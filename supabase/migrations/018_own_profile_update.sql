-- ============================================================================
-- 018 — Editing the own profile happens on the server
-- ============================================================================
-- Until now `userService.updateOwnProfile()` validated the form on the client:
-- whitelist of fields, name rules, URL validation. All of it JavaScript, all of
-- it in the user's browser. Someone with a console open bypasses it with one
-- line:
--
--     supabase.from('profiles').update({ role: 'admin', is_premium: true })
--
-- RLS stops the row from being someone else's. It says nothing about the
-- columns: `role`, `is_premium` and `purchased_courses` were all writable by
-- the account itself.
--
-- This migration moves the rules to Postgres:
--
--   1. `update_own_profile(jsonb)` — the profile form's only path. Validates in
--      SQL with the SAME rules as `src/utils/profileValidation.js` (the parity
--      is enforced by `src/test/profileValidation.test.js`, which reads this
--      file). Rejects unknown keys instead of ignoring them: a form sending
--      `role` is a bug or an attack, and both deserve an error.
--   2. `guard_privileged_profile_columns()` — BEFORE UPDATE trigger. If
--      `role`, `is_premium` or `purchased_courses` changed and the caller is a
--      logged-in non-admin, the write is aborted. This is the backstop for the
--      paths that do NOT go through the RPC.
--
-- What this does NOT solve (separate debt, by decision):
--   - The progress model (xp, level, streak, last_study_date) is still written
--     by the client. Fixing it means moving all of that to RPCs — a different
--     task.
--   - `createUserProfile()` still decides `role` from the session email on
--     INSERT. This trigger only guards UPDATE.
--   - The minimum of 8 characters in the password is still client-side; the
--     server's minimum is whatever the Supabase project is configured with.
--
-- SECURITY INVOKER on the RPC on purpose: it goes through the same RLS as
-- every other write, it does not widen anyone's permissions.
-- ============================================================================

-- ─── 1. RPC de edição do próprio perfil ────────────────────────────────────

create or replace function public.update_own_profile(p_patch jsonb)
returns setof public.profiles
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_row_id  uuid;
  v_name    text;
  v_bio     text;
  v_url     text;
  v_key     text;
  v_set     text := '';
begin
  if v_uid is null then
    raise exception 'Sessão inválida.'
      using errcode = '42501';
  end if;

  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'Dados inválidos.'
      using errcode = '22023';
  end if;

  -- Whitelist estrita. Chave desconhecida = erro, não silêncio: assim um
  -- formulário a mandar `role` não passa em silêncio nem depende de o cliente
  -- se lembrar de filtrar.
  if exists (
    select 1
    from jsonb_object_keys(p_patch) as key
    where key not in (
      'name', 'bio', 'is_public',
      'github_url', 'portfolio_url', 'linkedin_url',
      'twitter_url', 'instagram_url', 'website_url'
    )
  ) then
    raise exception 'Campo não editável pelo utilizador.'
      using errcode = '42501';
  end if;

  -- Perfis migrados do Firebase têm `id` ≠ `auth.uid()`; o RLS (015) já
  -- aceita as duas formas e aqui tem de ser igual.
  select p.id into v_row_id
  from public.profiles p
  where p.id = v_uid or p.auth_user_id = v_uid
  order by (p.id = v_uid) desc
  limit 1;

  if v_row_id is null then
    raise exception 'Perfil do utilizador não encontrado.'
      using errcode = 'P0002';
  end if;

  -- `name`: mesmas regras de src/utils/profileValidation.js.
  if p_patch ? 'name' then
    v_name := btrim(coalesce(p_patch ->> 'name', ''));

    if char_length(v_name) < 2 or char_length(v_name) > 60 then
      raise exception 'O nome tem de ter entre 2 e 60 caracteres.'
        using errcode = '22023';
    end if;

    if public.is_incomplete_profile_name(v_name) then
      raise exception 'Escolhe um nome próprio para apareceres na classificação.'
        using errcode = '22023';
    end if;

    v_set := v_set || format('name = %L', v_name);
  end if;

  -- `bio`: 500 caracteres, vazio = NULL (limpar o campo é legítimo).
  if p_patch ? 'bio' then
    v_bio := nullif(btrim(coalesce(p_patch ->> 'bio', '')), '');

    if v_bio is not null and char_length(v_bio) > 500 then
      raise exception 'A bio não pode ter mais de 500 caracteres.'
        using errcode = '22023';
    end if;

    v_set := v_set || format('bio = %L', v_bio);
  end if;

  if p_patch ? 'is_public' then
    if jsonb_typeof(p_patch -> 'is_public') <> 'boolean' then
      raise exception 'Valor inválido para a visibilidade do perfil.'
        using errcode = '22023';
    end if;

    v_set := v_set || format('is_public = %L::boolean', p_patch ->> 'is_public');
  end if;

  -- URLs: http(s) obrigatório, 300 caracteres no máximo, vazio = NULL.
  foreach v_key in array array[
    'github_url', 'portfolio_url', 'linkedin_url',
    'twitter_url', 'instagram_url', 'website_url'
  ] loop
    continue when not (p_patch ? v_key);

    v_url := nullif(btrim(coalesce(p_patch ->> v_key, '')), '');

    if v_url is not null then
      if char_length(v_url) > 300 then
        raise exception 'URL demasiado longa.'
          using errcode = '22023';
      end if;

      if v_url !~* '^https?://[^[:space:]]+$' then
        raise exception 'URL inválida. Exemplo: https://github.com/utilizador'
          using errcode = '22023';
      end if;
    end if;

    -- %L com o nome da coluna vindo da lista acima (nunca do payload).
    v_set := v_set || format('%I = %L', v_key, v_url);
  end loop;

  if v_set = '' then
    return query select * from public.profiles where id = v_row_id;
    return;
  end if;

  return query
  execute 'update public.profiles set ' || v_set || ' where id = $1 returning *'
    using v_row_id;
end;
$$;

comment on function public.update_own_profile(jsonb) is
  'Actualiza o perfil do próprio utilizador com validação no servidor. '
  'Aceita apenas name, bio, is_public e as seis URLs.';

revoke all on function public.update_own_profile(jsonb) from public, anon;
grant execute on function public.update_own_profile(jsonb) to authenticated;


-- ─── 2. Colunas privilegiadas fora do alcance do próprio utilizador ────────
-- Red de segurança para o que NÃO passa pela RPC: `role`, `is_premium` e
-- `purchased_courses` só mudam por ordem de um admin ou do servidor.
--
-- SECURITY DEFINER para poder chamar `public.is_admin()` (cuja execução está
-- revogada ao role `authenticated`) sem precisar de GRANTs novos. Não contorna
-- o RLS do UPDATE — isso pertence à função que chamou o trigger.

create or replace function public.guard_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role)
    or (new.is_premium is distinct from old.is_premium)
    or (new.purchased_courses is distinct from old.purchased_courses) then

    -- auth.uid() IS NULL = migração, seed, SQL editor ou service_role.
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Alteração de campos privilegiados apenas pelo servidor.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;

create trigger profiles_guard_privileged_columns
before update on public.profiles
for each row
execute function public.guard_privileged_profile_columns();

revoke all on function public.guard_privileged_profile_columns() from public, anon;
grant execute on function public.guard_privileged_profile_columns() to authenticated;