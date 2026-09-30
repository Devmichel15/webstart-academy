-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — backfill de learning_profiles.completed
--
-- ESTE FICHEIRO NÃO É APLICADO AUTOMATICAMENTE.
-- Rever, executar em staging, confirmar o resultado e só depois aplicar
-- em produção.
--
-- ─── O problema ──────────────────────────────────────────────────
-- `learning_profiles.completed` foi declarada em 001_initial_schema.sql mas
-- nunca era lida nem mantida pela aplicação:
--   * mapLearningProfileRow() não a mapeava;
--   * isAssessmentCompleted() só olhava para metadata.completed.
-- Duas consequências opostas:
--
--   1. Registos antigos (gravados antes de a coluna ser preenchida) e registos
--      copiados por link_legacy_profile (migration 010 copia assessment,
--      roadmap e metadata mas copia `completed` tal como estava) têm
--      completed = null ou false. Para qualquer consulta SQL que use a coluna
--      canónica — relatórios, dashboards, admin — estes utilizadores parecem
--      nunca ter concluído o onboarding.
--
--   2. Um registo com completed = true mas metadata incompleto era lido como
--      NÃO concluído, o que obrigava o utilizador a repetir o assessment e
--      sobrescrever o seu learning_profile.
--
-- ─── O que este script corrige ───────────────────────────────────
-- Preenche `completed` a partir de qualquer uma das fontes fiáveis, sem
-- tocar em linhas que já estão coerentes.
--
-- ─── Como aplicar ────────────────────────────────────────────────
--   1. Correr o bloco de diagnóstico e guardar o resultado.
--   2. Executar o UPDATE dentro de uma transação e rever o affected rows.
--   3. Reexecutar o diagnóstico: deve devolver 0 linhas.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Diagnóstico (SELECT) ─────────────────────────────────────
-- Quantos registos estão inconsistentes e porquê.
select
  count(*) filter (where completed is null)                    as completed_null,
  count(*) filter (where completed is false)                   as completed_false,
  count(*) filter (
    where completed is not true
      and (
        metadata->>'completed' = 'true'
        or coalesce(assessment->>'answeredAt', '') <> ''
        or assessment <> '{}'::jsonb
      )
  )                                                            as a_corrigir,
  count(*) filter (
    where completed is true
      and coalesce(metadata->>'completed', 'false') <> 'true'
  )                                                            as metadata_a_sincronizar
from public.learning_profiles;

-- Detalhe das linhas candidatas (rever antes de aplicar).
select
  user_id,
  completed,
  metadata->>'completed'   as metadata_completed,
  assessment->>'answeredAt' as answered_at,
  assessment                as assessment_json,
  source,
  updated_at
from public.learning_profiles
where completed is not true
  and (
    metadata->>'completed' = 'true'
    or coalesce(assessment->>'answeredAt', '') <> ''
    or assessment <> '{}'::jsonb
  )
order by updated_at desc;

-- ─── 2. Backfill (UPDATE) ────────────────────────────────────────
-- Só escreve em linhas que NÃO estão já concluídas. Um assessment conta como
-- submetido quando tem `answeredAt` (marca que saveFullLearningProfile grava)
-- ou quando `metadata.completed` é true. Um objeto `assessment` não vazio sem
-- `answeredAt` é tratado como rascunho e NÃO é promovido — evita marcar como
-- concluídos assessments interrompidos a meio.
begin;

update public.learning_profiles
set
  completed   = true,
  metadata    = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('completed', true),
  updated_at  = now()
where completed is not true
  and (
    metadata->>'completed' = 'true'
    or coalesce(assessment->>'answeredAt', '') <> ''
  );

-- ─── 3. Sincronizar o espelho metadata.completed ─────────────────
-- Linhas já canonicamente concluídas cujo metadata ficou para trás, para que as
-- leituras antigas (metadata->>'completed') e as novas (completed) digam o mesmo.
update public.learning_profiles
set
  metadata   = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('completed', true),
  updated_at = now()
where completed is true
  and coalesce(metadata->>'completed', 'false') <> 'true';

commit;

-- ─── 4. Verificação (deve devolver 0) ────────────────────────────
select count(*) as restantes_inconsistentes
from public.learning_profiles
where (
  completed is true
  and coalesce(metadata->>'completed', 'false') <> 'true'
)
or (
  completed is not true
  and (
    metadata->>'completed' = 'true'
    or coalesce(assessment->>'answeredAt', '') <> ''
  )
);

-- ═══════════════════════════════════════════════════════════════
-- Nota: este backfill só repõe a coerência de DADOS. A aplicação já
-- lê as duas fontes (ver src/services/learningProfileService.js,
-- getAssessmentStatus) e src/test/backfill.test.js fixa esse contrato.
-- ═══════════════════════════════════════════════════════════════