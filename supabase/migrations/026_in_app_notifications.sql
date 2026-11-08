-- Persistent notification inbox backing the application bell.

create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_event_id uuid references public.push_events(id) on delete set null,
  title text not null,
  body text not null default '',
  url text not null default '/',
  category text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint in_app_notifications_title_length
    check (char_length(title) between 1 and 120),
  constraint in_app_notifications_body_length
    check (char_length(body) <= 500)
);

create unique index if not exists in_app_notifications_event_user_idx
  on public.in_app_notifications (user_id, source_event_id);

create index if not exists in_app_notifications_recent_idx
  on public.in_app_notifications (user_id, created_at desc);

create index if not exists in_app_notifications_unread_idx
  on public.in_app_notifications (user_id, created_at desc)
  where is_read = false;

alter table public.in_app_notifications enable row level security;

drop policy if exists "in_app_notifications_read_own"
  on public.in_app_notifications;
create policy "in_app_notifications_read_own"
  on public.in_app_notifications
  for select to authenticated
  using (public.user_is_profile_owner(user_id));

drop policy if exists "in_app_notifications_update_own"
  on public.in_app_notifications;
create policy "in_app_notifications_update_own"
  on public.in_app_notifications
  for update to authenticated
  using (public.user_is_profile_owner(user_id))
  with check (public.user_is_profile_owner(user_id));

revoke all on public.in_app_notifications from anon, authenticated;
grant select on public.in_app_notifications to authenticated;
grant update (is_read) on public.in_app_notifications to authenticated;
grant all on public.in_app_notifications to service_role;
