-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 017_profile_name_and_ranking.sql
--
-- Bug: o top 10 semanal mostrava vários "Aluno WebStart".
--
-- Duas causas, as duas treated aqui:
--   1. `profiles.name` tinha `not null default 'Aluno WebStart'` — quem não
--      tinha nome próprio ficava preso no default para sempre;
--   2. `get_weekly_ranking` devolvia `p.name` cru, sem qualquer tratamento.
--
-- Decisões (combinadas):
--   - quem tem cadastro incompleto CONTINUA A CONTAR e a ocupar lugar, mas
--     aparece como "Aluno anónimo" e sem perfil público. Excluí-los punia
--     um aluno por causa de um bug de cadastro e mudava a ordenação;
--   - `name` passa a NULLABLE e sem default. NÃO normalizamos as linhas
--     existentes: passam a render como "Aluno anónimo" e corrigem-se sozinhas
--     quando cada utilizador guardar o nome.
--
-- ORDEM DE APLICAÇÃO: aplicar ANTES de o front passar a gravar `name = null`
-- (services/userService.js → resolveDisplayName). Reverter a ordem dá
-- "null value in column name" no registo de utilizadores sem nome.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1) Regra única de "cadastro incompleto" ────────────────────
-- Espelho de `isIncompleteProfileName()` em src/utils/profileValidation.js.
-- Os literais DEFAULT_PROFILE_NAME / ANONYMOUS_DISPLAY_NAME são comparados
-- com o JS por src/test/profileValidation.test.js.

create or replace function public.is_incomplete_profile_name(p_name text)
returns boolean
language sql
immutable
set search_path = public
as $$
  -- `regexp_replace` colapsa espaços internos para bater certo com o
  -- `normalizeName()` do JS: "  aluno   webstart  " é o default, não um nome.
  select p_name is null
      or regexp_replace(btrim(p_name), '\s+', ' ', 'g') = ''
      or lower(regexp_replace(btrim(p_name), '\s+', ' ', 'g'))
           = lower('Aluno WebStart');
$$;

comment on function public.is_incomplete_profile_name(text) is
  'Cadastro incompleto: name null, vazio/só espaços, ou igual ao default histórico.';

-- ─── 2) Top 10 semanal: anonimiza quem não escolheu nome ────────
-- `name` passa a ser o NOME A MOSTRAR (já anonimizado). Acrescenta-se
-- `has_public_profile` para o front saber se pode ligar ao perfil.
--
-- O `row_number()`, o ORDER BY, o filtro de visibilidade e o limite ficam
-- intactos: a ordenação não muda e a função continua a devolver as 10
-- primeiras + o utilizador atual quando ele estiver fora do top 10.

drop function if exists public.get_weekly_ranking(integer);

create function public.get_weekly_ranking(p_limit integer default 10)
returns table (
  rank bigint,
  name text,
  lessons_completed bigint,
  streak integer,
  points bigint,
  is_current_user boolean,
  has_public_profile boolean
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
      p.is_public,
      not public.is_incomplete_profile_name(p.name) as has_name,
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
    group by p.id, p.name, p.streak, p.created_at, p.is_public
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
      case
        when not has_name then 'Aluno anónimo'
        else name
      end as name,
      lessons_completed,
      streak,
      (lessons_completed * 10 + streak * 2)::bigint as points,
      is_current_user,
      (has_name and is_public) as has_public_profile
    from scores
  )
  select ranked.rank, ranked.name, ranked.lessons_completed, ranked.streak,
         ranked.points, ranked.is_current_user, ranked.has_public_profile
  from ranked
  where ranked.rank <= greatest(1, least(coalesce(p_limit, 10), 100))
     or ranked.is_current_user;
$$;

revoke all on function public.get_weekly_ranking(integer) from public, anon;
grant execute on function public.get_weekly_ranking(integer) to authenticated;

-- ─── 3) Schema: novos perfis nascem sem default ──────────────────
-- `name` deixa de ser NOT NULL e deixa de ter default. O registo passa a
-- gravar NULL quando não há nome nenhum (ver resolveDisplayName), e é o
-- modal lateral / página de perfil que o pede.

alter table public.profiles alter column name drop default;
alter table public.profiles alter column name drop not null;
