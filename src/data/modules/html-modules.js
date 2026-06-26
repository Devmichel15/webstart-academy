import { createModule, createQuiz, createQuestion, createLab, createMiniProject } from '../schemas.js'

/* ───────── Module 1 Quiz ───────── */
const htmlIntroQuiz = createQuiz({
  id: 'html-intro-quiz',
  title: 'Quiz: O que é HTML',
  questions: [
    createQuestion({ question: 'O que significa HTML?', options: ['HyperText Markup Language', 'Home Tool Markup Language', 'HyperTool Modern Language'], correctIndex: 0, explanation: 'HTML significa HyperText Markup Language.' }),
    createQuestion({ question: 'Quem criou o HTML?', options: ['Larry Page', 'Tim Berners-Lee', 'Bill Gates', 'Steve Jobs'], correctIndex: 1, explanation: 'Tim Berners-Lee criou o HTML em 1991 no CERN.' }),
    createQuestion({ question: 'HTML é uma linguagem de:', options: ['Programação', 'Marcação', 'Estilização', 'Banco de dados'], correctIndex: 1, explanation: 'HTML é uma linguagem de marcação, não de programação.' }),
  ],
})

/* ───────── Module 2 Quiz ───────── */
const htmlStructureQuiz = createQuiz({
  id: 'html-structure-quiz',
  title: 'Quiz: Estrutura Básica',
  questions: [
    createQuestion({ question: 'Qual tag envolve todo o conteúdo HTML?', options: ['<head>', '<html>', '<body>', '<main>'], correctIndex: 1, explanation: '<html> é a raiz do documento.' }),
    createQuestion({ question: 'Onde ficam os metadados?', options: ['<body>', '<head>', '<footer>', '<main>'], correctIndex: 1, explanation: '<head> contém metadados como charset e title.' }),
    createQuestion({ question: 'Qual meta tag é essencial para mobile?', options: ['charset', 'viewport', 'description', 'author'], correctIndex: 1, explanation: 'meta viewport controla o layout em dispositivos móveis.' }),
  ],
})

/* ───────── Module 3 Quiz ───────── */
const htmlTagsQuiz = createQuiz({
  id: 'html-tags-quiz',
  title: 'Quiz: Anatomia das Tags',
  questions: [
    createQuestion({ question: 'Qual parte da tag define o nome?', options: ['Atributo', 'Elemento', 'Valor', 'Conteúdo'], correctIndex: 1, explanation: 'O elemento é o nome da tag.' }),
    createQuestion({ question: 'O que é um atributo?', options: ['O conteúdo da tag', 'Informação extra sobre a tag', 'O fechamento da tag', 'O nome da tag'], correctIndex: 1, explanation: 'Atributos fornecem informações adicionais sobre a tag.' }),
  ],
})

/* ───────── Module 10 Quiz ───────── */
const htmlSemanticQuiz = createQuiz({
  id: 'html-semantic-quiz',
  title: 'Quiz: HTML Semântico',
  questions: [
    createQuestion({ question: 'Qual tag representa o conteúdo principal?', options: ['<header>', '<main>', '<section>', '<article>'], correctIndex: 1, explanation: '<main> envolve o conteúdo principal da página.' }),
    createQuestion({ question: 'Para que serve a tag <nav>?', options: ['Navegação', 'Notas', 'Novos artigos', 'Números'], correctIndex: 0, explanation: '<nav> define links de navegação.' }),
  ],
})

/* ───────── Module 13 Lab ───────── */
const htmlModernoLab = createLab({
  id: 'html-moderno-lab',
  title: 'Laboratório: Página Multimídia',
  description: 'Crie uma página usando video, audio, dialog e progress.',
  context: 'A WebStart quer uma página demo das capacidades multimídia do HTML5.',
  starterHtml: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>HTML Moderno</title>\n</head>\n<body>\n  <h1>Multimídia com HTML5</h1>\n  \n</body>\n</html>',
  starterCss: 'body { font-family: system-ui, sans-serif; max-width: 640px; margin: 0 auto; padding: 2rem; }\nvideo, audio { width: 100%; margin: 1rem 0; }\ndialog { border: 2px solid #064e3b; border-radius: 8px; padding: 2rem; }',
  hint: 'Use <video controls> e <audio controls>. Adicione um <dialog> com um botão para abrir/fechar.',
  checklist: ['Video com controles', 'Audio funcional', 'Dialog com botão', 'Progress bar'],
})

/* ───────── Module 14 Mini Project ───────── */
const htmlFinalMiniProject = createMiniProject({
  id: 'html-final-mini',
  title: 'Projeto Final: Landing Page WebStart',
  description: 'Crie uma landing page completa usando HTML semântico, SEO e acessibilidade.',
  context: 'Você foi contratado para criar a landing page da WebStart Academy. A página deve representar a identidade brutalista da marca e seguir todas as boas práticas que aprendeu.',
  requirements: [
    'DOCTYPE HTML5 com lang="pt"',
    'Header com logo e navegação',
    'Hero section com título, subtítulo e CTA',
    'Seção de features com grid de cards',
    'Seção de planos ou módulos',
    'Formulário de contato',
    'Footer completo',
    'Meta tags SEO (description, keywords)',
    'Alt text em todas as imagens',
    'Tags semânticas (main, section, article, aside)',
  ],
  starterHtml: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>WebStart Academy - Aprenda HTML</title>\n  <meta name="description" content="WebStart Academy - A melhor plataforma para aprender desenvolvimento web do zero.">\n</head>\n<body>\n  <header>\n    <h1>WebStart Academy</h1>\n    <nav>\n      <a href="#features">Recursos</a>\n      <a href="#contato">Contato</a>\n    </nav>\n  </header>\n  <main>\n    <section id="hero">\n      <h2>Aprenda HTML do Zero</h2>\n      <p>Sua jornada na web começa aqui.</p>\n    </section>\n    <section id="features">\n      \n    </section>\n    <section id="contato">\n      \n    </section>\n  </main>\n  <footer>\n    <p>&copy; 2026 WebStart Academy</p>\n  </footer>\n</body>\n</html>',
  starterCss: 'body { margin: 0; font-family: system-ui, sans-serif; line-height: 1.6; color: #064e3b; }\nheader { background: #059669; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }\nnav a { color: white; margin-left: 1rem; text-decoration: none; }\nmain { max-width: 960px; margin: 0 auto; padding: 2rem; }\nsection { margin-bottom: 3rem; }\nfooter { background: #064e3b; color: white; text-align: center; padding: 1rem; }',
  hint: 'Use article para cada feature, section para agrupar, e adicione labels nos inputs do formulário.',
  rubric: [
    'HTML semântico completo',
    'Meta tags SEO configuradas',
    'Formulário acessível com labels',
    'Hierarquia de headings correta',
    'Alt text em imagens',
    'Código limpo e indentado',
  ],
})

export const htmlModules = [
  createModule({
    id: 'html-intro-module',
    courseId: 'html',
    title: 'O que é HTML',
    description: 'Origem da Web, Tim Berners-Lee, HTML, CSS e JavaScript.',
    order: 1,
    lessons: ['html-intro'],
    quiz: htmlIntroQuiz,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-structure-module',
    courseId: 'html',
    title: 'Estrutura Básica',
    description: 'DOCTYPE, html, head, body, meta tags, viewport e title.',
    order: 2,
    lessons: ['html-structure'],
    quiz: htmlStructureQuiz,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-tags-module',
    courseId: 'html',
    title: 'Anatomia das Tags',
    description: 'Tags, elementos, hierarquia, aninhamento e boas práticas.',
    order: 3,
    lessons: ['html-tags'],
    quiz: htmlTagsQuiz,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-texts-module',
    courseId: 'html',
    title: 'Textos',
    description: 'Headings, parágrafos, formatação e blocos de código.',
    order: 4,
    lessons: ['html-headings', 'html-paragraphs'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-links-module',
    courseId: 'html',
    title: 'Links',
    description: 'Hipertexto, âncoras, links internos e externos.',
    order: 5,
    lessons: ['html-links'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-images-module',
    courseId: 'html',
    title: 'Imagens',
    description: 'Formatos, otimização e acessibilidade.',
    order: 6,
    lessons: ['html-images'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-lists-module',
    courseId: 'html',
    title: 'Listas',
    description: 'Listas ordenadas, não ordenadas e de definição.',
    order: 7,
    lessons: ['html-lists'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-tables-module',
    courseId: 'html',
    title: 'Tabelas',
    description: 'Estruturas tabulares e boas práticas.',
    order: 8,
    lessons: ['html-tables'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-forms-module',
    courseId: 'html',
    title: 'Formulários',
    description: 'Inputs, validações e formulários profissionais.',
    order: 9,
    lessons: ['html-forms'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-semantic-module',
    courseId: 'html',
    title: 'HTML Semântico',
    description: 'header, nav, main, section, article, footer e SEO.',
    order: 10,
    lessons: ['html-semantic'],
    quiz: htmlSemanticQuiz,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-seo-module',
    courseId: 'html',
    title: 'SEO para Iniciantes',
    description: 'Meta tags, headings e indexação.',
    order: 11,
    lessons: ['html-seo'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-a11y-module',
    courseId: 'html',
    title: 'Acessibilidade',
    description: 'Leitores de tela, labels, ARIA e navegação.',
    order: 12,
    lessons: ['html-accessibility'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-moderno-module',
    courseId: 'html',
    title: 'HTML Moderno',
    description: 'audio, video, iframe, dialog, progress e meter.',
    order: 13,
    lessons: ['html-moderno'],
    quiz: null,
    lab: htmlModernoLab,
    miniProject: null,
  }),
  createModule({
    id: 'html-final-project',
    courseId: 'html',
    title: 'Projeto Final',
    description: 'Landing page profissional com semântica, SEO e acessibilidade.',
    order: 14,
    lessons: [],
    quiz: null,
    lab: null,
    miniProject: htmlFinalMiniProject,
  }),
]
