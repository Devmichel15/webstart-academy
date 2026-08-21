# Plano de Migração — Firebase → Supabase/PostgreSQL

> Princípio: **Preservar primeiro. Migrar depois. Validar antes de substituir.**
> Este plano só avança de fase após aprovação explícita (regra da tarefa).

---

## 1. Estrutura de arquivos a criar (após aprovação)

```text
migration/
├── backups/                     # ⛔ .gitignore — dados brutos e sensíveis
│   └── firebase/
│       ├── users.json           # export cru por collection
│       ├── user_progress.json
│       ├── learning_profiles.json
│       ├── courses.json / modules.json / lessons.json / achievements.json
│       ├── user_achievements.json
│       └── emailEvents.json
├── normalized/                  # saída do transform (JSONL por tabela destino)
└── reports/
    ├── export-summary.json
    ├── transform-errors.jsonl
    ├── import-batches.jsonl     # {collection,total,processed,success,failed,skipped,batch}
    └── validation-report.json

scripts/migration/
├── export-firestore.mjs         # Admin SDK → migration/backups (raw, sem transformação)
├── export-auth.mjs              # listUsers → auth_users.json (uid, email, providers, metadata — SEM hash)
├── transform-data.mjs           # raw → normalized/*.jsonl + erros registrados, nunca aborta em silêncio
├── import-supabase.mjs          # UPSERT idempotente em batches via service_role (server-side only)
├── validate-migration.mjs       # counts + checksums + spot-checks Firebase vs Postgres
└── lib/{report.js,firebase-admin.js,supabase-admin.js}

supabase/migrations/
├── 001_initial_schema.sql
├── 002_indexes.sql
├── 003_rls.sql
└── 004_views_compatibility.sql

docs/migration/
├── firebase-audit.md            ✅ escrito
├── database-schema.md           ✅ escrito
├── migration-plan.md            ✅ este arquivo
├── validation-report.md         (gerado na ETAPA de validação)
└── rollback-plan.md             (§9 abaixo, versionado antes do cutover)
```

Credenciais: scripts server-side leem `SERVICE_ROLE_KEY` e credenciais Admin do Firebase de
variáveis locais/arquivo **fora do Git** (`migration/.env.local` no .gitignore). O frontend
só recebe `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (já presentes no .env).

---

## 2. Ordem de execução das fases

| # | Fase | Entregável | Gate |
|---|---|---|---|
| 1 | Export Firestore + Auth | `backups/firebase/*.json` + resumo com contagens | backup validado (JSON parseável, contagens > 0 conferidas com console) |
| 2 | Migrations SQL | schema + RLS aplicados num projeto Supabase **de staging** | smoke test SQL |
| 3 | Transform | JSONL normalizados + relatório de erros | zero erros não-explicados; divergências documentadas |
| 4 | Import | batches logados, idempotente | re-execução não duplica (counts estáveis) |
| 5 | Validação | `validation-report.md` | 100% counts + checksums ok ou diffs justificados |
| 6 | Adapter no app | flag `VITE_DATA_BACKEND=firebase\|supabase`, mesma UI | testes A/B manuais dos fluxos críticos |
| 7 | Cutover | Supabase = fonte principal | monitoramento 1–2 semanas com rollback pronto |

---

## 3. Idempotência e segurança do import

- Toda escrita usa **UPSERT** por chave única estável (PK text do conteúdo; `(user_id, lesson_id)` etc.).
- `user_id` resolvido **sempre** via mapa `legacy_firebase_uid → uuid` carregado em memória;
  registro órfão (progresso sem perfil) vai para `reports/import-batches.jsonl` como `failed`
  com motivo `orphan_legacy_uid` — nunca inventa usuário.
- Batches de 500 com retry exponencial (3x) e checkpoint por collection
  (`normalized/<tabela>.checkpoint` guarda offset) → retomada sem duplicar.
- Re-execução completa: counts idênticos (UPSERT) — exigência de validação §6.

## 4. Tratamento de erros

Formato obrigatório de log:

```json
{"collection":"lesson_progress","doc":"abc123_web-html-1","reason":"invalid user_id","stage":"transform"}
```

Nenhum erro engolido. Falhas não bloqueiam o batch inteiro (registro pula, lote continua),
mas o resumo final precisa listar `failed == 0` ou justificativa assinada antes do cutover.

## 5. Reconciliação de progresso (R4)

Origem tem duas fontes para "aulas concluídas": array `users.completedLessons[]` e coleção
`user_progress`. Regra do transform:

```text
para cada (uid, lessonId) na UNIÃO das duas fontes:
  completed_at = max(timestamp disponível; NULL se nenhuma fonte tem)
  time_spent   = valor de user_progress se existir, senão default 15
  marcar origem: 'array' | 'collection' | 'both'  → coluna de auditoria no relatório
```

Divergências viram seção própria no validation-report (número de registros por origem).

## 6. Validação (ETAPA obrigatória)

1. **Contagens** por collection/tabela (formato do enunciado).
2. **Spot-check determinístico**: amostragem estratificada (todos os admins, 10 maiores XP,
   20 aleatórios): email, name, xp, level, streak, completedLessons.length, currentCourse,
   createdAt (±1s), lastStudyDate.
3. **Checksum**: sha256 de JSON normalizado (chaves ordenadas, timestamps ISO truncados ao
   segundo, floats arredondados) por registro nas tabelas críticas (users→profiles,
   user_progress→lesson_progress); comparações Firebase-transform vs Postgres-lido.
4. **Relacionamentos**: todo lesson_progress.user_id existe em profiles; toda
   user_achievements.achievement_id existe; contadores derivados batem
   (ex.: count(lesson_progress completed) vs view).
5. **Timestamps preservados**: diferença máxima tolerada ±1s (serverTimestamp resolution).

Critério de aprovação: todas as métricas ✓ OU diferenças explicadas e aceitas aqui no chat.

## 7. Migração de identidade (resumo operacional)

- Fase A (agora): manter login Firebase; dados já no Supabase amarrados por legacy uid.
- Fase B: criar `auth.users` (Admin API, senha aleatória descartável, email_confirm=true).
- Fase C (cutover de auth): tela de ativação — senha informada é verificada contra o
  Firebase (ainda ativo, read-only) e definida na conta Supabase recém-logada.
  Google OAuth: mesmo OAuth Client reconfigurado no Supabase; matching por email verificado.
- Fase D (semanas depois, com Firebase ainda acessível): desligar validação Firebase.

Rollback de auth = voltar flag `VITE_DATA_BACKEND=firebase`: o login Firebase nunca foi
removido durante o período de observação.

## 8. Storage

Estado atual: buckets possivelmente vazios (nenhum upload chamado pela UI — auditoria §4).
Ação: criar buckets equivalentes (`avatars/`, `resources/`, `course-thumbnails/`) com policies
públicas de leitura onde fizer sentido; exportar/listar arquivos existentes (script
`export-storage.mjs` simples) e copiar 1:1 mantendo paths; URLs antigas do Firebase que
eventualmente existam em `photoURL` são externas (Google) — nada a converter.
Confirmar emptiness no console ANTES de declarar concluído.

## 9. Rollback (resumo — detalhar em rollback-plan.md antes do cutover)

```text
GATILHO: perda de dado, erro de login em massa, lentidão crítica
AÇÃO:
  1. VITE_DATA_BACKEND=firebase (deploy anterior permanece intacto)
  2. Firebase NUNCA foi alterado durante todo o processo (audit trail no repo)
  3. Dados criados SOMENTE no Supabase após cutover → export delta
     (created_at > cutover_ts) e reimport manual para Firebase se necessário
VERIFICAÇÃO: login + dashboard + completar aula no modo firebase
```

Garantia estrutural: **nenhum script deste plano escreve/apaga no Firebase** — export é read-only.

## 10. Cloud Functions (fora do escopo do import, mas parte do plano)

Equivalências Supabase necessárias antes do descomissionamento total:

| Firebase CF | Destino proposto |
|---|---|
| syncAuthUser (welcome email) | Edge Function + trigger on auth.users insert (ou hook no signup) |
| sendReactivationEmails (cron) | pg_cron + Edge Function (Brevo) |
| getReactivationUsers / listAllUsers | queries diretas/RPC admin (RLS is_admin) |
| onNewLessonPublished | Database Webhook / Edge Function em INSERT lessons |
| handleEmailPreferences | Edge Function (HMAC token igual ao atual) |
| brevoWebhook → emailEvents | Edge Function → insert email_events |

Estas funções continuam rodando no Firebase durante a transição (lendo users do Firestore?).
⚠ Decisão pendente de aprovação: enquanto o app gravar no Supabase, as CFs de email ficam
cegas às novidades. Opções: (a) aceitar gap de emails até portarmos as CFs; (b) portar as
CFs críticas (welcome/reactivation) ANTES do cutover. Recomendo **(b)** para welcome+reativação,
que são os únicos writes de negócio das CFs.

---

## 11. Riscos consolidados

| ID | Risco | Mitigação |
|---|---|---|
| R1 | Senhas não migráveis (scrypt ≠ bcrypt) | Estratégia de primeira senha §7; comunicação clara ao usuário |
| R2 | Google OAuth redirect novo | Configurar provider antes do cutover; testar com conta real |
| R3 | Conteúdo Firestore vazio (fallback estático) | Export confirma; seed das tabelas a partir dos estáticos se vazio (seedFirestore já define formato) |
| R4 | Arrays vs user_progress divergentes | União reconciliada §5 + relatório de divergências |
| R5 | Realtime diferente (onSnapshot) | Supabase Realtime + replica identity full; fallback polling no adapter |
| R6 | CFs cegas pós-cutover (emails param) | Portar welcome/reactivation antes (opção b §10) |
| R7 | Race conditions de XP hoje (read-modify-write client) | Paridade na fase 1; RPC atômica na fase 2 (não é bug novo) |
| R8 | username duplicado/NULL quebra UNIQUE | Pré-validação no transform; resolver colisões com sufixo determinístico documentado |
| R9 | `isPublic` divergente entre client (true) e CF (_fromAuth false) | Perguntar dono: perfis só-auth-sem-doc devem ser públicos? Default proposto: true |
| R10 | lastStudyDate string malformada | Validador no transform; inválidos → NULL + log failed (não aborta) |
| R11 | Timestamps de serverTimestamp pendentes (null em writes recentes) | Converter null → created_at = now() apenas quando campo ausente; registrar |
| R12 | service_role exposto acidentalmente | Somente scripts server-side; .gitignore; checagem de grep no CI local |
| R13 | Big bang | Flag de backend + fases com gate; Firebase intacto até decisão final |
| R14 | Quota/custo Supabase desconhecido | Medir volumes no export antes de escolher plano |
| R15 | Perda de contexto (pessoa nova) | Estes 5 docs + comentários nos scripts |

## 12. Critério de sucesso (da tarefa)

✓ todos os dados migrados · ✓ usuários identificáveis (legacy_firebase_uid) · ✓ relações íntegras
· ✓ progresso/XP/conquistas/timestamps preservados · ✓ arquivos preservados · ✓ auth funcionando
· ✓ RLS ativo · ✓ app funcionando · ✓ validação Firebase vs Supabase concluída · ✓ rollback
documentado · ✓ Firebase disponível como backup até confirmação final.
