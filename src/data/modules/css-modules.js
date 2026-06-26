import { createModule, createQuiz, createQuestion, createLab, createMiniProject } from '../schemas.js'

export const cssFundamentalsQuiz = createQuiz({
  id: 'css-fundamentals-quiz',
  title: 'Quiz: Fundamentos do CSS',
  questions: [
    createQuestion({
      question: 'Qual a forma recomendada de aplicar CSS?',
      options: ['Inline', 'Internal (style tag)', 'External (arquivo .css)', 'Qualquer uma'],
      correctIndex: 2,
      explanation: 'CSS externo separa estilo de conteúdo, facilita manutenção e permite cache.',
    }),
    createQuestion({
      question: 'Qual seletor tem maior especificidade?',
      options: ['Elemento (p)', 'Classe (.card)', 'ID (#hero)', 'Universal (*)'],
      correctIndex: 2,
      explanation: 'ID tem especificidade maior que classe, que é maior que elemento.',
    }),
    createQuestion({
      question: 'O que significa HSL?',
      options: ['Hue, Saturation, Lightness', 'High, Standard, Low', 'Hex, Style, Layer'],
      correctIndex: 0,
      explanation: 'HSL representa Matiz (Hue), Saturação (Saturation) e Luminosidade (Lightness).',
    }),
    createQuestion({
      question: 'Qual propriedade controla o espaçamento interno?',
      options: ['margin', 'padding', 'gap', 'spacing'],
      correctIndex: 1,
      explanation: 'padding controla o espaçamento interno entre o conteúdo e a borda.',
    }),
    createQuestion({
      question: 'O que box-sizing: border-box faz?',
      options: ['Inclui padding e border no width', 'Remove bordas do elemento', 'Adiciona borda ao conteúdo'],
      correctIndex: 0,
      explanation: 'Com border-box, o width total inclui padding e border, tornando o layout mais previsível.',
    }),
  ],
})

export const cssFundamentalsLab = createLab({
  id: 'css-fundamentals-lab',
  title: 'Laboratório: Estilização Base',
  description: 'Pratique seletores, cores e tipografia.',
  context:
    'Você está estilizando a página inicial da WebStart Academy. Precisa aplicar cores da marca, tipografia consistente e espaçamentos adequados.',
  starterHtml: '<header>\n  <h1>WebStart Academy</h1>\n  <p class="subtitle">Aprenda programação do zero</p>\n</header>\n<main>\n  <section class="card">\n    <h2>HTML5</h2>\n    <p>Estrutura semântica moderna</p>\n  </section>\n  <section class="card">\n    <h2>CSS3</h2>\n    <p>Layout e design profissional</p>\n  </section>\n</main>',
  starterCss: ':root {\n  --brand: #059669;\n  --dark: #064e3b;\n}\n* { box-sizing: border-box; }\nbody {\n  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 2rem;\n}',
  hint: 'Use variáveis CSS para cores. Aplique padding nos cards e margin entre seções.',
  checklist: [
    'Variáveis CSS definidas',
    'Tipografia configurada (font-family, line-height)',
    'Cores da marca aplicadas',
    'Espaçamentos consistentes',
    'Box-sizing border-box global',
  ],
})

export const cssFundamentalsMiniProject = createMiniProject({
  id: 'css-fundamentals-mini',
  title: 'Mini Projeto: Card de Perfil',
  description: 'Crie um card de perfil estilizado com CSS.',
  context:
    'A WebStart quer criar cards de perfil para os instrutores. Você precisa estilizar um card que será reutilizado em toda a plataforma, usando o design system brutalista da WebStart.',
  requirements: [
    'Usar variáveis CSS para cores',
    'Borda grossa (3px)',
    'Sombra offset (box-shadow)',
    'Tipografia consistente',
    'Espaçamentos com padding/margin',
    'Hover suave no card',
  ],
  starterHtml: '<div class="card">\n  <div class="avatar">WS</div>\n  <h2 class="name">Instrutor WebStart</h2>\n  <p class="role">Desenvolvedor Front-end</p>\n  <p class="bio">Especialista em HTML, CSS e JavaScript com foco em experiências de aprendizado.</p>\n  <div class="tags">\n    <span class="tag">HTML</span>\n    <span class="tag">CSS</span>\n  </div>\n</div>',
  starterCss: ':root {\n  --brand: #059669;\n  --dark: #064e3b;\n  --bg: #ffffff;\n}\n* { box-sizing: border-box; }\nbody {\n  font-family: system-ui, sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  margin: 0;\n  background: #f0fdf4;\n}\n.card {\n  \n}',
  hint: 'Use border: 3px solid var(--dark) e box-shadow: 4px 4px 0 var(--dark) para o estilo brutalista.',
  rubric: [
    'Design system WebStart seguido',
    'Variáveis CSS em uso',
    'Layout limpo e profissional',
    'Hover suave',
    'Cores consistentes',
    'Código CSS organizado',
  ],
})

export const cssLayoutQuiz = createQuiz({
  id: 'css-layout-quiz',
  title: 'Quiz: Layout com CSS',
  questions: [
    createQuestion({
      question: 'Qual display é melhor para layout bidimensional?',
      options: ['flex', 'grid', 'block', 'inline'],
      correctIndex: 1,
      explanation: 'Grid é ideal para layouts 2D (linhas e colunas simultaneamente). Flex é para 1D.',
    }),
    createQuestion({
      question: 'O que justify-content: center faz no Flexbox?',
      options: ['Centraliza no eixo principal', 'Centraliza no eixo cruzado', 'Centraliza verticalmente'],
      correctIndex: 0,
      explanation: 'justify-content alinha os itens no eixo principal (horizontal por padrão).',
    }),
    createQuestion({
      question: 'Qual unidade é relativa ao tamanho da tela?',
      options: ['px', 'rem', 'vw', 'em'],
      correctIndex: 2,
      explanation: 'vw (viewport width) é relativa à largura da viewport. 100vw = 100% da largura.',
    }),
  ],
})

export const cssLayoutLab = createLab({
  id: 'css-layout-lab',
  title: 'Laboratório: Layout Responsivo',
  description: 'Construa um layout que funciona em mobile e desktop.',
  context:
    'A página de cursos da WebStart precisa de um grid de cards responsivo. Em mobile: 1 coluna. Em tablet: 2. Em desktop: 3 colunas.',
  starterHtml: '<header>\n  <h1>Nossos Cursos</h1>\n</header>\n<main class="grid">\n  <div class="card">HTML5</div>\n  <div class="card">CSS3</div>\n  <div class="card">JavaScript</div>\n  <div class="card">React</div>\n  <div class="card">Node.js</div>\n  <div class="card">Banco de Dados</div>\n</main>',
  starterCss: '* { box-sizing: border-box; }\nbody {\n  font-family: system-ui, sans-serif;\n  margin: 0;\n  padding: 2rem;\n  background: #f0fdf4;\n}\nh1 { text-align: center; color: #059669; }\n.grid {\n  \n}\n.card {\n  padding: 2rem;\n  background: white;\n  border: 3px solid #064e3b;\n  box-shadow: 4px 4px 0 #064e3b;\n  text-align: center;\n  font-weight: bold;\n  font-size: 1.25rem;\n}',
  hint: 'Use grid-template-columns com repeat e auto-fill + minmax para responsividade sem media queries.',
  checklist: [
    'Grid layout implementado',
    'Responsivo sem media queries (auto-fill/minmax)',
    'Gap consistente entre cards',
    'Estilo brutalista nos cards',
    'Funciona em mobile e desktop',
  ],
})

export const cssLayoutMiniProject = createMiniProject({
  id: 'css-layout-mini',
  title: 'Mini Projeto: Dashboard WebStart',
  description: 'Crie um dashboard responsivo com Flexbox e Grid.',
  context:
    'Você foi contratado para criar o dashboard da WebStart Academy. O layout precisa ter sidebar, header, área principal de conteúdo e ser totalmente responsivo.',
  requirements: [
    'Layout com sidebar + header + main',
    'Sidebar fixa em desktop, oculta em mobile',
    'Grid de cards no conteúdo principal',
    'Header com navegação',
    'Responsivo (mobile-first)',
    'Usar flexbox e grid',
  ],
  starterHtml: '<div class="dashboard">\n  <aside class="sidebar">\n    <h2>WebStart</h2>\n    <nav>\n      <a href="#">Dashboard</a>\n      <a href="#">Cursos</a>\n      <a href="#">Lab</a>\n    </nav>\n  </aside>\n  <main class="content">\n    <header class="header">\n      <h1>Dashboard</h1>\n    </header>\n    <div class="grid">\n      <div class="card">Progresso</div>\n      <div class="card">Aulas</div>\n      <div class="card">XP</div>\n      <div class="card">Streak</div>\n    </div>\n  </main>\n</div>',
  starterCss: '* { box-sizing: border-box; }\nbody { margin: 0; font-family: system-ui, sans-serif; }\n.dashboard {\n  display: grid;\n  grid-template-columns: 240px 1fr;\n  min-height: 100vh;\n}\n.sidebar {\n  background: #064e3b;\n  color: white;\n  padding: 2rem;\n}\n.content {\n  padding: 2rem;\n  background: #f0fdf4;\n}\n@media (max-width: 768px) {\n  .dashboard { grid-template-columns: 1fr; }\n  .sidebar { display: none; }\n}',
  hint: 'Use grid-template-columns para o layout principal e flex/grid para os cards internos.',
  rubric: [
    'Layout de dashboard completo',
    'Sidebar funcional',
    'Grid de cards responsivo',
    'Mobile-first',
    'Design consistente',
    'Código CSS organizado',
  ],
})

export const cssAdvancedQuiz = createQuiz({
  id: 'css-advanced-quiz',
  title: 'Quiz: CSS Avançado',
  questions: [
    createQuestion({
      question: 'Qual propriedade cria uma animação baseada em estado?',
      options: ['animation', 'transition', 'transform', '@keyframes'],
      correctIndex: 1,
      explanation: 'transition anima mudanças de estado (como hover). animation + @keyframes criam animações contínuas.',
    }),
    createQuestion({
      question: 'Qual é a abordagem recomendada para responsividade?',
      options: ['Desktop-first', 'Mobile-first', 'Tablet-first', 'Tanto faz'],
      correctIndex: 1,
      explanation: 'Mobile-first é a abordagem moderna: estilize para mobile primeiro e adicione @media (min-width) para telas maiores.',
    }),
  ],
})

export const cssAdvancedLab = createLab({
  id: 'css-advanced-lab',
  title: 'Laboratório: Animações e Interações',
  description: 'Adicione micro-interações que melhoram a experiência do usuário.',
  context:
    'A WebStart quer tornar a experiência mais dinâmica. Você precisa adicionar animações sutis nos cards e botões da plataforma.',
  starterHtml: '<div class="container">\n  <button class="btn">Clique Aqui</button>\n  <div class="card">\n    <h3>Card Interativo</h3>\n    <p>Passe o mouse para ver a animação</p>\n  </div>\n  <div class="loading">Carregando...</div>\n</div>',
  starterCss: '* { box-sizing: border-box; }\nbody {\n  font-family: system-ui, sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  margin: 0;\n  background: #f0fdf4;\n}\n.container {\n  display: flex;\n  flex-direction: column;\n  gap: 2rem;\n  align-items: center;\n}\n.btn {\n  padding: 1rem 2rem;\n  background: #059669;\n  color: white;\n  border: 3px solid #064e3b;\n  font-weight: bold;\n  cursor: pointer;\n  \n}',
  hint: 'Use transition para hover effects e @keyframes + animation para o loading.',
  checklist: [
    'Botão com hover suave (scale ou translateY)',
    'Card com elevação no hover',
    'Loading animado com @keyframes',
    'Transitions suaves (0.2s-0.3s)',
    'Micro-interações com propósito',
  ],
})

export const cssModules = [
  createModule({
    id: 'css-fundamentals',
    courseId: 'css',
    title: 'Fundamentos do CSS',
    description: 'Seletores, cores, tipografia, espaçamentos e box model.',
    order: 1,
    lessons: ['css-intro', 'css-selectors', 'css-colors', 'css-typography', 'css-spacing', 'css-box-model'],
    quiz: cssFundamentalsQuiz,
    lab: cssFundamentalsLab,
    miniProject: cssFundamentalsMiniProject,
  }),
  createModule({
    id: 'css-layout',
    courseId: 'css',
    title: 'Layout com CSS',
    description: 'Flexbox, Grid e responsividade para layouts profissionais.',
    order: 2,
    lessons: ['css-flexbox', 'css-grid', 'css-responsive'],
    quiz: cssLayoutQuiz,
    lab: cssLayoutLab,
    miniProject: cssLayoutMiniProject,
  }),
  createModule({
    id: 'css-advanced',
    courseId: 'css',
    title: 'CSS Avançado',
    description: 'Animações, transições e projeto final estilizado.',
    order: 3,
    lessons: ['css-animations', 'css-project'],
    quiz: cssAdvancedQuiz,
    lab: cssAdvancedLab,
    miniProject: null,
  }),
]
