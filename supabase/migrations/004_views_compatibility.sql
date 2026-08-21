-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 004_views_compatibility.sql
-- Views que expõem os arrays do Firestore (compat com o adapter).
-- security_invoker: respeita RLS de quem consulta (PG15+).
-- ═══════════════════════════════════════════════════════════════

create or replace view public.v_profile_completed_lessons with (security_invoker = true) as
  select user_id,
         array_agg(lesson_id order by completed_at) as completed_lessons,
         count(*)::int                              as total
    from public.lesson_progress
   where completed = true
group by user_id;

create or replace view public.v_profile_completed_courses with (security_invoker = true) as
  select user_id, array_agg(course_id) as completed_courses
    from public.course_completions
group by user_id;

create or replace view public.v_profile_completed_quizzes with (security_invoker = true) as
  select user_id, array_agg(module_id) as completed_quizzes
    from public.quiz_completions
group by user_id;

-- Perfil + preferências + arrays num só payload (formato próximo ao doc Firestore)
create or replace view public.v_user_profile_compat with (security_invoker = true) as
  select p.*,
         ep.marketing_opt_out,
         ep.notifications_opt_out,
         coalesce(l.completed_lessons, '{}')  as completed_lessons,
         coalesce(cc.completed_courses, '{}') as completed_courses,
         coalesce(q.completed_quizzes, '{}')  as completed_quizzes
    from public.profiles p
    left join public.email_preferences ep        on ep.user_id = p.id
    left join public.v_profile_completed_lessons l  on l.user_id = p.id
    left join public.v_profile_completed_courses cc on cc.user_id = p.id
    left join public.v_profile_completed_quizzes q  on q.user_id = p.id;
