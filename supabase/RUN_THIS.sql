-- ═══════════════════════════════════════════════════════════════
-- EXECUTAR NO SUPABASE SQL EDITOR
-- Combina: 005_community_feed + 007_add_profile_progress_columns
-- ═══════════════════════════════════════════════════════════════

-- ─── 007: Colunas ausentes em profiles ────────────────────────

alter table public.profiles
  add column if not exists completed_lessons   jsonb not null default '[]',
  add column if not exists completed_courses   jsonb not null default '[]',
  add column if not exists completed_quizzes   jsonb not null default '[]';

-- ─── 005: Community Feed ─────────────────────────────────────

create table if not exists public.community_projects (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (length(title) between 3 and 120),
  description   text not null check (length(description) between 10 and 2000),
  tags          text[] not null default '{}',
  project_url   text,
  github_url    text,
  author_id     uuid not null references public.profiles(id) on delete cascade,
  like_count    integer not null default 0 check (like_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

do $$ begin
  alter table public.community_projects
    add constraint chk_project_has_url
    check (project_url is not null or github_url is not null);
exception when duplicate_object then null; end $$;

create index if not exists idx_community_projects_author on public.community_projects(author_id);
create index if not exists idx_community_projects_created on public.community_projects(created_at desc);
create index if not exists idx_community_projects_popular on public.community_projects(like_count desc, created_at desc);
create index if not exists idx_community_projects_tags on public.community_projects using gin(tags);

create table if not exists public.project_likes (
  project_id  uuid not null references public.community_projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists idx_project_likes_user on public.project_likes(user_id);

create table if not exists public.project_comments (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.community_projects(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_comments_project on public.project_comments(project_id, created_at asc);
create index if not exists idx_project_comments_author on public.project_comments(author_id);

-- ─── RLS ─────────────────────────────────────────────────────

alter table public.community_projects enable row level security;
alter table public.project_likes enable row level security;
alter table public.project_comments enable row level security;

do $$ begin create policy "cp_select" on public.community_projects for select using (auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "cp_insert" on public.community_projects for insert with check (auth.uid() is not null and author_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "cp_update" on public.community_projects for update using (auth.uid() is not null and author_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "cp_delete" on public.community_projects for delete using (auth.uid() is not null and author_id = auth.uid()); exception when duplicate_object then null; end $$;

do $$ begin create policy "pl_select" on public.project_likes for select using (auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "pl_insert" on public.project_likes for insert with check (auth.uid() is not null and user_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "pl_delete" on public.project_likes for delete using (auth.uid() is not null and user_id = auth.uid()); exception when duplicate_object then null; end $$;

do $$ begin create policy "pc_select" on public.project_comments for select using (auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "pc_insert" on public.project_comments for insert with check (auth.uid() is not null and author_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "pc_update" on public.project_comments for update using (auth.uid() is not null and author_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "pc_delete" on public.project_comments for delete using (auth.uid() is not null and (author_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))); exception when duplicate_object then null; end $$;

-- ─── TRIGGERS ────────────────────────────────────────────────

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger trg_community_projects_updated
    before update on public.community_projects
    for each row execute function public.update_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_project_comments_updated
    before update on public.project_comments
    for each row execute function public.update_updated_at();
exception when duplicate_object then null; end $$;

-- ─── FUNCTIONS ───────────────────────────────────────────────

create or replace function public.toggle_project_like(
  p_project_id uuid,
  p_user_id uuid
)
returns boolean as $$
declare
  v_liked boolean;
begin
  delete from public.project_likes
  where project_id = p_project_id and user_id = p_user_id;

  if found then
    update public.community_projects
    set like_count = greatest(0, like_count - 1)
    where id = p_project_id;
    return false;
  else
    insert into public.project_likes (project_id, user_id)
    values (p_project_id, p_user_id);
    update public.community_projects
    set like_count = like_count + 1
    where id = p_project_id;
    return true;
  end if;
end;
$$ language plpgsql security definer;

create or replace function public.increment_comment_count(
  p_project_id uuid,
  p_delta integer
)
returns void as $$
begin
  update public.community_projects
  set comment_count = greatest(0, comment_count + p_delta)
  where id = p_project_id;
end;
$$ language plpgsql security definer;

-- ─── VIEW ────────────────────────────────────────────────────

create or replace view public.v_community_author as
select
  p.id,
  p.name,
  p.username,
  p.photo_url as "photoURL"
from public.profiles p;
