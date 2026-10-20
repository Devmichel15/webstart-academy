-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 021_post_images.sql
-- Imagens nas publicações do Feed:
--   1) community_projects.image_paths — até 4 paths no Storage
--   2) bucket público "project-images" (5 MB, JPEG/PNG/WebP)
--   3) policies de escrita em storage.objects só pelo dono do perfil
--   4) RPC get_public_projects_by_username passa a expor image_paths
-- Compatível com publicações antigas: default '{}' = card sem imagens.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1) COLUNA image_paths ────────────────────────────────────

alter table public.community_projects
  add column if not exists image_paths text[] not null default '{}';

-- Máximo 4 imagens e apenas paths com estrutura {uuid}/{uuid}/{ficheiro}.
-- Postgres não permite subqueries em CHECK (erro 0A000), por isso a
-- validação vive numa função IMMUTABLE que a constraint chama.
create or replace function public.is_valid_post_image_paths(paths text[])
returns boolean
language sql
immutable
parallel safe
set search_path = public
as $$
  select coalesce(array_length(paths, 1), 0) <= 4
     and not exists (
       select 1
         from unnest(paths) as p
        where p !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9._-]{1,120}$'
     );
$$;

comment on function public.is_valid_post_image_paths(text[]) is
  'true se image_paths tem no maximo 4 entries e todos os paths seguem {uuid}/{uuid}/{ficheiro}.';

do $$
begin
  alter table public.community_projects
    add constraint chk_project_image_paths_021
    check (public.is_valid_post_image_paths(image_paths));
exception
  when duplicate_object then null;
end $$;

-- ─── 2) BUCKET ────────────────────────────────────────────────
-- Público (as publicações/showcases dos alunos já são conteúdo de
-- partilha; a RPC pública de perfis expõe projectos a anónimos).
-- Escrita protegida pelas policies da secção 3. Limites aplicados
-- também no backend de Storage, não só no frontend.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ─── 3) HELPER + POLICIES DE STORAGE ─────────────────────────
-- Path esperado: {profiles.id}/{community_projects.id}/{ficheiro}.
-- O primeiro segmento é o profiles.id do dono (pode diferir de
-- auth.uid() em perfis re-linkados — ver migration 015).

create or replace function public.owns_post_image_path(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_path is null then false
    when p_path !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' then false
    else public.user_is_profile_owner(split_part(p_path, '/', 1)::uuid)
  end;
$$;

comment on function public.owns_post_image_path(text) is
  'true se o path em storage.objects pertence ao perfil autenticado (1º segmento = profiles.id).';

revoke all on function public.owns_post_image_path(text) from public, anon;
grant execute on function public.owns_post_image_path(text) to authenticated, service_role;

drop policy if exists "project_images_select" on storage.objects;
create policy "project_images_select"
  on storage.objects for select
  using (bucket_id = 'project-images');

drop policy if exists "project_images_insert_own" on storage.objects;
create policy "project_images_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-images'
    and public.owns_post_image_path(name)
  );

drop policy if exists "project_images_update_own" on storage.objects;
create policy "project_images_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'project-images'
    and public.owns_post_image_path(name)
  )
  with check (
    bucket_id = 'project-images'
    and public.owns_post_image_path(name)
  );

drop policy if exists "project_images_delete_own" on storage.objects;
create policy "project_images_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-images'
    and public.owns_post_image_path(name)
  );

-- ─── 4) RPC PÚBLICA COM image_paths ───────────────────────────

drop function if exists public.get_public_projects_by_username(text);

create or replace function public.get_public_projects_by_username(p_username text)
returns table (
  id uuid,
  title text,
  description text,
  tags text[],
  project_url text,
  github_url text,
  image_paths text[],
  like_count integer,
  comment_count integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if p_username is null or btrim(p_username) = '' then
    return;
  end if;

  select p.id
    into v_profile_id
    from public.profiles p
   where lower(p.username) = lower(btrim(p_username))
     and coalesce(p.is_public, true) = true
   limit 1;

  if v_profile_id is null then
    return;
  end if;

  return query
  select
    cp.id,
    cp.title::text,
    cp.description::text,
    cp.tags,
    cp.project_url::text,
    cp.github_url::text,
    cp.image_paths,
    cp.like_count::integer,
    cp.comment_count::integer,
    cp.created_at
  from public.community_projects cp
  where cp.author_id = v_profile_id
  order by cp.created_at desc;
end;
$$;

comment on function public.get_public_projects_by_username(text) is
  'Projetos publicos de um utilizador (perfil publico). Whitelist explicita, sem dados sensiveis.';

revoke all on function public.get_public_projects_by_username(text) from public;
grant execute on function public.get_public_projects_by_username(text) to anon, authenticated;
