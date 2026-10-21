# Testes unitários e de integração + correções de bugs (WebStart Academy)

Branch: `test/unit-integration-fixes` (base: `feature/trilha-python`)
Commits: `42f124c`, `279f1d8`, `f19d27c`, `0ad06a2`

---

## Resumo

Esta branch adiciona uma suite de testes unitários e de integração à WebStart Academy (109 → **180 testes**, +71) e corrige **15 bugs** descobertos por essa suite.

O trabalho partiu de uma auditoria test-driven com um duplo de Supabase **em memória** (`src/test/fakeSupabase.js`) que implementa as políticas RLS, as foreign keys e a semântica de `maybeSingle()` do PostgREST. Ou seja, os testes não mockam respostas prontas: exercitam a integração real entre `AuthContext → userService → ProgressContext → guards → páginas`, com a base de dados a ser um repositório em memória e a persistência verificada relendo o repositório.

Os bugs foram todos encontrados com **teste vermelho primeiro**, reportados antes de serem corrigidos.

---

## Bugs #1 a #15

### Onboarding, perfis e identidade (1–4, 11–12)

| # | Bug | Ficheiro | Impacto |
|---|---|---|---|
| 1 | Leitura ambígua quando existem duas linhas de `profiles` para o mesmo auth uid | `userService.js` | `maybeSingle()` devolvia `PGRST116` e o perfil parecia inexistente, em utilizadores migrados |
| 2 | Atualizações gravadas no perfil errado | `userService.js` | Progresso e XP gravados no perfil não canónico |
| 3 | `createUserProfile` devolvia o perfil migrado errado | `userService.js` | Utilizador migrado vê o perfil vazio em vez do seu histórico |
| 4 | `learning_profiles` lido/gravado pelo auth uid em vez de `profiles.id` | `learningProfileService.js` | FK `user_id → profiles.id` falha com `23503` |
| 11 | `getUserProfile` engolia qualquer erro e devolvia `null` | `userService.js:214` | `null` indistinguível de "perfil inexistente" → **perfil duplicado** criado no login; `ProgressContext` tratava o utilizador como novo; falha silenciosa |
| 12 | `createUserProfile` engolia a falha de `link_legacy_profile` | `userService.js:57-66` | Migrador recebia **perfil vazio em vez do histórico** → onboarding forçado → perda aparente de progresso |

### Erros e resiliência (5, 13, 14)

| # | Bug | Ficheiro | Impacto |
|---|---|---|---|
| 5 | Erros de `getLearningProfile` engolidos | `learningProfileService.js` | Falha de leitura indistinguível de "sem perfil" |
| 13 | `onError` chamado depois de `unsubscribe` | `progressService.js:140` | `setState` após unmount; erro fantasma no ecrã |
| 14 | Guard tratava "não foi possível verificar" como "onboarding por fazer" | `LearningProfileGuard.jsx` | Em qualquer falha de rede/42501/500, utilizadores **com assessment já concluído** eram forçados a `/avaliacao-perfil` e pressionados a refazê-lo, com risco de **sobrescrever o `learning_profiles`** |

### Streak e XP (10)

| # | Bug | Ficheiro | Impacto |
|---|---|---|---|
| 10 | `computeStreakUpdate`: o ramo de gap era atingido na primeira atividade e dava bónus | `userService.js:501` | Toast de erro **"Streak reiniciado. -0 XP"** a utilizadores novos; **XP grátis de 10**; streak quebrado podia **aumentar** o XP (`xp=3, streak=8` → penaliza 25, soma 10 → 10) |

### Trilhas (7–8)

| # | Bug | Ficheiro | Impacto |
|---|---|---|---|
| 7 | `currentTrail` apontava para a trilha errada (off-by-one) | `trailProgressService.js` | Utilizador é reencaminhado para uma trilha já concluída |
| 8 | Trilhas indexadas pela lista não ordenada em vez de `order` | `trailProgressService.js` | Trilha atual/next errada quando as ordens não são sequenciais |

### Guard (9)

| # | Bug | Ficheiro | Impacto |
|---|---|---|---|
| 9 | Guard desestruturava uma chave `profile` inexistente no `ProgressContext` | `LearningProfileGuard.jsx` | `isNewUser` permanentemente `false` → redirecionamentos e gates errados |

### Backfill do assessment (6, 15)

| # | Bug | Ficheiro | Impacto |
|---|---|---|---|
| 6 | `saveFullLearningProfile` não preenchia a coluna canónica `completed` | `learningProfileService.js` | Registos gravados ficam com `completed = null` |
| 15 | `learning_profiles.completed` nunca era lida (só `metadata.completed`) | `learningProfileService.js` | `completed = true` com `metadata` incompleto → assessment lido como não feito → **repetição do assessment**; registos antigos invisíveis a qualquer consulta SQL que use a coluna canónica |

---

## Testes: 109 → 180

| Ficheiro | Cobertura |
|---|---|
| `src/test/integration.test.jsx` | Fluxos reais: login → perfil → dashboard; perfil migrado com 2 linhas; utilizador novo → onboarding; assessment de 7 perguntas → logout/login sem repetir onboarding; concluir aula → persiste após refresh/login |
| `src/test/userService.test.js` | Resolução canónica de perfil, writes, auth e propagação de erros |
| `src/test/learningProfileService.test.js` | Onboarding, perfil migrado, erros, coluna `completed` |
| `src/test/trails.test.js` | Ordem, current/next trail, persistência |
| `src/test/streak.test.js` | Streak/XP com fake timers: mesmo dia, dia consecutivo, gaps, meia-noite, UTC-1/UTC+1, Luanda, DST, idempotência |
| `src/test/errors.test.js` | Timeout, HTTP 500, RLS 42501, FK 23503, resposta nula, política de retry (permanente vs transitório) |
| `src/test/guard.test.jsx` | Loading, onboarding concluído, perfil migrado, utilizador novo, falha de rede |
| `src/test/backfill.test.js` | Registos antigos com `completed = null/false` e contrato de leitura |
| `src/test/auth.test.jsx` | Sessão, sincronização de perfil, loading, feedback de erro |
| `src/test/fakeSupabase.js` | Duplo em memória: RLS, FK, `PGRST116`, auth events, `link_legacy_profile` |
| `src/test/harness.js`, `src/test/setup.js` | Harness de mocks e ambiente determinístico |

**Limitações conhecidas do duplo em memória:** não valida PostgreSQL real, timezone do browser, concorrência, RLS do servidor, latência, limites HTTP nem comportamento de produção do PWA.

---

## Cobertura

- **42.64%** linhas, **71.38%** branches, 60.68% funções (relatório V8, restrito a `services/`, `contexts/`, `context/`, `hooks/`, `utils/`, `lib/`, `components/auth/`)
- Ficheiros prioritários por serem **0%** (próximo trabalho):
  `adminService.js`, `communityService.js`, `courseService.js`, `lessonService.js`, `rankingService.js`, `AdminRoute.jsx`, `ProtectedRoute.jsx`, `AuthLayout.jsx`, `LessonContext.jsx`, `InstallContext.jsx`

Comandos: `npm test`, `npm run test:coverage`.

---

## Comportamento que muda

**Em falha de rede, o guard deixa de enviar o utilizador para o onboarding.**

Antes, `completed` era um estado binário: `false` significava ao mesmo tempo "onboarding não feito" e "não foi possível verificar". Como `isAssessmentCompleted()` engolia o erro e devolvia `false`, e como o `ProgressContext` fica com `defaultProfile` (xp 0) quando a leitura do perfil falha — o que fazia `isNewUser` ser `true` — qualquer timeout, 500 ou 42501 resultava em redirecionar para `/avaliacao-perfil`, com risco de sobrescrever o `learning_profiles` de utilizadores que já tinham concluído o assessment.

Agora o guard distingue os três estados (`true` / `false` / "não foi possível verificar") e **não redireciona quando a verificação ou a leitura do perfil falharam**, nem abre o modal de assessment nesse caso.

Consequências:

- O `ProgressContext` expõe `error`, que o guard usa para não inferir "perfil vazio" de uma leitura falhada.
- O `getUserProfile` deixou de engolir erros: callers que dependiam de `null` para "não existe" foram revistos.

---

## Documentado e NÃO corrigido (decisão de produto)

1. **`getTodayKey()` usa UTC** (`userService.js`). Em Luanda (UTC+1), estudar às 00:30 grava o dia UTC anterior, pelo que o mesmo dia civil pode ser contado como dois dias de streak. Componente de demonstração em `src/test/streak.test.js`. Corrigir exige decidir qual é o "dia do utilizador".
2. **`src/utils/streak.js` é dead code** com constantes divergentes das de `userService.js` (bónus 0/25/50 vs 10/20/50; penalidade fixa de 10) e usa `new Date(\`${lastStudyDate}T00:00:00\`)`, que mistura data UTC com parser local e é vulnerável a DST.
3. **Duas escalas de nível**: `userService.getLevelFromXp()` (thresholds) vs `src/utils/xp.js:getLevelFromXp()` (1000 XP por nível), usada como fallback no `ProgressContext` quando `profile.level` é falsy. Divergem em quase toda a gama.

---

## SQL de backfill

`docs/backfill-learning-profiles-completed.sql` está incluído apenas como ficheiro. **Não foi aplicado em nenhuma base de dados.**

O script tem três blocos: um `SELECT` de diagnóstico, o `UPDATE` (que só escreve em linhas ainda não concluídas e só promove assessments com `answeredAt`) e um `SELECT` de verificação que deve devolver 0.

---

## Checklist pré-merge

- [ ] **Smoke test em staging** com um utilizador migrado que tenha as **2 linhas em `profiles`** (work profile + legacy profile ligadas por `auth_user_id`) — é o cenário dos bugs #1, #3 e #11.
- [ ] **Rever o backfill com o `SELECT` de diagnóstico em staging** antes de aplicar qualquer `UPDATE`; confirmar que `a_corrigir` corresponde ao esperado e guardar o resultado.
- [ ] **Testar manualmente o retry do guard no browser**: desligar a rede / bloquear o Supabase no DevTools e confirmar que um utilizador com assessment concluído **não** é enviado para `/avaliacao-perfil`.
- [ ] Confirmar que o backfill não é executado por nenhum job/CI.
- [ ] `npm test && npm run build && npm run lint` verdes (180/180, build OK, lint ≤ 77).