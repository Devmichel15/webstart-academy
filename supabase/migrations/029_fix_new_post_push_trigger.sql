-- community_projects identifies the project owner through author_id, not user_id.
-- The old trigger failed silently before it could create a push event.

create or replace function public.trg_push_new_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  begin
    insert into public.push_events (type, actor_profile_id, entity_id, payload)
    values (
      'new_post',
      new.author_id,
      new.id::text,
      jsonb_build_object('title', new.title)
    )
    returning id into v_event_id;

    perform public.dispatch_push_event(v_event_id);
  exception
    when others then
      raise log 'new post push event failed for project %, author %: %',
        new.id, new.author_id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_push_new_post on public.community_projects;
create trigger trg_push_new_post
  after insert on public.community_projects
  for each row execute function public.trg_push_new_post();
