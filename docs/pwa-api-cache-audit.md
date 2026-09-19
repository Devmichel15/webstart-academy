# Auditoria de endpoints e cache da PWA

A regra aplicada no `vite.config.js` é ordenada e explícita:

1. Supabase Auth `/auth/v1/*`: `NetworkOnly`.
2. Qualquer pedido que não seja `GET`/`HEAD`: `NetworkOnly`.
3. Leituras `GET` da API local `/api/*` e Supabase `/rest/v1/*` ou `/functions/v1/*`: `NetworkFirst`, timeout de 10 segundos e fallback curto em cache.
4. JS, CSS, imagens e fontes: `CacheFirst`.
5. Navegação sem resposta de rede: `navigateFallback` para `/offline.html`.

## Classificação encontrada

| Ficheiro/feature                         | Endpoint ou operação                     | Método            | Estratégia                   |
| ---------------------------------------- | ---------------------------------------- | ----------------- | ---------------------------- |
| `src/services/authService.js`            | Supabase Auth `signUp`                   | POST              | NetworkOnly                  |
| `src/services/authService.js`            | Supabase Auth `signInWithPassword`       | POST              | NetworkOnly                  |
| `src/services/authService.js`            | Supabase Auth OAuth                      | GET/redirect      | NetworkOnly                  |
| `src/services/authService.js`            | Supabase Auth `signOut`                  | POST              | NetworkOnly                  |
| `src/services/authService.js`            | Supabase Auth password reset             | POST              | NetworkOnly                  |
| `src/services/authService.js`            | Supabase Auth sessão/user                | GET               | NetworkOnly por `/auth/v1/*` |
| `src/services/userService.js`            | `/rest/v1/profiles` leitura              | GET               | NetworkFirst                 |
| `src/services/userService.js`            | `/rest/v1/profiles` insert/update/upsert | POST/PATCH        | NetworkOnly                  |
| `src/services/userService.js`            | RPC de relink                            | POST              | NetworkOnly                  |
| `src/services/progressService.js`        | `/rest/v1/progress` leitura              | GET               | NetworkFirst                 |
| `src/services/progressService.js`        | progresso, XP e conclusão                | POST/PATCH/DELETE | NetworkOnly                  |
| `src/services/courseService.js`          | trilhas e módulos publicados             | GET               | NetworkFirst                 |
| `src/services/lessonService.js`          | aulas e conteúdo                         | GET               | NetworkFirst                 |
| `src/services/communityService.js`       | feed, comentários e projetos             | GET               | NetworkFirst                 |
| `src/services/communityService.js`       | publicar, editar, apagar e RPCs          | POST/PATCH/DELETE | NetworkOnly                  |
| `src/services/learningProfileService.js` | perfil de aprendizagem                   | GET               | NetworkFirst                 |
| `src/services/learningProfileService.js` | guardar respostas/perfil                 | PATCH/POST        | NetworkOnly                  |
| `src/services/adminService.js`           | perfis, métricas e analytics             | GET               | NetworkFirst                 |
| `src/services/adminService.js`           | operações administrativas                | POST/PATCH/DELETE | NetworkOnly                  |
| `src/pages/EmailPreferences.jsx`         | `/api/email-preferences` leitura         | GET               | NetworkFirst                 |
| `src/pages/EmailPreferences.jsx`         | `/api/email-preferences` guardar         | POST              | NetworkOnly                  |
| `src/services/aiService.js`              | Hugging Face inference                   | POST              | NetworkOnly                  |
| `src/lib/data/legacyMerge.js`            | função Supabase legacy-read              | POST              | NetworkOnly                  |
| assets estáticos                         | JS/CSS/imagens/fontes                    | GET               | CacheFirst                   |

Não foram encontrados usos de Axios ou Firebase nos serviços ativos desta branch. As referências a `fetch` nas aulas são conteúdo didático, não chamadas da aplicação.
