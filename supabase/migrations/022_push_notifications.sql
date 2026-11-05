-- ============================================================================
-- 022 — Notificações Web Push
-- ============================================================================
-- WebStart Academy — 022_push_notifications.sql
-- Duas tabelas com responsabilidades diferentes:
--   1) public.push_subscriptions — uma linha por DISPOSITIVO (endpoint do
--      push service + chaves p256dh/auth). Segredos: nunca voltam ao cliente.
--   2) public.push_preferences — uma linha por CONTA (o que o utilizador
--      quer receber). Preferências são da conta, subscrições são do device.
--
-- Regras de segurança implementadas aqui:
--   - O cliente NUNCA lê nem escreve push_subscriptions directamente: a tabela
--     fica sem policies para `authenticated`/`anon` e sem privilégios para
--     esses roles. Só a Edge Function (service_role) escreve, depois de
--     validar o JWT do utilizador.
--   - O cliente só vê metadados dos seus dispositivos, através da RPC
--     list_push_devices(), que devolve um conjunto fixo de colunas.
--   - As preferências são lidas/escritas por RPCs que o Postgres valida
--     (whitelist de campos), como update_own_profile() em 018.
--   - O RLS usa public.user_is_profile_owner(), que reconhece perfis
--     migrados (profiles.id != auth.uid()), como o resto da app.
--
-- O que esta migration NÃO faz (fica para a Etapa 3):
--   - Agendar lembretes (streak, aprendizagem). As colunas reminder_hour e
--     reminder_days já existem para que a Etapa 3 não precise de outra
--     migração de schema.
--   - Enviar notificações a outros utilizadores. Não existe qualquer caminho
--     de broadcast aqui.
-- ============================================================================

-- ─── 1) TABELA DE SUBSCRIÇÕES (por dispositivo) ─────────────────────────────

create table if not exists public.push_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  endpoint        text not null,
  p256dh          text not null,
  auth            text not null,
  platform        text not null default 'unknown',
  user_agent      text,
  failure_count   integer not null default 0,
  last_error      text,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- O endpoint identifica univocamente a subscrição. Se outro utilizador
  -- subscrever o mesmo endpoint (device partilhado / conta trocada), a
  -- subscrição é reatribuída em vez de duplicada.
  constraint push_subscriptions_endpoint_key unique (endpoint),
  constraint push_subscriptions_platform_check
    check (platform in ('android', 'ios', 'desktop', 'unknown')),
  constraint push_subscriptions_endpoint_len check (char_length(endpoint) <= 2048),
  constraint push_subscriptions_failure_count_check check (failure_count >= 0)
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

comment on table public.push_subscriptions is
  'Subscrições Web Push por dispositivo. endpoint/p256dh/auth são segredos: '
  'só a Edge Function (service_role) tem acesso a esta tabela.';

-- ─── 2) TABELA DE PREFERÊNCIAS (por conta) ──────────────────────────────────

create table if not exists public.push_preferences (
  user_id           uuid primary key references public.profiles(id) on delete cascade,
  -- Master switch: o utilizador aceitou receber notificações push.
  push_enabled      boolean not null default false,
  -- Categorias (a entrega vem na Etapa 3; já são graváveis e consultáveis).
  learning_enabled  boolean not null default true,
  streak_enabled    boolean not null default true,
  community_enabled boolean not null default true,
  comments_enabled  boolean not null default true,
  reminders_enabled boolean not null default false,
  reminder_hour     integer not null default 19,
  reminder_days     smallint[] not null default '{1,2,3,4,5}'::smallint[],
  -- Rate limit do "enviar notificação de teste" (servidor, não cliente).
  last_test_sent_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint push_preferences_reminder_hour_check check (reminder_hour between 0 and 23),
  constraint push_preferences_reminder_days_check
    check (reminder_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[])
);

comment on table public.push_preferences is
  'Preferências de notificações por conta. push_enabled é o consentimento '
  'global; as restantes colunas são as categorias.';

-- ─── 3) TRIGGER updated_at ──────────────────────────────────────────────────

create or replace function public.set_push_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_push_subscriptions_updated on public.push_subscriptions;
create trigger trg_push_subscriptions_updated
  before update on public.push_subscriptions
  for each row execute function public.set_push_updated_at();

drop trigger if exists trg_push_preferences_updated on public.push_preferences;
create trigger trg_push_preferences_updated
  before update on public.push_preferences
  for each row execute function public.set_push_updated_at();

-- ─── 4) RLS ─────────────────────────────────────────────────────────────────
-- push_preferences: o dono lê e escreve a sua própria linha.
-- push_subscriptions: sem policies — nenhum papel de cliente acede. A RPC
-- list_push_devices() é SECURITY DEFINER e devolve só metadados.

alter table public.push_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "push_prefs_own" on public.push_preferences;
create policy "push_prefs_own"
  on public.push_preferences for all to authenticated
  using (public.user_is_profile_owner(user_id))
  with check (public.user_is_profile_owner(user_id));

-- Guardas explícitas: mesmo que alguém crie uma policy por engano, os
-- papéis de cliente não têm privilégios sobre a tabela de subscrições.
revoke all on public.push_subscriptions from anon, authenticated;
grant all on public.push_subscriptions to service_role;
grant select, insert, update on public.push_preferences to authenticated;
grant all on public.push_preferences to service_role;

-- ─── 5) RPC: preferências ──────────────────────────────────────────────────

create or replace function public.get_push_preferences()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_profile uuid := public.current_auth_profile_id();
  v_row     public.push_preferences%rowtype;
begin
  if v_profile is null then
    raise exception 'Sessão inválida.'
      using errcode = '42501';
  end if;

  select * into v_row
    from public.push_preferences p
   where p.user_id = v_profile;

  -- Sem linha ainda? Devolve os defaults (a linha é criada no primeiro save).
  return jsonb_build_object(
    'push_enabled',      coalesce(v_row.push_enabled, false),
    'learning_enabled',  coalesce(v_row.learning_enabled, true),
    'streak_enabled',    coalesce(v_row.streak_enabled, true),
    'community_enabled', coalesce(v_row.community_enabled, true),
    'comments_enabled',  coalesce(v_row.comments_enabled, true),
    'reminders_enabled', coalesce(v_row.reminders_enabled, false),
    'reminder_hour',     coalesce(v_row.reminder_hour, 19),
    'reminder_days',     coalesce(v_row.reminder_days, '{1,2,3,4,5}'::smallint[]),
    'last_test_sent_at', v_row.last_test_sent_at
  );
end;
$$;

comment on function public.get_push_preferences() is
  'Preferências de notificações do utilizador autenticado, com defaults se '
  'ainda não tiver guardado nada.';

create or replace function public.upsert_push_preferences(p_patch jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_profile uuid := public.current_auth_profile_id();
  v_set     text := '';
  v_days    smallint[] := '{}'::smallint[];
  v_key     text;
begin
  if v_profile is null then
    raise exception 'Sessão inválida.'
      using errcode = '42501';
  end if;

  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'Dados inválidos.'
      using errcode = '22023';
  end if;

  -- Whitelist estrita (mesmo espírito de 018): chave desconhecida = erro.
  if exists (
    select 1
      from jsonb_object_keys(p_patch) as key
     where key not in (
       'push_enabled', 'learning_enabled', 'streak_enabled',
       'community_enabled', 'comments_enabled', 'reminders_enabled',
       'reminder_hour', 'reminder_days'
     )
  ) then
    raise exception 'Campo não editável pelo utilizador.'
      using errcode = '42501';
  end if;

  -- A linha tem de existir antes do UPDATE (upsert real).
  insert into public.push_preferences (user_id)
  values (v_profile)
  on conflict (user_id) do nothing;

  foreach v_key in array array[
    'push_enabled', 'learning_enabled', 'streak_enabled',
    'community_enabled', 'comments_enabled', 'reminders_enabled'
  ] loop
    continue when not (p_patch ? v_key);

    if jsonb_typeof(p_patch -> v_key) <> 'boolean' then
      raise exception 'Valor inválido para %.', v_key
        using errcode = '22023';
    end if;

    v_set := v_set || format('%I = %L::boolean', v_key, p_patch ->> v_key);
  end loop;

  if p_patch ? 'reminder_hour' then
    if jsonb_typeof(p_patch -> 'reminder_hour') <> 'number' then
      raise exception 'Valor inválido para a hora do lembrete.'
        using errcode = '22023';
    end if;

    if (p_patch ->> 'reminder_hour')::int not between 0 and 23 then
      raise exception 'A hora do lembrete tem de estar entre 0 e 23.'
        using errcode = '22023';
    end if;

    v_set := v_set || format('reminder_hour = %s', (p_patch ->> 'reminder_hour')::int);
  end if;

  if v_set <> '' then
    execute 'update public.push_preferences set ' || v_set || ' where user_id = $1'
      using v_profile;
  end if;

  -- reminder_days é um array: não pode ir pelo SQL dinâmico (um array jsonb
  -- não é um literal de array do Postgres), por isso é validado e gravado
  -- à parte.
  if p_patch ? 'reminder_days' then
    if jsonb_typeof(p_patch -> 'reminder_days') <> 'array' then
      raise exception 'Valor inválido para os dias do lembrete.'
        using errcode = '22023';
    end if;

    if exists (
      select 1
        from jsonb_array_elements_text(p_patch -> 'reminder_days') as t(value)
       where t.value !~ '^[0-9]{1,2}$'
    ) then
      raise exception 'Valor inválido para os dias do lembrete.'
        using errcode = '22023';
    end if;

    v_days := array(
      select jsonb_array_elements_text(p_patch -> 'reminder_days')::smallint
    );

    if exists (
      select 1 from unnest(v_days) as d(day) where d.day < 0 or d.day > 6
    ) then
      raise exception 'Os dias do lembrete têm de estar entre 0 e 6.'
        using errcode = '22023';
    end if;

    update public.push_preferences
       set reminder_days = v_days
     where user_id = v_profile;
  end if;

  return public.get_push_preferences();
end;
$$;

comment on function public.upsert_push_preferences(jsonb) is
  'Guarda as preferências de notificações do próprio utilizador. Aceita só '
  'as chaves de categoria, o master switch e as preferências de lembrete.';

revoke all on function public.get_push_preferences() from public, anon;
grant execute on function public.get_push_preferences() to authenticated;
revoke all on function public.upsert_push_preferences(jsonb) from public, anon;
grant execute on function public.upsert_push_preferences(jsonb) to authenticated;

-- ─── 6) RPC: dispositivos do utilizador (só metadados) ──────────────────────

create or replace function public.list_push_devices()
returns table (
  id              uuid,
  platform        text,
  user_agent      text,
  created_at      timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_count   integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile uuid := public.current_auth_profile_id();
begin
  if v_profile is null then
    raise exception 'Sessão inválida.'
      using errcode = '42501';
  end if;

  -- Colunas fixas: endpoint, p256dh e auth nunca saem daqui.
  return query
    select s.id,
           s.platform,
           s.user_agent,
           s.created_at,
           s.last_success_at,
           s.last_failure_at,
           s.failure_count
      from public.push_subscriptions s
     where s.user_id = v_profile
     order by s.created_at desc;
end;
$$;

comment on function public.list_push_devices() is
  'Dispositivos com subscrição push do utilizador autenticado. Devolve só '
  'metadados — nunca o endpoint nem as chaves.';

revoke all on function public.list_push_devices() from public, anon;
grant execute on function public.list_push_devices() to authenticated;
