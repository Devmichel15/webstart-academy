-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 002_indexes.sql
-- Índices para os padrões de acesso do app + queries de validação.
-- ═══════════════════════════════════════════════════════════════

-- profiles: buscas do app e adminService
create index if not exists idx_profiles_username        on public.profiles (lower(username));
create index if not exists idx_profiles_role            on public.profiles (role);
create index if not exists idx_profiles_is_public       on public.profiles (is_public) where is_public;
create index if not exists idx_profiles_last_login      on public.profiles (last_login);
create index if not exists idx_profiles_legacy_uid      on public.profiles (legacy_firebase_uid);

-- lesson_progress
create index if not exists idx_progress_user_completed  on public.lesson_progress (user_id) where completed;
create index if not exists idx_progress_lesson          on public.lesson_progress (lesson_id);
create index if not exists idx_progress_course          on public.lesson_progress (course_id);
create index if not exists idx_progress_updated         on public.lesson_progress (updated_at desc);

-- quiz / course completions
create index if not exists idx_quiz_module              on public.quiz_completions (module_id);
create index if not exists idx_ccourse_course           on public.course_completions (course_id);

-- user_achievements
create index if not exists idx_uachv_achievement        on public.user_achievements (achievement_id);

-- conteúdo
create index if not exists idx_modules_course           on public.modules (course_id, "order");
create index if not exists idx_lessons_module           on public.lessons (module_id, "order");
create index if not exists idx_lessons_course           on public.lessons (course_id, "order");

-- email
create index if not exists idx_email_events_email       on public.email_events (email);
create index if not exists idx_email_events_occurred    on public.email_events (occurred_at desc);
create index if not exists idx_xp_tx_user               on public.xp_transactions (user_id, created_at desc);
