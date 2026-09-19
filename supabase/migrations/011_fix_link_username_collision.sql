-- WebStart Academy - 011_fix_link_username_collision.sql
-- Evita colisao entre o username do perfil legado e a copia keyed por auth.uid().

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
  v_auth       public.profiles%rowtype;
  v_legacy     public.profiles%rowtype;
  v_email      text;
  v_source     text;
  v_username   text;
begin
  select * into v_auth from public.profiles where id = p_auth_uid;

  if p_firebase_uid is not null then
    select * into v_legacy from public.profiles
      where legacy_firebase_uid = p_firebase_uid
      limit 1;
    if v_legacy.id is not null then
      v_source := 'firebase_uid';
    end if;
  end if;

  if v_legacy.id is null then
    select email into v_email from auth.users where id = p_auth_uid;
    if v_email is null then v_email := v_auth.email; end if;

    if v_email is not null and btrim(v_email) <> '' then
      select * into v_legacy
        from public.profiles
        where lower(email) = lower(btrim(v_email))
          and id <> p_auth_uid
        order by xp desc, created_at asc nulls last
        limit 1;
      if v_legacy.id is not null then v_source := 'email'; end if;
    end if;
  end if;

  if v_legacy.id is null then return p_auth_uid; end if;
  if v_legacy.auth_user_id is not null and v_legacy.auth_user_id <> p_auth_uid then
    return p_auth_uid;
  end if;

  v_username := v_legacy.username;
  if v_username is not null and exists (
    select 1 from public.profiles
    where username = v_username and id <> p_auth_uid
  ) then
    v_username := left(v_username, 80) || '-' || left(replace(p_auth_uid::text, '-', ''), 8);
  end if;

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
      p_auth_uid, null, name, v_username, email, provider, role,
      photo_url, xp, level, streak, last_study_date, completed_exercises,
      completed_projects, current_course, current_lesson, total_study_time,
      total_study_time_legacy, is_public, first_steps_done, created_at, now(),
      welcome_email_sent, welcome_email_sent_at, last_reactivation_email,
      certificates, is_premium, purchased_courses, completed_lessons,
      completed_courses, completed_quizzes, github_url, portfolio_url,
      linkedin_url, twitter_url, instagram_url, website_url, bio, now(),
      null
  from public.profiles
  where id = v_legacy.id
  on conflict (id) do update
    set name                    = coalesce(public.profiles.name, excluded.name),
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
        current_course         = coalesce(public.profiles.current_course, excluded.current_course),
        current_lesson          = coalesce(public.profiles.current_lesson, excluded.current_lesson),
        total_study_time        = excluded.total_study_time,
        total_study_time_legacy = coalesce(public.profiles.total_study_time_legacy, excluded.total_study_time_legacy),
        first_steps_done        = public.profiles.first_steps_done or excluded.first_steps_done,
        certificates            = excluded.certificates,
        purchased_courses       = excluded.purchased_courses,
        completed_lessons      = excluded.completed_lessons,
        completed_courses      = excluded.completed_courses,
        completed_quizzes      = excluded.completed_quizzes,
        github_url             = coalesce(public.profiles.github_url, excluded.github_url),
        portfolio_url          = coalesce(public.profiles.portfolio_url, excluded.portfolio_url),
        linkedin_url           = coalesce(public.profiles.linkedin_url, excluded.linkedin_url),
        twitter_url            = coalesce(public.profiles.twitter_url, excluded.twitter_url),
        instagram_url          = coalesce(public.profiles.instagram_url, excluded.instagram_url),
        website_url            = coalesce(public.profiles.website_url, excluded.website_url),
        bio                    = coalesce(public.profiles.bio, excluded.bio)
    where public.profiles.xp = 0
      and public.profiles.completed_lessons = '[]'::jsonb
      and public.profiles.completed_courses = '[]'::jsonb;

  insert into public.lesson_progress
      (user_id, lesson_id, course_id, module_id, completed, progress_percentage,
       time_spent, completed_at, updated_at, legacy_doc_id, time_spent_legacy)
    select p_auth_uid, lesson_id, course_id, module_id, completed, progress_percentage,
           time_spent, completed_at, updated_at, legacy_doc_id, time_spent_legacy
      from public.lesson_progress where user_id = v_legacy.id
    on conflict (user_id, lesson_id) do nothing;

  insert into public.quiz_completions (user_id, module_id, completed_at)
    select p_auth_uid, module_id, completed_at from public.quiz_completions
      where user_id = v_legacy.id on conflict (user_id, module_id) do nothing;

  insert into public.course_completions (user_id, course_id, completed_at)
    select p_auth_uid, course_id, completed_at from public.course_completions
      where user_id = v_legacy.id on conflict (user_id, course_id) do nothing;

  insert into public.user_achievements (user_id, achievement_id, earned_at)
    select p_auth_uid, achievement_id, earned_at from public.user_achievements
      where user_id = v_legacy.id on conflict (user_id, achievement_id) do nothing;

  insert into public.learning_profiles
      (user_id, assessment, roadmap, metadata, completed, source, created_at, updated_at)
    select p_auth_uid, assessment, roadmap, metadata, completed, source, created_at, now()
      from public.learning_profiles where user_id = v_legacy.id
    on conflict (user_id) do nothing;

  insert into public.email_preferences (user_id, marketing_opt_out, notifications_opt_out, updated_at)
    select p_auth_uid, marketing_opt_out, notifications_opt_out, now()
      from public.email_preferences where user_id = v_legacy.id
    on conflict (user_id) do nothing;

  update public.profiles set auth_user_id = p_auth_uid
    where id = v_legacy.id and auth_user_id is null;

  insert into public.identity_links (auth_uid, source_profile_id, legacy_firebase_uid, match_source)
    values (p_auth_uid, v_legacy.id, v_legacy.legacy_firebase_uid, v_source)
  on conflict (auth_uid) do update set
    source_profile_id = excluded.source_profile_id,
    legacy_firebase_uid = excluded.legacy_firebase_uid,
    match_source = excluded.match_source,
    created_at = now();

  return p_auth_uid;
end
$$;

grant execute on function public.link_legacy_profile(uuid, text) to authenticated;
