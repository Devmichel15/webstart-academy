-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 001_initial_schema.sql
-- Fontes: docs/migration/database-schema.md (FINAL) + backup-report.md
-- Ordem de criação respeita dependências. Idempotente por projeto novo.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── IDENTITY ──────────────────────────────────────────────────

create table public.profiles (
  id                      uuid primary key,
  -- uuid determinístico derivado do Firebase UID (uuidv5), gerado pelo transform
  legacy_firebase_uid     text not null unique,
  name                    text not null default 'Aluno WebStart',
  username                text unique,
  email                   text not null default '',
  provider                text not null default 'email' check (provider in ('email','google')),
  role                    text not null default 'student' check (role in ('student','admin')),
  photo_url               text,

  xp                      integer not null default 0 check (xp >= 0),
  level                   integer not null default 1,
  streak                  integer not null default 0,
  last_study_date         date,
  completed_exercises     integer not null default 0,
  completed_projects      integer not null default 0,
  current_course          text,
  current_lesson          text,
  total_study_time        integer not null default 0,
  -- preserva valor original (string corrompida por concatenação em 28 docs legados)
  total_study_time_legacy text,

  is_public               boolean not null default true,
  first_steps_done        boolean not null default false,

  created_at              timestamptz not null default now(),
  last_login              timestamptz,
  welcome_email_sent      boolean not null default false,
  welcome_email_sent_at   timestamptz,
  last_reactivation_email timestamptz,

  certificates            jsonb not null default '[]',
  is_premium              boolean not null default false,
  purchased_courses       jsonb not null default '[]'
);

create table public.email_preferences (
  user_id               uuid primary key references public.profiles(id) on delete cascade,
  marketing_opt_out     boolean not null default false,
  notifications_opt_out boolean not null default false,
  updated_at            timestamptz not null default now()
);

create table public.learning_profiles (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  assessment jsonb not null default '{}',
  roadmap    jsonb not null default '{}',
  metadata   jsonb not null default '{}',
  completed  boolean not null default false,
  source     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.firebase_id_mapping (
  firebase_doc_path text primary key,
  supabase_table    text not null,
  supabase_id       text not null,
  migrated_at       timestamptz not null default now()
);

-- ─── LEARNING (conteúdo; seed a partir de src/data/** na fase de import) ───

create table public.courses (
  id              text primary key,
  title           text not null,
  slug            text unique,
  description     text,
  thumbnail       text default '',
  difficulty      text default 'beginner',
  estimated_hours integer default 0,
  total_lessons   integer default 0,
  icon            text,
  color           text,
  status          text not null default 'available' check (status in ('available','soon')),
  sort_order      integer,
  instructor      text,
  required_trail  text,
  -- payload específico do app (level/xp/completion) preservado em jsonb
  extra           jsonb not null default '{}'
);

create table public.modules (
  id          text primary key,
  course_id   text not null references public.courses(id) on delete cascade,
  title       text not null default '',
  description text,
  "order"     integer default 1,
  -- quiz/lab/miniProject do catálogo estático
  extra       jsonb not null default '{}'
);

create table public.lessons (
  id                   text primary key,
  module_id            text references public.modules(id) on delete set null,
  course_id            text not null references public.courses(id) on delete cascade,
  title                text not null,
  slug                 text,
  content              text,
  illustration         text,
  estimated_time       integer,
  "order"              integer default 1,
  resources            jsonb not null default '[]',
  exercise             jsonb,
  -- payload específico (type/youtubeUrl/embedUrl/duration/legacy)
  extra                jsonb not null default '{}',
  notification_sent    boolean not null default false,
  notification_sent_at timestamptz,
  notification_stats   jsonb
);

create table public.achievements (
  id          text primary key,
  title       text not null,
  description text,
  icon        text,
  xp_reward   integer default 0,
  requirement text,
  type        text not null check (type in ('lessons','xp','streak','exercises','projects','course')),
  target      integer,
  course_id   text references public.courses(id)
);

-- ─── PROGRESS ──────────────────────────────────────────────────

create table public.lesson_progress (
  user_id             uuid not null references public.profiles(id) on delete cascade,
  lesson_id           text not null references public.lessons(id),
  course_id           text,
  module_id           text,
  completed           boolean not null default false,
  progress_percentage integer default 0,
  time_spent          integer default 0,
  completed_at        timestamptz,
  updated_at          timestamptz not null default now(),
  legacy_doc_id       text,
  -- preserva duração original em "MM:SS" quando veio como string (video-aulas)
  time_spent_legacy   text,
  primary key (user_id, lesson_id)
);

create table public.quiz_completions (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  module_id    text not null references public.modules(id),
  completed_at timestamptz,             -- NULL: origem não registra timestamp
  primary key (user_id, module_id)
);

create table public.course_completions (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  course_id    text not null references public.courses(id),
  completed_at timestamptz,             -- NULL: origem não registra timestamp
  primary key (user_id, course_id)
);

-- ─── GAMIFICATION ──────────────────────────────────────────────

create table public.user_achievements (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievements(id),
  earned_at      timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- NOVA — ledger para uso futuro; nasce vazia na migração (paridade).
create table public.xp_transactions (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  amount     integer not null,
  reason     text not null,
  ref_id     text,
  created_at timestamptz not null default now()
);

-- ─── EMAIL / NOTIFICAÇÕES ──────────────────────────────────────

create table public.email_events (
  id          uuid primary key default gen_random_uuid(),
  event       text not null check (event in ('opened','clicked','bounced','complained','unsubscribed')),
  email       text not null,
  message_id  text,
  subject     text,
  link        text,
  occurred_at timestamptz,
  received_at timestamptz not null default now()
);

create table public.announcements (
  id            text primary key,
  subject       text,
  total         integer default 0,
  sent          integer default 0,
  errors        integer default 0,
  error_details jsonb default '[]',
  mode          text,
  sent_at       timestamptz
);
