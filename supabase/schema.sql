-- Vantage cross-device sync — one row per user, guarded by row-level security.
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → paste → Run).

create table if not exists public.vantage_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.vantage_state enable row level security;

-- Each signed-in user can read/write exactly their own row; the anon key
-- alone can touch nothing.
create policy "own row select" on public.vantage_state
  for select using (auth.uid() = user_id);
create policy "own row insert" on public.vantage_state
  for insert with check (auth.uid() = user_id);
create policy "own row update" on public.vantage_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Client shoot shortlists (v2, added 2026-07-04) ──────────────────────────
-- The photographer stores a list (spots + per-spot notes); the client (no
-- account) opens it via the unguessable uuid in the link and writes back a
-- pick + comment. Run this whole block once in the SQL editor.

create table if not exists public.shortlists (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  title text check (char_length(title) <= 120),
  spots jsonb not null, -- [{"id": "spot-id", "note": "shown to the client"}]
  created_at timestamptz not null default now()
);
alter table public.shortlists enable row level security;
create policy "shortlists owner all" on public.shortlists
  for all using (auth.uid() = owner) with check (auth.uid() = owner);
-- Deliberately NO anon select policy: clients read via get_shortlist() below,
-- so the REST API can never enumerate lists.

create table if not exists public.shortlist_responses (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shortlists (id) on delete cascade,
  picked text[] not null default '{}'
    check (array_length(picked, 1) is null or array_length(picked, 1) <= 10),
  client_name text check (char_length(client_name) <= 80),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
alter table public.shortlist_responses enable row level security;
-- Anyone holding a valid list id may respond (the client has no account);
-- the FK guarantees the list exists.
create policy "respond with a list id" on public.shortlist_responses
  for insert to anon, authenticated with check (true);
create policy "owner reads responses" on public.shortlist_responses
  for select using (exists (
    select 1 from public.shortlists l where l.id = list_id and l.owner = auth.uid()
  ));

-- Capability-URL read: knowing the uuid IS the authorization.
create or replace function public.get_shortlist(p_id uuid)
returns table (id uuid, title text, spots jsonb, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select id, title, spots, created_at from shortlists where id = p_id;
$$;

-- ── Shortlist response notify (v3, added 2026-07-05) ────────────────────────
-- Applied as migration `shortlist_response_notify` via the Supabase MCP.
-- When a client inserts a response, pg_net pokes the Worker, which web-pushes
-- the list owner's subscribed devices (see worker/index.ts response-hook).

create extension if not exists pg_net with schema extensions;

-- Owner lookup for the response webhook. Capability-URL consistent: knowing a
-- valid list uuid is the authorization (returns only the owner uuid).
create or replace function public.get_list_owner(p_id uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select owner from shortlists where id = p_id;
$$;

create or replace function public.notify_shortlist_response()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://shootvantage.com/api/shortlist/response-hook',
    body := jsonb_build_object('record', jsonb_build_object(
      'list_id', new.list_id,
      'client_name', new.client_name
    )),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists shortlist_response_notify on public.shortlist_responses;
create trigger shortlist_response_notify
  after insert on public.shortlist_responses
  for each row execute function public.notify_shortlist_response();

-- ── Shortlist response email (v3 email leg, added 2026-07-06) ────────────────
-- Applied as migration `shortlist_email_notify`. The Worker emails the list
-- owner via Resend when a client responds. Owner-email lookup is gated by a
-- shared secret (stored in internal.config AND as the Worker secret
-- SUPABASE_HOOK_SECRET — value NOT in this file; rotate by updating both).

create schema if not exists internal;
revoke all on schema internal from public;
create table if not exists internal.config (key text primary key, value text not null);
-- insert into internal.config (key, value) values ('worker_hook_secret', '<secret>')
--   on conflict (key) do update set value = excluded.value;

create or replace function public.get_owner_email(p_id uuid, p_secret text)
returns text
language plpgsql
security definer
set search_path = public, internal, auth
as $$
declare
  v_owner uuid;
  v_email text;
begin
  if p_secret is null or p_secret is distinct from
     (select value from internal.config where key = 'worker_hook_secret') then
    return null;
  end if;
  select owner into v_owner from public.shortlists where id = p_id;
  if v_owner is null then return null; end if;
  select email into v_email from auth.users where id = v_owner;
  return v_email;
end;
$$;

-- Webhook payload now carries picks + comment so the email can show them.
create or replace function public.notify_shortlist_response()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://shootvantage.com/api/shortlist/response-hook',
    body := jsonb_build_object('record', jsonb_build_object(
      'list_id', new.list_id,
      'client_name', new.client_name,
      'picked', new.picked,
      'comment', new.comment
    )),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
end;
$$;

-- ── Spot suggestions (feedback #9, added 2026-07-06) ────────────────────────
-- Applied as migration `spot_suggestions`. Insert-only inbox: users submit
-- what they know; periodic curation sessions verify per docs/ADDING_SPOTS.md
-- and promote the good ones (read via SQL, never the public API).
create table if not exists public.spot_suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 120),
  where_hint text check (char_length(where_hint) <= 300),
  why text check (char_length(why) <= 500),
  access_notes text check (char_length(access_notes) <= 500),
  suggested_by uuid references auth.users (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'added', 'rejected')),
  created_at timestamptz not null default now()
);
alter table public.spot_suggestions enable row level security;
create policy "anyone suggests" on public.spot_suggestions
  for insert to anon, authenticated with check (true);

-- ── Your own photos (feedback #8, added 2026-07-06) ─────────────────────────
-- Applied as migration `user_photos`. Public bucket `spot-photos`; writes are
-- tied to the {uid}/... path prefix; the table maps photos to spots.
-- (Bucket row: insert into storage.buckets (id,name,public,file_size_limit,
--  allowed_mime_types) values ('spot-photos','spot-photos',true,8388608,
--  array['image/jpeg','image/png','image/webp','image/heic']).)

create table if not exists public.user_photos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  spot_id text not null check (char_length(spot_id) <= 60),
  path text not null,
  created_at timestamptz not null default now()
);
alter table public.user_photos enable row level security;
create policy "own photos" on public.user_photos
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

-- storage.objects policies:
-- create policy "own uploads" on storage.objects for insert to authenticated
--   with check (bucket_id = 'spot-photos' and (storage.foldername(name))[1] = auth.uid()::text);
-- create policy "own deletes" on storage.objects for delete to authenticated
--   using (bucket_id = 'spot-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Next-city scoreboard (B12 / IA redesign 1j, added 2026-07-15) ────────────
-- Applied as migration `city_votes` via the Supabase MCP. One vote per
-- account, changeable (upsert on the PK). The raw table maps users to votes,
-- so it gets NO anon select — public tallies go through a counts-only definer
-- function, matching the get_shortlist() convention.

create table if not exists public.city_votes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  city text not null check (char_length(city) <= 40),
  created_at timestamptz not null default now()
);

alter table public.city_votes enable row level security;

create policy "own vote all" on public.city_votes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.city_vote_totals()
returns table (city text, votes bigint)
language sql
security definer
set search_path = public
stable
as $$
  select city, count(*) as votes from city_votes group by city order by votes desc;
$$;

-- ── Photo hunts (B14 / handoff 2c-2d) + server-minted points (B11) ──────────
-- Applied as migration `photo_hunts_and_server_points` via the Supabase MCP
-- (2026-07-15). Full definition lives in the migration; summary:
--   point_events  — append-only ledger; RLS select-own; NO client insert
--                   (only definer RPCs write); unique (owner, reason, ref).
--   hunts         — public-read content; stops jsonb [{spotId,name,lat,lng,
--                   hint}] with coords duplicated from the catalog so the
--                   server can enforce geo (150 m tolerance absorbs fixes).
--   hunt_joins    — own-row (joining is free, no validation needed).
--   hunt_progress — RLS select-own; written only by submit_hunt_stop().
--   submit_hunt_stop(hunt, stop, photo_path, lat, lng) — security definer;
--     validates auth, open window, strict stop order, photo proof (own
--     user_photos row at the stop's spot), and the 150 m haversine rule;
--     awards stop_pts (+finish_pts on the last stop) idempotently; returns
--     {done,total,finished,awarded,totalPts}. Execute: authenticated only.
-- Seeded hunts: golden-hour-grand-tour (tampa-bay), old-city-evening-walk
-- (philadelphia) — evergreen (opens_at/closes_at null).
-- Guards integration-tested 2026-07-15 with simulated JWT claims + rollback:
-- unknown hunt / order / photo proof / 21 km geo / duplicate all rejected;
-- valid submit returned awarded=25.

-- ── Community shots + ratings (social feature, added 2026-07-16) ────────────
-- Applied as migration `community_shots_ratings` via the Supabase MCP while
-- user_photos held ZERO rows (no retroactive exposure). Summary:
--   user_photos    — gains public SELECT ("shots are community content");
--                    writes stay owner-only.
--   photo_ratings  — (photo_id, rater) pk, rating 1-5, changeable; RLS on,
--                    NO client policies — reads/writes only via RPCs.
--   rate_photo(photo, rating) — definer; guards: auth, 1-5, photo exists,
--     not your own; upserts the rating; when a photo reaches >=3 ratings
--     averaging >=4.0 its OWNER earns +25 (reason topShot, once per photo,
--     idempotent). Execute: authenticated only.
--   spot_community_photos(spot_id) — definer, anon-callable: photos + count,
--     avg, Bayesian score ((sum + 3.5*5)/(count + 5)) sorted best-first,
--     owner reduced to two initials (emails never leave the server),
--     is_mine + my_rating for the caller.
--   point_events reason check gains topShot.
-- Guards integration-tested 2026-07-16 w/ simulated JWTs + rollback:
-- own-photo/range/unknown rejected; re-rate replaces; award fires exactly
-- once at 3x avg>=4 (+25); listing returns score 3.813 for 4.33x3.

-- ── Photo quotas + retention (storage management, added 2026-07-16) ─────────
-- Applied as migrations `photo_quotas_and_retention`, `rate_photo_anonymous_
-- owner`, `prune_rows_only`. Summary:
--   photo_quota(points) — per-spot upload allowance by craft points:
--     2 (Apprentice) / 3 (250+) / 4 (1000+) / 6 (2500+) / 8 (6000+).
--     Mirrored client-side in src/craft/points.ts photoQuotaForPoints —
--     keep in lockstep.
--   photo_quota_gate — BEFORE INSERT trigger on user_photos; rejects over-
--     quota uploads with a friendly "earn points to raise it" error.
--   user_photos.owner is now NULLABLE, FK on delete SET NULL; the
--     prune_photos_on_account_delete trigger (auth.users BEFORE DELETE)
--     removes the departing user's below-bar photo ROWS (bar: >=3 ratings
--     avg >=4.0) and keeps good ones as anonymous community shots ("—" in
--     listings; rate_photo skips the award when owner is null).
--   "spot photos per-user cap" — RESTRICTIVE storage.objects insert policy:
--     hard 200-file ceiling per user in spot-photos (raw-storage spam brake).
-- NOTE: Supabase blocks SQL deletes on storage.objects (Storage API only),
-- so files are cleaned client-side: uploads compensate on failed row
-- inserts, and each user's own session sweeps orphans in their folder
-- (sweepMyOrphanPhotos on the Your-shots screen). Files of DELETED accounts
-- below the bar remain until a service-key janitor exists (known gap).
-- Integration-tested 2026-07-16 w/ rollback: quota 2 then 4 after +1000 pts,
-- fresh per spot; good photo survived account deletion anonymized; pruned
-- rows gone; anonymous photo ratable without award.
