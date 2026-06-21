export const supportMaterials = [
  {
    id: 'html',
    title: 'Materiais HTML5',
    videos: [
      { title: 'HTML Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=UB1O30fR-EE' },
      { title: 'HTML Semântico', channel: 'Origamid', url: 'https://www.youtube.com/watch?v=T8EiM9forLU' },
    ],
    books: [
      { title: 'HTML and CSS: Design and Build Websites', author: 'Jon Duckett' },
      { title: 'Learning Web Design', author: 'Jennifer Niederst Robbins' },
    ],
    tools: [
      { name: 'MDN HTML Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
      { name: 'Can I Use', url: 'https://caniuse.com/' },
      { name: 'W3C Validator', url: 'https://validator.w3.org/' },
    ],
    extensions: ['Live Server', 'Prettier', 'Material Icon Theme', 'Error Lens'],
  },
  {
    id: 'css',
    title: 'Materiais CSS3',
    videos: [
      { title: 'CSS Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=yfoY53QXEnI' },
      { title: 'Flexbox in 15 min', channel: 'Web Dev Simplified', url: 'https://www.youtube.com/watch?v=fYq5PXgZslU' },
    ],
    books: [
      { title: 'CSS: The Definitive Guide', author: 'Eric Meyer' },
      { title: 'Every Layout', author: 'Heydon Pickering' },
    ],
    tools: [
      { name: 'MDN CSS Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
      { name: 'Flexbox Froggy', url: 'https://flexboxfroggy.com/' },
      { name: 'Grid Garden', url: 'https://cssgridgarden.com/' },
    ],
    extensions: ['Live Server', 'Prettier', 'Color Highlight', 'Tailwind CSS IntelliSense'],
  },
]

export const vscodeGuide = {
  title: 'Configuração do VS Code',
  steps: [
    {
      title: '1. Instalar VS Code',
      content: 'Baixe em code.visualstudio.com. Instale e abra o editor.',
      link: 'https://code.visualstudio.com/',
    },
    {
      title: '2. Live Server',
      content: 'Extensão essencial para preview em tempo real. Clique "Go Live" na barra inferior.',
      extension: 'Live Server (Ritwick Dey)',
    },
    {
      title: '3. Prettier',
      content: 'Formata código automaticamente. Configure format on save nas settings.',
      extension: 'Prettier - Code formatter',
    },
    {
      title: '4. Material Icon Theme',
      content: 'Ícones visuais para arquivos e pastas — facilita navegação.',
      extension: 'Material Icon Theme',
    },
    {
      title: '5. Error Lens',
      content: 'Mostra erros inline no editor — feedback instantâneo.',
      extension: 'Error Lens',
    },
    {
      title: '6. GitHub Copilot (opcional)',
      content: 'Assistente de IA para autocompletar código. Requer assinatura.',
      extension: 'GitHub Copilot',
    },
  ],
}

export const learningRoadmap = [
  { phase: 'Fundamentos', items: ['HTML5 estrutura', 'CSS3 básico', 'VS Code setup'] },
  { phase: 'Layout', items: ['Box Model', 'Flexbox', 'Grid', 'Responsividade'] },
  { phase: 'Prática', items: ['Projeto HTML', 'Projeto CSS', 'Laboratório'] },
  { phase: 'Próximos passos', items: ['JavaScript', 'React', 'Backend'] },
]

export const labChallenges = [
  {
    id: 'challenge-1',
    title: 'Card WebStart',
    description: 'Crie um card com borda grossa, sombra e título verde.',
    starterHtml: '<div class="card">\n  <h2>WebStart</h2>\n  <p>Academia online</p>\n</div>',
    starterCss: '.card {\n  \n}',
    hint: 'Use border: 3px solid e box-shadow: 4px 4px 0.',
  },
  {
    id: 'challenge-2',
    title: 'Navbar Flex',
    description: 'Navbar horizontal com logo à esquerda e links à direita.',
    starterHtml: '<nav class="navbar">\n  <span class="logo">WebStart</span>\n  <div class="links">\n    <a href="#">Cursos</a>\n    <a href="#">Lab</a>\n  </div>\n</nav>',
    starterCss: '.navbar {\n  \n}',
    hint: 'display: flex; justify-content: space-between;',
  },
  {
    id: 'challenge-3',
    title: 'Grid de Cursos',
    description: 'Grid 2x2 com cards de cursos.',
    starterHtml: '<div class="grid">\n  <div class="item">HTML</div>\n  <div class="item">CSS</div>\n  <div class="item">JS</div>\n  <div class="item">React</div>\n</div>',
    starterCss: '.grid {\n  \n}\n.item {\n  padding: 1rem;\n  border: 2px solid #064e3b;\n}',
    hint: 'grid-template-columns: repeat(2, 1fr); gap: 1rem;',
  },
]
