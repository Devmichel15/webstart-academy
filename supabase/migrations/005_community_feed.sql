-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 005_community_feed.sql
-- Tabelas para a feature Feed (antes "Comunidade")
-- Mapeia: community_projects, project_likes, project_comments
-- ═══════════════════════════════════════════════════════════════

-- ─── COMMUNITY PROJECTS ──────────────────────────────────────

create table public.community_projects (
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

-- Constraint: pelo menos um URL obrigatório
alter table public.community_projects
  add constraint chk_project_has_url
  check (project_url is not null or github_url is not null);

-- Índices para ordenação e filtragem
create index idx_community_projects_author on public.community_projects(author_id);
create index idx_community_projects_created on public.community_projects(created_at desc);
create index idx_community_projects_popular on public.community_projects(like_count desc, created_at desc);
create index idx_community_projects_tags on public.community_projects using gin(tags);

-- ─── PROJECT LIKES ───────────────────────────────────────────

create table public.project_likes (
  project_id  uuid not null references public.community_projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- Índice para lookup por utilizador
create index idx_project_likes_user on public.project_likes(user_id);

-- ─── PROJECT COMMENTS ────────────────────────────────────────

create table public.project_comments (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.community_projects(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para lookup por projeto e ordenação
create index idx_project_comments_project on public.project_comments(project_id, created_at asc);
create index idx_project_comments_author on public.project_comments(author_id);

-- ─── RLS POLICIES ────────────────────────────────────────────

-- Community Projects
alter table public.community_projects enable row level security;

-- Leitura: qualquer utilizador autenticado
create policy "cp_select" on public.community_projects
  for select using (auth.uid() is not null);

-- Criação: autor autenticado, author_id deve corresponder ao auth.uid()
create policy "cp_insert" on public.community_projects
  for insert with check (
    auth.uid() is not null
    and author_id = auth.uid()
  );

-- Atualização: autor do projeto pode editar conteúdo; qualquer um pode atualizar like_count/comment_count
create policy "cp_update" on public.community_projects
  for update using (
    auth.uid() is not null
    and author_id = auth.uid()
  );

-- Exclusão: apenas o autor
create policy "cp_delete" on public.community_projects
  for delete using (
    auth.uid() is not null
    and author_id = auth.uid()
  );

-- Project Likes
alter table public.project_likes enable row level security;

-- Leitura: qualquer autenticado
create policy "pl_select" on public.project_likes
  for select using (auth.uid() is not null);

-- Criação: utilizador autenticado, user_id deve corresponder ao auth.uid()
create policy "pl_insert" on public.project_likes
  for insert with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

-- Exclusão: apenas o próprio utilizador
create policy "pl_delete" on public.project_likes
  for delete using (
    auth.uid() is not null
    and user_id = auth.uid()
  );

-- Project Comments
alter table public.project_comments enable row level security;

-- Leitura: qualquer autenticado
create policy "pc_select" on public.project_comments
  for select using (auth.uid() is not null);

-- Criação: autor autenticado, author_id deve corresponder ao auth.uid()
create policy "pc_insert" on public.project_comments
  for insert with check (
    auth.uid() is not null
    and author_id = auth.uid()
  );

-- Atualização: apenas o autor do comentário
create policy "pc_update" on public.project_comments
  for update using (
    auth.uid() is not null
    and author_id = auth.uid()
  );

-- Exclusão: autor do comentário ou admin
create policy "pc_delete" on public.project_comments
  for delete using (
    auth.uid() is not null
    and (
      author_id = auth.uid()
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      )
    )
  );

-- ─── TRIGGERS ────────────────────────────────────────────────

-- Trigger para atualizar updated_at automaticamente
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_community_projects_updated
  before update on public.community_projects
  for each row execute function public.update_updated_at();

create trigger trg_project_comments_updated
  before update on public.project_comments
  for each row execute function public.update_updated_at();

-- ─── FUNCTIONS PARA ATUALIZAR CONTADORES ─────────────────────

-- Função para incrementar like_count (chamada pela app)
create or replace function public.toggle_project_like(
  p_project_id uuid,
  p_user_id uuid
)
returns boolean as $$
declare
  v_liked boolean;
begin
  -- Tentar remover like existente
  delete from public.project_likes
  where project_id = p_project_id and user_id = p_user_id;

  if found then
    -- Like removido, decrementar contador
    update public.community_projects
    set like_count = greatest(0, like_count - 1)
    where id = p_project_id;
    return false;
  else
    -- Adicionar like, incrementar contador
    insert into public.project_likes (project_id, user_id)
    values (p_project_id, p_user_id);
    update public.community_projects
    set like_count = like_count + 1
    where id = p_project_id;
    return true;
  end if;
end;
$$ language plpgsql security definer;

-- Função para incrementar comment_count
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

-- ─── VIEWS COMPATIBILIDADE ───────────────────────────────────

-- View que simula o formato Firestore para hydration de autores
create or replace view public.v_community_author as
select
  p.id,
  p.name,
  p.username,
  p.photo_url as "photoURL"
from public.profiles p;
