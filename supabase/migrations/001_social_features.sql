-- ─────────────────────────────────────────────
-- Migration 001: Social Network Features
-- Friendships, Skills, Links, Notifications,
-- Reactions (karma), Custom Communities
-- ─────────────────────────────────────────────

-- ── Extend communities ───────────────────────
alter table public.communities
  add column if not exists description text not null default '',
  add column if not exists created_by   uuid references public.users(id) on delete set null,
  add column if not exists tags         text[] not null default '{}';

create policy "communities_auth_insert"
  on public.communities for insert
  with check (created_by = auth.uid() and auth.uid() is not null);

create policy "communities_creator_delete"
  on public.communities for delete
  using (created_by = auth.uid());

-- ── Friendships ──────────────────────────────
create table if not exists public.friendships (
  id           uuid        primary key default gen_random_uuid(),
  requester_id uuid        not null references public.users(id) on delete cascade,
  addressee_id uuid        not null references public.users(id) on delete cascade,
  status       text        not null default 'pending'
                           check (status in ('pending', 'accepted', 'rejected')),
  created_at   timestamptz not null default now(),
  constraint friendships_unique    unique (requester_id, addressee_id),
  constraint friendships_no_self   check  (requester_id <> addressee_id)
);

create index if not exists friendships_addressee_idx
  on public.friendships (addressee_id, status);
create index if not exists friendships_requester_idx
  on public.friendships (requester_id, status);

alter table public.friendships enable row level security;
alter table public.friendships replica identity full;
alter publication supabase_realtime add table public.friendships;

create policy "friendships_participants_read"
  on public.friendships for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "friendships_auth_insert"
  on public.friendships for insert
  with check (requester_id = auth.uid() and auth.uid() is not null);

create policy "friendships_addressee_update"
  on public.friendships for update
  using  (addressee_id = auth.uid())
  with check (addressee_id = auth.uid());

create policy "friendships_participants_delete"
  on public.friendships for delete
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ── User Skills ───────────────────────────────
create table if not exists public.user_skills (
  user_id uuid not null references public.users(id) on delete cascade,
  skill   text not null check (char_length(skill) between 1 and 50),
  primary key (user_id, skill)
);

alter table public.user_skills enable row level security;
alter table public.user_skills replica identity full;
alter publication supabase_realtime add table public.user_skills;

create policy "user_skills_public_read"
  on public.user_skills for select using (true);

create policy "user_skills_self_insert"
  on public.user_skills for insert
  with check (user_id = auth.uid() and auth.uid() is not null);

create policy "user_skills_self_delete"
  on public.user_skills for delete
  using (user_id = auth.uid());

-- ── User External Links ───────────────────────
create table if not exists public.user_links (
  user_id   uuid not null references public.users(id) on delete cascade,
  link_type text not null check (link_type in ('github','arxiv','orcid','linkedin','twitter','website')),
  url       text not null check (char_length(url) <= 500),
  primary key (user_id, link_type)
);

alter table public.user_links enable row level security;

create policy "user_links_public_read"
  on public.user_links for select using (true);

create policy "user_links_self_insert"
  on public.user_links for insert
  with check (user_id = auth.uid() and auth.uid() is not null);

create policy "user_links_self_update"
  on public.user_links for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_links_self_delete"
  on public.user_links for delete
  using (user_id = auth.uid());

-- ── Notifications ─────────────────────────────
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

create index if not exists notifications_user_idx
  on public.notifications (user_id, read, created_at desc);

alter table public.notifications enable row level security;
alter table public.notifications replica identity full;
alter publication supabase_realtime add table public.notifications;

create policy "notifications_self_read"
  on public.notifications for select
  using (user_id = auth.uid());

-- Any auth user can insert notifications (needed to notify other users)
create policy "notifications_auth_insert"
  on public.notifications for insert
  with check (auth.uid() is not null);

create policy "notifications_self_update"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "notifications_self_delete"
  on public.notifications for delete
  using (user_id = auth.uid());

-- ── Message Reactions (karma upvotes) ─────────
create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id    uuid not null references public.users(id)    on delete cascade,
  primary key (message_id, user_id)
);

alter table public.message_reactions enable row level security;
alter table public.message_reactions replica identity full;
alter publication supabase_realtime add table public.message_reactions;

create policy "message_reactions_public_read"
  on public.message_reactions for select using (true);

create policy "message_reactions_auth_insert"
  on public.message_reactions for insert
  with check (user_id = auth.uid() and auth.uid() is not null);

create policy "message_reactions_self_delete"
  on public.message_reactions for delete
  using (user_id = auth.uid());
