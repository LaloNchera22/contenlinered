-- Enable pgvector for semantic community matching
create extension if not exists vector;

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  public_status text        not null default '',
  status_score  int         not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.communities (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  topic_vector vector(384),           -- for future semantic similarity search
  created_at   timestamptz not null default now()
);

create table if not exists public.memberships (
  user_id      uuid        not null references public.users(id)       on delete cascade,
  community_id uuid        not null references public.communities(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (user_id, community_id)
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
  on public.messages (community_id, created_at desc);

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
-- Row Level Security — Zero Trust model
-- ─────────────────────────────────────────────

alter table public.users        enable row level security;
alter table public.communities  enable row level security;
alter table public.memberships  enable row level security;
alter table public.messages     enable row level security;

-- users: public read, self-update only
create policy "users_public_read"
  on public.users for select
  using (true);

create policy "users_self_update"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- users: self insert on sign-up
create policy "users_self_insert"
  on public.users for insert
  with check (id = auth.uid());

-- communities: public read, no client-side write (managed server-side)
create policy "communities_public_read"
  on public.communities for select
  using (true);

-- memberships: member can read their own rows; self insert/delete
create policy "memberships_self_read"
  on public.memberships for select
  using (user_id = auth.uid());

create policy "memberships_self_insert"
  on public.memberships for insert
  with check (user_id = auth.uid());

create policy "memberships_self_delete"
  on public.memberships for delete
  using (user_id = auth.uid());

-- messages: select/insert only inside communities the caller has joined
create policy "messages_member_read"
  on public.messages for select
  using (
    exists (
      select 1 from public.memberships m
      where m.community_id = messages.community_id
        and m.user_id = auth.uid()
    )
  );

create policy "messages_member_insert"
  on public.messages for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.memberships m
      where m.community_id = messages.community_id
        and m.user_id = auth.uid()
    )
  );
