-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 014_post_reports_moderation.sql
-- Moderação mínima: tabela de denúncias + RLS (reporter cria, admin resolve),
-- RPC admin_resolve_report com guard is_admin, e URLs apenas https.
-- ═══════════════════════════════════════════════════════════════

-- ─── POST REPORTS ─────────────────────────────────────────────

create table public.post_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  project_id  uuid references public.community_projects(id) on delete cascade,
  comment_id  uuid references public.project_comments(id) on delete cascade,
  reason      text not null check (length(reason) between 3 and 500),
  status      text not null default 'pending' check (status in ('pending','resolved')),
  resolution  text check (resolution in ('dismissed','deleted')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  constraint chk_report_target check (
    (project_id is not null and comment_id is null)
    or
    (project_id is null and comment_id is not null)
  )
);

create index idx_post_reports_status on public.post_reports(status, created_at desc);
create index idx_post_reports_reporter on public.post_reports(reporter_id);

alter table public.post_reports enable row level security;

-- qualquer utilizador autenticado cria denúncia para si próprio
create policy "post_reports_insert_self"
  on public.post_reports for insert to authenticated
  with check (reporter_id = auth.uid());

-- o autor vê as suas próprias denúncias (necessário para INSERT ... RETURNING
-- / Prefer: return=representation, senão o Postgres re-valida a linha com RLS)
create policy "post_reports_select_self"
  on public.post_reports for select to authenticated
  using (reporter_id = auth.uid());

-- apenas admin lê / atualiza estado / apaga
create policy "post_reports_admin_all"
  on public.post_reports for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── RPC DE RESOLUÇÃO (admin) ─────────────────────────────────

create or replace function public.admin_resolve_report(
  p_report_id uuid,
  p_action    text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.post_reports%rowtype;
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  select * into v_report from public.post_reports where id = p_report_id;
  if v_report.id is null then
    raise exception 'report_not_found';
  end if;

  if lower(p_action) = 'delete' then
    if v_report.comment_id is not null then
      delete from public.project_comments where id = v_report.comment_id;
    elsif v_report.project_id is not null then
      delete from public.community_projects where id = v_report.project_id;
    end if;
    update public.post_reports
      set status = 'resolved', resolution = 'deleted', resolved_at = now()
      where id = p_report_id;
  elsif lower(p_action) = 'dismiss' then
    update public.post_reports
      set status = 'resolved', resolution = 'dismissed', resolved_at = now()
      where id = p_report_id;
  else
    raise exception 'invalid_action';
  end if;
end
$$;

revoke all on function public.admin_resolve_report(uuid, text) from public, anon;
grant execute on function public.admin_resolve_report(uuid, text) to authenticated;

-- ─── URLs apenas https (não confiar só no frontend) ───────────

alter table public.community_projects
  add constraint chk_project_url_https_014
  check (project_url is null or project_url ~ '^https://');

alter table public.community_projects
  add constraint chk_github_url_https_014
  check (github_url is null or github_url ~ '^https://');