-- ─────────────────────────────────────────────
-- Migration 002: Reddit-style Community Features
-- Community membership, saved posts, post titles
-- ─────────────────────────────────────────────

-- ── Post titles (optional field on messages) ──
alter table public.messages
  add column if not exists title text check (char_length(title) <= 300);

-- ── Community Membership ──────────────────────
create table if not exists public.community_members (
  community_id uuid        not null references public.communities(id) on delete cascade,
  user_id      uuid        not null references public.users(id)       on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index if not exists community_members_community_idx
  on public.community_members (community_id);

create index if not exists community_members_user_idx
  on public.community_members (user_id);

alter table public.community_members enable row level security;
alter table public.community_members replica identity full;
alter publication supabase_realtime add table public.community_members;

-- Anyone can read member counts (for community browsing)
create policy "community_members_public_read"
  on public.community_members for select using (true);

-- Authenticated users can join communities
create policy "community_members_self_insert"
  on public.community_members for insert
  with check (user_id = auth.uid() and auth.uid() is not null);

-- Members can leave communities
create policy "community_members_self_delete"
  on public.community_members for delete
  using (user_id = auth.uid());

-- ── Saved Posts ───────────────────────────────
create table if not exists public.saved_posts (
  user_id    uuid        not null references public.users(id)    on delete cascade,
  message_id uuid        not null references public.messages(id) on delete cascade,
  saved_at   timestamptz not null default now(),
  primary key (user_id, message_id)
);

create index if not exists saved_posts_user_idx
  on public.saved_posts (user_id, saved_at desc);

alter table public.saved_posts enable row level security;

-- Users can only see their own saved posts
create policy "saved_posts_self_read"
  on public.saved_posts for select
  using (user_id = auth.uid());

-- Users can save posts
create policy "saved_posts_self_insert"
  on public.saved_posts for insert
  with check (user_id = auth.uid() and auth.uid() is not null);

-- Users can unsave posts
create policy "saved_posts_self_delete"
  on public.saved_posts for delete
  using (user_id = auth.uid());
