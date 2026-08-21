-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 003_rls.sql
-- Row Level Security + policies + realtime.
-- Fase atual: acesso via service_role (import) — RLS já pronta p/ cutover.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from anon, authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles             enable row level security;
alter table public.email_preferences    enable row level security;
alter table public.learning_profiles    enable row level security;
alter table public.firebase_id_mapping  enable row level security;
alter table public.courses              enable row level security;
alter table public.modules              enable row level security;
alter table public.lessons              enable row level security;
alter table public.achievements         enable row level security;
alter table public.lesson_progress      enable row level security;
alter table public.quiz_completions     enable row level security;
alter table public.course_completions   enable row level security;
alter table public.user_achievements    enable row level security;
alter table public.xp_transactions      enable row level security;
alter table public.email_events         enable row level security;
alter table public.announcements        enable row level security;

-- ─── profiles: dono, públicos ou admin ─────────────────────────

create policy "profiles_select_self_or_public"
  on public.profiles for select to authenticated
  using (id = auth.uid() or is_public = true or public.is_admin());

create policy "profiles_insert_self"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_admin_all"
  on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── preferências / perfil de aprendizagem: dono apenas ────────

create policy "email_prefs_own"     on public.email_preferences    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "learning_own"        on public.learning_profiles    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "progress_own"        on public.lesson_progress      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "quiz_own"            on public.quiz_completions     for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ccourse_own"         on public.course_completions   for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "uachv_select_visible"
  on public.user_achievements for select to authenticated
  using (user_id = auth.uid()
         or exists (select 1 from public.profiles p where p.id = user_id and p.is_public));

create policy "uachv_insert_own"
  on public.user_achievements for insert to authenticated
  with check (user_id = auth.uid());

-- xp_transactions / email_events / firebase_id_mapping:
-- SEM policies → negadas a anon/authenticated; service_role bypassa RLS.

-- ─── conteúdo: leitura pública ─────────────────────────────────

create policy "courses_read"     on public.courses       for select to anon, authenticated using (true);
create policy "modules_read"     on public.modules       for select to anon, authenticated using (true);
create policy "lessons_read"     on public.lessons       for select to anon, authenticated using (true);
create policy "achvmnts_read"    on public.achievements  for select to anon, authenticated using (true);
create policy "announcements_read" on public.announcements for select to authenticated using (public.is_admin());

-- ─── realtime (ignora erro se tabela/publicação não existir) ───

do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object or undefined_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.lesson_progress;
exception when duplicate_object or undefined_object then null; end $$;
