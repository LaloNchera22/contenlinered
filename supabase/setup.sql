-- ─────────────────────────────────────────────────────────────────────────────
-- CONTENLINE — Setup SQL consolidado para Supabase
-- Combina: schema base + 001_social_features + 002_reddit_features + Storage
-- Idempotente: puede ejecutarse varias veces sin errores.
-- Pega TODO este archivo en: Supabase → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- =============================================================================
-- 1) TABLAS
-- =============================================================================

create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  public_status text        not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.communities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  created_by  uuid references public.users(id) on delete set null,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- Por si la tabla ya existía sin las columnas nuevas:
alter table public.communities
  add column if not exists description text not null default '',
  add column if not exists created_by   uuid references public.users(id) on delete set null,
  add column if not exists tags         text[] not null default '{}';

create table if not exists public.messages (
  id              uuid        primary key default gen_random_uuid(),
  community_id    uuid        not null references public.communities(id) on delete cascade,
  user_id         uuid        not null references public.users(id)       on delete cascade,
  content         text        not null default '' check (char_length(content) <= 4000),
  attachment_url  text,
  attachment_type text        check (attachment_type in ('pdf', 'audio')),
  title           text        check (char_length(title) <= 300),
  created_at      timestamptz not null default now(),
  constraint messages_has_content_or_attachment check (
    char_length(content) > 0 or attachment_url is not null
  )
);

alter table public.messages
  add column if not exists title text check (char_length(title) <= 300);

create table if not exists public.comments (
  id          uuid        primary key default gen_random_uuid(),
  message_id  uuid        not null references public.messages(id) on delete cascade,
  user_id     uuid        not null references public.users(id)    on delete cascade,
  content     text        not null check (char_length(content) between 1 and 1000),
  created_at  timestamptz not null default now()
);

create table if not exists public.live_sessions (
  id          uuid        primary key default gen_random_uuid(),
  topic       text        not null check (char_length(topic) between 3 and 200),
  created_by  uuid        not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '2 hours'
);

create table if not exists public.session_members (
  session_id  uuid not null references public.live_sessions(id) on delete cascade,
  user_id     uuid not null references public.users(id)         on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table if not exists public.session_messages (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        not null references public.live_sessions(id) on delete cascade,
  user_id     uuid        not null references public.users(id)         on delete cascade,
  content     text        not null check (char_length(content) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create table if not exists public.private_messages (
  id          uuid        primary key default gen_random_uuid(),
  sender_id   uuid        not null references public.users(id) on delete cascade,
  receiver_id uuid        not null references public.users(id) on delete cascade,
  content     text        not null check (char_length(content) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create table if not exists public.friendships (
  id           uuid        primary key default gen_random_uuid(),
  requester_id uuid        not null references public.users(id) on delete cascade,
  addressee_id uuid        not null references public.users(id) on delete cascade,
  status       text        not null default 'pending'
                           check (status in ('pending', 'accepted', 'rejected')),
  created_at   timestamptz not null default now(),
  constraint friendships_unique  unique (requester_id, addressee_id),
  constraint friendships_no_self check  (requester_id <> addressee_id)
);

create table if not exists public.user_skills (
  user_id uuid not null references public.users(id) on delete cascade,
  skill   text not null check (char_length(skill) between 1 and 50),
  primary key (user_id, skill)
);

create table if not exists public.user_links (
  user_id   uuid not null references public.users(id) on delete cascade,
  link_type text not null check (link_type in ('github','arxiv','orcid','linkedin','twitter','website')),
  url       text not null check (char_length(url) <= 500),
  primary key (user_id, link_type)
);

create table if not exists public.notifications (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.users(id) on delete cascade,
  type         text        not null
               check (type in ('friend_request','friend_accepted','mention')),
  from_user_id uuid        references public.users(id) on delete set null,
  entity_id    uuid,
  content      text        not null default '',
  read         boolean     not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id    uuid not null references public.users(id)    on delete cascade,
  primary key (message_id, user_id)
);

create table if not exists public.community_members (
  community_id uuid        not null references public.communities(id) on delete cascade,
  user_id      uuid        not null references public.users(id)       on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table if not exists public.saved_posts (
  user_id    uuid        not null references public.users(id)    on delete cascade,
  message_id uuid        not null references public.messages(id) on delete cascade,
  saved_at   timestamptz not null default now(),
  primary key (user_id, message_id)
);

-- =============================================================================
-- 2) ÍNDICES
-- =============================================================================

create index if not exists messages_community_created_idx
  on public.messages (community_id, created_at asc);

create index if not exists comments_message_created_idx
  on public.comments (message_id, created_at asc);

create index if not exists session_messages_session_created_idx
  on public.session_messages (session_id, created_at asc);

create index if not exists private_messages_conversation_idx
  on public.private_messages (sender_id, receiver_id, created_at asc);

create index if not exists friendships_addressee_idx
  on public.friendships (addressee_id, status);

create index if not exists friendships_requester_idx
  on public.friendships (requester_id, status);

create index if not exists notifications_user_idx
  on public.notifications (user_id, read, created_at desc);

create index if not exists community_members_community_idx
  on public.community_members (community_id);

create index if not exists community_members_user_idx
  on public.community_members (user_id);

create index if not exists saved_posts_user_idx
  on public.saved_posts (user_id, saved_at desc);

-- =============================================================================
-- 3) FUNCIONES Y TRIGGERS
-- =============================================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

-- =============================================================================
-- 4) REPLICA IDENTITY (necesario para Realtime con UPDATE/DELETE)
-- =============================================================================

alter table public.messages           replica identity full;
alter table public.comments           replica identity full;
alter table public.friendships        replica identity full;
alter table public.user_skills        replica identity full;
alter table public.notifications      replica identity full;
alter table public.message_reactions  replica identity full;
alter table public.community_members  replica identity full;

-- =============================================================================
-- 5) PUBLICACIÓN REALTIME (idempotente)
-- =============================================================================

do $$
declare
  t text;
  tables text[] := array[
    'messages',
    'comments',
    'friendships',
    'user_skills',
    'notifications',
    'message_reactions',
    'community_members'
  ];
begin
  foreach t in array tables loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- =============================================================================
-- 6) ROW LEVEL SECURITY (habilitar)
-- =============================================================================

alter table public.users              enable row level security;
alter table public.communities        enable row level security;
alter table public.messages           enable row level security;
alter table public.comments           enable row level security;
alter table public.live_sessions      enable row level security;
alter table public.session_members    enable row level security;
alter table public.session_messages   enable row level security;
alter table public.private_messages   enable row level security;
alter table public.friendships        enable row level security;
alter table public.user_skills        enable row level security;
alter table public.user_links         enable row level security;
alter table public.notifications      enable row level security;
alter table public.message_reactions  enable row level security;
alter table public.community_members  enable row level security;
alter table public.saved_posts        enable row level security;

-- =============================================================================
-- 7) POLÍTICAS RLS  (drop + create => idempotente)
-- =============================================================================

-- ── users ────────────────────────────────────────────────────────────────────
drop policy if exists "users_public_read"  on public.users;
drop policy if exists "users_self_insert"  on public.users;
drop policy if exists "users_self_update"  on public.users;

create policy "users_public_read" on public.users for select using (true);
create policy "users_self_insert" on public.users for insert
  with check (id = auth.uid());
create policy "users_self_update" on public.users for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ── communities ─────────────────────────────────────────────────────────────
drop policy if exists "communities_public_read"     on public.communities;
drop policy if exists "communities_auth_insert"     on public.communities;
drop policy if exists "communities_creator_delete"  on public.communities;

create policy "communities_public_read" on public.communities for select using (true);
create policy "communities_auth_insert" on public.communities for insert
  with check (created_by = auth.uid() and auth.uid() is not null);
create policy "communities_creator_delete" on public.communities for delete
  using (created_by = auth.uid());

-- ── messages ────────────────────────────────────────────────────────────────
drop policy if exists "messages_public_read"  on public.messages;
drop policy if exists "messages_auth_insert"  on public.messages;

create policy "messages_public_read" on public.messages for select using (true);
create policy "messages_auth_insert" on public.messages for insert
  with check (user_id = auth.uid() and auth.uid() is not null);

-- ── comments ────────────────────────────────────────────────────────────────
drop policy if exists "comments_public_read"  on public.comments;
drop policy if exists "comments_auth_insert"  on public.comments;

create policy "comments_public_read" on public.comments for select using (true);
create policy "comments_auth_insert" on public.comments for insert
  with check (user_id = auth.uid() and auth.uid() is not null);

-- ── live_sessions ───────────────────────────────────────────────────────────
drop policy if exists "live_sessions_public_read"     on public.live_sessions;
drop policy if exists "live_sessions_auth_insert"     on public.live_sessions;
drop policy if exists "live_sessions_creator_delete"  on public.live_sessions;

create policy "live_sessions_public_read" on public.live_sessions for select using (true);
create policy "live_sessions_auth_insert" on public.live_sessions for insert
  with check (created_by = auth.uid() and auth.uid() is not null);
create policy "live_sessions_creator_delete" on public.live_sessions for delete
  using (created_by = auth.uid());

-- ── session_members ─────────────────────────────────────────────────────────
drop policy if exists "session_members_public_read"   on public.session_members;
drop policy if exists "session_members_self_insert"   on public.session_members;
drop policy if exists "session_members_self_upsert"   on public.session_members;
drop policy if exists "session_members_self_delete"   on public.session_members;

create policy "session_members_public_read" on public.session_members for select using (true);
create policy "session_members_self_insert" on public.session_members for insert
  with check (user_id = auth.uid() and auth.uid() is not null);
create policy "session_members_self_upsert" on public.session_members for update
  using (user_id = auth.uid());
create policy "session_members_self_delete" on public.session_members for delete
  using (user_id = auth.uid());

-- ── session_messages ────────────────────────────────────────────────────────
drop policy if exists "session_messages_public_read"  on public.session_messages;
drop policy if exists "session_messages_auth_insert"  on public.session_messages;

create policy "session_messages_public_read" on public.session_messages for select using (true);
create policy "session_messages_auth_insert" on public.session_messages for insert
  with check (user_id = auth.uid() and auth.uid() is not null);

-- ── private_messages ────────────────────────────────────────────────────────
drop policy if exists "private_messages_participants_read"  on public.private_messages;
drop policy if exists "private_messages_auth_insert"        on public.private_messages;

create policy "private_messages_participants_read" on public.private_messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "private_messages_auth_insert" on public.private_messages for insert
  with check (sender_id = auth.uid() and auth.uid() is not null);

-- ── friendships ─────────────────────────────────────────────────────────────
drop policy if exists "friendships_participants_read"   on public.friendships;
drop policy if exists "friendships_auth_insert"         on public.friendships;
drop policy if exists "friendships_addressee_update"    on public.friendships;
drop policy if exists "friendships_participants_delete" on public.friendships;

create policy "friendships_participants_read" on public.friendships for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "friendships_auth_insert" on public.friendships for insert
  with check (requester_id = auth.uid() and auth.uid() is not null);
create policy "friendships_addressee_update" on public.friendships for update
  using  (addressee_id = auth.uid())
  with check (addressee_id = auth.uid());
create policy "friendships_participants_delete" on public.friendships for delete
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ── user_skills ─────────────────────────────────────────────────────────────
drop policy if exists "user_skills_public_read"   on public.user_skills;
drop policy if exists "user_skills_self_insert"   on public.user_skills;
drop policy if exists "user_skills_self_delete"   on public.user_skills;

create policy "user_skills_public_read" on public.user_skills for select using (true);
create policy "user_skills_self_insert" on public.user_skills for insert
  with check (user_id = auth.uid() and auth.uid() is not null);
create policy "user_skills_self_delete" on public.user_skills for delete
  using (user_id = auth.uid());

-- ── user_links ──────────────────────────────────────────────────────────────
drop policy if exists "user_links_public_read"   on public.user_links;
drop policy if exists "user_links_self_insert"   on public.user_links;
drop policy if exists "user_links_self_update"   on public.user_links;
drop policy if exists "user_links_self_delete"   on public.user_links;

create policy "user_links_public_read" on public.user_links for select using (true);
create policy "user_links_self_insert" on public.user_links for insert
  with check (user_id = auth.uid() and auth.uid() is not null);
create policy "user_links_self_update" on public.user_links for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "user_links_self_delete" on public.user_links for delete
  using (user_id = auth.uid());

-- ── notifications ───────────────────────────────────────────────────────────
drop policy if exists "notifications_self_read"    on public.notifications;
drop policy if exists "notifications_auth_insert"  on public.notifications;
drop policy if exists "notifications_self_update"  on public.notifications;
drop policy if exists "notifications_self_delete"  on public.notifications;

create policy "notifications_self_read" on public.notifications for select
  using (user_id = auth.uid());
create policy "notifications_auth_insert" on public.notifications for insert
  with check (auth.uid() is not null);
create policy "notifications_self_update" on public.notifications for update
  using (user_id = auth.uid());
create policy "notifications_self_delete" on public.notifications for delete
  using (user_id = auth.uid());

-- ── message_reactions ───────────────────────────────────────────────────────
drop policy if exists "message_reactions_public_read"  on public.message_reactions;
drop policy if exists "message_reactions_auth_insert"  on public.message_reactions;
drop policy if exists "message_reactions_self_delete"  on public.message_reactions;

create policy "message_reactions_public_read" on public.message_reactions for select using (true);
create policy "message_reactions_auth_insert" on public.message_reactions for insert
  with check (user_id = auth.uid() and auth.uid() is not null);
create policy "message_reactions_self_delete" on public.message_reactions for delete
  using (user_id = auth.uid());

-- ── community_members ───────────────────────────────────────────────────────
drop policy if exists "community_members_public_read"  on public.community_members;
drop policy if exists "community_members_self_insert"  on public.community_members;
drop policy if exists "community_members_self_delete"  on public.community_members;

create policy "community_members_public_read" on public.community_members for select using (true);
create policy "community_members_self_insert" on public.community_members for insert
  with check (user_id = auth.uid() and auth.uid() is not null);
create policy "community_members_self_delete" on public.community_members for delete
  using (user_id = auth.uid());

-- ── saved_posts ─────────────────────────────────────────────────────────────
drop policy if exists "saved_posts_self_read"    on public.saved_posts;
drop policy if exists "saved_posts_self_insert"  on public.saved_posts;
drop policy if exists "saved_posts_self_delete"  on public.saved_posts;

create policy "saved_posts_self_read" on public.saved_posts for select
  using (user_id = auth.uid());
create policy "saved_posts_self_insert" on public.saved_posts for insert
  with check (user_id = auth.uid() and auth.uid() is not null);
create policy "saved_posts_self_delete" on public.saved_posts for delete
  using (user_id = auth.uid());

-- =============================================================================
-- 8) STORAGE — bucket "attachments" (PDFs y audios)
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

drop policy if exists "attachments_public_read"  on storage.objects;
drop policy if exists "attachments_auth_insert"  on storage.objects;
drop policy if exists "attachments_auth_delete"  on storage.objects;

create policy "attachments_public_read"
  on storage.objects for select
  using (bucket_id = 'attachments');

create policy "attachments_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.uid() is not null);

create policy "attachments_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================================
-- 9) SEED — comunidades por defecto
-- =============================================================================

insert into public.communities (name) values
  ('General'),
  ('Tecnología'),
  ('Arte y Diseño')
on conflict do nothing;
