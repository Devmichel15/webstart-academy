# Auditoria Firebase — WebStart Academy

> Data: 2026-08-21 · Escopo: código-fonte completo (src/, functions/, .env.example)
> Método: análise estática de todos os pontos de uso de Firebase. **Nenhuma alteração foi feita.**
> Contagens reais de documentos serão medidas na ETAPA 2 (export) — marcadas como `TBD`.

---

## 1. Visão geral da arquitetura atual

```text
Frontend (React/Vite)
  ├── Firebase Auth ............ email/senha + Google OAuth (popup)
  ├── Firestore ................ dados de usuários, progresso, gamificação, conteúdo
  ├── Firebase Storage ......... serviços definidos, PORÉM nenhum fluxo da UI chama upload
  └── Cloud Functions (v2) ..... emails Brevo, listAllUsers, webhooks, triggers
```

Arquivos que tocam Firebase:

| Arquivo | Uso |
|---|---|
| `src/firebase/firebase.js` | init App/Auth/Firestore/Storage (config via `VITE_FIREBASE_*`) |
| `src/services/authService.js` | register/login/logout/reset/Google |
| `src/services/userService.js` | CRUD perfil + gamificação embutida |
| `src/services/progressService.js` | conclusões de aula/exercício/projeto/quiz, XP, streak |
| `src/services/achievementService.js` | catálogo + desbloqueio de conquistas |
| `src/services/courseService.js` | leitura `courses`, `modules` |
| `src/services/lessonService.js` | leitura `lessons` |
| `src/services/learningProfileService.js` | `learning_profiles` (assessment + roadmap IA) |
| `src/services/publicProfileService.js` | perfil público por username + ranking global |
| `src/services/storageService.js` | upload avatar/resources/thumbnail (**não referenciado pela UI**) |
| `src/services/adminService.js` | admin: usuários paginados, métricas, Cloud Functions |
| `src/utils/seedFirestore.js` | seed de conteúdo (courses/modules/lessons/achievements) |
| `functions/index.js` | 6 Cloud Functions (detalhadas §6) |

Observação crítica: **cursos/módulos/aulas/conquistas têm fallback estático em código**
(`src/data/trails.js`, `src/data/lessons/`, `src/data/achievements.js`). Se as collections
estiverem vazias, o app funciona igual. O Firestore só sobrepõe o estático quando populado.

---

## 2. Inventário de collections

### 2.1 `users`

| Propriedade | Valor |
|---|---|
| Document ID | **Firebase Auth UID** |
| Subcollections | nenhuma |
| Quem cria | `createUserProfile()` no login/registro (client) · CF `syncAuthUser` lê |
| Quem lê | próprio usuário (snapshot), admin (lista/página/ranking), CFs de email |
| Quem atualiza | próprio usuário (perfil, preferências, progresso), CF reativação (`lastReactivationEmail`) |
| Quem remove | **ninguém no código** (nenhum deleteDoc de users) |

Campos observados (origem: `buildDefaultUser` em userService.js + updates espalhados):

| Campo | Tipo Firestore | Notas |
|---|---|---|
| `uid` | string | igual ao doc ID |
| `name` | string | default "Aluno WebStart" |
| `username` | string | gerado por `generateUniqueUsername(name, uid)`; único implícito (query `where username ==`) |
| `email` | string | "" se ausente |
| `provider` | string | `'email'` \| `'google'` |
| `role` | string | `'student'` \| `'admin'` (promovido automaticamente se email == VITE_ADMIN_EMAIL) |
| `photoURL` | string | presente em perfis Google; lido por admin/ranking/perfil público |
| `createdAt` | Timestamp (serverTimestamp) | |
| `lastLogin` | Timestamp (serverTimestamp) | |
| `xp` | number | acumulado no cliente (read-modify-write) |
| `level` | number | derivado de xp via `getLevelFromXp` |
| `streak` | number | |
| `lastStudyDate` | **string `YYYY-MM-DD`** (não é Timestamp) | `getTodayKey()` |
| `completedLessons` | array\<string\> (lessonIds) | duplica info de `user_progress` |
| `completedCourses` | array\<string\> (courseIds) | |
| `completedQuizzes` | array\<string\> (moduleIds) | única fonte de quizzes (sem collection) |
| `completedExercises` | number | contador simples |
| `completedProjects` | number | contador simples |
| `currentCourse` | string \| null | última trilha visitada |
| `currentLesson` | string \| null | última aula visitada |
| `totalStudyTime` | number (minutos) | |
| `isPublic` | boolean | default `true` no client; `false` nos perfis sintéticos `_fromAuth` das CFs ⚠ divergência |
| `firstStepsDone` | boolean | onboarding; backfill one-time `migrateFirstStepsDone()` |
| `lastReactivationEmail` | Timestamp \| null | escrito pela CF agendada |
| `emailPreferences` | object `{marketingOptOut: bool, notificationsOptOut: bool}` | |
| `welcomeEmailSent` | boolean | flag anti-duplicidade de email |
| `welcomeEmailSentAt` | Timestamp | escrito pela CF `syncAuthUser` |

Relacionamentos: `completedLessons[]` → `lessons.id`; `completedCourses[]` → `courses.id`;
`completedQuizzes[]` → `modules.id`; `currentCourse` → `courses.id`; `currentLesson` → `lessons.id`.
Todos **sem FK real** (Firestore) — integridade verificada apenas em runtime.

### 2.2 `user_progress`

| Propriedade | Valor |
|---|---|
| Document ID | **`${userId}_${lessonId}`** (determinístico) |
| Cria | `completeLesson()` (setDoc) |
| Lê | próprio usuário (`where userId ==`), admin (coleção inteira p/ métricas) |
| Atualiza | ninguém (write-once `completed: true`) |
| Remove | ninguém |

| Campo | Tipo | Notas |
|---|---|---|
| `userId` | string | Firebase UID |
| `courseId` | string | |
| `moduleId` | string | `${courseId}-main` quando aula não tem módulo |
| `lessonId` | string | |
| `completed` | boolean | sempre `true` nos writes atuais |
| `completedAt` | Timestamp (serverTimestamp) | |
| `progressPercentage` | number | sempre 100 nos writes atuais |
| `timeSpent` | number (min) | `lesson.duration \|\| 15` |

⚠ `completeLesson` grava aqui **e** no array `users.completedLessons` em chamadas separadas,
sem transação → podem existir divergências pré-existentes (ver Riscos R4).

### 2.3 `learning_profiles`

| Propriedade | Valor |
|---|---|
| Document ID | Firebase UID |
| Cria/atualiza | `saveFullLearningProfile()` após avaliação (merge) |
| Lê | próprio usuário (`LearningProfileGuard`) |

| Campo | Tipo | Notas |
|---|---|---|
| `assessment` | object | respostas (experience, objective, interest, studyTime, difficulty, confidence, motivation…) + `answeredAt` serverTimestamp |
| `roadmap` | object | archetype, aiSummary, recommendedCourses[], firstStep{courseId,lessonId}, estimatedWeeks, welcomeMessage, generatedAt |
| `metadata` | object | `{completed, version, source, createdAt, updatedAt}` |

### 2.4 `courses`

Doc ID = trail id estático (ex.: `web`). Campos (seed): `id, title, slug, description, thumbnail,
difficulty, estimatedHours, totalLessons`. Leitura: `orderBy('title')`. Escrito apenas por seed manual.
Fallback estático completo em `src/data/trails.js`.

### 2.5 `modules`

Doc ID = `${courseId}-main` (seed). Campos: `id, courseId, title, description, order`.
Leitura: `where courseId ==`. Trilhas reais têm múltiplos módulos **apenas no estático**
(`trails[].modules` são ids de módulo, dados em `src/data/modules/`).

### 2.6 `lessons`

Doc ID = lesson id estático (ex.: `web-html-basics`). Campos (seed): `id, moduleId, courseId, title,
slug, content, illustration, estimatedTime, order, resources[], exercise`. Extras escritos por CF:
`notificationSent, notificationSentAt, notificationStats{sent,errors,total}`.
Leitura: `where moduleId ==` / `where courseId ==`. Merge com estático (Firestore sobrepõe campos).

### 2.7 `achievements`

Doc ID = achievement id estático. Campos (seed): `title, description, icon, xpReward, requirement,
type ('lessons'\|'xp'\|'streak'\|'exercises'\|'projects'\|'course'), target, courseId`.
Catálogo também vive em `src/data/achievements.js` (fallback). Tipos avaliados no cliente.

### 2.8 `user_achievements`

| Propriedade | Valor |
|---|---|
| Document ID | `${userId}_${achievementId}` (determinístico) |
| Cria | `checkAndUnlockAchievements()` no cliente |
| Lê | próprio usuário |

Campos: `userId, achievementId, earnedAt (serverTimestamp)`.

### 2.9 `emailEvents`

Doc ID automático. Escrita somente pela CF `brevoWebhook`. Campos: `event ('opened'|'clicked'|
'bounced'|'complained'|'unsubscribed'), email, messageId, subject, link, timestamp, receivedAt`.
Nunca lida pelo frontend.

---

## 3. Firebase Authentication

| Item | Valor |
|---|---|
| Providers | **Email/senha** e **Google OAuth** (`signInWithPopup`; redirect handler existe no código) |
| Persistência | `browserLocalPersistence` |
| Sessão | JWT Firebase, refresh automático |
| Recuperação de senha | `sendPasswordResetEmail` (template padrão Firebase) |
| Verificação de email | **não usada** (nenhuma chamada sendEmailVerification; `emailVerified` ignorado) |
| UID | base de identidade: doc ID de `users`, `learning_profiles`; prefixo de `user_progress`, `user_achievements` |
| displayName/photoURL | usados na criação de perfil (Google) |
| Roles | **não são custom claims** — campo `role` no documento `users/{uid}`; CFs validam lendo Firestore |
| Onboarding | `firstStepsDone` (user doc) + chave localStorage `webstart_onboarding_done` (UX apenas) |
| Admin bootstrap | promoção automática se `email === VITE_ADMIN_EMAIL` |

Fluxos: registro cria Auth user → `createUserProfile`; login Google cria/reusa perfil;
`onAuthStateChanged` garante existência do perfil a cada boot; `updateLastLogin` a cada login.

**Implicação para migração**: senhas (hash scrypt do Firebase) **não são importáveis** no
Supabase GoTrue (bcrypt). Estratégia de identidade detalhada em `database-schema.md` §5 e
`migration-plan.md` §7.

---

## 4. Firebase Storage

Serviços prontos (`storageService.js`):

| Path pattern | Função | Chamado pela UI? |
|---|---|---|
| `avatars/{uid}.{ext}` | `uploadAvatar` | **Não** (0 referências) |
| `resources/{courseId}/{lessonId}/{filename}` | `uploadResource` | **Não** |
| `course-thumbnails/{courseId}.{ext}` | `uploadCourseThumbnail` | **Não** |

`photoURL` exibido no app vem exclusivamente do Google OAuth (`lh3.googleusercontent.com`) —
**URL externa, não arquivo do Firebase Storage**. Conclusão: Storage está essencialmente
**vazio/em desuso**; migração de arquivos provavelmente trivial (confirmar no console na ETAPA 2).

---

## 5. Variáveis de ambiente (nomes apenas — valores nunca commitados)

Frontend (.env): `VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID,
VITE_FIREBASE_MEASUREMENTID, VITE_API_KEY (Hugging Face), VITE_ADMIN_EMAIL,
VITE_SUPABASE_URL ✅, VITE_SUPABASE_ANON_KEY ✅` (chaves Supabase já presentes no .env;
`@supabase/supabase-js@2.112.3` já instalado no package.json — ainda sem nenhum import no código).

Cloud Functions: `UNSUBSCRIBE_SECRET`, `BREVO_API_KEY`, `APP_URL`; service account em
`firebase/serviceAccountKey.json` (local, fora do Git).

---

## 6. Cloud Functions (backend invisível ao schema)

| Função | Tipo | Lê | Escreve |
|---|---|---|---|
| `listAllUsers` | onCall (admin-only) | users + **Firebase Auth listUsers** | — (merge `_fromAuth`) |
| `syncAuthUser` | trigger `users/{uid}` onCreate | user doc | `welcomeEmailSent(At)`; email Brevo |
| `sendReactivationEmails` | schedule 24h (Africa/Luanda) | users (inatividade 1/3 dias, opt-out marketing) | `lastReactivationEmail` |
| `getReactivationUsers` | onCall (admin-only) | idem | — |
| `onNewLessonPublished` | trigger `lessons/{lid}` onCreate | users matriculados | `notificationSent(At)`, `notificationStats` |
| `handleEmailPreferences` | onRequest GET/POST (HMAC token) | users.emailPreferences | users.emailPreferences |
| `brevoWebhook` | onRequest POST | — | **emailEvents** |

Lógica de negócio relevante: elegibilidade de reativação (dias desde `lastStudyDate`,
`lastReactivationEmail < 7d`), definição de "matriculado" (`currentCourse ==` OU
`completedCourses.includes` OU prefixo de lessonId `courseId + '-'`).

---

## 7. Dados estáticos (fora do Firestore, mas relevantes ao schema)

- `src/data/trails.js` — trilhas, módulos, status (`available`/`soon`), order, difficulty
- `src/data/lessons/**` + `allVideoLessons` — aulas completas (content, exercise, duration…)
- `src/data/achievements.js` — catálogo de conquistas
- `src/data/modules/**` — definições de módulos/quiz

Estes são a fonte primária de conteúdo hoje; Firestore apenas espelha/sobrepõe.

---

## 8. Operações por collection (matriz CRUID consolidada)

| Collection | Create | Read | Update | Delete |
|---|---|---|---|---|
| users | client (login) | owner/admin/CFs | owner/CFs | — |
| user_progress | client | owner/admin | — | — |
| learning_profiles | client | owner | client (merge) | — |
| courses | seed | público | seed | — |
| modules | seed | público | seed | — |
| lessons | seed/CF | público | CF (notificação) | — |
| achievements | seed | público | seed | — |
| user_achievements | client | owner | — | — |
| emailEvents | CF | — | — | — |

Nenhuma operação de delete existe no código — risco de perda por aplicação: baixo.
