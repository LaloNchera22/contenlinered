-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  public_status text        not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.communities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id           uuid        primary key default gen_random_uuid(),
  community_id uuid        not null references public.communities(id) on delete cascade,
  user_id      uuid        not null references public.users(id)       on delete cascade,
  content      text        not null check (char_length(content) between 1 and 4000),
  created_at   timestamptz not null default now()
);

-- Index for fast message history per community
create index if not exists messages_community_created_idx
  on public.messages (community_id, created_at asc);

-- Auto-update updated_at on users
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

-- ─────────────────────────────────────────────
-- Row Level Security — Zero Trust / 100% pública
-- ─────────────────────────────────────────────

alter table public.users       enable row level security;
alter table public.communities enable row level security;
alter table public.messages    enable row level security;

-- users: public read, self-insert on sign-up, self-update only
create policy "users_public_read"
  on public.users for select
  using (true);

create policy "users_self_insert"
  on public.users for insert
  with check (id = auth.uid());

create policy "users_self_update"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- communities: public read, no client-side write
create policy "communities_public_read"
  on public.communities for select
  using (true);

-- messages: public read, authenticated insert (own user_id only)
create policy "messages_public_read"
  on public.messages for select
  using (true);

create policy "messages_auth_insert"
  on public.messages for insert
  with check (
    user_id = auth.uid()
    and auth.uid() is not null
  );

-- ─────────────────────────────────────────────
-- Seed: sample communities
-- ─────────────────────────────────────────────

insert into public.communities (name) values
  ('General'),
  ('Tecnología'),
  ('Arte y Diseño')
on conflict do nothing;
