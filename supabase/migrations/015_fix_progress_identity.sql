-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 015_fix_progress_identity.sql
-- Causa raiz dos erros 23503 (FK) e 409 no avanço de aulas / like:
--   auth.uid()  ≠  profiles.id  para perfis re-linkados (herdados + contas
--   órfãs). Tabelas com FK user_id → profiles.id gravam com o id errado.
-- Correções:
--   1) helper current_auth_profile_id(): o profile.id real do auth corrente
--   2) toggle_project_like passa a resolver user_id via profile real
--   3) RLS "próprio" passa a reconhecer o perfil por auth_user_id (leitura
--      do próprio perfil + leitura/escrita de progresso/quiz/course/email)
-- ═══════════════════════════════════════════════════════════════

-- ─── 1) helper: resolve o profiles.id real a partir de auth.uid() ──

create or replace function public.current_auth_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
    from public.profiles p
   where p.id = auth.uid() or p.auth_user_id = auth.uid()
   limit 1;
$$;

revoke all on function public.current_auth_profile_id() from public, anon;
grant execute on function public.current_auth_profile_id() to authenticated;

create or replace function public.user_is_profile_owner(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(p_profile_id = auth.uid(), false)
    or exists (
      select 1 from public.profiles p
      where p.id = p_profile_id and p.auth_user_id = auth.uid()
    );
$$;

revoke all on function public.user_is_profile_owner(uuid) from public, anon;
grant execute on function public.user_is_profile_owner(uuid) to authenticated;

-- ─── 2) toggle_project_like: grava com o profile id real ──────────

drop function if exists public.toggle_project_like(uuid, uuid);

create or replace function public.toggle_project_like(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_profile uuid := public.current_auth_profile_id();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- sem perfil resolúvel (conta órfã): mensagem própria, sem vazar SQL
  if v_profile is null then
    raise exception using
      errcode = 'P0001',
      message = 'Ainda não tens um perfil configurado. Cria o teu perfil para poderes interagir.';
  end if;

  delete from public.project_likes
    where project_id = p_project_id and user_id = v_profile;

  if found then
    update public.community_projects
      set like_count = greatest(0, like_count - 1)
      where id = p_project_id;
    return false;
  else
    insert into public.project_likes (project_id, user_id)
      values (p_project_id, v_profile);
    update public.community_projects
      set like_count = like_count + 1
      where id = p_project_id;
    return true;
  end if;
end
$$;

revoke all on function public.toggle_project_like(uuid) from public, anon;
grant execute on function public.toggle_project_like(uuid) to authenticated;

-- ─── 3) RLS: "próprio" também por auth_user_id ────────────────────

drop policy if exists "profiles_select_self_or_public" on public.profiles;
create policy "profiles_select_self_or_public"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or auth_user_id = auth.uid()
    or is_public = true
    or public.is_admin()
  );

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = auth.uid() or auth_user_id = auth.uid())
  with check (id = auth.uid() or auth_user_id = auth.uid());

drop policy if exists "progress_own" on public.lesson_progress;
create policy "progress_own"
  on public.lesson_progress for all to authenticated
  using (public.user_is_profile_owner(user_id))
  with check (public.user_is_profile_owner(user_id));

drop policy if exists "quiz_own" on public.quiz_completions;
create policy "quiz_own"
  on public.quiz_completions for all to authenticated
  using (public.user_is_profile_owner(user_id))
  with check (public.user_is_profile_owner(user_id));

drop policy if exists "ccourse_own" on public.course_completions;
create policy "ccourse_own"
  on public.course_completions for all to authenticated
  using (public.user_is_profile_owner(user_id))
  with check (public.user_is_profile_owner(user_id));

drop policy if exists "email_prefs_own" on public.email_preferences;
create policy "email_prefs_own"
  on public.email_preferences for all to authenticated
  using (public.user_is_profile_owner(user_id))
  with check (public.user_is_profile_owner(user_id));

drop policy if exists "learning_own" on public.learning_profiles;
create policy "learning_own"
  on public.learning_profiles for all to authenticated
  using (public.user_is_profile_owner(user_id))
  with check (public.user_is_profile_owner(user_id));

drop policy if exists "uachv_insert_own" on public.user_achievements;
create policy "uachv_insert_own"
  on public.user_achievements for insert to authenticated
  with check (public.user_is_profile_owner(user_id));

-- ─── 4) comunidade: author_id/user_id também podem ser o perfil re-linkado ──

drop policy if exists "pl_insert" on public.project_likes;
create policy "pl_insert"
  on public.project_likes for insert to authenticated
  with check (
    auth.uid() is not null
    and public.user_is_profile_owner(user_id)
  );

drop policy if exists "pl_delete" on public.project_likes;
create policy "pl_delete"
  on public.project_likes for delete to authenticated
  using (
    auth.uid() is not null
    and public.user_is_profile_owner(user_id)
  );

drop policy if exists "cp_insert" on public.community_projects;
create policy "cp_insert"
  on public.community_projects for insert to authenticated
  with check (
    auth.uid() is not null
    and public.user_is_profile_owner(author_id)
  );

drop policy if exists "cp_update" on public.community_projects;
create policy "cp_update"
  on public.community_projects for update to authenticated
  using (public.user_is_profile_owner(author_id));

drop policy if exists "cp_delete" on public.community_projects;
create policy "cp_delete"
  on public.community_projects for delete to authenticated
  using (public.user_is_profile_owner(author_id));

drop policy if exists "pc_insert" on public.project_comments;
create policy "pc_insert"
  on public.project_comments for insert to authenticated
  with check (
    auth.uid() is not null
    and public.user_is_profile_owner(author_id)
  );

drop policy if exists "pc_update" on public.project_comments;
create policy "pc_update"
  on public.project_comments for update to authenticated
  using (public.user_is_profile_owner(author_id));

drop policy if exists "pc_delete" on public.project_comments;
create policy "pc_delete"
  on public.project_comments for delete to authenticated
  using (
    auth.uid() is not null
    and (
      public.user_is_profile_owner(author_id)
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      )
    )
  );

-- ─── 5) denúncias: reporter_id também pelo perfil real ─────────

alter table public.post_reports
  alter column reporter_id set default public.current_auth_profile_id();

drop policy if exists "post_reports_insert_self" on public.post_reports;
create policy "post_reports_insert_self"
  on public.post_reports for insert to authenticated
  with check (public.user_is_profile_owner(reporter_id));

drop policy if exists "post_reports_select_self" on public.post_reports;
create policy "post_reports_select_self"
  on public.post_reports for select to authenticated
  using (public.user_is_profile_owner(reporter_id));