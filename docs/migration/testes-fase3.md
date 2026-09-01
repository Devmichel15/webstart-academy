# WebStart Academy — Fase 3: Relatório de Testes e Correções

Data: 2026-09-01 · Branch: `develop`
Relacionado a: `docs/migration/audit-fase1.md` (causas B1–B4)

---

## Resumo executivo

- **Build de produção:** ✅ `npm run build` → `✓ built in 4.61s` (2833 módulos transformados).
- **Lint dos arquivos alterados:** ✅ nenhum erro novo introduzido; erros/avisos restantes são pré-existentes do working tree (ver §5).
- **Ambiente sem credenciais/dashboard ao vivo:** testes de runtime (login como usuário migrado, painel admin, feed) ficam **PENDENTES DE EXECUÇÃO MANUAL** no ambiente com acesso ao Supabase/Firebase (§4).

## 1. O que mudou (Fase 2)

| Causa | Mudança | Arquivo |
|---|---|---|
| B1 | Migration de identidade: coluna `profiles.auth_user_id`, relaxa `legacy_firebase_uid` (aceita NULL p/ novos cadastros), tabela `identity_links` (auditoria), função `link_legacy_profile` (copy+validate, idempotente, nunca destrutiva) | `supabase/migrations/009_identity_link.sql` |
| B1 | `createUserProfile` tenta re-link via RPC antes de criar perfil vazio; `legacy_firebase_uid` só preenchido quando há vinculo real com Firebase (antes gravava `user.id` — causa raiz da duplicação) | `src/services/userService.js` |
| B1 | Backfill server-side de todos os auth.users (dry-run por padrão) | `scripts/migration/relink-identities.mjs` |
| B2 | Policies RLS de admin (`all`) em `lesson_progress`, `quiz_completions`, `course_completions`, `user_achievements`; `select` admin em `learning_profiles` e `email_preferences` | `009_identity_link.sql` |
| B2 | `subscribeToAllUsersMerged` deixa de mesclar a mesma fonte Supabase duas vezes ("fonte mista") | `src/services/adminService.js` |
| B3 | `getUserProfile` loga o erro (não retorna `null` silencioso); `ProgressContext` não faz mais early-return sem `setProfile` (quebra o loop do `FirstStepsGuard`) | `userService.js`, `src/contexts/ProgressContext.jsx` |
| B4 | Aplicação idempotente das migrations 005–009 (detecta aplicação manual prévia via tabela-guarda) | `scripts/migration/apply-pending.mjs` |
| B4 | Backfill delta Firebase→Supabase por presença (copy+validate, só o que não existe no destino; pendências por falta de perfil são reportadas) | `scripts/migration/import-delta.mjs` |

Consequência (working tree já em remoção da feature achievements/share):
- `ProgressContext`/`Profile`/`Dashboard` referências órfãs ao sistema removido (build quebrava) foram limpas para deixar o app consistente.

## 2. Verificação estática (executado aqui)

- `npm run build` — ✅ sucesso (prod, código mantém 0 erros).
- `node --check` em `apply-pending.mjs`, `relink-identities.mjs`, `import-delta.mjs`, `userService.js` — ✅ OK.
- `npx eslint` em `userService.js`, `adminService.js` — ✅ 0 problemas.
- `npx eslint` em `ProgressContext.jsx`, `Profile.jsx`, `Dashboard.jsx` — 2 erros **pré-existentes** (não introduzidos nesta correção): `react-hooks/set-state-in-effect` e `useOutletContext` após early-return em `Dashboard`. Avisos de deps do `react-hooks/exhaustive-deps` também pré-existentes.

## 3. Checklist por causa (estado)

### B1 — Identidade / histórico órfão
- [x] Migration `009` idempotente (coluna, índice único em `auth_user_id`, auditoria, RPC).
- [x] Estratégia conforme decisão: `legacy_firebase_uid` = chave join autoritativa; fallback por email normalizado com auditoria em `identity_links`; **não** usa email como única chave nem regride para Firebase Auth.
- [x] `createUserProfile` resolve por `legacy_firebase_uid` (sessão/metadata) → fallback email → grava `auth_user_id = auth.uid()`.
- [x] Script `relink-identities.mjs` (dry-run default) para o backfill em massa.
- [ ] **PENDENTE (manual):** aplicar `009` no destino e rodar `relink-identities.mjs --run`; confirmar no relatório `migration/reports/relink-report.json` que `linked + linked_email` correspondem aos usuários migrados.

### B2 — Admin não lê progresso de alunos
- [x] Policies admin em todas as tabelas de progresso (RLS continua negando a não-admins).
- [ ] **PENDENTE (manual):** entrar como admin e abrir Dashboard/Users/Analytics; conferir que a lista de alunos e o painel carregam progresso de terceiros (antes retornavam vazio).

### B3 — Erros silenciosos
- [x] `getUserProfile` loga erro; `ProgressContext` sempre aplica `setProfile` mesmo sem username.
- [ ] **PENDENTE (manual):** logar como usuário migrado cujo perfil ainda está vazio e conferir que (a) não há loop de redirect/carrega, (b) username é gerado, (c) o histórico aparece após o re-link.

### B4 — Migrations 005–008 e import pendentes
- [x] `apply-pending.mjs` aplica 005→009 com registros em `schema_migrations` e guardas de aplicação manual.
- [x] `import-delta.mjs` sincroniza progresso/conquistas criados DEPOIS do import (não-destrutivo).
- [ ] **PENDENTE (manual):** `node scripts/migration/apply-pending.mjs` no destino; `export-firestore.mjs` → `import-delta.mjs --run`; validar feed (005) e contagens.

## 4. Plano de execução manual sugerido (ambiente com credenciais)

1. `node scripts/migration/apply-pending.mjs`
   - Esperado: `✓ 005...` .. `✓ 009...`; re-rodar → todos `↷ skip`.
2. `node scripts/migration/relink-identities.mjs` → revisar dry-run → `--run --limit 10` (fumada) → `--run`.
   - Esperado: `linked` ≈ usuários do Firebase com histórico; `no_legacy` ≈ novos.
3. `node scripts/migration/export-firestore.mjs` → `node scripts/migration/import-delta.mjs` (dry-run) → `--run`.
4. Teste de login (browser): usuário migrado → perfil preenchido, aulas assistidas no dashboard, sem redirect em loop.
5. Admin: Dashboard/Users/Analytics carregam dados de todos os alunos.
6. Feed: posts/likes/comentários visíveis.

## 5. Pendências pré-existentes (fora do escopo desta correção)

- `Dashboard.jsx`: `useOutletContext()` após retorno cedo (hooks rules) — origem anterior a esta correção.
- Avisos `exhaustive-deps`/`set-state-in-effect`/chunk size no build — não introduzidos aqui.
- Working tree continha refatoração inacabada (remoção de achievements/PlayerCard/PublicProfile) que quebrava o build; esta correção convergiu o código para o estado consistente, mas a decisão de remover a feature é do dono do repo.

## 6. Decisões que ainda dependem de aprovação humana

1. Ordem de deploy: migration 009 + relink antes de liberar login aos usuários migrados (evita novo perfil vazio).
2. Incluir também como candidatos a re-link os usuários com perfil novo já ativo (email bate) — a função cobre pela via segurança (`where xp=0` protege overwrite; histórico é anexado).
3. Confirmação da remoção permanente da feature de achievements/share (arquivos já deletados no working tree).