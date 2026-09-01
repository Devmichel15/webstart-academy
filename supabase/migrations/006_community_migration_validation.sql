-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 006_community_migration_validation.sql
-- Validação e seed de dados community a partir do Firestore
-- ═══════════════════════════════════════════════════════════════

-- Verificar integridade das tabelas community
do $$
declare
  v_projects int;
  v_likes int;
  v_comments int;
  v_orphan_projects int;
  v_orphan_comments int;
begin
  select count(*) into v_projects from public.community_projects;
  select count(*) into v_likes from public.project_likes;
  select count(*) into v_comments from public.project_comments;

  -- Verificar projetos órfãos (author_id não existe em profiles)
  select count(*) into v_orphan_projects
  from public.community_projects cp
  where not exists (select 1 from public.profiles p where p.id = cp.author_id);

  -- Verificar comentários órfãos
  select count(*) into v_orphan_comments
  from public.project_comments pc
  where not exists (select 1 from public.profiles p where p.id = pc.author_id);

  raise notice '═══ Community Data Validation ═══';
  raise notice 'Projects: %', v_projects;
  raise notice 'Likes: %', v_likes;
  raise notice 'Comments: %', v_comments;
  raise notice 'Orphan projects (no author): %', v_orphan_projects;
  raise notice 'Orphan comments (no author): %', v_orphan_comments;

  if v_orphan_projects > 0 or v_orphan_comments > 0 then
    raise warning 'Found orphan records! Check author_id references.';
  else
    raise notice 'All foreign keys are valid.';
  end if;
end $$;

-- Verificar que os contadores estão corretos
do $$
declare
  v_mismatched int;
begin
  select count(*) into v_mismatched
  from public.community_projects cp
  where cp.like_count != (
    select count(*) from public.project_likes pl where pl.project_id = cp.id
  )
  or cp.comment_count != (
    select count(*) from public.project_comments pc where pc.project_id = cp.id
  );

  if v_mismatched > 0 then
    raise warning 'Found % projects with mismatched counters', v_mismatched;

    -- Auto-fix: atualizar contadores
    update public.community_projects cp
    set
      like_count = coalesce((select count(*) from public.project_likes pl where pl.project_id = cp.id), 0),
      comment_count = coalesce((select count(*) from public.project_comments pc where pc.project_id = cp.id), 0);

    raise notice 'Auto-fixed % project counters', v_mismatched;
  else
    raise notice 'All project counters are correct.';
  end if;
end $$;
