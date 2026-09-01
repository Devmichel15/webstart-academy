-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 009_identity_link.sql
-- B1: vínculo de identidade entre auth.users (GoTrue) e o histórico
--     migrado do Firebase (perfis com id = uuidv5(NS, firebase_uid)).
-- B2: RLS de leitura/escrita para admin nas tabelas de progresso.
-- Estratégia (decisão do audit): legacy_firebase_uid é a chave de join
-- autoritativa/imutável; a coluna auth_user_id passa a apontar o perfil
-- para auth.uid(); re-link é copy+validate, nunca destrutivo.
-- ═══════════════════════════════════════════════════════════════

-- ─── B1: coluna de vínculo ─────────────────────────────────────

alter table public.profiles
  add column if not exists auth_user_id uuid;

create unique index if not exists idx_profiles_auth_user_id
  on public.profiles (auth_user_id);

-- novos cadastros GoTrue não têm (e não devem ter) Firebase UID
alter table public.profiles
  alter column legacy_firebase_uid drop not null;

-- ─── B1: auditoria de re-links ─────────────────────────────────

create table if not exists public.identity_links (
  auth_uid            uuid primary key,
  source_profile_id   uuid not null references public.profiles(id) on delete cascade,
  legacy_firebase_uid text,
  match_source        text check (match_source in ('firebase_uid', 'email')),
  created_at          timestamptz not null default now()
);

alter table public.identity_links enable row level security;

create policy "identity_links_select_own"
  on public.identity_links for select to authenticated
  using (auth_uid = auth.uid());

create policy "identity_links_admin_all"
  on public.identity_links for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── B1: função de re-link (copy + validate, nunca destrutivo) ──

create or replace function public.link_legacy_profile(
  p_auth_uid     uuid,
  p_firebase_uid text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth   public.profiles%rowtype;
  v_legacy public.profiles%rowtype;
  v_email  text;
  v_source text;
begin
  select * into v_auth from public.profiles where id = p_auth_uid;

  -- 1) fonte autoritativa: legacy_firebase_uid (chave imutável da migração)
  if p_firebase_uid is not null then
    select * into v_legacy from public.profiles
      where legacy_firebase_uid = p_firebase_uid
      limit 1;
    if v_legacy.id is not null then
      v_source := 'firebase_uid';
    end if;
  end if;

  -- 2) fallback: email normalizado (auditado em identity_links)
  if v_legacy.id is null then
    select email into v_email
      from auth.users
      where id = p_auth_uid;

    if v_email is null then
      v_email := v_auth.email;
    end if;

    if v_email is not null and btrim(v_email) <> '' then
      select * into v_legacy
        from public.profiles
        where lower(email) = lower(btrim(v_email))
          and id <> p_auth_uid
        order by xp desc, created_at asc nulls last
        limit 1;
      if v_legacy.id is not null then
        v_source := 'email';
      end if;
    end if;
  end if;

  -- nada legado para reconciliar (novo cadastro sem histórico)
  if v_legacy.id is null then
    return p_auth_uid;
  end if;

  -- já vinculado a outro auth_uid -> não mexe (idempotente / anti-corrida)
  if v_legacy.auth_user_id is not null and v_legacy.auth_user_id <> p_auth_uid then
    return p_auth_uid;
  end if;

  -- 3) perfil de trabalho em p_auth_uid como CÓPIA do legado.
  --    Se já existe, só preenche enquanto ainda estiver vazio/duplicado.
  insert into public.profiles (
      id, legacy_firebase_uid, name, username, email, provider, role,
      photo_url, xp, level, streak, last_study_date, completed_exercises,
      completed_projects, current_course, current_lesson, total_study_time,
      total_study_time_legacy, is_public, first_steps_done, created_at, last_login,
      welcome_email_sent, welcome_email_sent_at, last_reactivation_email,
      certificates, is_premium, purchased_courses, completed_lessons,
      completed_courses, completed_quizzes, github_url, portfolio_url,
      linkedin_url, twitter_url, instagram_url, website_url, bio, updated_at,
      auth_user_id
  )
  select
      p_auth_uid, legacy_firebase_uid, name, username, email, provider, role,
      photo_url, xp, level, streak, last_study_date, completed_exercises,
      completed_projects, current_course, current_lesson, total_study_time,
      total_study_time_legacy, is_public, first_steps_done, created_at, now(),
      welcome_email_sent, welcome_email_sent_at, last_reactivation_email,
      certificates, is_premium, purchased_courses, completed_lessons,
      completed_courses, completed_quizzes, github_url, portfolio_url,
      linkedin_url, twitter_url, instagram_url, website_url, bio, now(),
      NULL
  from public.profiles
  where id = v_legacy.id
  on conflict (id) do update
    set legacy_firebase_uid     = coalesce(public.profiles.legacy_firebase_uid, excluded.legacy_firebase_uid),
        name                    = coalesce(public.profiles.name, excluded.name),
        username                = coalesce(public.profiles.username, excluded.username),
        email                   = coalesce(public.profiles.email, excluded.email),
        role                    = case when public.profiles.role = 'student' then excluded.role else public.profiles.role end,
        photo_url               = coalesce(public.profiles.photo_url, excluded.photo_url),
        xp                      = excluded.xp,
        level                   = excluded.level,
        streak                  = excluded.streak,
        last_study_date         = coalesce(public.profiles.last_study_date, excluded.last_study_date),
        completed_exercises     = excluded.completed_exercises,
        completed_projects      = excluded.completed_projects,
        current_course          = coalesce(public.profiles.current_course, excluded.current_course),
        current_lesson          = coalesce(public.profiles.current_lesson, excluded.current_lesson),
        total_study_time        = excluded.total_study_time,
        total_study_time_legacy = coalesce(public.profiles.total_study_time_legacy, excluded.total_study_time_legacy),
        first_steps_done        = public.profiles.first_steps_done or excluded.first_steps_done,
        certificates            = excluded.certificates,
        purchased_courses       = excluded.purchased_courses,
        completed_lessons       = excluded.completed_lessons,
        completed_courses       = excluded.completed_courses,
        completed_quizzes       = excluded.completed_quizzes,
        github_url              = coalesce(public.profiles.github_url, excluded.github_url),
        portfolio_url           = coalesce(public.profiles.portfolio_url, excluded.portfolio_url),
        linkedin_url            = coalesce(public.profiles.linkedin_url, excluded.linkedin_url),
        twitter_url             = coalesce(public.profiles.twitter_url, excluded.twitter_url),
        instagram_url           = coalesce(public.profiles.instagram_url, excluded.instagram_url),
        website_url             = coalesce(public.profiles.website_url, excluded.website_url),
        bio                     = coalesce(public.profiles.bio, excluded.bio)
    where public.profiles.xp = 0
      and public.profiles.completed_lessons = '[]'::jsonb
      and public.profiles.completed_courses = '[]'::jsonb;

  -- 4) histórico (filhos) — idempotente: só insere o que ainda não existe
  insert into public.lesson_progress
      (user_id, lesson_id, course_id, module_id, completed, progress_percentage,
       time_spent, completed_at, updated_at, legacy_doc_id, time_spent_legacy)
    select p_auth_uid, lesson_id, course_id, module_id, completed, progress_percentage,
           time_spent, completed_at, updated_at, legacy_doc_id, time_spent_legacy
      from public.lesson_progress
      where user_id = v_legacy.id
    on conflict (user_id, lesson_id) do nothing;

  insert into public.quiz_completions (user_id, module_id, completed_at)
    select p_auth_uid, module_id, completed_at
      from public.quiz_completions
      where user_id = v_legacy.id
    on conflict (user_id, module_id) do nothing;

  insert into public.course_completions (user_id, course_id, completed_at)
    select p_auth_uid, course_id, completed_at
      from public.course_completions
      where user_id = v_legacy.id
    on conflict (user_id, course_id) do nothing;

  insert into public.user_achievements (user_id, achievement_id, earned_at)
    select p_auth_uid, achievement_id, earned_at
      from public.user_achievements
      where user_id = v_legacy.id
    on conflict (user_id, achievement_id) do nothing;

  insert into public.learning_profiles
      (user_id, assessment, roadmap, metadata, completed, source, created_at, updated_at)
    select p_auth_uid, assessment, roadmap, metadata, completed, source, created_at, now()
      from public.learning_profiles
      where user_id = v_legacy.id
    on conflict (user_id) do nothing;

  insert into public.email_preferences (user_id, marketing_opt_out, notifications_opt_out, updated_at)
    select p_auth_uid, marketing_opt_out, notifications_opt_out, now()
      from public.email_preferences
      where user_id = v_legacy.id
    on conflict (user_id) do nothing;

  -- 5) marca o legado como vinculado a este auth_uid
  update public.profiles
     set auth_user_id = p_auth_uid
   where id = v_legacy.id
     and auth_user_id is null;

  -- 6) auditoria do vínculo
  insert into public.identity_links (auth_uid, source_profile_id, legacy_firebase_uid, match_source)
    values (p_auth_uid, v_legacy.id, v_legacy.legacy_firebase_uid, v_source)
  on conflict (auth_uid) do update
    set source_profile_id   = excluded.source_profile_id,
        legacy_firebase_uid = excluded.legacy_firebase_uid,
        match_source        = excluded.match_source,
        created_at          = now();

  return p_auth_uid;
end
$$;

grant execute on function public.link_legacy_profile(uuid, text) to authenticated;

-- ─── B2: RLS de admin (leitura do progresso de todos os alunos) ─

create policy "progress_admin_all"
  on public.lesson_progress for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "quiz_admin_all"
  on public.quiz_completions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "ccourse_admin_all"
  on public.course_completions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "uachv_admin_all"
  on public.user_achievements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "learning_admin_select"
  on public.learning_profiles for select to authenticated
  using (public.is_admin());

create policy "email_prefs_admin_select"
  on public.email_preferences for select to authenticated
  using (public.is_admin());