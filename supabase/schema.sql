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
