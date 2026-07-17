import { createLesson } from '../schemas.js'

export const cssLessons = [
  createLesson({
    id: 'css-intro',
    courseId: 'css',
    moduleId: 'css-fundamentals',
    title: 'Introdução ao CSS3',
    description: 'O que é CSS e como estilizar HTML.',
    duration: 15,
    xp: 25,
    order: 1,
    illustration: 'palette',
    objectives: [
      'Entender o papel do CSS na web',
      'Conhecer as formas de aplicar CSS',
      'Criar e aplicar estilos básicos',
    ],
    prerequisites: ['HTML: Estrutura Base'],
    introduction:
      'Se HTML é a estrutura de uma casa, CSS é a pintura, a decoração e o paisagismo. CSS transforma HTML puro em interfaces visuais atraentes e funcionais.',
    history:
      'CSS foi proposto por Håkon Wium Lie em 1994, quando a web ainda era apenas texto. Antes do CSS, toda estilização era feita com atributos HTML e tags como <font>. CSS1 foi lançado em 1996. CSS3 (2011+) trouxe módulos como Flexbox, Grid e animações.',
    concept:
      'CSS (Cascading Style Sheets) é uma linguagem de estilo que controla a aparência dos elementos HTML: cores, fontes, espaçamentos, layout e animações. O nome "cascading" (cascata) vem da ordem de prioridade das regras.',
    howItWorks:
      'O navegador faz o parse do HTML (DOM) e do CSS (CSSOM), combina ambos na Render Tree, calcula o layout (posição e tamanho) e finalmente pinta os pixels na tela.',
    bestPractices: [
      'Prefira CSS externo (arquivo .css)',
      'Use classes reutilizáveis em vez de IDs',
      'Mantenha estilos organizados e comentados',
      'Use variáveis CSS para temas e cores',
    ],
    commonMistakes: [
      '❌ CSS inline (mistura estilo com conteúdo)',
      '❌ !important abusivamente (quebra cascata)',
      '❌ Não resetar estilos padrão do navegador',
      '❌ Esquecer de testar em múltiplos navegadores',
    ],
    example: {
      html: '<h1 class="title">WebStart Academy</h1>\n<p class="subtitle">Aprenda CSS na prática</p>\n<button class="btn">Começar</button>',
      css: '.title { color: #059669; font-size: 2.5rem; font-weight: 800; }\n.subtitle { color: #065f46; font-size: 1.25rem; }\n.btn { background: #059669; color: white; border: none; padding: 0.75rem 1.5rem; font-weight: bold; }',
    },
    exercise: {
      prompt: 'Estilize um h1 com cor verde (#059669), fonte 2rem e um p com cor cinza escuro e fonte 1.1rem.',
      starterCode: 'h1 {}\np {}',
      hint: 'Use color para cor e font-size para tamanho.',
    },
    summary: ['CSS estiliza e dá vida ao HTML', 'Prefira CSS externo', 'Use classes reutilizáveis'],
    checklist: ['Entendi o papel do CSS', 'Apliquei estilos básicos', 'Sei as 3 formas de aplicar CSS'],
  }),

  createLesson({
    id: 'css-selectors',
    courseId: 'css',
    moduleId: 'css-fundamentals',
    title: 'Seletores',
    description: 'Elemento, classe, id e seletores combinados.',
    duration: 15,
    xp: 25,
    order: 2,
    illustration: 'target',
    objectives: [
      'Diferenciar seletores de elemento, classe e id',
      'Entender especificidade no CSS',
      'Usar seletores combinados',
    ],
    prerequisites: ['CSS: Introdução ao CSS3'],
    concept:
      'Seletores CSS definem quais elementos serão estilizados. Seletor de elemento (p), classe (.card), id (#hero). A especificidade define qual regra vence: id > classe > elemento.',
    bestPractices: [
      'Prefira classes para estilos reutilizáveis',
      'IDs são para identificação única (javascript, âncoras)',
      'Evite !important — use especificidade correta',
      'Use nomenclatura consistente (BEM, kebab-case)',
    ],
    commonMistakes: [
      '❌ Usar !important para contornar especificidade',
      '❌ Seletores muito específicos (evite chain)',
      '❌ Não entender cascata (a ordem importa)',
    ],
    example: {
      html: '<div class="card">\n  <h2 class="card__title">Título do Card</h2>\n  <p class="card__text">Texto do card</p>\n</div>\n<div id="hero">Hero Section</div>',
      css: '.card { border: 2px solid #064e3b; padding: 1.5rem; }\n.card__title { font-size: 1.5rem; color: #059669; }\n#hero { background: #ecfdf5; padding: 3rem; text-align: center; }',
    },
    exercise: {
      prompt: 'Crie classes .btn (padding 1rem, border) e .btn-primary (background verde, texto branco). Depois use ambas em um botão.',
      starterCode: '.btn {}\n.btn-primary {}',
      hint: 'btn-primary pode ser usada junto com btn: class="btn btn-primary".',
    },
    summary: ['Classes são reutilizáveis', 'IDs devem ser únicos', 'Especificidade: id > classe > elemento'],
    checklist: ['Usei seletores de classe', 'Entendi especificidade', 'Evito !important'],
  }),

  createLesson({
    id: 'css-colors',
    courseId: 'css',
    moduleId: 'css-fundamentals',
    title: 'Cores',
    description: 'Hex, RGB, HSL e variáveis CSS.',
    duration: 15,
    xp: 25,
    order: 3,
    illustration: 'colors',
    objectives: [
      'Usar diferentes formatos de cor (hex, rgb, hsl)',
      'Criar e usar variáveis CSS',
      'Manter contraste acessível',
    ],
    prerequisites: ['CSS: Seletores'],
    concept:
      'Cores em CSS podem ser definidas em hex (#059669), RGB (rgb(5,150,105)), HSL (hsl(160,94%,30%)) ou nomes (green). HSL é mais intuitivo para criar variações.',
    bestPractices: [
      'Use variáveis CSS (:root { --brand: #059669; })',
      'Mantenha contraste WCAG AA (4.5:1 para texto)',
      'HSL facilita criar paletas consistentes',
    ],
    commonMistakes: [
      '❌ Baixo contraste (texto claro em fundo claro)',
      '❌ Cores hardcoded repetidas (use variáveis)',
      '❌ Depender apenas de cor para informação',
    ],
    example: {
      html: '<div class="badge">WebStart</div>\n<button class="btn">Saiba mais</button>',
      css: ':root { --brand: #059669; --brand-dark: #064e3b; --text: #1f2937; }\n.badge { background: var(--brand); color: white; padding: 0.5rem 1rem; }\n.btn { background: var(--brand); color: white; padding: 0.75rem 1.5rem; border: 2px solid var(--brand-dark); }',
    },
    exercise: {
      prompt: 'Defina variáveis --primary (verde), --bg (cinza claro) e --text (quase preto). Aplique em body (bg, text) e h1 (primary).',
      starterCode: ':root {}\nbody {}\nh1 {}',
      hint: 'Use var(--nome) para referenciar a variável.',
    },
    summary: ['HSL é mais intuitivo para ajustar cores', 'Variáveis CSS escalam o design system', 'Sempre verifique contraste'],
    checklist: ['Usei variáveis CSS', 'Testei contraste de cores', 'Entendo HSL vs Hex'],
  }),

  createLesson({
    id: 'css-typography',
    courseId: 'css',
    moduleId: 'css-fundamentals',
    title: 'Tipografia',
    description: 'font-family, size, weight, line-height.',
    duration: 12,
    xp: 25,
    order: 4,
    illustration: 'typography',
    objectives: [
      'Configurar tipografia base com font-family',
      'Usar escala tipográfica consistente',
      'Ajustar line-height para legibilidade',
    ],
    concept:
      'font-family define a fonte. font-size o tamanho. font-weight a espessura. line-height o espaçamento entre linhas. Use system-ui ou fontes da web com @font-face ou Google Fonts.',
    bestPractices: [
      'Use font stack com fallback (system-ui, sans-serif)',
      'line-height entre 1.5 e 1.7 para corpo de texto',
      'Escala tipográfica: 1.25 ou 1.333 (modular scale)',
    ],
    commonMistakes: [
      '❌ line-height muito baixo (texto apertado)',
      '❌ Usar muitas fontes diferentes (max 2-3)',
      '❌ Tamanhos de fonte inconsistentes',
    ],
    example: {
      html: '<h1>WebStart Academy</h1>\n<h2>Aprenda programação</h2>\n<p>Na WebStart, você aprende na prática, com projetos reais e feedback constante.</p>',
      css: 'body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1f2937; }\nh1 { font-size: 2.5rem; font-weight: 800; line-height: 1.2; }\nh2 { font-size: 1.75rem; font-weight: 700; }',
    },
    exercise: {
      prompt: 'Configure body com font-family system-ui, line-height 1.7, font-size 16px. h1 com 2rem e weight 800.',
      starterCode: 'body {}\nh1 {}',
      hint: 'system-ui usa a fonte padrão do sistema operacional.',
    },
    summary: ['line-height ~1.5-1.7 para corpo', 'Use font stack com fallback', 'Escala tipográfica consistente'],
    checklist: ['Configurei tipografia base', 'Ajustei line-height', 'Usei escala consistente'],
  }),

  createLesson({
    id: 'css-spacing',
    courseId: 'css',
    moduleId: 'css-fundamentals',
    title: 'Espaçamentos',
    description: 'margin, padding e gap.',
    duration: 12,
    xp: 25,
    order: 5,
    illustration: 'spacing',
    objectives: [
      'Diferenciar margin, padding e gap',
      'Usar shorthand para espaçamentos',
      'Aplicar espaçamentos consistentes',
    ],
    concept:
      'margin é o espaço EXTERNO (entre elementos). padding é o espaço INTERNO (entre conteúdo e borda). gap funciona em Flexbox e Grid para espaçar filhos.',
    bestPractices: [
      'Use padding para espaço interno ao elemento',
      'Use margin para espaço entre elementos',
      'gap substitui margin hacks em flex/grid',
      'Shorthand: margin: 1rem 2rem (vertical horizontal)',
    ],
    commonMistakes: [
      '❌ Usar margin em flex children (use gap)',
      '❌ Confundir margin collapse com bug',
      '❌ Espaçamentos inconsistentes (use escala)',
    ],
    example: {
      html: '<div class="card">\n  <h2>WebStart</h2>\n  <p>Conteúdo com padding interno.</p>\n</div>\n<div class="card">Segundo card</div>',
      css: '.card { padding: 1.5rem; margin-bottom: 1rem; border: 2px solid #064e3b; }',
    },
    exercise: {
      prompt: 'Crie .card com padding 1.5rem e margin-bottom 1rem. Adicione um container flex com gap 1rem.',
      starterCode: '.card {}\n.container {}',
      hint: 'padding = interno, margin = externo, gap = entre flex/grid children.',
    },
    summary: ['margin = espaço externo', 'padding = espaço interno', 'gap para Flexbox e Grid'],
    checklist: ['Diferencio margin e padding', 'Usei shorthand', 'Usei gap em flex/grid'],
  }),

  createLesson({
    id: 'css-box-model',
    courseId: 'css',
    moduleId: 'css-fundamentals',
    title: 'Box Model',
    description: 'content, padding, border, margin e box-sizing.',
    duration: 15,
    xp: 25,
    order: 6,
    illustration: 'box',
    objectives: [
      'Entender o Box Model completo',
      'Usar box-sizing: border-box',
      'Calcular tamanho total de elementos',
    ],
    introduction:
      'Todo elemento HTML é uma caixa retangular. O Box Model descreve como o CSS calcula o tamanho dessa caixa: conteúdo → padding → borda → margem.',
    concept:
      'O Box Model é composto de 4 camadas: content (conteúdo), padding (espaço interno), border (borda) e margin (espaço externo). O box-sizing define como width/height interagem com essas camadas.',
    howItWorks:
      'Sem border-box: width = apenas content. Com border-box: width = content + padding + border. Sempre use border-box globalmente para layout previsível.',
    bestPractices: ['Sempre use box-sizing: border-box global (*)', 'Use width + padding + border para definir tamanhos precisos'],
    example: {
      html: '<div class="box">200px com border-box</div>',
      css: '* { box-sizing: border-box; }\n.box { width: 200px; padding: 20px; border: 3px solid #059669; margin: 10px; }',
    },
    exercise: {
      prompt: 'Aplique border-box globalmente. Crie uma .box com width 300px, padding 16px, border 3px. Qual o tamanho total real?',
      starterCode: '* {}\n.box { width: 300px; }',
      hint: 'Com border-box, width = 300px inclui padding e border.',
    },
    summary: ['border-box é padrão moderno', 'Box Model: content → padding → border → margin', 'Com border-box, width inclui padding+border'],
    checklist: ['Entendi o Box Model', 'Usei border-box globalmente', 'Sei calcular tamanho real'],
  }),

  createLesson({
    id: 'css-flexbox',
    courseId: 'css',
    moduleId: 'css-layout',
    title: 'Flexbox',
    description: 'display flex, justify-content, align-items.',
    duration: 20,
    xp: 35,
    order: 1,
    illustration: 'flex',
    objectives: [
      'Criar layouts com Flexbox',
      'Alinhar itens com justify-content e align-items',
      'Usar flex para distribuir espaço',
    ],
    concept:
      'Flexbox é um modelo de layout unidimensional. display: flex no container. justify-content alinha no eixo principal. align-items no eixo cruzado. flex: 1 nos filhos para distribuir espaço.',
    bestPractices: [
      'Use gap em vez de margins entre flex items',
      'flex-wrap: wrap para itens quebrarem em nova linha',
      'Use flex shorthand (flex: 1 = flex-grow: 1)',
    ],
    commonMistakes: [
      '❌ Usar Flexbox para layout 2D (use Grid)',
      '❌ Esquecer que flex-direction muda os eixos',
    ],
    example: {
      html: '<div class="flex-container">\n  <div class="item">1</div>\n  <div class="item">2</div>\n  <div class="item">3</div>\n</div>',
      css: '.flex-container { display: flex; gap: 1rem; justify-content: center; }\n.item { flex: 1; padding: 1rem; background: #ecfdf5; border: 2px solid #064e3b; text-align: center; }',
    },
    exercise: {
      prompt: 'Crie um flex container centralizado com 3 itens, gap 1rem, cada item com flex: 1.',
      starterCode: '.container {}\n.item {}',
      hint: 'display: flex; justify-content: center; gap: 1rem;',
    },
    summary: ['Flexbox = layout em 1 dimensão', 'justify + align controlam posicionamento', 'gap substitui margin hacks'],
    checklist: ['Criei layout flex', 'Usei justify-content e align-items', 'Usei gap entre itens'],
  }),

  createLesson({
    id: 'css-grid',
    courseId: 'css',
    moduleId: 'css-layout',
    title: 'CSS Grid',
    description: 'display grid, grid-template-columns.',
    duration: 20,
    xp: 35,
    order: 2,
    illustration: 'grid',
    objectives: [
      'Criar layouts bidimensionais com Grid',
      'Usar grid-template-columns e grid-template-rows',
      'Combinar Grid com Flexbox',
    ],
    concept:
      'CSS Grid é um sistema de layout bidimensional. display: grid. grid-template-columns define colunas. grid-template-rows define linhas. gap espaça células.',
    bestPractices: [
      'Grid para layouts de página (2D)',
      'Flexbox para componentes (1D)',
      'Use fr para distribuir espaço proporcional',
      'repeat() e minmax() para grids responsivos',
    ],
    commonMistakes: ['❌ Grid para tudo (Flexbox é melhor para 1D)', '❌ Não usar gap', '❌ grid-template-columns muito rígido (sem responsividade)'],
    example: {
      html: '<div class="grid">\n  <div>1</div><div>2</div><div>3</div>\n  <div>4</div><div>5</div><div>6</div>\n</div>',
      css: '.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }',
    },
    exercise: {
      prompt: 'Grid com 3 colunas iguais, gap 1.5rem, e 4 itens dentro.',
      starterCode: '.grid {}\n.item {}',
      hint: 'grid-template-columns: repeat(3, 1fr);',
    },
    summary: ['Grid = layout 2D', 'repeat() e fr simplificam colunas', 'Grid para página, Flex para componentes'],
    checklist: ['Criei grid layout', 'Usei repeat e fr', 'Entendo Grid vs Flexbox'],
  }),

  createLesson({
    id: 'css-responsive',
    courseId: 'css',
    moduleId: 'css-layout',
    title: 'Responsividade',
    description: 'Media queries, unidades relativas e mobile-first.',
    duration: 20,
    xp: 35,
    order: 3,
    illustration: 'responsive',
    objectives: [
      'Entender mobile-first como abordagem padrão',
      'Usar media queries para breakpoints',
      'Aplicar unidades relativas (rem, %, vw, vh)',
    ],
    concept:
      'Design responsivo adapta o layout ao tamanho da tela. Mobile-first: estilize para mobile primeiro, depois adicione @media (min-width) para telas maiores. Use unidades relativas em vez de px fixos.',
    bestPractices: [
      'Mobile-first: @media (min-width: 768px)',
      'Use rem em vez de px para fontes',
      'Breakpoints comuns: 640px, 768px, 1024px, 1280px',
      'Teste em dispositivos reais, não só no DevTools',
    ],
    commonMistakes: [
      '❌ px fixos em vez de unidades relativas',
      '❌ Desktop-first (mais CSS para reverter)',
      '❌ Breakpoints demais ou de menos',
    ],
    example: {
      html: '<div class="container">\n  <div class="card">Responsivo</div>\n  <div class="card">Adaptável</div>\n</div>',
      css: '.container { display: grid; gap: 1rem; }\n.card { padding: 1rem; border: 2px solid #064e3b; }\n@media (min-width: 768px) { .container { grid-template-columns: repeat(2, 1fr); } }',
    },
    exercise: {
      prompt: 'Container 100% em mobile, max-width 960px centralizado em telas > 768px. Use media query.',
      starterCode: '.container {}\n@media (min-width: 768px) { .container { } }',
      hint: 'Mobile-first: comece sem media query, depois adicione @media.',
    },
    summary: ['Mobile-first é padrão moderno', 'rem e % > px fixo', 'Media queries adaptam layout'],
    checklist: ['Usei media queries', 'Pensei mobile-first', 'Usei unidades relativas'],
  }),

  createLesson({
    id: 'css-animations',
    courseId: 'css',
    moduleId: 'css-advanced',
    title: 'Animações',
    description: 'transition, transform e @keyframes.',
    duration: 20,
    xp: 35,
    order: 1,
    illustration: 'motion',
    objectives: [
      'Criar transições suaves com transition',
      'Usar transform para transformações 2D/3D',
      'Criar animações com @keyframes',
    ],
    concept:
      'transition anima mudanças entre estados (hover, focus). transform modifica posição, escala e rotação. @keyframes define animações complexas com múltiplos passos.',
    bestPractices: [
      'Transições curtas: 0.2s a 0.3s',
      'Use transform em vez de animar width/height (melhor performance)',
      'Prefira animações sutis e com propósito',
      'Respeite prefers-reduced-motion',
    ],
    commonMistakes: [
      '❌ Animações muito longas ou lentas',
      '❌ Animar propriedades caras (width, height, top, left)',
      '❌ Exagero em animações (distrai o usuário)',
    ],
    example: {
      html: '<button class="btn">Hover me</button>\n<div class="loading">Carregando...</div>',
      css: '.btn { transition: transform 0.2s, box-shadow 0.2s; }\n.btn:hover { transform: translateY(-3px); box-shadow: 4px 4px 0 #064e3b; }\n@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }\n.loading { animation: pulse 1s infinite; }',
    },
    exercise: {
      prompt: 'Botão com transition no hover: scale(1.05) e sombra. Crie um loading animado com @keyframes pulse.',
      starterCode: '.btn {}\n.btn:hover {}\n@keyframes pulse {}',
      hint: 'transition: transform 0.2s; no botão. @keyframes com 0%, 50%, 100%.',
    },
    summary: ['transition para mudanças de estado', 'keyframes para animações contínuas', 'Use com moderação e propósito'],
    checklist: ['Criei hover animado', 'Entendi transition vs animation', 'Usei @keyframes'],
  }),

  createLesson({
    id: 'css-project',
    courseId: 'css',
    moduleId: 'css-advanced',
    title: 'Projeto Final CSS',
    description: 'Estilize a landing page HTML com design WebStart.',
    duration: 30,
    xp: 50,
    order: 2,
    illustration: 'project',
    objectives: [
      'Aplicar todos os conceitos CSS em um projeto real',
      'Criar um design system consistente',
      'Entregar uma página responsiva e animada',
    ],
    context:
      'Você é o designer/developer responsável pela landing page da WebStart Academy. Precisa criar uma identidade visual marcante usando o estilo brutalista (bordas grossas, sombras duras, cores vibrantes).',
    concept:
      'O Design System WebStart usa: bordas 3px, box-shadow offset, paleta verde (#059669 e variações), tipografia bold, cards elevados e micro-interações.',
    example: {
      html: '<section class="hero">\n  <h1>WebStart Academy</h1>\n  <p>Aprenda programação na prática</p>\n  <button class="btn">Começar</button>\n</section>',
      css: ':root { --green: #059669; --dark: #064e3b; --shadow: 4px 4px 0 var(--dark); }\n.hero { border: 3px solid var(--dark); box-shadow: var(--shadow); padding: 3rem; text-align: center; }\n.btn { background: var(--green); color: white; border: 3px solid var(--dark); padding: 0.75rem 2rem; font-weight: bold; transition: transform 0.2s; cursor: pointer; }\n.btn:hover { transform: translateY(-2px); }',
    },
    challenge: {
      prompt: 'Crie um hero section com fundo verde claro, título grande, subtítulo e botão. Adicione uma sombra offset característica.',
      starterCode: '.hero {}\n.hero h1 {}\n.hero .btn {}',
      hint: 'Use box-shadow: 4px 4px 0 var(--dark) para o estilo brutalista.',
    },
    summary: [
      'Projeto integra todos os conceitos CSS',
      'Design system consistente = marca forte',
      'Responsivo e animado = experiência profissional',
    ],
    checklist: ['Landing page estilizada', 'Design responsivo', 'Animações sutis', 'Projeto concluído'],
  }),
]
