# RETENTION_AUDIT.md

## 1. Executive Summary

WebStart has a substantial but incomplete retention stack. Push notification infrastructure (PWA SW, VAPID, subscriptions, preferences, dispatch) is the most complete area. Streak calculation exists only as a pure utility (`src/utils/streak.js`) and is not persisted or integrated. Daily goals, weekly summaries, smart reminders scheduling, and achievements are largely absent or removed from the working tree. Overall completion: **~32%**.

## 2. Estado geral da feature

- Push (infra): PARCIAL/COMPLETO-ish (frontend+backend+DB+edge functions)
- Streaks: PARCIAL (frontend utility only)
- Daily goals: AUSENTE
- Smart reminders: PARCIAL (preferences + dispatch edge fn, no scheduler/cron)
- Achievements: AUSENTE (removed from working tree; DB tables remain)
- Weekly summary: AUSENTE
- Progress/re-engagement: PARCIAL (progressService exists)

## 3. Percentagem global de conclusão

**32%** (weighted). Push ~75%, Streak ~25%, Daily goals 0%, Smart reminders ~30%, Achievements 0%, Weekly summary 0%, Progress/re-engagement ~40%.

## 4. Tabela de auditoria por funcionalidade

| Funcionalidade | Estado | % | Notas |
|---|---|---|---|
| A. Learning Streaks | PARCIAL | 25% | `src/utils/streak.js`, `src/test/streak.test.js`. Sem persistência/integração. |
| B. Daily Learning Goals | AUSENTE | 0% | Nenhum código. |
| C. Push Notifications | PARCIAL | 75% | `src/services/pushService.js`, `public/sw.js`, migrations 022/024/025, edge fns. |
| D. Smart Learning Reminders | PARCIAL | 30% | `push_preferences.reminders_*`, `push-dispatch` edge fn. Sem cron/agendamento. |
| E. Achievement System | AUSENTE | 0% | Removido do working tree (docs/removal). Tabelas DB existem. |
| F. Weekly Learning Summary | AUSENTE | 0% | Nenhum código. |
| G. Progress & Re-engagement | PARCIAL | 40% | `src/services/progressService.js`, ProgressContext. |

## 5. Análise técnica detalhada

### A. Streaks
- `src/utils/streak.js`: `computeStreakUpdate`, `getTodayKey`, `getStreakBonusXp`. Lógica de dias consecutivos, break penalty. Sem timezone handling (usa `new Date()` local mas lastStudyDate parseado como UTC midnight). Sem persistência. Sem UI dedicada (ProfileView menciona streak?).
- `src/test/streak.test.js` existe.
- Sem integração com conclusão de aulas em progressService? Verificar.

### B. Daily goals
- Ausente. Nenhuma tabela, service, componente.

### C. Push
- Frontend: `pushService.js` (subscribe/unsubscribe/test/resubscribe, preferences RPC, device list), `NotificationSettings.jsx`, `NotificationContext.jsx`, `public/sw.js`, `public/manifest.webmanifest`.
- Backend: migrations 022, 024, 025; edge functions `push-subscribe`, `push-send`, `push-dispatch`, `_shared/push.ts`, `_shared/sender.ts`.
- VAPID key via `VITE_VAPID_PUBLIC_KEY`.
- Produção: depende de env vars e deploy de edge functions — não verificado.

### D. Smart reminders
- Preferences columns `reminders_enabled`, `reminder_hour`, `reminder_days` existem. Edge `push-dispatch` existe. Sem cron/scheduler. Sem regras de segmentação.

### E. Achievements
- Removido do working tree. DB tables `achievements`, `user_achievements` permanecem (188 rows). Sem código cliente.

### F. Weekly summary
- Ausente. Dados parcialmente disponíveis via progress tables.

### G. Progress & re-engagement
- `progressService.js`, `ProgressContext.jsx`, `trailProgressService.js`. Histórico de aulas, última actividade parcial.

## 6. Arquitectura actual
Frontend (React) → services → Supabase (RPC/edge) → Postgres (RLS). Push via service worker + PushManager + edge functions.

## 7. Problemas encontrados
1. Streak não persistido nem integrado com conclusão de aulas.
2. Achievements removidos mas DB órfã.
3. Sem scheduler/cron para reminders (push-dispatch sem trigger agendado verificado).
4. Daily goals e weekly summary inexistentes.
5. Timezone handling ausente em streak.

## 8. Funcionalidades reutilizáveis
- `src/utils/streak.js`, push infra, progressService, ProgressContext, NotificationSettings.

## 9. Funcionalidades em falta
- Daily goals (UI+DB+service)
- Weekly summary
- Scheduler para reminders
- Streak persistence + UI
- Achievements re-implementation (se desejado)
- Timezone handling

## 10. Roadmap
P0: persist streak, integrate with lesson completion; schedule push-dispatch via cron; verify prod push.
P1: daily goals; weekly summary; re-engagement flow.
P2: achievements (optional), smart reminder rules.
P3: refinements.

## 11. Estimativa de esforço
Não estimável com confiança sem análise de equipa; push infra ~completa, restante ~60-70% do trabalho de retenção.

## 12. Critérios de conclusão
Conforme secção 8 do pedido.

## 13. Recomendações técnicas
- Adicionar coluna `last_study_date`/`current_streak` em profiles ou tabela dedicada.
- Implementar cron no Supabase para push-dispatch.
- Adicionar daily_goals table.
- Respeitar consentimento e rate limits.
