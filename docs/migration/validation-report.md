# Relatório de Validação — Migração Firebase → Supabase

**Data:** 2026-08-22 · **Projeto:** `cawoavdletnngyhrtzao` (região pooler `aws-1-eu-west-1`)

```text
========================================
WEBSTART FIREBASE → SUPABASE
MIGRATION VALIDATION
========================================
Status: SUCCESS
```

## 1. Resumo por entidade

| Entidade | Origem (backup) | Destino (Supabase) | Diferença | Status |
|---|---|---|---|---|
| Users (Auth = profiles) | 81 | 81 | 0 | ✓ |
| Courses | 12 | 12 | 0 | ✓ |
| Modules (47 + 9 legados) | 56 | 56 | 0 | ✓ |
| Lessons (277 + 18 legadas) | 295 | 295 | 0 | ✓ |
| Achievements (catálogo) | 12 | 12 | 0 | ✓ |
| Lesson progress | 354 | 354 | 0 | ✓ |
| Quiz completions | 0 | 0 | 0 | ✓ |
| Course completions | 13 | 13 | 0 | ✓ |
| User achievements | 188 | 188 | 0 | ✓ |
| Email preferences | 81 | 81 | 0 | ✓ |
| Learning profiles | 0 | 0 | 0 | ✓ |
| Announcements | 1 | 1 | 0 | ✓ |
| firebase_id_mapping | 269 | 269 | 0 | ✓ |
| **Total de registros comparados** | **1362** | **1362** | **0** | **✓** |

## 2. XP

| Métrica | Valor |
|---|---|
| XP total Firebase (backup) | **83.665** |
| XP total Supabase | **83.665** |
| Difference | **0** ✓ |
| Comparação por usuário (81/81) | **0 diferenças** ✓ |

## 3. Dados preservados

```text
Users lost:            0 ✓
Progress lost:         0 ✓
XP difference:         0 ✓
Achievements lost:     0 ✓
Broken references:     0 ✓
Hash mismatches:       0 ✓  (1.362 registros com hash canônico sha256)
Migration errors:      0 ✓  (estado final)
Firebase modified:     NO ✓  (export 100% read-only)
Frontend modified:     NO ✓
Rollback:              AVAILABLE ✓  (Firebase intacto + backups locais)
```

## 4. Preservação legada (estratégia zero-perda)

O catálogo atual (`src/data/**`) não contém aulas/módulos antigos de texto que foram
substituídos por video-aulas, mas o histórico de progresso real os referencia.
Para satisfazer as FKs **sem descartar nenhum registro**, foram sintetizadas linhas
marcadas `legacy=true`:

- **18 aulas legadas criadas** (`html-tags`, `web-intro`, etc.)
- **9 módulos legados criados** (`web-fundamentos`, `html-fundamentos`, etc.)
- **50 registros de progresso preservados** nessas aulas legadas (50/50)

> Nota: estimativas anteriores mencionavam "51"; a contagem exata validada é **50**.

## 5. Qualidade de dados encontrada (preservada, não corrigida)

Descobertas no backup durante o transform — valores originais mantidos byte-exato:

| Campo | Situação | Tratamento |
|---|---|---|
| `users.totalStudyTime` | string corrompida em 28/81 docs (concatenação MM:SS) | inteiro reconstruído quando parse fecha (17), 0 nos ambíguos (11); original em `profiles.total_study_time_legacy` |
| `user_progress.timeSpent` | duração "MM:SS" como string em 210/354 registros (video-aulas) | convertido para minutos; original em `lesson_progress.time_spent_legacy` |
| `firstStepsDone` ausente | 27 usuários sem o campo | backfill pela regra aprovada: 9 true / 18 false |

Colunas `*_legacy` adicionadas via patch espelhado na migration `001`.

## 6. Incidentes de execução (todos resolvidos, sem perda)

1. **uuid v5 truncado** — função gerava 40 hex; PostgREST rejeitou o batch atomicamente
   (nenhuma escrita parcial). Corrigido p/ 16 bytes; transform regenerado.
2. **`email_preferences.updated_at` null** — chave omitida no payload p/ default do banco.
3. **Inteiros vs strings** (§5) — colunas `_legacy` + reconstrução determinística.
4. **FKs de módulo legado** — detectadas pela validação profunda; resolvidas com §4.

Em todos os casos os batches do PostgREST são atômicos: falha ⇒ rejeição completa,
reexecução idempotente (upsert) sem duplicação.

## 7. Metodologia de validação

- **Contagens**: todas as 13 tabelas (local JSONL vs DB via `Prefer: count=exact`)
- **Hashes canônicos sha256** por registro (chaves ordenadas, timestamps → epoch):
  local vs remoto projetado nas mesmas colunas — **1.362/1.362 idênticos**
- **Timestamps** normalizados e comparados (createdAt, lastLogin, earnedAt, completedAt)
- **FKs**: 7 verificações de órfãos sobre os dados remotos — **0 órfãos**
- **RLS**: anon bloqueado em `profiles` (0 linhas) e catálogo público legível (12 cursos);
  16 policies ativas; service_role usada apenas server-side (`.env.local` gitignored)
- **Pré-verificação**: 17/17 checks antes do import

Artefatos: `migration/reports/{deep-validation,validation-summary,transform-summary,
seed-content-summary,import-summary}.json`

## 8. Critérios de sucesso — checklist final

✓ backup disponível · ✓ schema aplicado (15 tabelas, 4 views, 15 FKs, 36 índices, 16 policies)
· ✓ import concluído · ✓ users/courses/modules/lessons/legacy/progress/XP/achievements
preservados · ✓ timestamps preservados · ✓ foreign keys válidas · ✓ hashes validados
· ✓ diferenças críticas = 0 · ✓ erros críticos = 0 · ✓ Firebase intacto

## 9. Estado e próximos passos

**A aplicação continua operando 100% no Firebase.** Nenhum arquivo de frontend,
service, hook ou `.env` principal foi alterado. O Supabase contém uma cópia fiel e
validada dos dados, pronta para a fase de cutover — que só ocorrerá após aprovação
explícita. Firebase permanece fallback até lá.
