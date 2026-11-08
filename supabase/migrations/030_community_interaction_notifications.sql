-- Emit community notifications for likes and comments. The dispatcher
-- broadcasts to opted-in users and excludes the actor.

alter table public.push_events
  drop constraint if exists push_events_type_check;

alter table public.push_events
  add constraint push_events_type_check
  check (type in (
    'new_post',
    'lesson_completed',
    'project_liked',
    'project_commented'
  ));

create or replace function public.trg_push_community_interaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_project_id uuid;
  v_project_author_id uuid;
  v_project_title text;
  v_event_type text;
  v_event_id uuid;
begin
  if tg_table_name = 'project_likes' then
    v_actor_id := new.user_id;
    v_project_id := new.project_id;
    v_event_type := 'project_liked';
  else
    v_actor_id := new.author_id;
    v_project_id := new.project_id;
    v_event_type := 'project_commented';
  end if;

  select author_id, title
    into v_project_author_id, v_project_title
    from public.community_projects
   where id = v_project_id;

  if not found or v_project_author_id = v_actor_id then
    return new;
  end if;

  begin
    insert into public.push_events (type, actor_profile_id, entity_id, payload)
    values (
      v_event_type,
      v_actor_id,
      v_project_id::text,
      jsonb_build_object('project_title', v_project_title)
    )
    returning id into v_event_id;

    perform public.dispatch_push_event(v_event_id);
  exception
    when others then
      raise log 'community interaction push event failed for project %, actor %: %',
        v_project_id, v_actor_id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_push_project_liked on public.project_likes;
create trigger trg_push_project_liked
  after insert on public.project_likes
  for each row execute function public.trg_push_community_interaction();

drop trigger if exists trg_push_project_commented on public.project_comments;
create trigger trg_push_project_commented
  after insert on public.project_comments
  for each row execute function public.trg_push_community_interaction();
