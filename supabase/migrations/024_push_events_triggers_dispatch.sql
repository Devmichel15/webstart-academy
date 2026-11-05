-- ============================================================================
-- 024 — Push events outbox + triggers + dispatch (action-driven)
-- ============================================================================
-- WebStart Academy — 024_push_events_triggers_dispatch.sql
--
-- Notificações disparadas por ações:
--   1) Novo post/projeto em community_projects (INSERT)
--   2) Aluno conclui uma aula: lesson_progress passa de completed_at null
--      para preenchido (apenas primeira conclusão)
--
-- Usa apenas Supabase (Postgres + Edge Functions + pg_net). Sem backend
-- externo. O segredo partilhado para chamar push-dispatch deve ficar no
-- Vault (nunca no repo).
-- ============================================================================

-- ─── 1) Categoria de atividade de estudo nas preferências ────────────────────
alter table public.push_preferences
  add column if not exists study_activity_enabled boolean not null default true;

-- Garantir que preferências existentes ficam com default true
update public.push_preferences
   set study_activity_enabled = true
 where study_activity_enabled is null;

-- ─── 2) Throttle por destinatário e categoria ──────────────────────────────
create table if not exists public.push_throttle (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  category   text not null,
  last_sent_at timestamptz not null default now(),
  primary key (user_id, category),
  constraint push_throttle_category_check
    check (category in ('learning','streak','community','comments','reminders','study_activity'))
);

alter table public.push_throttle enable row level security;
revoke all on public.push_throttle from anon, authenticated;
grant all on public.push_throttle to service_role;

-- ─── 3) Outbox de eventos push ─────────────────────────────────────────────
create table if not exists public.push_events (
  id                uuid primary key default gen_random_uuid(),
  type              text not null,
  actor_profile_id  uuid,
  entity_id         text,
  payload           jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  processed_at      timestamptz,
  constraint push_events_type_check
    check (type in ('new_post','lesson_completed'))
);

create index if not exists push_events_unprocessed_idx
  on public.push_events (created_at)
 where processed_at is null;

alter table public.push_events enable row level security;
revoke all on public.push_events from anon, authenticated;
grant all on public.push_events to service_role;

-- ─── 4) Função para disparar push-dispatch via pg_net ──────────────────────
create or replace function public.dispatch_push_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
  v_req_id bigint;
begin
  -- URL da Edge Function (pode ser ajustado por configuração)
  v_url := coalesce(
    current_setting('app.settings.supabase_functions_url', true),
    'https://<project-ref>.supabase.co/functions/v1/push-dispatch'
  );
  
  -- Secret partilhado guardado no Vault (nunca no repo)
  begin
    select decrypted_secret into v_secret
      from vault.decrypted_secrets
     where name = 'push_dispatch_secret'
     limit 1;
  exception
    when others then
      v_secret := null;
  end;
  
  if v_secret is null then
    return;
  end if;
  
  -- Chamar Edge Function via pg_net
  begin
    select net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-dispatch-secret', v_secret
      ),
      body := jsonb_build_object('event_id', p_event_id)
    ) into v_req_id;
  exception
    when others then
      -- Nunca falhar a ação original
      return;
  end;
end;
$$;

revoke all on function public.dispatch_push_event(uuid) from public, anon, authenticated;
grant execute on function public.dispatch_push_event(uuid) to service_role;

-- ─── 5) Trigger em community_projects (novo post/projeto) ─────────────────
create or replace function public.trg_push_new_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  -- Criar evento na outbox
  begin
    insert into public.push_events (type, actor_profile_id, entity_id, payload)
    values (
      'new_post',
      new.user_id,
      new.id::text,
      jsonb_build_object('title', new.title)
    )
    returning id into v_event_id;
    
    -- Disparar dispatch (nunca falhar a ação original)
    perform public.dispatch_push_event(v_event_id);
  exception
    when others then
      -- Capturar qualquer exceção - não falhar INSERT
      return new;
  end;
  
  return new;
end;
$$;

drop trigger if exists trg_push_new_post on public.community_projects;
create trigger trg_push_new_post
  after insert on public.community_projects
  for each row execute function public.trg_push_new_post();

-- ─── 6) Trigger em lesson_progress (primeira conclusão) ────────────────────
create or replace function public.trg_push_lesson_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  -- Só na primeira conclusão: OLD.completed_at is null and NEW.completed_at is not null
  if OLD.completed_at is null and NEW.completed_at is not null then
    begin
      insert into public.push_events (type, actor_profile_id, entity_id, payload)
      values (
        'lesson_completed',
        new.user_id,
        new.lesson_id,
        jsonb_build_object('lesson_id', new.lesson_id, 'course_id', new.course_id)
      )
      returning id into v_event_id;
      
      -- Disparar dispatch (nunca falhar a ação original)
      perform public.dispatch_push_event(v_event_id);
    exception
      when others then
        -- Capturar qualquer exceção - não falhar UPDATE
        return new;
    end;
  end if;
  
  return new;
end;
$$;

drop trigger if exists trg_push_lesson_completed on public.lesson_progress;
create trigger trg_push_lesson_completed
  after update on public.lesson_progress
  for each row execute function public.trg_push_lesson_completed();
