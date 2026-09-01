# Status do Dual-Backend (estratégia híbrida / "strangler fig")

> Documento de rastreio da fase temporária em que **escrita é 100% Supabase**
> e a **leitura** faz merge do histórico que ainda só existe no Firebase.
> Atualizar a cada alteração de modo/entidade. Objetivo final: desligar o leitor
> legado e voltar a 100% Supabase.

Branch de trabalho: `feat/hybrid-read-merge` (a partir de `develop`).
Criado em: 2026-09-01.

---

## 1. Regra do jogo (aprovado)

| Regra | Como está garantida |
|---|---|
| Nunca escrever dado novo no Firebase | Runtime não contém NENHUM import de `firebase/*` (verificado por grep). `src/utils/seedFirestore.js` e `src/services/storageService.js` (único código com escrita Firestore) foram **removidos**. `src/firebase/firebase.js` permanece SÓ como base do leitor legado opcional (dynamic import, nunca no bundle principal). |
| Nunca apagar dado no Firebase | Nenhum delete de coleção legada no código. `functions/` (admin SDK, servidor) intocado. |
| Leitura legada centralizada | Toda leitura de Firestore passa por `src/lib/data/legacyMerge.js`. Nenhuma tela importa Firebase diretamente. |
| Join por identidade, não por email | `profiles.legacy_firebase_uid` = UID Firebase original (string), chave autoritativa. No leitor de servidor, o `legacy_firebase_uid` é resolvido a partir de `auth.uid()` no banco — nunca recebido por email do cliente. |
| Não usar a camada de merge para "resolver" bug que não é de dados | Causas-raiz de trilhas/feed documentadas na seção 3 (não foram "resolvidas" com merge). |

## 2. Entidades e modos de leitura

| Entidade | Modo | Fonte primária (Supabase) | Fonte legada (Firestore) | Observações |
|---|---|---|---|---|
| `lesson_progress` / aulas assistidas | **merge** | `profiles.completed_lessons` + `lesson_progress` | `users/{uid}.completedLessons` | Uniões apenas em memória; sem backfill no cliente. |
| `course_completions` | **merge** | `profiles.completed_courses` | `users/{uid}.completedCourses` | Idem. |
| `quiz_completions` | **merge** | `profiles.completed_quizzes` | `users/{uid}.completedQuizzes` | Idem. |
| `learning_profiles` (avaliação/onboarding) | **supabase-only** | `learning_profiles` | — (coleção inexistente no backup — `transform-data.mjs` emite arquivo vazio) | Avaliação é 100% do novo app; sem dados legados a fundir. |
| `profiles` (cadastro/identidade) | **supabase-only** | `profiles` | fonte histórica (não viva) | Re-link feito por `link_legacy_profile`; não se lê perfil do Firestore. |
| Feed (`community_projects`) | **supabase-only** | `community_projects` | — | Feed sempre foi Supabase no runtime. |
| `user_achievements` | **supabase-only** | `user_achievements` | `user_achievements` | Migrado 1:1; sem merge. |
| `email_preferences` | **supabase-only** | `email_preferences` | `users/{uid}.emailPreferences` | Migrado; sem merge. |

Registro no código: `MERGE_MODES` em `src/lib/data/legacyMerge.js`.

## 3. Causas-raiz investigadas (NÃO "resolvidas" via merge)

### 3.1 Feed — bug real de código (corrigido)
- **Sintoma:** "load more" do feed duplicava os mesmos projetos e nunca avançava.
- **Causa:** `src/services/communityService.js` paginava keyset com `.gt('created_at', cursor)` sobre ordenação `created_at DESC`. Para ordem descrescente o cursor deve apontar para **antes** do último (`lt`), não para depois (`gt`).
- **Correção:** `lt('created_at', cursor)` para modo `recent`; para `popular` (ordenação composta `like_count DESC, created_at DESC`) o cursor agora é `{ createdAt, likeCount }` com filtro `or(and(like_count.eq.C, created_at.lt.T), like_count.lt.C)`.
- **Relação com migração:** nenhuma — era bug de query, independente de dados.

### 3.2 Trilhas — sintoma que NÃO é de render (progresso), duas fontes a reconciliar
- **Render:** trilhas vêm de dados estáticos (`src/data/trails.js`) e sempre carregam; não há bug de carregamento.
- **Progresso:** tudo (status de trilha, %, jornada) deriva de `profiles.completed_lessons` / `completed_courses` / `completed_quizzes` (JSONB em `profiles`). *Dois riscos:*
  1. **Gap de histórico legado** (Firestore-only) → coberto temporariamente pelo **merge** (item 2). Não é bug de código.
  2. **Desync Supabase interno**: `lesson_progress` (linhas) vs `profiles.completed_lessons` (JSONB). `completeLesson` grava ambos, mas imports/backfills (p. ex. `import-delta`) podem gravar só um lado. **Ação (scripts, não cliente):** rodar reconsiliação — ver seção 5 (item de verificação). Enquanto pendente, o merge usa `profiles.completed_*` como base e NÃO corrige esse desync.

### 3.3 Constraint de leitura no browser (importante)
- `firebase/firestore.rules`: `users/{userId}` legível apenas com `request.auth` **do Firebase Auth** (`request.auth.uid == userId`) ou `isAdmin()` (que também exige Firebase Auth).
- O app novo autentica com **Supabase Auth** → não existe `request.auth` no Firebase → leitura SDK no browser é **negada** e degrada silenciosamente.
- **Caminho operável:** leitor servidor. Já criado `supabase/functions/legacy-read/index.ts` (firebase-admin com `FIREBASE_SERVICE_ACCOUNT`); no cliente, ativar `VITE_LEGACY_READ_URL` + `setLegacyReader` da camada. **Aguardando deploy + env para ficar funcional.**

## 4. Volume estimado pendente

> ⚠ Princípio: não assumir. Medir antes de declarar concluído.

- **Pendente de medição** (sem acesso a banco/live neste ambiente):
  1. Contar Firestore `users` com `completedLessons/completedCourses/completedQuizzes` não vazios.
  2. Rodar `scripts/migration/import-delta.mjs` em **dry-run** e ver quantos registos faltam p/ Supabase.
  3. Rodar `scripts/migration/relink-identities.mjs` em dry-run para conferir vínculos sem `identity_links`.
- Registo do resultado: preencher a tabela abaixo quando medido (comando + contagem + data).

| Medição | Comando | Pendente | Data |
|---|---|---|---|
| Usuários Firestore com histórico | `probe-rules-live.mjs` / admin SDK query | TBD | — |
| Deltas lessons não no Supabase | `node scripts/migration/import-delta.mjs` (dry-run) | TBD | — |
| Re-links ausentes | `node scripts/migration/relink-identities.mjs` (dry-run) | TBD | — |
| Desync lesson_progress vs completed_lessons | SQL (seção 5) | TBD | — |

## 5. Prazo & critérios de saída (deadline)

**Prazo proposto para o modo híbrido:** **4 semanas** após o deploy do leitor servidor
(a confirmar pelo dono do produto). Reavaliar semanalmente no `docs/migration/`.

**Critérios de saída (desligar merge):**
1. `import-delta.mjs --run` (com limite por lote) zera os deltas em dry-run posterior = 0.
2. Reconsiliação `lesson_progress` ↔ `profiles.completed_*` converge (SQL abaixo sem pendências):
   ```sql
   select count(*) as desync
   from public.profiles p
   where exists (
     select 1 from public.lesson_progress lp
     where lp.user_id = p.id
       and not lp.lesson_id = any (coalesce(p.completed_lessons::text[], '{}'::text[]))
   );
   ```
3. Testes da Fase 3 (ver `testes-fase3-hybrid.md`) aprovados com `VITE_ENABLE_FIREBASE_LEGACY_READ=false`.
4. `grep -r "firebase" src/services src/contexts src/pages` retorna apenas o leitor legado desligável.
5. Remover (ou deixar documentado como removível) `src/firebase/firebase.js`, `src/lib/data/legacyMerge.js` e `supabase/functions/legacy-read/`.

**Ao sair:** configurar `VITE_ENABLE_FIREBASE_LEGACY_READ=false`, apontar `VITE_LEGACY_READ_URL` vazio, remover código leitor, e re-rodar o build.

## 6. Plano de ação pendente

- [ ] Deploy da função `legacy-read` + `supabase secrets set FIREBASE_SERVICE_ACCOUNT`.
- [ ] Setar `VITE_LEGACY_READ_URL=...` no ambiente (`.env` local / Vercel).
- [ ] Medir volume (seção 4) e preencher tabela.
- [ ] Reconciliar desync `lesson_progress` vs `profiles.completed_*`.
- [ ] Decidir se o admin também lê legado (leitura N+1 por usuário no cliente é inviável; recomendado backfill completo + relatório).
- [ ] Confirmar prazo/critérios de saída com o dono do produto.