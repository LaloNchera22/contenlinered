-- ─────────────────────────────────────────────
-- Migration 003: User Personalization & Settings
-- Display name, language, privacy controls.
-- ─────────────────────────────────────────────

-- ── Extend users with optional display_name ──
alter table public.users
  add column if not exists display_name text not null default ''
  check (char_length(display_name) <= 60);

-- ── User settings (1-row-per-user preferences) ──
create table if not exists public.user_settings (
  user_id            uuid        primary key references public.users(id) on delete cascade,
  language           text        not null default 'es'
                                 check (language in ('es', 'en')),
  -- Who can send DMs: anyone (default), friends only, no one
  dm_policy          text        not null default 'anyone'
                                 check (dm_policy in ('anyone', 'friends', 'nobody')),
  -- Who can see your profile (status, skills): public or friends-only
  profile_visibility text        not null default 'public'
                                 check (profile_visibility in ('public', 'friends')),
  -- Who can see your external links: public, friends, or nobody
  links_visibility   text        not null default 'public'
                                 check (links_visibility in ('public', 'friends', 'nobody')),
  -- Show online presence indicator to others
  show_online        boolean     not null default true,
  -- Allow others to mention you with @username
  allow_mentions     boolean     not null default true,
  -- Email & in-app notification toggles
  notify_friend_requests boolean not null default true,
  notify_mentions    boolean     not null default true,
  notify_messages    boolean     not null default true,
  updated_at         timestamptz not null default now()
);

create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute procedure public.handle_updated_at();

alter table public.user_settings enable row level security;
alter table public.user_settings replica identity full;
alter publication supabase_realtime add table public.user_settings;

-- Users can read their own settings (kept private; not public).
create policy "user_settings_self_read"
  on public.user_settings for select
  using (user_id = auth.uid());

create policy "user_settings_self_insert"
  on public.user_settings for insert
  with check (user_id = auth.uid() and auth.uid() is not null);

create policy "user_settings_self_update"
  on public.user_settings for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_settings_self_delete"
  on public.user_settings for delete
  using (user_id = auth.uid());

-- Helper: ensure a settings row exists for every user on first sign-in.
-- (App layer does an upsert on load; this keeps things resilient.)
create or replace function public.ensure_user_settings()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists users_ensure_settings on public.users;
create trigger users_ensure_settings
  after insert on public.users
  for each row execute procedure public.ensure_user_settings();
