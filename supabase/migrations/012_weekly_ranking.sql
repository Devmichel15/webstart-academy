-- Weekly ranking with a privacy-safe RPC surface.

create or replace function public.get_weekly_ranking(p_limit integer default 10)
returns table (
  rank bigint,
  name text,
  lessons_completed bigint,
  streak integer,
  points bigint,
  is_current_user boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with current_profile as (
    select coalesce(
      (select p.id from public.profiles p where p.auth_user_id = auth.uid() limit 1),
      auth.uid()
    ) as id
  ),
  scores as (
    select
      p.id,
      p.name,
      coalesce(count(distinct lp.lesson_id) filter (
        where lp.completed and lp.completed_at >= date_trunc('week', now())
      ), 0)::bigint as lessons_completed,
      coalesce(p.streak, 0)::integer as streak,
      max(lp.completed_at) filter (
        where lp.completed and lp.completed_at >= date_trunc('week', now())
      ) as latest_completion_at,
      min(lp.completed_at) filter (
        where lp.completed and lp.completed_at >= date_trunc('week', now())
      ) as first_completion_at,
      p.created_at,
      (p.id = (select id from current_profile)) as is_current_user
    from public.profiles p
    left join public.lesson_progress lp on lp.user_id = p.id
    where p.is_public or p.id = (select id from current_profile)
    group by p.id, p.name, p.streak, p.created_at
  ),
  ranked as (
    select
      row_number() over (
        order by
          (lessons_completed * 10 + streak * 2) desc,
          streak desc,
          first_completion_at asc nulls last,
          created_at asc
      ) as rank,
      name,
      lessons_completed,
      streak,
      (lessons_completed * 10 + streak * 2)::bigint as points,
      is_current_user
    from scores
  )
  select ranked.rank, ranked.name, ranked.lessons_completed, ranked.streak,
         ranked.points, ranked.is_current_user
  from ranked
  where ranked.rank <= greatest(1, least(coalesce(p_limit, 10), 100))
     or ranked.is_current_user;
$$;

revoke all on function public.get_weekly_ranking(integer) from public, anon;
grant execute on function public.get_weekly_ranking(integer) to authenticated;