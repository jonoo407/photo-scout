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
    headers := internal.worker_hook_headers()
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
    headers := internal.worker_hook_headers()
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

-- ── Tester feedback (2026-07-28, TestFlight phase) ─────────────────────────
-- Insert-only under RLS, exactly like spot_suggestions: anyone can send,
-- nobody can read others' reports through the API. Reviewed by pulling rows
-- with SQL and folding them into docs/BACKLOG.md (see the query in that file).
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 1 and 4000),
  kind text not null default 'bug' check (kind in ('bug', 'idea', 'praise')),
  submitted_by uuid references auth.users (id) on delete set null,
  contact_email text check (char_length(contact_email) <= 200),
  -- Which build the tester was on: a report without it is guesswork.
  app_version text check (char_length(app_version) <= 60),
  platform text check (char_length(platform) <= 300),
  status text not null default 'new' check (status in ('new', 'triaged', 'shipped', 'wontfix')),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
create policy "anyone sends feedback" on public.feedback
  for insert to anon, authenticated with check (true);
create index if not exists feedback_created_idx on public.feedback (created_at desc);
create index if not exists feedback_status_idx on public.feedback (status);

-- Notify leg: same net.http_post pattern as shortlist_response_notify, so
-- feedback reaches email instead of waiting for someone to read the table.
create or replace function public.feedback_notify()
returns trigger language plpgsql security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://shootvantage.com/api/feedback-hook',
    body := jsonb_build_object('record', jsonb_build_object(
      'id', new.id, 'kind', new.kind, 'message', new.message,
      'contact_email', new.contact_email, 'app_version', new.app_version,
      'platform', new.platform
    )),
    headers := internal.worker_hook_headers()
  );
  return new;
end;
$$;
drop trigger if exists feedback_notify on public.feedback;
create trigger feedback_notify after insert on public.feedback
  for each row execute function public.feedback_notify();

-- ── Photo reporting, blocking, takedown (V1, 2026-07-28) ────────────────────
-- Applied as migration `photo_reports_and_blocking` via the Supabase MCP.
-- Community shots went public 2026-07-16 with no report path and no way to
-- mute a poster. App Review guideline 1.2 requires FOUR things of any app
-- carrying user-generated content, and this migration is three of them
-- (the fourth, a filter on posting, is the client-side standards gate in
-- src/ui/SpotDetail/StandardsGate.tsx + src/community/standards.ts):
--   · report mechanism + timely response  → report_photo() + the email leg
--   · ability to block abusive users      → blocked_users + block_photo_owner()
--   · removal of violating content        → user_photos.hidden_at
--
-- Both RPCs are definer functions rather than table writes, for one reason:
-- spot_community_photos reduces a photo's owner to two initials, so the client
-- has no owner uuid with which to block. Blocking is keyed off the PHOTO and
-- the server resolves the owner. Likewise the auto-hide threshold — a report
-- count the client can write is a report count an abuser can forge.

create table if not exists public.photo_reports (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.user_photos (id) on delete cascade,
  -- set null, not cascade: the moderation record outlives the reporter's account
  reporter uuid references auth.users (id) on delete set null,
  reason text not null check (reason in ('offensive','harassment','copyright','spam','other')),
  note text check (char_length(note) <= 1000),
  status text not null default 'new' check (status in ('new','upheld','dismissed')),
  created_at timestamptz not null default now()
);
-- RLS on with NO policies: writes go through report_photo(), reads are SQL-only.
-- Anything else would let one user enumerate who reported whom.
alter table public.photo_reports enable row level security;
create unique index if not exists photo_reports_one_per_user
  on public.photo_reports (photo_id, reporter) where reporter is not null;
create index if not exists photo_reports_triage_idx
  on public.photo_reports (status, created_at desc);

create table if not exists public.blocked_users (
  blocker uuid not null references auth.users (id) on delete cascade,
  blocked uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  constraint no_self_block check (blocker <> blocked)
);
alter table public.blocked_users enable row level security;
create policy "own block list" on public.blocked_users
  for all to authenticated using (auth.uid() = blocker) with check (auth.uid() = blocker);

-- Takedown latch (once set it stays set; un-hiding is a deliberate SQL act):
--   alter table public.user_photos
--     add column hidden_at timestamptz, add column hidden_reason text;
-- The public read respects it too — the listing RPC is not the only way to
-- reach this table. The owner still sees their own hidden shot via the
-- "own photos" policy, so they can delete it:
--   drop policy "shots are community content" on public.user_photos;
--   create policy "shots are community content" on public.user_photos
--     for select to anon, authenticated using (hidden_at is null);
--
-- Functions (full bodies in the migration):
--   report_photo(photo, reason, note) — auth required, rejects reporting your
--     own shot, one report per person per photo (upsert), AUTO-HIDES on the
--     second DISTINCT reporter and marks that photo's reports 'upheld'.
--     Returns {hidden, reports}. With one curator, automation is what makes
--     "timely responses" true; a human still reviews the queue.
--   block_photo_owner(photo)  — resolves owner server-side, refuses self-block
--   blocked_count() / unblock_everyone() — drive the Settings row
--   spot_community_photos()   — now also filters `hidden_at is null` and
--     `not exists (blocked_users where blocker = auth.uid())`
--   photo_report_notify()     — after-insert trigger → /api/report-hook → email
--
-- Integration-tested 2026-07-28 w/ rollback, 17 assertions: owner refused,
-- duplicate report does not tip the threshold, 2nd distinct reporter hides,
-- reports marked upheld, raw table read drops the hidden row, block is
-- per-viewer (others still see the shot), self-block refused, owner still sees
-- own hidden shot, unblock restores, signed-out refused.

-- Triage the queue:
--   select r.created_at, r.reason, r.note, p.spot_id, p.path, p.hidden_at
--   from photo_reports r join user_photos p on p.id = r.photo_id
--   where r.status = 'new' order by r.created_at desc;
-- Uphold a report the auto-rule didn't catch (removes it for everyone):
--   update user_photos set hidden_at = now(), hidden_reason = '<reason>'
--   where id = '<photo>';
-- Dismiss:
--   update photo_reports set status = 'dismissed' where id = '<report>';
--   update user_photos set hidden_at = null, hidden_reason = null where id = '<photo>';

-- ── Opaque photographer refs + per-row block management (2026-07-29) ────────
-- Applied as migration `photographer_refs_and_block_management`.
--
-- V1 (the day before) keyed blocking off the PHOTO, because
-- spot_community_photos reduces owners to two initials and the client
-- therefore had no handle for a person. That kept auth uuids off the client —
-- worth keeping, since a stable uuid would let anyone enumerate photos and map
-- where a given photographer shoots — but it meant Settings could only show
-- "2 blocked" with a single Unblock all. An accidental block had no individual
-- undo, and there was no blocking path at all for surfaces with no photo
-- attached (V7 threads, V8 critiques).
--
-- The handle is a RANDOM ref, deliberately not a hash of the uuid: a hash
-- needs a salt, and any authenticated user can read a function body out of
-- pg_proc, so the salt would not stay secret. A random ref reverses to nothing
-- and has no secret to keep, while still being stable per person — which is
-- what lets the client group someone's shots and label a block-list row.

create table if not exists public.photographers (
  owner uuid primary key references auth.users (id) on delete cascade,
  ref uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);
-- No policies: refs reach clients only through the definer RPCs, so this can
-- never be read as a directory of everyone who has ever posted.
alter table public.photographers enable row level security;

-- spot_community_photos is STABLE and so cannot mint a ref itself; a BEFORE
-- INSERT trigger on user_photos (`ensure_photographer_ref`) does it at upload
-- time, and the migration backfilled existing owners.
--
-- Functions (full bodies in the migration):
--   spot_community_photos()   — now also returns `owner_ref` (additive: a
--     client from before the deploy simply ignores the extra column)
--   block_photographer(ref)   — the real block; works anywhere a ref is known
--   unblock_photographer(ref) — lifts ONE block
--   blocked_photographers()   — ref + initials + blocked_at, for the list
--   block_photo_owner(photo)  — kept for clients mid-rollout; resolves the ref
--     (minting one if the photo predates the trigger) and defers to the above
--   unblock_everyone()        — now UNUSED by the client; left rather than
--     spending a migration to drop it
--
-- Integration-tested 2026-07-29 w/ rollback, 16 assertions: refs are per
-- PHOTOGRAPHER not per photo, one photographer's shots share a ref, ref differs
-- from the auth uuid, blocking by ref removes all their shots, the list names
-- them, unblocking one restores only that one, unknown ref and self-block are
-- refused, the legacy photo-keyed call still works, signed-out sees an empty
-- list rather than an error.

-- ── Function EXECUTE lockdown (2026-09-12) ─────────────────────────────────
-- Applied as migration `lock_down_public_function_execute`. Postgres grants
-- EXECUTE to PUBLIC on CREATE FUNCTION, and anon/authenticated inherit it, so
-- every function above was callable at /rest/v1/rpc/<name> by anyone — 18 of
-- them without signing in (Supabase security advisor, 2026-08-31). Each one
-- guards itself (auth.uid() or the shared secret), so nothing was exploitable,
-- but trigger bodies and retired functions had no reason to be endpoints.
--
-- The intended level per function lives in `supabase/function-access.ts` and
-- the migration SQL is GENERATED from it (revokeSql()), so the two cannot
-- drift; tests/unit/db-function-access.test.ts scans src/ and worker/ for real
-- .rpc() call sites and fails if the manifest stops matching them.
--
-- Reachable signed-out (5, all deliberate): get_shortlist, get_list_owner,
--   get_owner_email, spot_community_photos, city_vote_totals.
--   NOTE get_list_owner + get_owner_email are called by the WORKER, which
--   holds only SUPABASE_PUBLISHABLE_KEY — its calls arrive as `anon`.
--   Revoking them breaks the shortlist response email with no app-side symptom.
-- Signed-in only (6): report_photo, rate_photo, submit_hunt_stop,
--   block_photographer, unblock_photographer, blocked_photographers.
-- Internal, no caller (10): the six trigger bodies (feedback_notify,
--   photo_report_notify, enforce_photo_quota, prune_departing_photos,
--   notify_shortlist_response, ensure_photographer_ref), the photo_quota
--   helper, and the retired unblock_everyone / blocked_count /
--   block_photo_owner.
--
-- Triggers still fire after the revoke: Postgres checks EXECUTE at CREATE
-- TRIGGER time, not per row. Verified 2026-09-12 on a throwaway table in a
-- rolled-back transaction (insert as `anon` with EXECUTE fully revoked — the
-- BEFORE INSERT trigger still ran).
--
-- photo_quota also had a mutable search_path (the one remaining advisor
-- finding of its kind); it is now pinned to `public`.
--
-- Verified live 2026-09-12 against the production REST API: unblock_everyone,
-- blocked_count, photo_quota and report_photo return 401/403 "permission
-- denied" to the anon key; spot_community_photos, city_vote_totals,
-- get_shortlist, get_list_owner and get_owner_email still return 200; and a
-- signed-in user still reaches all six authenticated RPCs (they answer with
-- business-logic errors like "unknown photo", proving the body ran).
--
-- Still open and NOT code: leaked-password protection needs the Supabase Pro
-- plan. The three `rls_enabled_no_policy` INFO findings (photo_ratings,
-- photo_reports, photographers) are the intended design — those tables are
-- reachable only through definer RPCs, never directly.

-- ── Storage janitor (V10, 2026-09-12) ──────────────────────────────────────
-- Applied as migration `storage_janitor_object_listing` + Edge Function
-- `storage-janitor` (supabase/functions/storage-janitor/).
--
-- The gap this closes was recorded above as "files of DELETED accounts below
-- the bar remain until a service-key janitor exists". Every other cleanup
-- path in this app runs client-side as the file's owner: uploads compensate
-- on a failed row insert, and each user's own session sweeps orphans in their
-- folder. None of them can reach a departed account's files, because the
-- owner's token died with the account and Supabase blocks SQL deletes on
-- storage.objects (Storage API only).
--
--   storage_objects_for_janitor(limit) — definer READ of the bucket listing,
--     service_role only. A listing is a map of who uploaded what and where
--     they were standing, so it is never reachable from a browser.
--   Edge Function storage-janitor — service_role; lists objects, reads every
--     `path` still in user_photos, deletes the difference over the Storage
--     API. Auth is a shared secret in the JANITOR_SECRET function secret
--     (Supabase Management API), on top of the platform's JWT check.
--
-- Safety, because the job is deleting photographs:
--   · DRY RUN unless the body says {"apply": true},
--   · a 24-hour grace period, so an upload whose row insert is still in
--     flight is never swept,
--   · presence of a ROW is the test, never ownership — account deletion keeps
--     good photos with owner = null, and those rows still carry the path,
--   · an object with no parseable created_at is kept, never assumed old,
--   · max 200 deletions per run,
--   · .emptyFolderPlaceholder markers are skipped.
-- The selection logic is a pure module (functions/storage-janitor/select.ts)
-- with no Deno imports, so tests/unit/storage-janitor.test.ts exercises the
-- exact code that runs in production.
--
-- First real run 2026-09-12: scanned 1, orphans 1, deleted 1 — the orphan
-- noted above as existing since 2026-07-16. Bucket now 0 files / 0 orphans.
-- Guards verified against production before applying: graceHours=10000 spared
-- the same 58-day-old file, maxDeletes=0 selected nothing, and a wrong or
-- missing x-janitor-secret returned 403.

-- ── In-app account deletion (App Store 5.1.1(v), 2026-09-24) ───────────────
-- No migration: Edge Function `delete-account` (supabase/functions/
-- delete-account/) + Worker route POST /api/account/delete.
--
-- Settings → Delete account (typed DELETE) → the Worker verifies the session
-- against /auth/v1/user, forgets the user's push devices in the AlertsDO, then
-- calls the Edge Function with the SAME user token. The function re-verifies
-- it with getUser() and, as service_role:
--   1. lists every file under spot-photos/<uid>/ (the listing, not the rows,
--      is the source of truth — it also finds orphans, and survives a retry),
--   2. deletes the user's user_photos rows — ALL of them. prune_departing_
--      photos keeps well-rated shots anonymized, which is right for a lapsed
--      account and wrong for someone who asked for deletion. The trigger
--      still governs deletes made any other way (dashboard, SQL),
--   3. deletes their feedback and spot_suggestions (both `on delete set
--      null`; feedback can carry a contact email),
--   4. removes the files over the Storage API,
--   5. deletes the auth user; FK cascades take vantage_state (saved spots,
--      plans, notes, prefs), shortlists + responses, city_votes,
--      blocked_users, photographers — and, per their migrations (bodies not
--      in this file, so confirm with the query below), hunt_joins,
--      hunt_progress, point_events and photo_ratings. photo_reports they
--      filed survive with reporter = null.
-- The auth user goes LAST, so any earlier failure leaves an account the
-- person can sign back into and retry from.
--
-- Step 5 fails ("Database error deleting user") if any FK into auth.users is
-- NO ACTION/RESTRICT and the user has rows there. Check before deploying —
-- every row should read c (cascade) or n (set null):
--   select conrelid::regclass as tbl, conname, confdeltype
--   from pg_constraint
--   where contype = 'f' and confrelid = 'auth.users'::regclass
--   order by 1;
--
-- Deploy: supabase functions deploy delete-account  (JWT verification on;
-- SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the platform —
-- no secret to set). Until it is deployed the Worker answers 502 and the
-- app shows "nothing was lost, try again".

-- ── Webhook shared secret (2026-09-24) ─────────────────────────────────────
-- Applied as migration `webhook_shared_secret`
-- (supabase/migrations/20260924000000_webhook_shared_secret.sql).
--
-- The three pg_net triggers above used to post with only Content-Type, and
-- the Worker checked nothing: anyone could POST /api/feedback-hook or
-- /api/report-hook to email Jon at will, or /api/shortlist/response-hook with
-- a known list id to push + email a photographer a fake "client picked". The
-- email leg shares Resend's quota with auth SMTP, so a flood also starved
-- password resets.
--
--   internal.worker_hook_headers() — definer, no role may EXECUTE it (only
--     the trigger functions' owner): Content-Type plus `x-vantage-hook-secret`
--     = internal.config.worker_hook_secret, the SAME value as the Worker
--     secret SUPABASE_HOOK_SECRET that already gates get_owner_email().
--   notify_shortlist_response / feedback_notify / photo_report_notify — now
--     post `headers := internal.worker_hook_headers()`. The migration patches
--     the LIVE bodies in place and refuses to run if the secret is unset or a
--     body doesn't have the expected header literal.
--
-- The Worker answers 503 when SUPABASE_HOOK_SECRET is unset and 401 when the
-- header doesn't match. Apply the migration BEFORE deploying that Worker.
-- Verified 2026-09-24 on Postgres 16 with a recording stand-in for
-- net.http_post: refuses without the secret, anon inserts on all three
-- tables post the header, EXECUTE lockdown survives, re-run is a no-op, an
-- unexpected body aborts with nothing half-applied, anon cannot call the
-- helper.
