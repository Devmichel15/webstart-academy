-- -----------------------------------------------------------------------------
-- WebStart Academy - 019_public_profile.sql
-- Perfil público + heatmap de atividade + projetos públicos
-- Regras: idempotente, sem alterar dados existentes.
-- -----------------------------------------------------------------------------

-- 1) Índice para heatmap/queries por (user_id, completed_at)
create index if not exists idx_lesson_progress_user_completed_at
  on public.lesson_progress (user_id, completed_at)
  where completed and completed_at is not null;

-- 2) RPC: get_public_profile_by_username
create or replace function public.get_public_profile_by_username(p_username text)
returns table (
  name text,
  username text,
  photo_url text,
  bio text,
  github_url text,
  portfolio_url text,
  linkedin_url text,
  twitter_url text,
  instagram_url text,
  website_url text,
  xp integer,
  level integer,
  streak integer,
  created_at timestamptz,
  completed_lessons_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if p_username is null or btrim(p_username) = '' then
    return;
  end if;

  select p.id
    into v_profile_id
    from public.profiles p
   where lower(p.username) = lower(btrim(p_username))
     and coalesce(p.is_public, true) = true
   limit 1;

  if v_profile_id is null then
    return;
  end if;

  return query
  select
    p.name::text,
    p.username::text,
    p.photo_url::text,
    p.bio::text,
    p.github_url::text,
    p.portfolio_url::text,
    p.linkedin_url::text,
    p.twitter_url::text,
    p.instagram_url::text,
    p.website_url::text,
    p.xp::integer,
    p.level::integer,
    p.streak::integer,
    p.created_at,
    coalesce(count(lp.lesson_id), 0)::bigint as completed_lessons_count
  from public.profiles p
  left join public.lesson_progress lp
    on lp.user_id = p.id
   and lp.completed = true
   and lp.completed_at is not null
  where p.id = v_profile_id
    and coalesce(p.is_public, true) = true
  group by p.id, p.name, p.username, p.photo_url, p.bio, p.github_url, p.portfolio_url, p.linkedin_url, p.twitter_url, p.instagram_url, p.website_url, p.xp, p.level, p.streak, p.created_at;
end;
$$;

comment on function public.get_public_profile_by_username(text) is
  'Retorna apenas campos publicos do perfil por username. NUNCA devolve email, role, is_premium ou outros campos sensiveis.';

revoke all on function public.get_public_profile_by_username(text) from public;
grant execute on function public.get_public_profile_by_username(text) to anon, authenticated;

-- 3) RPC: get_profile_activity_heatmap
create or replace function public.get_profile_activity_heatmap(p_username text)
returns table (
  day date,
  count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if p_username is null or btrim(p_username) = '' then
    return;
  end if;

  select p.id
    into v_profile_id
    from public.profiles p
   where lower(p.username) = lower(btrim(p_username))
     and coalesce(p.is_public, true) = true
   limit 1;

  if v_profile_id is null then
    return;
  end if;

  return query
  select
    (lp.completed_at at time zone 'Africa/Luanda')::date as day,
    count(*)::int as count
  from public.lesson_progress lp
  where lp.user_id = v_profile_id
    and lp.completed = true
    and lp.completed_at is not null
    and lp.completed_at >= (now() - interval '365 days')
  group by 1
  order by 1;
end;
$$;

comment on function public.get_profile_activity_heatmap(text) is
  'Heatmap (ultimos 365 dias, TZ Africa/Luanda) das aulas concluidas para perfil publico. Apenas dados agregados, sem user_id.';

revoke all on function public.get_profile_activity_heatmap(text) from public;
grant execute on function public.get_profile_activity_heatmap(text) to anon, authenticated;

-- 4) RPC: get_public_projects_by_username
drop function if exists public.get_public_projects_by_username(text);

create or replace function public.get_public_projects_by_username(p_username text)
returns table (
  id uuid,
  title text,
  description text,
  tags text[],
  project_url text,
  github_url text,
  like_count integer,
  comment_count integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if p_username is null or btrim(p_username) = '' then
    return;
  end if;

  select p.id
    into v_profile_id
    from public.profiles p
   where lower(p.username) = lower(btrim(p_username))
     and coalesce(p.is_public, true) = true
   limit 1;

  if v_profile_id is null then
    return;
  end if;

  return query
  select
    cp.id,
    cp.title::text,
    cp.description::text,
    cp.tags,
    cp.project_url::text,
    cp.github_url::text,
    cp.like_count::integer,
    cp.comment_count::integer,
    cp.created_at
  from public.community_projects cp
  where cp.author_id = v_profile_id
  order by cp.created_at desc;
end;
$$;

comment on function public.get_public_projects_by_username(text) is
  'Projetos publicos de um utilizador (perfil publico). Whitelist explicita, sem dados sensiveis.';

revoke all on function public.get_public_projects_by_username(text) from public;
grant execute on function public.get_public_projects_by_username(text) to anon, authenticated;