# Testes Fase 3 — Estratégia Híbrida (legacy read + merge)

> Checklist de validação manual/automática da fase híbrida no branch
> `feat/hybrid-read-merge`. Executar com `.env` contendo `VITE_ENABLE_FIREBASE_LEGACY_READ=true`.
> Itens assinalados `[ ]` são passos de execução; `[x]` = cumprido.

Pré-requisitos:
- [ ] `supabase functions deploy legacy-read` concluído e `VITE_LEGACY_READ_URL` setado.
- [ ] Dois usuários de teste: (A) legado com histórico Firebase; (B) novo cadastro Supabase puro.

---

## F.3.1 Leitura de usuário com histórico misto

- [ ] Login do usuário A (legado).
- [ ] Jornada/trilhas: aulas concluídas no Firebase aparecem como concluídas (sem duplicar as já migradas).
- [ ] `profiles.completed_lessons` JSJBSN não é alterado pelo merge (leitura só em memória). Confirmar que não há `update` à tabela `profiles` disparado pelo merge.
- [ ] Nenhuma duplicação: união é um Set (IDs únicos).
- [ ] Fallback: com `VITE_LEGACY_READ_URL` vazio/inválido, o app continua carregando normalmente (degrade silencioso) — console.warn `[legacyMerge]`.

## F.3.2 Visão admin

- [ ] Admin vê dados agregados de alunos sem travar/crescer leitura N+1 para Firebase (limitação documentada).
- [ ] Se o admin abrir o perfil de um usuário legado, o histórico de aulas assistidas inclui o legado (via mesmo `legacyMerge.mergeCompletions`), sem duplicar.

## F.3.3 Onboarding / avaliação (supabase-only)

- [ ] Novo usuário B completa avaliação (`learning_profiles`).
- [ ] Ao fechar e reabrir o app, avaliação permanece concluída (nada vem do Firebase).
- [ ] `learning_profiles` continua registrado com `source` correto; nenhuma escrita ao Firebase em todo o fluxo.

## F.3.4 Trilhas para perfis diferentes

- [ ] Usuário A (legado): trilhas refletem histórico legado + migrado (unido).
- [ ] Usuário B (novo): trilhas zeradas, mudam ao completar aulas.
- [ ] `computeTrailStatus`/progresso percentuais coerentes (sem aula "concluída" fantasma de outro usuário).

## F.3.5 Feed

- [ ] Primeira página carrega sem erro.
- [ ] "Carregar mais": paga para páginas seguintes **sem duplicar** (regressão da correção `.lt` / cursor composto).
- [ ] Ordenação "Populares": paginação composta por `like_count` + `created_at` avança corretamente com empates.

## F.3.6 Cadastro de novo aluno (escrita 100% Supabase)

- [ ] Novo cadastro: `profiles.legacy_firebase_uid = NULL`, `auth_user_id = NULL`.
- [ ] Não gera perfil duplicado (regressão B1).
- [ ] `identity_links` não recebe linha nova para cadastro puro.
- [ ] Grep de escrita Firebase no runtime: `rg "firebase/firestore|writeBatch|setDoc|addDoc|updateDoc" src/` → sem ocorrências fora do leitor legado permitido.

## F.3.7 Build & lint

- [ ] `npm run build` termina em OK.
- [ ] `npm run lint` sem novos erros (erros pré-existentes conhecidos: set-state-em-effect em ProgressContext e `useOutletContext` pós early-return em Dashboard.jsx).
- [ ] Bundle não importa Firebase no chunk principal (dynamic import apenas no leitor legado).

## F.3.8 Data integrity (pós-teste)

- [ ] `import-delta.mjs` dry-run = 0 pendências (critério de saída).
- [ ] SQL de desync (`lesson_progress` vs `completed_*`) = 0 pendências.
- [ ] Registro de leitura: `legacyMerge.getMergeStats()` mostra `reads/cacheHits/errors` sem erros anómalos.

---
Resultado final: preencher data e assinalar todos os itens antes de desligar o merge (`VITE_ENABLE_FIREBASE_LEGACY_READ=false`).