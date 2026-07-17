# Sistema de Reativação de Utilizadores — Fase 1.4

## Arquitetura

```
Cloud Scheduler (diário às 9h Africa/Luanda)
  ↓
Cloud Function: sendReactivationEmails
  ↓
services/users.js → findReactivationUsers()
  ↓ Firestore query
  ↓ Filtra: completedLessons >= 1, inatividade D-1 ou D-3
  ↓ Anti-spam: lastReactivationEmail < 7 dias
  ↓
services/users.js → getCourseTitle()
  ↓ Busca nome do curso na collection courses
  ↓
templates/reactivation.js → buildReactivationEmail()
  ↓ Gera HTML personalizado
  ↓
services/brevo.js → sendEmail()
  ↓ POST https://api.brevo.com/v3/smtp/email
  ↓
users/{uid}.lastReactivationEmail = now
```

## Estrutura de Ficheiros

```
functions/
├── index.js                        # Entry point — exports todas as Cloud Functions
├── services/
│   ├── brevo.js                    # Cliente HTTP da API Brevo
│   └── users.js                    # Query de elegibilidade + lookup de cursos
├── templates/
│   └── reactivation.js             # Template HTML do email
├── package.json
└── REACTIVATION_EMAILS.md          # Este ficheiro
```

## Cloud Functions

### `sendReactivationEmails` (agendada)

- **Trigger:** `onSchedule` — corre todos os dias às 9h (Africa/Luanda)
- **Retry:** 2 tentativas em caso de falha
- **Fluxo:**
  1. Chama `findReactivationUsers()` para obter utilizadores elegíveis
  2. Para cada utilizador:
     - Busca o nome real do curso via `getCourseTitle()`
     - Gera o email HTML via `buildReactivationEmail()`
     - Envia via Brevo API HTTP
     - Atualiza `lastReactivationEmail` no Firestore
  3. Registra logs de sucesso/erro para cada envio

### `getReactivationUsers` (callable)

- **Trigger:** HTTPS Callable (admin only)
- **Retorna:** Lista de users elegíveis com detalhes
- **Uso:** Admin pode visualizar no painel antes de disparar

### `listAllUsers` (callable)

- Sem alterações — mantém funcionalidade existente

### `syncAuthUser` (Firestore trigger)

- Sem alterações — mantém funcionalidade existente

## Query de Elegibilidade

```javascript
// services/users.js → findReactivationUsers()
// 1. Busca todos os users da collection 'users'
// 2. Filtra: completedLessons.length >= 1
// 3. Filtra: lastStudyDate = D-1 (1 dia) OU D-3 (3 dias)
// 4. Anti-spam: ignora se lastReactivationEmail foi enviado nos últimos 7 dias
// 5. Retorna: uid, email, name, xp, streak, completedLessons, currentCourse, currentLesson
```

## Integração com Brevo

- **Endpoint:** `POST https://api.brevo.com/v3/smtp/email`
- **Autenticação:** Header `api-key` com a chave da API
- **Remetente:** `noreply@webstart-academy.web.app`
- **Chave:** Lida de `process.env.BREVO_API_KEY` ou `process.env.VITE_API_KEY_BREVO`

### Configuração da Chave

**Desenvolvimento local:**
```bash
# A chave já está no ficheiro .env do projeto raiz
# O dotenv carrega automaticamente ao iniciar as functions
```

**Produção (Firebase):**
```bash
firebase functions:config:set brevo.api_key="xkeysib-xxx"
```

## Template do Email

O email inclui:
- Saudação personalizada com o primeiro nome
- Nome da trilha/curso em progresso (buscado da collection `courses`)
- Estatísticas: XP, streak, aulas concluídas
- CTA direto com link para continuar na próxima aula
- Design responsivo com cores da marca (verde #064e3b)

### Alterar o Template

Edite `functions/templates/reactivation.js`:

```javascript
// A função buildReactivationEmail(user, courseName, nextLessonId) retorna string HTML
// Variáveis disponíveis:
//   user.name           → nome do utilizador
//   user.xp             → XP acumulado
//   user.streak         → dias seguidos
//   user.completedLessons → número de aulas concluídas
//   courseName          → nome da trilha em progresso
//   nextLessonId        → ID da próxima aula (para o link CTA)
```

## Critérios de Elegibilidade

| Critério | Valor |
|----------|-------|
| Aulas concluídas | >= 1 |
| Inatividade | 1 dia (D-1) OU 3 dias (D-3) |
| Anti-spam | Último email enviado há >= 7 dias |
| Email verificado | Deve ter email no perfil |

## Campo no Schema

```javascript
// users/{uid}
lastReactivationEmail: null | Timestamp
```

## Como Testar Localmente

```bash
# 1. Instalar dependências
cd functions && npm install

# 2. Iniciar emuladores
cd .. && firebase emulators:start

# 3. Chamar a function manualmente (via Firebase Console ou emulador)
# A function sendReactivationEmails é agendada — teste via:
firebase functions:shell
> sendReactivationEmails()

# 4. Ou chamar getReactivationUsers para ver users elegíveis
# (requer autenticação admin)
```

## Deploy

```bash
cd functions && npm install
cd .. && firebase deploy --only functions
```

## Logs

```bash
firebase functions:log --only sendReactivationEmails
```

## Melhorias Futuras

- **Emails transaccionais:** enviar email de boas-vindas, conclusão de módulo, certificado
- **Segmentação:** emails diferentes para D-1 vs D-3 (urgência crescente)
- **A/B testing:** testar diferentes assuntos e CTAs
- **Preferências:** permitir ao utilizador optar por não receber emails
- **Push notifications:** integrar FCM para notificações in-app
- **Métricas:** tracking de abertura e clique via Brevo webhooks
