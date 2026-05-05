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
  id              uuid        primary key default gen_random_uuid(),
  community_id    uuid        not null references public.communities(id) on delete cascade,
  user_id         uuid        not null references public.users(id)       on delete cascade,
  content         text        not null default '' check (char_length(content) <= 4000),
  attachment_url  text,
  attachment_type text        check (attachment_type in ('pdf', 'audio')),
  created_at      timestamptz not null default now(),
  constraint messages_has_content_or_attachment check (
    char_length(content) > 0 or attachment_url is not null
  )
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

-- ─────────────────────────────────────────────
-- Storage: attachments bucket
-- ─────────────────────────────────────────────

-- Run this in Supabase SQL editor (requires storage extension):
-- insert into storage.buckets (id, name, public) values ('attachments', 'attachments', true) on conflict do nothing;

-- create policy "attachments_public_read"
--   on storage.objects for select
--   using (bucket_id = 'attachments');

-- create policy "attachments_auth_insert"
--   on storage.objects for insert
--   with check (bucket_id = 'attachments' and auth.uid() is not null);

-- create policy "attachments_auth_delete"
--   on storage.objects for delete
--   using (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─────────────────────────────────────────────
-- Seed: sample communities
-- ─────────────────────────────────────────────

insert into public.communities (name) values
  ('General'),
  ('Tecnología'),
  ('Arte y Diseño')
on conflict do nothing;

-- ─────────────────────────────────────────────
-- Presence Events (Eventos de Presencia)
-- ─────────────────────────────────────────────

create table if not exists public.live_sessions (
  id           uuid        primary key default gen_random_uuid(),
  topic        text        not null check (char_length(topic) between 3 and 200),
  created_by   uuid        not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '2 hours'
);

create table if not exists public.session_members (
  session_id  uuid        not null references public.live_sessions(id) on delete cascade,
  user_id     uuid        not null references public.users(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table if not exists public.session_messages (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        not null references public.live_sessions(id) on delete cascade,
  user_id     uuid        not null references public.users(id) on delete cascade,
  content     text        not null check (char_length(content) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists session_messages_session_created_idx
  on public.session_messages (session_id, created_at asc);

alter table public.live_sessions    enable row level security;
alter table public.session_members  enable row level security;
alter table public.session_messages enable row level security;

-- live_sessions: anyone can read; auth users can create their own; creator can delete
create policy "live_sessions_public_read"
  on public.live_sessions for select using (true);

create policy "live_sessions_auth_insert"
  on public.live_sessions for insert
  with check (created_by = auth.uid() and auth.uid() is not null);

create policy "live_sessions_creator_delete"
  on public.live_sessions for delete
  using (created_by = auth.uid());

-- session_members: anyone can read; members manage themselves
create policy "session_members_public_read"
  on public.session_members for select using (true);

create policy "session_members_self_insert"
  on public.session_members for insert
  with check (user_id = auth.uid() and auth.uid() is not null);

create policy "session_members_self_upsert"
  on public.session_members for update
  using (user_id = auth.uid());

create policy "session_members_self_delete"
  on public.session_members for delete
  using (user_id = auth.uid());

-- session_messages: public read; auth insert own messages
create policy "session_messages_public_read"
  on public.session_messages for select using (true);

create policy "session_messages_auth_insert"
  on public.session_messages for insert
  with check (user_id = auth.uid() and auth.uid() is not null);
