# Schema PostgreSQL FINAL — WebStart Academy

> Status: **FINALIZADO** após auditoria + backup validado + aprovação do dono (ajustes do
> `backup-report.md` §9 incorporados). Fontes: `firebase-audit.md`, `backup-report.md`.
> IDs dos usuários são **determinísticos** (uuidv5 do `legacy_firebase_uid`) para permitir
> re-execuções idempotentes e, depois, criação de `auth.users` com o mesmo id.

---

## 1. Domínios

```text
IDENTITY       profiles, email_preferences, learning_profiles, firebase_id_mapping
LEARNING       courses, modules, lessons, achievements   (seed a partir de src/data/**)
PROGRESS       lesson_progress, quiz_completions, course_completions
GAMIFICATION   user_achievements, xp_transactions (nova/vazia)
EMAIL          email_events, announcements
AUTH           auth.users — criado em fase posterior com o MESMO uuid de profiles.id
```

## 2. Estratégia de IDs (decisões finais)

| Decisão | Justificativa |
|---|---|
| `profiles.id` = uuidv5(namespace fixo, legacy_firebase_uid) | Determinístico → transform/import idempotentes; permitirá `admin.createUser({ id })` preservando o mesmo uuid na fase de identidade |
| **Sem FK** para `auth.users` na migration inicial | Permite importar dados ANTES da migração de auth (fase A). FK será adicionada numa migration posterior (`010_identity_link`) quando os auth.users existirem |
| PKs textuais idênticas aos ids atuais no conteúdo | UPSERT direto, zero remapeamento |
| `lesson_progress.legacy_doc_id` coluna normal | Preserva `{uid}_{lessonId}` original p/ auditoria |
| Órfãos auth-sem-doc | Regra aprovada: seriam criados com `is_public=false`. Backup mostrou 0 órfãos; regra fica implementada no transform por segurança |
| Default `is_public=true` na coluna | Paridade com o comportamento atual do app para NOVOS cadastros |

## 3. Migrations versionadas

```text
supabase/migrations/
├── 001_initial_schema.sql        tabelas + constraints
├── 002_indexes.sql               índices
├── 003_rls.sql                   RLS + policies + realtime
└── 004_views_compatibility.sql   views de arrays p/ o adapter
```

Aplicação: via SQL Editor do dashboard ou `supabase db push` (requer credenciais de
administração — nunca anon key).

## 4. DDL final (resumo das decisões relevantes)

### profiles (ajustes pós-backup destacados)

```sql
create table public.profiles (
  id                      uuid primary key default gen_random_uuid(),
  -- legacy_firebase_uid é gerado pelo transform como uuidv5(ns, uid):
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
  is_public               boolean not null default true,
  first_steps_done        boolean not null default false,
  created_at              timestamptz not null default now(),
  last_login              timestamptz,
  welcome_email_sent      boolean not null default false,
  welcome_email_sent_at   timestamptz,
  last_reactivation_email timestamptz,
  certificates            jsonb not null default '[]',   -- ★ novo (backup §4)
  is_premium              boolean not null default false,-- ★ novo
  purchased_courses       jsonb not null default '[]'    -- ★ novo
);
```

Backfill `first_steps_done`: 27 docs sem o campo recebem a regra de atividade aprovada
(`xp>0 || completedLessons>0 || completedCourses>0`) durante o transform.

### announcements (★ tabela nova)

Log de campanhas descoberto no backup (1 doc). Sem PII além de contagens.

```sql
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
```

### Demais estruturas

Idênticas à proposta revisada, com colunas `extra jsonb` em `courses/modules/lessons`
para preservar payloads do app (level/xp/completion, quiz/lab/miniProject,
youtubeUrl/embedUrl/duration, flag `legacy` das 18 aulas removidas do catálogo que
mantêm progresso real — zero-perda), `email_preferences`, `learning_profiles` (jsonb),
`lesson_progress` (PK composta + `legacy_doc_id`), `quiz_completions`/
`course_completions` (`completed_at` NULL quando origem não tem timestamp),
`user_achievements`, `xp_transactions` (vazia), `email_events` (vazia),
`announcements` e `firebase_id_mapping`.

Views de compatibilidade expõem os arrays (`completedLessons/Courses/Quizzes[]`) que o
adapter do frontend consome, com `security_invoker=true`.

## 5. Conteúdo educacional (R3 confirmado)

Firestore não possui courses/modules/lessons/achievements. As tabelas serão povoadas por
**seed derivado de `src/data/**`** (trilhas, módulos, todas as aulas incluindo video-aulas,
conquistas) num script próprio da fase de import — garantindo que os FKs de progresso
(`fundamentos-web`, `html-exercises`, etc.) existam antes do import de progresso.

## 6. Volumes reais medidos (backup)

users 81 · lesson_progress 354 · user_achievements 188 · announcements 1 ·
course_completions esperado ≈ pares de completedCourses (12 usuários) ·
quiz_completions 0 · email_preferences 81 (linha por perfil) · learning_profiles 0.
