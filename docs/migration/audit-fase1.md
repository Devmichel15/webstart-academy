# Auditoria Fase 1 — Migração Firebase → Supabase (WebStart)

> **Data:** 2026-09-01 · **Branch:** `develop` · **Escopo:** análise estática do código-fonte.
> Método: leitura de todos os serviços/contextos/pages/guards, migrations SQL, scripts de
> migração e docs de migração. **Nenhuma alteração de runtime foi feita** nesta fase.
> Algumas confirmações exigem acesso ao banco/runtime (marcadas como `[PRECISA INVESTIGAÇÃO]`).

---

## 1. Resumo executivo

A migração do **frontend para Supabase está quase completa** (auth + dados). Não existe
**dual-write** no código atual: nenhum serviço de dados grava simultaneamente em Firebase e
Supabase, e nenhum serviço de dados legado (Firestore) é importado no app.

Porém, existem **4 bugs estruturais confirmados por análise de código** que explicam a
maioria dos sintomas relatados:

| # | Bug | Sintomas afetados |
|---|-----|-------------------|
| B1 | **Desalinhamento de identidade**: migration criou `profiles.id = uuidv5(firebase_uid)`, mas o app cria perfis com `id = auth.users.id` (UUID aleatório do GoTrue). Para usuários migrados, login não encontra o perfil e **cria um segundo perfil vazio**; todo o histórico fica órfão. | 1, 2, 3, 4 |
| B2 | **RLS sem policy de admin em `lesson_progress`/`quiz_completions`/`course_completions`**: admin não consegue ler progresso de outros alunos. | 3 |
| B3 | **`getUserProfile` retorna `null` em qualquer erro** e `subscribeToUser` não propaga estado de erro quando o canal não chega — telas consomem `null`/arrays vazios e exibem vazio sem mensagem. | todas |
| B4 | **Migrations 005–008 (feed/comunidade, colunas jsonb, networking) e o import da comunidade dependem de execução manual** (`supabase/RUN_THIS.sql`, `import-community.js`). Se não aplicadas no projeto alvo, feed e parte das leituras falham com erros de "relation does not exist". | 5, 6 |

Nota importante sobre o sintoma 1 e 2 ("dados continuam caindo no Firebase"): **no código
atual não existe gravação de dados de negócio no Firebase vinda do frontend**. O comportamento
observado de "aula não persiste / aluno não aparece" é causado por **falha silenciosa** (B1+B3),
não por escrita no Firestore. As únicas referências a Firebase no runtime são:
`src/firebase/firebase.js` (init), `src/services/storageService.js` (uploads — **não chamado
pela UI**) e `src/utils/seedFirestore.js` (ferramenta de seed — **não chamado pela UI**).
Cloud Functions (`functions/`) continuam 100% em Firebase e são backend (emails/notificação).

---

## 2. Arquitetura atual (leitura do código)

```text
Frontend (React/Vite)
  ├── Supabase Auth ................. email/senha + Google OAuth (authService.js)
  ├── Supabase (PostgREST) .......... profiles, lesson_progress, learning_profiles,
  │                                courses, modules, lessons, achievements,
  │                                user_achievements, community_projects, ...
  └── Firebase (apenas não-UI) ...... storageService (upload, sem chamadas na UI)
                                    seedFirestore (dev tool, sem chamadas na UI)
Backend
  └── Cloud Functions (Firebase) .... emails Brevo, listAllUsers, webhooks, triggers
                                    (NAO portadas para Edge Functions ainda)
```

### 2.1 Referências Firebase no código do app (runtime)

| Arquivo | Uso | Chamado pela UI? | Status |
|---|---|---|---|
| `src/firebase/firebase.js` | `initializeApp`, Auth, Firestore, Storage | — (apenas via abaixo) | suspenso |
| `src/services/storageService.js` | upload avatar/resources/thumbnail via Firebase Storage | **Não** (0 referências) | legado inerte |
| `src/utils/seedFirestore.js` | seed cursos/módulos/aulas/conquistas no Firestore | **Não** (0 referências) | dev tool |

### 2.2 Referências Firebase no backend / infraestrutura

| Caminho | Uso | Status |
|---|---|---|
| `functions/` (6 CFs) | emails, listAllUsers, webhooks, reactivation | **ainda em Firebase** — pendente de portar para Edge Functions |
| `firebase.json`, `firebase/*.rules`, `firebase/serviceAccountKey.json` | infra/rules | mantidos (backup) |
| `migration/`, `scripts/migration/` | export (read-only) do Firebase → Supabase | corretos, read-only para uso |

> Nenhum arquivo de serviço de dados (`src/services/*.js`) importa hoje de `firebase/*`, com
> exceção de `storageService.js`. A camada de dados é 100% Supabase.

---

## 3. Mapeamento de entidades por sintoma

Legenda: **W** = write (gravação) · **R** = read (leitura) · **Fb/Sb** = Firebase/Supabase.

### 3.1 Aulas assistidas (sintomas 1 e 3)

| Operação | Onde (arquivo:função) | Fonte |
|---|---|---|
| W | `src/services/progressService.js:completeLesson()` → `upsert` em `lesson_progress` (`user_id,lesson_id`) | Sb ✅ |
| W | `src/services/userService.js:addCompletedLesson()` → `updateUserProfile` → `profiles.completed_lessons` | Sb ✅ |
| W | `src/services/userService.js:addXpToUser / addStudyTime / updateUserStreak` → `profiles` | Sb ✅ |
| R (próprio) | `progressService.getUserProgress()` / `subscribeToUserProgress()` → `lesson_progress WHERE user_id` | Sb ✅ |
| R (admin, todos) | `adminService.getAllProgressRecords()` / `subscribeToAllProgress()` → `lesson_progress` | Sb ⛔ **RLS bloqueia** (B2) |

**Conclusão:** o ponto de escrita está correto para o Supabase. A falha vem de B1 (user_id não
existe em `profiles` para usuários migrados → FK violation em `lesson_progress` → erro dentro de
`withRetry` → `completeLesson` lança → UI mostra "Erro ao salvar progresso") e de B2 no lado do admin.

### 3.2 Novos alunos / perfis (sintoma 2)

| Operação | Onde | Fonte |
|---|---|---|
| W | `AuthContext.jsx:onAuthStateChanged` → `userService.createUserProfile()` | Sb ✅ |
| W | `userService.createUserProfile()` → `profiles.insert({ id: user.id, legacy_firebase_uid: user.id, ... })` | Sb ✅ (*ver B1*) |
| R (admin) | `adminService.getAllUsers()` / `subscribeToAllUsersMerged()` → `profiles` | Sb ✅ (com redundância) |

**Conclusão:** novos cadastros **são** gravados no Supabase (RLS `profiles_insert_self` permite
`id = auth.uid()`). Se "não aparecem" no admin, causas prováveis: (a) RLS de `profiles_select`
é `id = auth.uid() or is_public = true or is_admin()` — admin tem `profiles_admin_all`, ok;
(b) **o merge `subscribeToAllUsersMerged` chama `getAllUsers` (Supabase) duas vezes** (função
local + `fetchAllUsersFromCloudFunction` que também chama a função local) — sem erro, mas
confuso; (c) `[PRECISA INVESTIGAÇÃO]` confirmar no runtime se o admin está logado com perfil
`role='admin'` no Supabase. O canal realtime `admin-users` requer `profiles` na publicação
`supabase_realtime` (presente em 003_rls).

**B1 detalhado:** para usuários **migrados**, o `profiles.id` é `uuidv5(firebase_uid)`, mas o
`auth.users.id` do GoTrue é outro UUID. No login, `createUserProfile(user.id)` faz
`SELECT * FROM profiles WHERE id = auth.uid()` (o UUID do GoTrue) → não encontra → **insere um
perfil novo e vazio**. Historicamente o doc ficou sob o uuidv5. Isso duplica perfil, perde
progresso/XP/conquistas na tela do usuário e quebra o admin (lista perfil vazio + perfil órfão).

### 3.3 Onboarding (sintoma 4)

| Operação | Onde | Fonte |
|---|---|---|
| W (flag UX) | `src/pages/Onboarding.jsx` → `localStorage['webstart_onboarding_done']` | cliente ✋ nenhum banco |
| W (flag real) | `src/pages/PrimeirosPassos.jsx:handleStart/handleSkip` → `updateUserProfile(user.id, { firstStepsDone: true })` | Sb ✅ |
| R (guard) | `FirstStepsGuard.jsx` → `useProgress().firstStepsDone` | Sb ✅ |
| R (assessment) | `AssessmentPage`/`LearningProfileGuard` → `learningProfileService.saveFullLearningProfile()` | Sb ✅ |

**Conclusão parcial:** o carrossel `/onboarding` é puramente local (nunca persiste em banco — é
UX). O `firstStepsDone` é persistido no Supabase. **Risco real:** `ProgressContext`/`useUser`
têm a regra "se `!username`, chama `ensureUsername` e dá `return` sem `setProfile`" — numa
sessão em que o username ainda não existe, `profile` permanece no default (`firstStepsDone:
false`) → `FirstStepsGuard` força `/primeiros-passos` em loop mesmo com dados persistidos.
Somado a B1 (perfil duplicado/vazio) o onboarding parece "não persistir". `[PRECISA
INVESTIGAÇÃO]` confirmar o fluxo real no runtime (ver §6).

### 3.4 Trilhas (sintoma 5)

| Operação | Onde | Fonte |
|---|---|---|
| R | `courseService.getCourses()` → `courses` (fallback estático `src/data`) | Sb ✅ |
| R | `courseService.getModulesByCourse()` → `modules` (fallback estático) | Sb ✅ |
| R | `lessonService.getLessonsByModule/Course` → `lessons` (fallback estático) | Sb ✅ |
| R (tela) | `src/pages/Journey.jsx` → `useProgress().getTrailStatus/getCourseProgress` (dados puros do `src/data/trails.js`) | cliente ✅ |

**Conclusão:** trilhas na tela **não dependem de banco** (dados estáticos locais). "Tela em
branco" exige exceção. Candidatos: (a) `withRetry` + fallback podem mascarar, mas não quebram;
(b) se o projeto-alvo tiver a tabela `courses` (importada com 12 linhas) mas RLS/colunas
divergentes → `getCourses` lança → `.catch` retorna estático → ok; (c) **`[PRECISA
INVESTIGAÇÃO]`**: verificar erros no console/network do runtime (ex.: PGRST ou erro 401 se a
tabela não existir → o fallback estático deveria segurar). Se a tela está em branco mesmo com
fallback, o problema é em `Journey.jsx`/`useProgress` (depende de `progressRecords`/`profile`,
via B3). Recomenda-se reproduzir no runtime antes de alterar.

### 3.5 Feed (sintoma 6)

| Operação | Onde | Fonte |
|---|---|---|
| R | `communityService.getProjectsFeed()` → `community_projects` | Sb ✅ |
| R | `communityService.hydrateAuthors()` → `profiles` | Sb ✅ |
| W | `communityService.createProject/toggleLike/addComment` | Sb ✅ |
| Infra | **`community_projects`/`project_likes`/`project_comments` criadas em `005_community_feed.sql`** (replicado em `RUN_THIS.sql`) | ⚠ depende de execução |

**Conclusão:** todo o feed depende das tabelas `005` e do **import de dados da comunidade**
(`migration/import-community.js`), que copiam do Firestore. **Se o `RUN_THIS.sql` não rodou no
projeto-alvo ou o import não foi feito, o feed retorna "relation does not exist" (erro em
`getProjectsFeed`, propagado como erro de tela) e fica vazio** — sintoma 6. Além disso, a RLS
`cp_select` exige `auth.uid() is not null`: anônimos não veem o feed (comportamento esperado).

---

## 4. Mecanismo de "dual write"

**Não existe dual-write.** Não há feature flag `VITE_DATA_BACKEND` implementada (o plano
`migration-plan.md` §6 previa `VITE_DATA_BACKEND=firebase|supabase`, mas o adapter nunca foi
implementado — os services já apontam direto para Supabase). Não há fallback silencioso para
Firebase nos services de dados.

O que pode dar a impressão de "gravar no Firebase":
- Cloud Functions ainda rodam no Firebase (emails, `listAllUsers`) e leem/gravam Firestore
  (`users`): mudanças de `emailPreferences`/`welcomeEmailSent` feitas no Supabase **não** são
  vistas pelas CFs (R6 do plano) — e vice-versa. Não afeta aulas/alunos.
- `storageService` (Firebase Storage) seria chamado se a UI ganhasse upload, mas hoje não é
  referenciado.

---

## 5. Análise RLS (Supabase)

Fonte: `supabase/migrations/003_rls.sql` (+ políticas da comunidade em `005`/`RUN_THIS.sql`).

| Tabela | Policy aplicável | Problema |
|---|---|---|
| `profiles` | select: dono \| `is_public` \| admin; insert/update: dono; admin: tudo | ok |
| `lesson_progress` | **apenas `progress_own` (`user_id = auth.uid()`)** | ⛔ **admin não lê progresso de outros** (B2) |
| `quiz_completions` | `quiz_own` | ⛔ idem |
| `course_completions` | `ccourse_own` | ⛔ idem |
| `user_achievements` | select: dono ou perfil público; insert: dono | ⛔ admin não lê todos (parcial) |
| `courses/modules/lessons/achievements` | read público (anon+authenticated) | ok |
| `learning_profiles` | `learning_own` (dono) | ok p/ próprio; **admin?** (admin não é previsto) |
| `community_projects` | cp_select/cp_insert/cp_update/cp_delete (autor) | ok; admin não gerencia projetos alheios |
| `project_likes` | pl_select/pl_insert/pl_delete | ok |
| `project_comments` | pc_select/pc_insert/pc_update/pc_delete | ok (admin tem delete) |
| `firebase_id_mapping`, `xp_transactions`, `email_events` | sem policies (negado p/ client) | ok |

**Correções necessárias (Fase 2):** adicionar policies de admin (SELECT — e onde fizer sentido
WRITE) para `lesson_progress`, `quiz_completions`, `course_completions`, `user_achievements`,
`learning_profiles` (o painel admin consome progresso agregado). Sem isso o painel do admin fica
com dados vazios/falsos (sintoma 3).

---

## 6. Mapeamento de identidade Firebase → Supabase (B1 — causador nº 1)

| Etapa | Quem escreveu o `id` | Resultado |
|---|---|---|
| Migration (transform-data.mjs:96) | `profiles.id = uuidv5(NS, firebase_uid)`; `legacy_firebase_uid = firebase_uid` | 81 perfis com id determinístico |
| Plano (database-schema.md §2, migration-plan §7) | deveria criar `auth.users` **com o mesmo uuid** via Admin API (migration `010_identity_link`) | **não existe** no repositório |
| App atual (authService + AuthContext + userService.createUserProfile) | `signUp`/`signInWithPassword` → GoTrue gera `auth.users.id` **aleatório**; `profiles.id = auth.uid()`; `legacy_firebase_uid = auth.uid()` | **desalinhado** |

Consequências concretas:
1. Usuário migrado loga → `createUserProfile(goTrueUuid)` não acha `profiles` → **cria perfil
   vazio** → perde XP/progresso/conquistas na UI (sintomas 1, 3, 4).
2. `lesson_progress` dos migrados fica sob o uuidv5; novo progresso sob outro → dois conjuntos.
3. Novo cadastro (pós-cutover) → perfil `id = goTrueUuid` funciona isoladamente, MAS:
   - `legacy_firebase_uid = goTrueUuid` (valor falso — não é um UID no Firebase), o que
     polui qualquer re-conciliação futura com Firebase;
   - o mesmo documento **também poderia existir** no Firebase se o signup ocorrer também lá
     (fluxos antigos) → duplicidade entre as duas pontas (por isso "novos alunos não aparecem"
     pode parecer questão de sync).
4. O `cutover.js` (migration/cutover.js) cria perfis `id = auth.uid()` para quem não tem — mas
   não resolve a **re-ligação** do histórico uuidv5 existente aos `auth.users` atuais.

**Impacto no Suporte a relaçõo admin→aluno:** RLS compara `id = auth.uid()`; para o admin isso
funciona apenas se o perfil do admin existe sob o mesmo id (funciona para admins criados depois
do cutover; quebra para admins migrados que ganham perfil duplicado).

**Decisão humana necessária (Fase 2 pré-req):** escolher a estratégia de identidade:
- **(i) Re-link**: mapear cada `auth.users` atual (por email/provedor) ao perfil uuidv5 migrado,
  atualizar `auth.users.id` **não é possível** (GoTrue não permite renomear id) → alternativa:
  adicionar coluna `auth_user_id` (ou usar `email` como join) e **unificar leituras/escritas
  através dela**. Grande refactor.
- **(ii) Manter `legacy_firebase_uid` como ponte**: em `profiles`, popular
  `legacy_firebase_uid = firebase_uid` real para perfis migrados; nas escritas/leituras de
  progresso usar o **id do perfil correto** resolvido no login (buscar por `email` primeiro,
  depois por `id`) e **migrar** o histórico uuidv5 → novo id, marcando a origem em
  `firebase_id_mapping`.
- **(iii) Novo contrato (recomendado a longo prazo)**: como o Firebase ainda é fonte de backup,
  manter Firebase Auth como **fonte de identidade da transição**, com
  `VITE_DATA_BACKEND`/camada de adapter real (conforme planejado), e só depois fazer o link de
  `auth.users`.

Sem esta decisão, qualquer correção pontual (ex.: só arrumar RLS) deixará os sintomas 1–4
parciais.

---

## 7. Outras observações de código (riscos/qualidade)

1. **`ProgressContext`/`useUser` — early-return sem `setProfile` quando `!username`**
   (`ProgressContext.jsx:75-78`): em boot com perfil sem `username`, o estado permanece default
   → guards (`FirstStepsGuard`, `LearningProfileGuard`) tomam decisões erradas (loop em
   `/primeiros-passos`; modal de avaliação repetido). Sobre B3.
2. **`getUserProfile` engole erros** (`userService.js:125-127`): `if (error || !data) return null`.
   Todos os fluxos derivam disso silenciosamente (XP, streak, completedLessons, assessment).
3. **`updateUserProfile` usa `upsert({ onConflict: 'id' })` com `id = uid`** —
   `profiles_insert_self` `with check (id = auth.uid())` cobre o upsert; ok, mas só se o uid for
   o id do perfil certo (ver B1).
4. **`adminService.fetchAllUsersFromCloudFunction`** (`adminService.js:49-56`) chama a função
   local `getAllUsers()` (Supabase), **não** a Cloud Function Firebase. `subscribeToAllUsersMerged`
   junta a mesma fonte duas vezes. Não quebra, mas abre espaço para confusão ("fonte mista").
5. **`lessonService.getLessonById`** devolve estático se `data` vazio; ok. Se a tabela `lessons`
   existe mas o módulo/curso do estático não, `mapLessonRow` depende de colunas que existem.
6. **Feed `getProjectsFeed`** usa cursor por `created_at` (não `id`): com timestamps iguais há
   risco de pular/duplicar página. Baixa prioridade.
7. **`functions/` CFs ainda escrevem em Firestore** (`users`, `emailEvents`). Pós-cutover do
   app, `syncAuthUser` (welcome email) e `sendReactivationEmails` ficam cegas às novidades do
   Supabase (R6) — decisão pendente do plano (§10, recomendação portar welcome/reactivation antes).

---

## 8. Matriz tabela/coleção — mapeamento e status

| Firebase (coleção) | Supabase (tabela) | Status migração | Status app |
|---|---|---|---|
| `users` | `profiles` | ✅ 81/81 (validado) | ⚠ B1 quebra vínculo id para usuários migrados |
| `user_progress` | `lesson_progress` | ✅ 354/354 | ⛔ RLS admin (B2) |
| `learning_profiles` | `learning_profiles` | ✅ 0 (vazio no backup) | ✅ escritas novas ok |
| `courses` | `courses` | ✅ 12/12 | ✅ leitura+fallback |
| `modules` | `modules` | ✅ 56/56 (inclui 9 legados) | ✅ |
| `lessons` | `lessons` | ✅ 295/295 (inclui 18 legados) | ✅ |
| `achievements` | `achievements` | ✅ 12/12 | ✅ |
| `user_achievements` | `user_achievements` | ✅ 188/188 | ⚠ admin select parcial |
| `quiz completions` (embedded) | `quiz_completions` | ✅ 0 | ✅ |
| `course completions` (embedded) | `course_completions` | ✅ 13/13 | ✅ |
| `emailPreferences` (embedded) | `email_preferences` | ✅ 81/81 | ✅ |
| `emailEvents` | `email_events` | (vazio) | ✅ (CFs ainda em Firebase) |
| `announcements` | `announcements` | ✅ 1/1 | ✅ |
| — (mapeamento) | `firebase_id_mapping` | ✅ 269/269 | é só auditoria |
| `community_projects` | `community_projects` | ⚠ depende do `import-community.js` | ⚠ depende da migration 005 (B4) |
| `community_likes` | `project_likes` | ⚠ idem | ⚠ idem |
| `community_comments` | `project_comments` | ⚠ idem | ⚠ idem |
| `auth/users` | `auth.users` | ⚠ **pendente** (plano §7 falhou) | ⛔ **B1** |

---

## 9. Correlação sintoma → causa raiz → confiança

| Sintoma | Causa raiz mais provável | Confiança |
|---|---|---|
| 1. Aulas assistidas não persistem | B1 (user_id inexistente para migrados → FK fail) + B3 (erro engolido) | Alta (código) |
| 2. Novos alunos não aparecem | B1 p/ migrados; para novos, funcionalidade ok; admin depende de `profiles` carregados + realtime. Ambiguidade (Firebase vs Supabase) precisa do runtime para fechar. | Média (runtime) |
| 3. Admin vê aulas assistidas erradas/outros alunos | **B2** (RLS sem policy admin) — certo por código | Muito alta |
| 4. Onboarding não persiste | B1 (perfil duplicado) + early-return `ProgressContext` + carrossel é só localStorage | Alta (código) |
| 5. Trilhas não carregam | Não é banco (estático). Provável B3 (progress/profile) ou exceção em `useProgress`. | Média (runtime) |
| 6. Feed não carrega | **B4** (migration 005 / import comunidade não aplicadas no destino) ou RLS de autenticação | Média-Alta (runtime) |

---

## 10. Pendências que exigem decisão humana (antes/junto da Fase 2)

1. **[DECISÃO] Estratégia de identidade** para usuários migrados (re-link via email,
   `legacy_firebase_uid` como ponte, ou voltar `VITE_DATA_BACKEND=firebase` numa fase de
   transição com adapter real). Sem isso B1 não é corrigível com segurança.
2. **[DECISÃO] RLS admin**: permitir SELECT (e opcionalmente WRITE) do admin nas tabelas de
   progresso/conquistas/perfil de aprendizagem é requisito do painel; precisa aprovação por
   expandir superfície de leitura dos admins.
3. **[DECISÃO] Dados da comunidade**: confirmar se `community_*` deve vir do Firestore
   (rodar `import-community.js`) ou nascer vazia — hoje `005/RUN_THIS.sql` cria a estrutura mas
   nenhum dado. Confirmar se o app deve ler anônimo (landing) ou só autenticado.
4. **[DECISÃO] CFs**: portar (pelo menos) welcome email + reativação para Edge Functions antes
   do descomissionamento, para não ficarem cegas (recomendação do próprio plano).
5. **[VERIFICAÇÃO] Runtime**: aplicar migrations 001–008 no projeto alvo e confirmar que o feed,
   trilhas e cadastro respondem (2 minutos de console/network suficientes). Necessário acesso a
   credenciais ou ao dashboard — não tenho acesso a partir deste ambiente.

---

## 11. Recomendações para Fase 2 (em ordem de dependência)

1. Resolver **identidade (B1)** conforme decisão humana (§10.1); no mínimo, adicionar coluna de
   vínculo e resolver o perfil correto por email no `createUserProfile`.
2. Corrigir **RLS admin (B2)** com migration nova (`009_admin_rls.sql`).
3. Corrigir **silenciamento de erros (B3)**: `getUserProfile` deve lançar/registrar erro em vez de
   retornar null; `ProgressContext` deve setar profile mesmo sem username (resolver username sem
   early-return).
4. Garantir **aplicação das migrations 005–008** + **import da comunidade** no destino, e
   documentar execução (B4).
5. **Script de backfill delta**: copiar do Firebase o que foi criado/alterado **após** a data de
   export da migração original (aulas assistidas novas, perfis novos, onboarding) com validação
   de contagem — regra "copy + validate", nunca destrutivo.
6. Ajustar `legacy_firebase_uid` para guardar o UID real do Firebase quando aplicável (novos
   cadastros não têm UID Firebase — deixar null/não setar).

---

*Fim do relatório da Fase 1. Nenhum arquivo de runtime foi alterado nesta fase.*