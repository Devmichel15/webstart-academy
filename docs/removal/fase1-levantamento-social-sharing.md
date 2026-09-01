# Fase 1 — Levantamento: Remoção de Social Sharing, Achievements e Perfil Público

> **Data:** 2026-09-01 · **Branch de trabalho:** `chore/remove-social-sharing` (a partir de `develop`)
> **Método:** análise estática do código-fonte. Nenhuma alteração de runtime foi feita nesta fase.

---

## Sumário executivo

A feature de partilha social da WebStart Academy envolve três subsistemas interligados:

| Subsistema | Estado atual |
|---|---|
| **Partilha em redes sociais** (ShareCard, ShareButtons, shareUtils) | Ficheiros já deletados no working directory (não commitados) |
| **Achievements / Conquistas** | Totalmente presente: dados, serviço, UI no Dashboard e Perfil, modal de celebração, lógica de desbloqueio em progressService |
| **Perfil público** (`/u/:username`) | Presente: rota, página, serviço; expõe perfil + achievements + links sociais sem autenticação |

**Dependência cruzada importante:** `achievementService.checkAndUnlockAchievements()` é chamado dentro de `progressService.completeLesson/completeExercise/completeProject()`. A remoção deve manter o fluxo de conclusão de aulas/exercícios/projetos intacto — apenas eliminar a chamada de achievements e o `shareData` retornado.

**O que NÃO é achievements e deve ser mantido:**
- `src/components/ui/Badge.jsx` — componente genérico de UI (usado em headers, Admin, CourseDetail, etc.)
- `src/components/TrilhaBadgeCard.jsx` — card de trilha tecnológica (campo `badge` = texto tipo "Exercícios", não um achievement)
- `src/data/trailTechConfig.js` — configuração visual das trilhas (campo `badge` = rótulo de trilha)
- `src/components/layout/Sidebar.jsx` → `UserBadge` — componente que mostra avatar/nível no sidebar (não tem relação com achievements)
- Links sociais em `EditProfile.jsx` — são campos do perfil **privado** do utilizador (GitHub, LinkedIn, etc.); devem ser mantidos

---

## 1. UI — Componentes e Páginas

### 1.1 Ficheiros a remover completamente

| Ficheiro | Motivo |
|---|---|
| `src/components/share/ShareCard.jsx` | Componente de card social para redes (já deletado no WD) |
| `src/components/share/ShareButtons.jsx` | Botões de partilha social (já deletado no WD) |
| `src/components/gamification/AchievementCelebration.jsx` | Modal de "Conquista desbloqueada!" acionado ao completar aulas/exercícios |
| `src/components/gamification/PlayerCard.jsx` | Card de jogador exibido no Perfil Público e em `Profile.jsx`; inclui secção de badges/achievements e link de perfil público |
| `src/pages/PublicProfile.jsx` | Página de perfil público acessível sem autenticação em `/u/:username`; exibe PlayerCard, conquistas, links sociais |
| `src/data/achievements.js` | 12 conquistas estáticas (definição dos achievements); sem outros consumidores além de achievementService |

### 1.2 Ficheiros a modificar (remover secções específicas)

| Ficheiro | O que remover |
|---|---|
| `src/pages/Profile.jsx` | Secção "Medalhas" (mapeamento de `achievements`), Card de "Perfil público" com link compartilhável e botão de copiar, import de `PlayerCard` e `getPublicProfileUrl` |
| `src/pages/Dashboard.jsx` | Secção "Conquistas" (bloco `<section>` com `achievements.map(...)` e contador), import e uso de `achievements` do `useProgress` |
| `src/pages/CourseCompletion.jsx` | Meta description da SEO que menciona "conquistas e compartilhe seu progresso" |
| `src/App.jsx` | Rota `/u/:username` e import de `PublicProfile` |

---

## 2. Backend / Serviços / Utils

### 2.1 Ficheiros a remover completamente

| Ficheiro | Motivo |
|---|---|
| `src/services/achievementService.js` | Todo o serviço: `getAchievements`, `getUserAchievements`, `checkAndUnlockAchievements`, `getAchievementsWithStatus`; 100% achievements |
| `src/services/publicProfileService.js` | Todo o serviço: `getPublicProfileByUsername`, `getGlobalRanking`, `getUserRankPercentile`; suporte exclusivo ao perfil público |
| `src/utils/shareUtils.js` | Utilitários de partilha social (já deletado no WD) |
| `src/utils/username.js` | `getPublicProfileUrl` — usado apenas para gerar URL do perfil público (mais: `slugifyUsername`/`generateUniqueUsername` devem ser avaliados — ver nota abaixo) |

> **Nota sobre `username.js`:** `slugifyUsername` e `generateUniqueUsername` são usados em `userService.js:ensureUsername()` para gerar o username do utilizador (funcionalidade de identidade, não de partilha). Apenas `getPublicProfileUrl` deve ser removido; as outras funções devem ser mantidas.

### 2.2 Ficheiros a modificar (remover lógica específica)

| Ficheiro | O que remover |
|---|---|
| `src/services/progressService.js` | Import de `checkAndUnlockAchievements`, chamadas em `completeLesson`/`completeExercise`/`completeProject`, e os objetos `shareData` retornados (incluindo campos `badge: newlyUnlocked[0]?.title`) |
| `src/contexts/ProgressContext.jsx` | Import de `getAchievementsWithStatus` e `AchievementCelebration`, estado `achievements`/`celebration`/`setCelebration`, chamadas `getAchievementsWithStatus` no subscriber, `completeLesson`/`completeExercise`/`completeProject` (remover `if (result.shareData) setCelebration(...)`), `dismissCelebration`, render de `<AchievementCelebration>`, remoção de `achievements` e `celebration`/`dismissCelebration` do `value` exposto |
| `src/utils/username.js` | Remover apenas `getPublicProfileUrl` (manter `slugifyUsername` e `generateUniqueUsername`) |

---

## 3. Banco de Dados

### 3.1 Supabase — tabelas órfãs (NÃO excluir)

| Tabela | Dados presentes | Decisão |
|---|---|---|
| `achievements` | 12 linhas (achievements estáticos sincronizados) | **Manter** — sinalizar como órfã; aguardar decisão humana antes de dropar |
| `user_achievements` | 188 linhas (conquistas desbloqueadas por utilizadores) | **Manter** — dados históricos de utilizadores; **não excluir** |

> ⚠ **Decisão pendente (humana):** após remoção completa da feature, confirmar se as tabelas `achievements` e `user_achievements` podem ser dropadas. Recomenda-se backup antes.

### 3.2 Supabase — colunas em `profiles` relacionadas ao perfil público

| Coluna | Uso atual | Decisão |
|---|---|---|
| `is_public` | Lida em `publicProfileService.getPublicProfileByUsername()` para filtrar perfis privados; também em `firestore.rules` e `adminService` | Com a remoção do perfil público, a coluna deixa de ser consultada pelo frontend. Pode ser mantida no banco sem impacto, ou sinalizada para remoção futura. |
| `username` | Gerado por `ensureUsername` em `userService`; usado internamente no perfil e seria usado na URL pública | O username continua a ser gerado (identidade interna). A sua exposição pública via `/u/:username` é removida. A coluna deve ser mantida. |
| `bio`, `github_url`, `portfolio_url`, `linkedin_url`, `twitter_url`, `instagram_url`, `website_url` | Lidos em `publicProfileService` (para o perfil público) e em `EditProfile` (campos do perfil privado) | **Manter** — são parte do perfil pessoal do utilizador; só o `publicProfileService` é removido |

### 3.3 Firebase Firestore — coleções relacionadas

| Coleção | Estado | Decisão |
|---|---|---|
| `achievements` | Definida em `firestore.rules` com read para autenticados, write para admin. Populada por `seedFirestore.js` (dev tool, não chamado pela UI) | **Manter** — não remover dados; regra pode ser mantida ou marcada como legado |
| `user_achievements` | Definida em `firestore.rules`; utilizada antes da migração para Supabase | **Manter** — dados históricos; manter regra por precaução |

### 3.4 Firebase Storage — paths relacionados

| Path | Uso | Decisão |
|---|---|---|
| `shared-cards/{userId}/**` | Descrito no README como destino de cards gerados (ShareCard canvas → Storage). Regra em `storage.rules` (mencionada no README mas ausente no `storage.rules` atual) | **Confirmar** se existem ficheiros aqui antes de remover a regra. Sinalizar para revisão humana. |

---

## 4. Notificações e Integrações

### 4.1 Cloud Functions Firebase (`functions/index.js`)

Após inspeção: as Cloud Functions presentes são `listAllUsers` e `syncAuthUser`. Nenhuma CF encontrada que dispare notificações específicas de achievements. As CFs de email (`sendWelcomeEmail`, `sendReactivationEmails`) não têm relação com achievements.

> ✅ **Sem impacto direto.** Não existem CFs dedicadas a achievements ou partilha social no repositório atual.

### 4.2 Email transacional

`EmailPreferences.jsx` permite opt-out de dois tipos de email: "reativação" e "novas aulas". Nenhuma menção a achievements ou partilha social. Sem impacto.

### 4.3 Analytics / Eventos de tracking

Sem eventos de analytics/tracking explícitos no código (`gtag`, `amplitude`, `mixpanel`, etc.) relacionados a achievements ou social share encontrados. Sem impacto.

---

## 5. Referências indiretas e dependências cruzadas

| Local | Referência | Avaliação |
|---|---|---|
| `src/pages/CourseCompletion.jsx` | Meta description menciona "conquistas e compartilhe seu progresso" | Texto cosmético — alterar para remover referência |
| `src/pages/Profile.jsx` | Header subtitle "XP, níveis, badges e perfil público compartilhável." | Texto cosmético — alterar |
| `README.md` | Tabela de funcionalidades menciona "Perfil Público" e "Cards de Compartilhamento"; tabela de storage path `shared-cards` | Atualizar README após remoção |
| `src/utils/seedFirestore.js` | Importa `achievements` de `data/achievements.js` e popula Firestore | Ferramenta dev (não chamada pela UI). Se `achievements.js` for removido, este ficheiro deve ser atualizado ou removido |
| `src/pages/admin/AdminDashboard.jsx` | Import de `Award` de lucide-react (ícone genérico, não relacionado a achievements diretamente); usa `computeRankings` que lista utilizadores por XP | Nenhum impacto direto na remoção. Rankings por XP são independentes de achievements |
| `src/hooks/useProgress.js` | Expõe `achievements` via `ProgressContext` | Com a remoção de `achievements` do contexto, remover o campo do hook |

### 5.1 Impacto no sistema de XP

⚠ **Atenção:** `achievementService.checkAndUnlockAchievements()` chama `addXpToUser()` quando uma conquista é desbloqueada. Com a remoção dos achievements, esse bónus de XP deixa de existir. Isto **não quebra** outros fluxos (o XP base de aulas/exercícios/projetos é gerido directamente em `progressService`), mas representa uma mudança no modelo de progressão do utilizador.

> ⚠ **Decisão humana recomendada:** informar os utilizadores (ou compensar de outra forma) sobre a remoção dos bónus XP que vinh`am via achievements.

### 5.2 Fluxo de conclusão de aula — antes vs. depois

**Antes:**
```
completeLesson() → checkAndUnlockAchievements() → addXpToUser (bónus) → return { shareData, newlyUnlocked }
                  → ProgressContext.completeLesson → setCelebration(shareData) → AchievementCelebration modal
```

**Depois (proposto):**
```
completeLesson() → return { xpEarned, moduleComplete, courseComplete, streakResult }
                  → ProgressContext.completeLesson → sem modal de celebração
```

O toast de "Aula concluída! +XP" em `ProgressContext` é mantido — apenas o modal de achievements e o `shareData` são removidos.

---

## 6. Inventário completo de ficheiros afectados

### Remoção total (ficheiros inteiros)
- `src/components/share/ShareCard.jsx` ← já deletado no WD
- `src/components/share/ShareButtons.jsx` ← já deletado no WD
- `src/utils/shareUtils.js` ← já deletado no WD
- `src/components/gamification/AchievementCelebration.jsx`
- `src/components/gamification/PlayerCard.jsx`
- `src/pages/PublicProfile.jsx`
- `src/services/achievementService.js`
- `src/services/publicProfileService.js`
- `src/data/achievements.js`

### Modificação parcial (remover secções específicas)
- `src/App.jsx` — rota `/u/:username` e import `PublicProfile`
- `src/services/progressService.js` — import + chamadas de `checkAndUnlockAchievements`, objetos `shareData`
- `src/contexts/ProgressContext.jsx` — achievements state, celebration state, AchievementCelebration render
- `src/pages/Profile.jsx` — secção Medalhas, card de Perfil público
- `src/pages/Dashboard.jsx` — secção Conquistas
- `src/pages/CourseCompletion.jsx` — texto da meta description SEO
- `src/utils/username.js` — remover apenas `getPublicProfileUrl`

### Sem alterações (confirmar manutenção)
- `src/components/ui/Badge.jsx` — componente UI genérico
- `src/components/TrilhaBadgeCard.jsx` — card de trilha tecnológica
- `src/pages/EditProfile.jsx` — campos de links sociais são do perfil privado
- `src/components/layout/Sidebar.jsx` → `UserBadge` — avatar/nível, não achievements
- `src/utils/username.js` → `slugifyUsername`, `generateUniqueUsername` — identidade interna

---

## 7. Decisões pendentes de aprovação humana

| # | Decisão | Contexto |
|---|---|---|
| D1 | **Excluir tabelas `achievements` e `user_achievements` no Supabase** | 188 linhas de dados históricos de utilizadores. Recomenda-se não excluir por agora; sinalizar para decisão futura |
| D2 | **Excluir ficheiros `shared-cards/` no Firebase Storage** | Confirmar se existem cards gerados e se podem ser apagados |
| D3 | **Comunicar remoção do bónus XP via achievements** | Achievements davam bónus de XP (50–500 XP por conquista). Utilizadores existentes com XP acumulado por achievements não perdem XP já ganho, mas novas conquistas não serão mais desbloqueadas |
| D4 | **Remover regras de Firestore/Storage** para `achievements`/`user_achievements` | Regras ficam inócuas após remoção; podem ser mantidas por segurança ou limpas. Decisão de manutenção de infra |
| D5 | **Remover `seedFirestore.js`** ou actualizar para não importar `achievements.js` | Ferramenta dev; sem impacto na UI |

---

*Relatório produzido em 2026-09-01. Fase 2 (remoção) será executada após revisão deste documento.*
