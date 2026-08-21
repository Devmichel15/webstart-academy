# Relatório de Backup — ETAPA 2 (Firebase → arquivos locais)

> Executado em modo **100% READ-ONLY** (`scripts/migration/export-firestore.mjs`).
> Operações utilizadas: `listCollections`, `collection.get()`, `doc.listCollections()`,
> `auth.listUsers()`, `bucket.getFiles()`. Nenhuma escrita, atualização ou exclusão.
> Backups em `migration/backups/firebase/` (gitignored) · hashes sha256 em `_manifest.json`.

---

## 1. Collections encontradas (descoberta dinâmica, sem nomes pré-assumidos)

| Collection | Documentos | Observações |
|---|---|---|
| `users` | **81** | doc ID = Firebase UID |
| `user_progress` | **354** | doc ID = `{uid}_{lessonId}` |
| `user_achievements` | **188** | doc ID = `{uid}_{achievementId}` |
| `announcements` | **1** | ⚠ entidade NÃO referenciada por src/ ou functions/ no código auditado — log de campanha de email (`scripts/announceCssVideo.js`) |

**Não existem** collections de conteúdo (`courses`, `modules`, `lessons`, `achievements`),
nem `learning_profiles`, nem `emailEvents` neste projeto Firestore. O catálogo educacional
vivo de fato é o **estático em código** (`src/data/**`). O fallback do app já cobre isso;
impacto: import fica menor e a modelagem de conteúdo deve nascer das fontes estáticas.

## 2. Subcollections

Nenhuma detectada (amostragem de até 20 docs por collection). Modelo é flat — bom para
a modelagem relacional.

## 3. Firebase Auth

| Métrica | Valor |
|---|---|
| Usuários Auth | **81** |
| Providers | `google.com`: 47 · `password` (email/senha): 34 |
| Email verificado | 47 (= todos os Google; nenhum email/senha verificado) |
| Desabilitados | 0 |
| Órfãos auth→Firestore | **0** |
| Órfãos Firestore→auth | **0** |

## 4. Firestore `users` (perfil)

- role: 80 student · 1 admin
- provider (doc): google 44 · email 37
- `isPublic`: true nos 81 (campo sempre presente)
- `firstStepsDone`: true 50 · false 4 · **ausente 27** (backfill necessário no transform)
- email vazio: 0 · sem username: 0
- XP total 83.665 · máx 11.585
- Campos novos descobertos (não estavam na auditoria estática):
  - `certificates`: presente em 40 docs, **sempre array vazio**
  - `isPremium`: presente em 25 docs, todos `false`
  - `purchasedCourses`: presente em 25 docs, todos vazios
  → feature de monetização preparada mas inativa. Schema incluirá as colunas por paridade.

### Reconciliação `completedLessons[]` (array) ↔ `user_progress` (coleção)

| Origem | Registros |
|---|---|
| Em ambas | 354 |
| Só no array | 0 |
| Só na coleção | 0 |

Divergência real: **zero** (risco R4 encerrado com dado, não com suposição).

### Outros arrays

- `completedQuizzes[]`: campo presente em 42 docs, **todos vazios** (quizzes não foram usados)
- `completedCourses[]`: 12 usuários, cursos `fundamentos-web`, `html-exercises`
- `user_progress` referencia cursos: fundamentos-web, html, html-exercises, javascript, css, php

## 5. Storage

Bucket não existe (`The specified bucket does not exist`) mesmo testando os três padrões de
nome. **Firebase Storage nunca foi provisionado/uso zero** — migração de arquivos: nada a fazer.

## 6. Cloud Functions encontradas (código em `functions/`, ainda não migradas)

| Função | Tipo | Papel |
|---|---|---|
| `listAllUsers` | onCall admin | lista Auth+Firestore mergeado |
| `syncAuthUser` | trigger users.onCreate | welcome email (Brevo) + flag |
| `sendReactivationEmails` | cron 24h | reativação (Brevo), grava `lastReactivationEmail` |
| `getReactivationUsers` | onCall admin | prévia da lista de reativação |
| `onNewLessonPublished` | trigger lessons.onCreate | notificação nova aula (Brevo) |
| `handleEmailPreferences` | onRequest GET/POST | unsubscribe com token HMAC |
| `brevoWebhook` | onRequest POST | grava tracking (hoje iria p/ `emailEvents`, coleção inexistente = sem tráfego) |

A coleção `announcements` evidencia uso manual/script de campanhas (1 envio real: 42/42).

## 7. Erros durante o export

Nenhum erro de leitura. Única ressalva: bucket de Storage inexistente (documentado acima).

## 8. Validação do backup

Todos os arquivos re-lidos, parseados e conferidos contra o manifesto:

```
✓ announcements.json       registros=1      hash ok
✓ user_achievements.json   registros=188    hash ok
✓ user_progress.json       registros=354    hash ok
✓ users.json               registros=81     hash ok
✓ _auth_users.json         registros=81     hash ok
validação geral: OK ✓
```

Integridade referencial dentro do backup: 0 userIds órfãos em `user_progress` e
`user_achievements`; 100% dos doc IDs compostos consistentes com seus campos.

## 9. Impacto no schema proposto (ajustes para revisão)

1. **Adicionar** colunas `certificates jsonb default '[]'`, `is_premium boolean default false`,
   `purchased_courses jsonb default '[]'` em `profiles`.
2. **Adicionar tabela `announcements`** (id text PK, subject, total, sent, errors int,
   error_details jsonb, mode, sent_at timestamptz).
3. **Conteúdo (courses/modules/lessons/achievements)**: origem real = `src/data/**`;
   seed das tabelas a partir dos estáticos (R3 confirmado — Firestore vazio).
4. `quiz_completions`: manter (paridade), nascerá vazia.
5. `email_events`: nascerá vazia (webhook sem tráfego histórico).
6. Backfill `first_steps_done` para os 27 ausentes: usar mesma regra de atividade do
   `migrateFirstStepsDone()` (xp>0 ou concluídas>0) — proposta, sujeita à sua aprovação.
