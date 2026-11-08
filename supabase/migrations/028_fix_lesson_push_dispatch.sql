-- Ensure lesson completions are emitted for both first-time inserts and updates,
-- and use the actual Supabase project URL when no database setting is present.

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
  v_url := coalesce(
    nullif(current_setting('app.settings.supabase_functions_url', true), ''),
    'https://cawoavdletnngyhrtzao.supabase.co/functions/v1/push-dispatch'
  );

  begin
    select decrypted_secret into v_secret
      from vault.decrypted_secrets
     where name = 'push_dispatch_secret'
     limit 1;
  exception
    when others then
      raise log 'push dispatch secret lookup failed for event %: %',
        p_event_id, sqlerrm;
      return;
  end;

  if v_secret is null then
    raise log 'push dispatch secret is not configured for event %', p_event_id;
    return;
  end if;

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
      raise log 'push dispatch request enqueue failed for event %: %',
        p_event_id, sqlerrm;
      return;
  end;

  if v_req_id is null then
    raise log 'push dispatch request returned no request id for event %',
      p_event_id;
  end if;
end;
$$;

create or replace function public.trg_push_lesson_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  if new.completed_at is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.completed_at is not null then
    return new;
  end if;

  begin
    insert into public.push_events (type, actor_profile_id, entity_id, payload)
    values (
      'lesson_completed',
      new.user_id,
      new.lesson_id,
      jsonb_build_object('lesson_id', new.lesson_id, 'course_id', new.course_id)
    )
    returning id into v_event_id;

    perform public.dispatch_push_event(v_event_id);
  exception
    when others then
      raise log 'lesson completion push event failed for user %, lesson %: %',
        new.user_id, new.lesson_id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_push_lesson_completed on public.lesson_progress;
create trigger trg_push_lesson_completed
  after insert or update on public.lesson_progress
  for each row execute function public.trg_push_lesson_completed();
