-- ============================================================================
-- 027 — Quem tem a app instalada (PWA)
-- ============================================================================
-- A instalação é um facto do DISPOSITIVO, mas o painel admin precisa de a
-- atribuir a uma CONTA. O browser só nos dá dois sinais fiáveis:
--
--   1. a app está a correr em `display-mode: standalone` (ou `minimal-ui` /
--      `fullscreen`) — ou seja, foi aberta a partir do ícone instalado;
--   2. o evento `appinstalled` dispara no momento em que a instalação termina.
--
-- Em ambos os casos o cliente chama `mark_app_installed()` enquanto tem sessão.
-- Isto não apanha quem instala com a conta terminada e nunca mais abre a app
-- instalada; é uma limitação do browser, não da tabela.
--
-- As colunas são de leitura livre para o dono/admin (RLS de `profiles`), mas a
-- escrita passa pela RPC abaixo: o cliente não tem de saber resolver
-- `id` vs `auth_user_id` (perfis migrados, migration 015).
-- ============================================================================

alter table public.profiles
  add column if not exists app_installed boolean not null default false,
  add column if not exists app_installed_at timestamptz,
  add column if not exists app_installed_platform text;

-- Índice parcial: o painel só pergunta pelos instalados, e são poucos no
-- início. Evita indexar a maioria (false) sem necessidade.
create index if not exists idx_profiles_app_installed
  on public.profiles (app_installed)
  where app_installed = true;

-- Idempotente: mantém o primeiro instante de instalação e a primeira
-- plataforma conhecida. Chamar em cada arranque da app instalada é seguro.
create or replace function public.mark_app_installed(p_platform text default null)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_platform text := nullif(btrim(coalesce(p_platform, '')), '');
begin
  if v_uid is null then
    raise exception 'Sessão inválida.'
      using errcode = '42501';
  end if;

  update public.profiles
     set app_installed = true,
         app_installed_at = coalesce(app_installed_at, now()),
         app_installed_platform = coalesce(app_installed_platform, v_platform)
   where id = v_uid or auth_user_id = v_uid;
end;
$$;

comment on function public.mark_app_installed(text) is
  'Marca a conta do utilizador autenticado como tendo a app instalada. '
  'Idempotente; preserva a data e plataforma da primeira instalação.';

revoke all on function public.mark_app_installed(text) from public, anon;
grant execute on function public.mark_app_installed(text) to authenticated;
