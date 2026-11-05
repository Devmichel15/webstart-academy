-- ============================================================================
-- 025 — Incluir study_activity_enabled nas RPCs e whitelists
-- ============================================================================
-- Adiciona study_activity_enabled ao get_push_preferences e à whitelist
-- do upsert_push_preferences, mantendo compatibilidade com defaults.
-- ============================================================================

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

  return jsonb_build_object(
    'push_enabled',           coalesce(v_row.push_enabled, false),
    'learning_enabled',       coalesce(v_row.learning_enabled, true),
    'streak_enabled',         coalesce(v_row.streak_enabled, true),
    'community_enabled',      coalesce(v_row.community_enabled, true),
    'comments_enabled',       coalesce(v_row.comments_enabled, true),
    'reminders_enabled',      coalesce(v_row.reminders_enabled, false),
    'study_activity_enabled', coalesce(v_row.study_activity_enabled, true),
    'reminder_hour',          coalesce(v_row.reminder_hour, 19),
    'reminder_days',          coalesce(v_row.reminder_days, '{1,2,3,4,5}'::smallint[]),
    'last_test_sent_at',      v_row.last_test_sent_at
  );
end;
$$;

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

  -- Whitelist estrita
  if exists (
    select 1
      from jsonb_object_keys(p_patch) as key
     where key not in (
       'push_enabled', 'learning_enabled', 'streak_enabled',
       'community_enabled', 'comments_enabled', 'reminders_enabled',
       'study_activity_enabled',
       'reminder_hour', 'reminder_days'
     )
  ) then
    raise exception 'Campo não editável pelo utilizador.'
      using errcode = '42501';
  end if;

  -- Garantir linha
  insert into public.push_preferences (user_id)
  values (v_profile)
  on conflict (user_id) do nothing;

  foreach v_key in array array[
    'push_enabled', 'learning_enabled', 'streak_enabled',
    'community_enabled', 'comments_enabled', 'reminders_enabled',
    'study_activity_enabled'
  ] loop
    continue when not (p_patch ? v_key);

    if jsonb_typeof(p_patch -> v_key) <> 'boolean' then
      raise exception 'Valor inválido para %.', v_key
        using errcode = '22023';
    end if;

    v_set := v_set || case when v_set <> '' then ', ' else '' end || format('%I = %L::boolean', v_key, p_patch ->> v_key);
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

    v_set := v_set || case when v_set <> '' then ', ' else '' end || format('reminder_hour = %s', (p_patch ->> 'reminder_hour')::int);
  end if;

  if v_set <> '' then
    execute 'update public.push_preferences set ' || v_set || ' where user_id = $1'
      using v_profile;
  end if;

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
