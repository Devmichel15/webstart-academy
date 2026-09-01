-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 008_profile_networking.sql
-- Adiciona campos de networking e bio ao perfil.
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists github_url    text,
  add column if not exists portfolio_url text,
  add column if not exists linkedin_url  text,
  add column if not exists twitter_url   text,
  add column if not exists instagram_url text,
  add column if not exists website_url   text,
  add column if not exists bio           text,
  add column if not exists updated_at    timestamptz not null default now();
