# Relatório de Fluxo de Uso — WebStart Academy

## Óptica do Usuário: Do Onboarding à Experiência Completa

---

## 1. ONBOARDING

O primeiro contacto do usuário com a plataforma é um carrossel introdutório com 3 slides:

| Slide | Titulo | Descricao |
|-------|--------|-----------|
| 1 | Roadmaps Inteligentes | Trilhas de aprendizado organizadas e progressivas |
| 2 | Aprenda na Pratica | Laboratórios interativos, quizzes e projetos reais |
| 3 | Sua Carreira Tech | Certificados, progresso gamificado e_portfolio_publico |

**Regra de negócio:** O onboarding é exibido uma única vez. Ao finalizar ou pular, um flag `webstart_onboarding_done` é salvo no `localStorage` do navegador. Usuários que já completaram o onboarding nunca mais o veem.

**Fluxo:**
1. Usuário acessa qualquer URL da plataforma
2. Se não existe o flag no localStorage → redirecionado para `/onboarding`
3. Navega pelos slides com "Proximo" ou clica "Pular introducao"
4. No ultimo slide, o botao muda para "Comecar Agora"
5. Flag é salvo → redirecionado para `/login`

---

## 2. AUTENTICACAO

### 2.1 Login (`/login`)

Duas opcoes disponiveis:
- **Email/Senha:** Campos de email e senha, botao "Entrar"
- **Google:** Botao "Continuar com Google" — abre popup de selecao de conta

**Regras de negocio:**
- Se o usuario ainda nao completou o onboarding, e redirecionado para `/onboarding` antes de ver a pagina de login
- Senha minima de 6 caracteres (validacao do Firebase)
- Erros sao traduzidos automaticamente para portugues (ex: "auth/wrong-password" → "Senha incorreta")
- Todas as tentativas de autenticacao possuem retry automatico (3 tentativas com backoff exponencial)

### 2.2 Registro (`/registro`)

Campos obrigatorios:
- Nome completo
- Email
- Senha (minimo 6 caracteres)
- Confirmar senha

Alternativa: "Continuar com Google"

**Regras de negocio apos registro:**
1. Firebase Auth cria o usuario
2. Documento `users/{uid}` e criado no Firestore com:
   - `xp: 0`, `level: 1`, `streak: 0`
   - `completedLessons: []`, `completedCourses: []`
   - `completedExercises: 0`, `completedProjects: 0`
   - `totalStudyTime: 0`, `certificates: []`
   - `isPublic: true` (perfil publico por padrao)
   - `role: 'student'` (exceto email do admin)
   - `username` gerado automaticamente a partir do nome
3. Username e gerado via slugificacao do nome + 4 ultimos caracteres do UID (ex: `joao-silva-a1b2`)
4. Redirect para `/` (Dashboard)

### 2.3 Recuperacao de Senha (`/recuperar-senha`)

- Campo de email
- Envia link de redefinicao via Firebase
- Mensagem de confirmacao exibida

### 2.4 Guardas de Rota

| Rota | Protecao | Comportamento |
|------|----------|---------------|
| `/onboarding`, `/login`, `/registro`, `/recuperar-senha` | Publica | Acessivel sem login |
| `/`, `/trilhas`, `/perfil`, `/chat`, etc. | Autenticada | Redireciona para `/login` se nao autenticado, com `state.from` para voltar apos login |
| `/admin/*` | Admin | Verifica email === `ADMIN_EMAIL` E `profile.role === 'admin'`. Se nao, redireciona para `/` |
| `/u/:username` | Publica | Qualquer pessoa pode ver perfis publicos |

---

## 3. DASHBOARD (`/`)

Apos login, o usuario chega ao Dashboard — a tela principal.

### Secoes do Dashboard:

**a) Header de Boas-Vindas**
- Mensagem personalizada com o nome do usuario
- Exibe nivel atual e XP

**b) Estatisticas Rápidas**
- Total de aulas concluidas
- Sequencia de dias (streak)
- XP total
- Nivel atual

**c) Sua Jornada**
- Lista as trilhas disponiveis com status visual:
  - **Trancada (locked):** Requisito nao atendido, opaca com cadeado
  - **Disponivel (available):** Pode comecar
  - **Em progresso (in_progress):** Ja iniciou, barra de progresso
  - **Concluida (completed):** Checkmark verde

**d) Proximo Passo**
- Sugere a proxima aula nao concluida
- Botao "Continuar" para retomar de onde parou

**e) Conquistas Recentes**
- Ultimas conquistas desbloqueadas
- Convite para ver todas no perfil

---

## 4. TRILHAS DE APRENDIZADO

### 4.1 Visao Geral (`/trilhas`)

Exibe um roadmap linear com todas as 11 trilhas:

| # | Trilha | Status Atual | Pre-requisito |
|---|--------|-------------|---------------|
| 1 | Fundamentos da Web | Disponivel | Nenhum |
| 2 | HTML5 | Disponivel | Fundamentos da Web |
| 3 | Exercicios de HTML em Video | Disponivel | HTML5 |
| 4 | CSS3 | Em construcao | Exercicios de HTML em Video |
| 5 | JavaScript | Em breve | CSS3 |
| 6 | Git & GitHub | Em breve | JavaScript |
| 7 | React | Em breve | Git & GitHub |
| 8 | Backend com Node.js | Em breve | React |
| 9 | Banco de Dados | Em breve | Backend com Node.js |
| 10 | APIs REST | Em breve | Banco de Dados |
| 11 | Deploy & DevOps | Em breve | APIs REST |

**Regras de desbloqueio:**
- Cada trilha opcionalmente define um `requiredTrail`
- A trilha so e desbloqueada quando o curso requisito esta em `completedCourses`
- Trilhas com `status: 'soon'` estao sempre trancadas e nao aparecem no dashboard
- Trilhas com `status: 'building'` mostram conteudo mas aulas estao indisponiveis

### 4.2 Detalhe do Curso (`/trilhas/:courseId`)

Mostra todos os modulos do curso com:
- Lista de modulos com numero de aulas
- Status de cada modulo (trancado/disponivel/em progresso/concluido)
- Barra de progresso geral do curso
- Botao para entrar no proximo modulo

### 4.3 Detalhe do Modulo (`/trilhas/:courseId/modulo/:moduleId`)

Conteudo do modulo:
- Lista de aulas com status (concluida/pendente)
- Links para:
  - Quiz do modulo
  - Laboratorio do modulo
  - Mini-projeto do modulo

### 4.4 Conclusao do Curso (`/trilhas/:courseId/conclusao`)

Apos completar todas as aulas de todos os modulos:
- Pagina de celebracao com:
  - Projeto final
  - Avaliacao final
  - Certificado do curso
  - Proximos passos
  - Botoes para compartilhar nas redes sociais

---

## 5. AULAS

### 5.1 Aula em Texto (`/aula/:lessonId`)

Estrutura da pagina:
- **Indice lateral** com secoes da aula
- **Barra de progresso de leitura** no topo
- **Conteudo renderizado por secoes**, que podem ser:
  - `ConceptContent` — explicacao do conceito
  - `HowItWorksSection` — passo a passo
  - `ListSection` — listas estilizadas
  - `CodePreview` — blocos de codigo com syntax highlighting
  - `Callout` — caixas de destaque
  - `StorySection` — narrativas e historias
  - `LessonIllustration` — ilustracoes hero
  - `PlaygroundBlock` — playground de codigo ao vivo
  - `ChallengeBlock` — desafio pratico
  - `QuizBlock` — quiz interativo inline
  - `ExerciseBlock` — exercicio com editor de codigo
  - `KnowledgeCheck` — verificacao rapida de conhecimento
  - `ComplementSection` — recursos adicionais de aprendizado
- **Tutor AI** embutido na parte inferior da aula
- **Botao "Concluir aula"** no final

**Regras ao concluir aula:**
1. XP e adicionado (50 XP por aula)
2. Streak e atualizado
3. Conquistas sao avaliadas
4. Se todas as aulas do modulo estao completas → bonus de modulo (+200 XP)
5. Se todas as aulas do curso estao completas → bonus de curso (+1000 XP) + certificado

### 5.2 Video-Aula (`/video-aula/:lessonId`)

- Player de video incorporado
- Mesma estrutura de conteudo de secoes
- Tutor AI disponivel

---

## 6. PRACTICA

### 6.1 Laboratorio (`/laboratorio` e `/trilhas/:courseId/modulo/:moduleId/lab`)

**Modulo Lab:**
- Editor de codigo HTML/CSS na esquerda
- Preview ao vivo na direita (iframe sandboxed)
- Barra de ferramentas com: formatar, resetar, executar
- Painel de informacoes com instrucoes do desafio
- Console de saida

**Laboratorio Independente:**
- Desafios guiados com objetivos claros
- Mesmo editor + preview

### 6.2 Quiz (`/trilhas/:courseId/modulo/:moduleId/quiz`)

- Perguntas de multipla escolha
- Feedback imediato apos responder cada pergunta
- Explicacao exibida apos cada resposta
- Pontuacao final ao completar

### 6.3 Mini-Projeto (`/trilhas/:courseId/modulo/:moduleId/mini-projeto`)

- Editor de codigo completo
- Lista de requisitos do projeto
- Rubrica de avaliacao
- Submissao para verificacao

---

## 7. TUTOR IA

### 7.1 Chat (`/chat`)

- Interface completa de chat
- Historico de conversas
- Rate limit: 10 requisicoes por 60 segundos
- Cache de respostas: TTL de 5 minutos
- Respostas estruturadas em JSON:
  ```json
  {
    "feedback": "...",
    "score": 0-100,
    "mistakes": [],
    "improvements": [],
    "explanation": "..."
  }
  ```
- Modelo: GPT-OSS-120B via HuggingFace/Groq

### 7.2 Tutor Inline (em aulas)

- Componente embutido na pagina da aula
- Contexto da aula atual e enviado junto com a pergunta
- Mesma estrutura de resposta

---

## 8. SISTEMA DE GAMIFICACAO

### 8.1 XP (Experiencia)

| Atividade | XP Ganho |
|-----------|----------|
| Concluir aula | 50 |
| Concluir laboratorio | 50 |
| Concluir exercicio | 120 |
| Concluir mini-projeto | 300 |
| Bonus de modulo completo | 200 |
| Bonus de curso completo | 1000 |

### 8.2 Niveis

- **Formula:** `Math.floor(xp / 1000) + 1`
- Cada nivel requer 1000 XP
- Exemplo: 2500 XP = Nivel 3

### 8.3 Sequencia (Streak)

| Comportamento | Resultado |
|---------------|-----------|
| Estudar no mesmo dia | Streak mantido |
| Dia seguinte consecutivo | Streak + 1 |
| Falta de 1+ dia | Streak reseta para 1, **-10 XP de penalidade** |

**Bonus de streak:**

| Dias Consecutivos | Bonus XP |
|--------------------|----------|
| 3+ dias | +25 XP |
| 7+ dias | +50 XP |
| 14+ dias | +75 XP |

### 8.4 Conquistas (12 no total)

| ID | Titulo | Condicao | XP |
|----|--------|----------|-----|
| first-lesson | Primeiro Passo | Completar 1 aula | 50 |
| first-website | Primeiro Website | Completar 1 exercicio | 100 |
| list-master | Mestre das Listas | Completar 5 aulas | 75 |
| semantic-pro | HTML Semantico Pro | Completar 10 aulas | 150 |
| html-hero | Heroi HTML | Completar curso HTML | 200 |
| css-master | Mestre CSS | Completar curso CSS | 200 |
| streak-3 | Consistente | 3 dias seguidos | 50 |
| streak-7 | 7 Dias Seguidos | 7 dias seguidos | 100 |
| project-builder | Construtor de Projetos | Completar 1 projeto | 150 |
| xp-500 | Explorador | Atingir 500 XP | 50 |
| xp-2000 | Veterano | Atingir 2000 XP | 100 |
| graduate | WebStart Graduate | Completar 23 aulas | 500 |

**Regra:** Conquistas sao avaliadas automaticamente apos cada conclusao de aula. Uma conquista so pode ser desbloqueada uma vez.

---

## 9. PERFIL

### 9.1 Perfil Pessoal (`/perfil`)

Conteudo:
- **Player Card** com avatar, nome, username, nivel, XP, streak
- **Secao de conquistas** com todas desbloqueadas e bloqueadas
- **Certificados** obtidos
- **Link para perfil publico** com botao de copiar
- **Botoes de compartilhar:** Twitter, WhatsApp, copiar link, baixar card como imagem
- **Configuracao de visibilidade:** publico/privado

### 9.2 Perfil Publico (`/u/:username`)

- Acessivel por qualquer pessoa (sem autenticacao)
- Exibe: nome, username, XP, nivel, streak, aulas concluidas, conquistas
- Se o usuario definiu `isPublic: false`, a pagina retorna 404

---

## 10. MATERIAS DE APOIO (`/materiais`)

Secoes disponiveis:
- Videos recomendados
- Livros e artigos
- Ferramentas essenciais
- Guia de instalacao do VS Code
- Desafios de laboratorio extras
- Roadmap de aprendizado visual

---

## 11. FLUXO DE CONCLUSAO COMPLETO

```
Acessar aula
  ↓
Ler conteudo / assistir video
  ↓
Interagir com secoes (quizzes inline, exercicios, playgrounds)
  ↓
Usar Tutor AI (opcional)
  ↓
Clicar "Concluir aula"
  ↓
Sistema processa:
  ├── Adiciona XP (50)
  ├── Atualiza streak
  ├── Avalia conquistas
  ├── Verifica se modulo esta completo → bonus 200 XP
  ├── Verifica se curso esta completo → bonus 1000 XP + certificado
  └── Desbloqueia proxima aula/modulo/trilha
  ↓
Toast de confirmacao exibido
  ↓
Proximo passo sugerido
```

---

## 12. ADMINISTRACAO

Acesso restrito ao email configurado em `VITE_ADMIN_EMAIL` com role `admin` no Firestore.

### 12.1 Dashboard Admin (`/admin`)
- Metricas: total de usuarios, aulas, trilhas
- Graficos: aulas por dia, usuarios por dia, crescimento, stats por trilha
- Rankings: top 10 por progresso, aulas, cursos
- Insights gerados automaticamente

### 12.2 Gestao de Usuarios (`/admin/users`)
- Tabela pesquisavel e filtravel
- Linhas expandiveis com detalhes completos do usuario
- Dados unificados do Firebase Auth + Firestore

### 12.3 Analiticas (`/admin/analytics`)
- Graficos detalhados (barras, pizza, area)
- Tabela de popularidade de aulas
- Taxas de abandono por trilha

---

## 13. SEGURANCA E REGRAS DE ACESSO

### Firestore Rules

| Colecao | Leitura | Escrita |
|---------|---------|---------|
| `users/{uid}` | Proprio usuario, perfil publico, ou admin | Apenas o proprio usuario |
| `courses` | Qualquer autenticado | Apenas admin |
| `modules` | Qualquer autenticado | Apenas admin |
| `lessons` | Qualquer autenticado | Apenas admin |
| `user_progress` | Proprio usuario ou admin | Apenas o proprio usuario |
| `user_achievements` | Proprio usuario ou admin | Apenas cria (sem update/delete) |
| `certificates` | Proprio usuario ou admin | Apenas o proprio usuario |

### Storage Rules

| Caminho | Leitura | Escrita |
|---------|---------|---------|
| `avatars/` | Qualquer autenticado | Apenas dono (max 5MB, imagem) |
| `resources/` | Qualquer autenticado | Apenas admin |
| `course-thumbnails/` | Publico | Apenas admin |
| `certificates/` | Apenas dono | Apenas dono (max 10MB) |

---

## 14. ARQUITETURA DE DADOS

### Fonte Dual de Dados
1. **Firestore** (producao) — tentativa primaria de busca
2. **Dados estaticos** em `src/data/` (fallback) — usado quando Firestore falha ou nao tem dados
3. **Cache localStorage** — para dados de curso

### Principais Colecoes Firestore

**`users/{uid}`**
```
uid, name, username, email, provider, role, createdAt, lastLogin,
xp, level, streak, lastStudyDate, completedLessons[], completedCourses[],
completedExercises, completedProjects, totalStudyTime, certificates[],
isPublic, photoURL
```

**`user_progress/{userId}_{lessonId}`**
```
userId, courseId, moduleId, lessonId, completed, completedAt,
progressPercentage, timeSpent
```

**`user_achievements/{userId}_{achievementId}`**
```
userId, achievementId, earnedAt
```

---

## 15. MAPA DE ROTAS COMPLETO

```
/                           Dashboard (protegido)
/onboarding                 Carrossel introdutório (publico)
/login                      Login (publico)
/registro                   Registro (publico)
/recuperar-senha            Recuperação de senha (publico)
/u/:username                Perfil público (publico)
/trilhas                    Visão geral das trilhas (protegido)
/trilhas/:courseId          Detalhe do curso (protegido)
/trilhas/:courseId/conclusao  Conclusão do curso (protegido)
/trilhas/:courseId/modulo/:moduleId          Detalhe do módulo (protegido)
/trilhas/:courseId/modulo/:moduleId/quiz     Quiz do módulo (protegido)
/trilhas/:courseId/modulo/:moduleId/lab      Laboratório do módulo (protegido)
/trilhas/:courseId/modulo/:moduleId/mini-projeto  Mini-projeto (protegido)
/aula/:lessonId             Aula em texto (protegido)
/video-aula/:lessonId       Video-aula (protegido)
/laboratorio                Laboratório independente (protegido)
/materiais                  Matérias de apoio (protegido)
/perfil                     Perfil pessoal (protegido)
/chat                       Chat com Tutor AI (protegido)
/admin                      Dashboard admin (admin)
/admin/users                Gestão de usuários (admin)
/admin/analytics            Analíticas detalhadas (admin)
```
