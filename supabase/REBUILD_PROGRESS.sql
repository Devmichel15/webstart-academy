-- ═══════════════════════════════════════════════════════════════
-- EXECUTAR NO SUPABASE SQL EDITOR
-- Reconstrói completed_lessons / completed_courses / completed_quizzes
-- e total_study_time em profiles a partir das tabelas de progresso.
-- ═══════════════════════════════════════════════════════════════

-- 1. completed_lessons: array de lesson_ids concluídas
update public.profiles p
set completed_lessons = coalesce(sub.ids, '[]'::jsonb)
from (
  select user_id, jsonb_agg(lesson_id) as ids
  from public.lesson_progress
  where completed = true
  group by user_id
) sub
where p.id = sub.user_id;

-- 2. completed_courses: array de course_ids concluídas
update public.profiles p
set completed_courses = coalesce(sub.ids, '[]'::jsonb)
from (
  select user_id, jsonb_agg(course_id) as ids
  from public.course_completions
  group by user_id
) sub
where p.id = sub.user_id;

-- 3. completed_quizzes: array de module_ids concluídos
update public.profiles p
set completed_quizzes = coalesce(sub.ids, '[]'::jsonb)
from (
  select user_id, jsonb_agg(module_id) as ids
  from public.quiz_completions
  group by user_id
) sub
where p.id = sub.user_id;

-- 4. total_study_time: soma dos minutos estudados
update public.profiles p
set total_study_time = coalesce(sub.total, 0)
from (
  select user_id, sum(time_spent) as total
  from public.lesson_progress
  where time_spent is not null
  group by user_id
) sub
where p.id = sub.user_id;

-- Verificação: mostrar quantos perfis foram atualizados
select
  (select count(*) from profiles where completed_lessons != '[]'::jsonb) as profiles_with_lessons,
  (select count(*) from profiles where completed_courses != '[]'::jsonb) as profiles_with_courses,
  (select count(*) from profiles where completed_quizzes != '[]'::jsonb) as profiles_with_quizzes,
  (select count(*) from profiles where total_study_time > 0) as profiles_with_study_time,
  (select count(*) from lesson_progress where completed = true) as total_lesson_completions,
  (select count(*) from course_completions) as total_course_completions,
  (select count(*) from quiz_completions) as total_quiz_completions;
