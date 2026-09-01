-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 007_add_profile_progress_columns.sql
-- Adiciona colunas JSONB ausentes em profiles que o código espera.
-- Complementa lesson_progress / course_completions / quiz_completions
-- com colunas de conveniência no perfil do utilizador.
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists completed_lessons   jsonb not null default '[]',
  add column if not exists completed_courses   jsonb not null default '[]',
  add column if not exists completed_quizzes   jsonb not null default '[]';
