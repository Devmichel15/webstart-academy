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

/* ───────── Module 4 Quiz ───────── */
const htmlTextsQuiz = createQuiz({
  id: 'html-texts-quiz',
  title: 'Quiz: Textos e Hierarquia',
  questions: [
    createQuestion({ question: 'Quantos h1 uma página deve ter?', options: ['Apenas um', 'Quantos quiser', 'No máximo 3', 'Nenhum'], correctIndex: 0, explanation: 'Deve haver apenas um h1 por página.' }),
    createQuestion({ question: 'Qual tag usar para importância grave?', options: ['<b>', '<strong>', '<i>', '<em>'], correctIndex: 1, explanation: '<strong> indica importância grave, <b> é apenas visual.' }),
    createQuestion({ question: 'O que significa pular de h1 para h4?', options: ['É aceitável', 'Quebra a hierarquia semântica', 'O código não valida', 'Melhora o SEO'], correctIndex: 1, explanation: 'Pular níveis quebra a hierarquia para leitores de tela e motores de busca.' }),
  ],
})

/* ───────── Module 5 Quiz ───────── */
const htmlLinksQuiz = createQuiz({
  id: 'html-links-quiz',
  title: 'Quiz: Links',
  questions: [
    createQuestion({ question: 'Qual atributo do <a> define o destino?', options: ['src', 'href', 'link', 'dest'], correctIndex: 1, explanation: 'href (hypertext reference) define o destino do link.' }),
    createQuestion({ question: 'Por que usar rel="noopener"?', options: ['Melhora o SEO', 'Segurança contra tabnabbing', 'Acelera o carregamento', 'É obrigatório'], correctIndex: 1, explanation: 'Sem noopener, a nova página pode acessar a aba anterior via window.opener.' }),
    createQuestion({ question: 'Qual texto de link é o mais adequado?', options: ['"Clique aqui"', '"Saiba mais sobre HTML semântico"', '"Link"', '"Mais"'], correctIndex: 1, explanation: 'O texto do link deve descrever o destino.' }),
  ],
})

/* ───────── Module 6 Quiz ───────── */
const htmlImagesQuiz = createQuiz({
  id: 'html-images-quiz',
  title: 'Quiz: Imagens',
  questions: [
    createQuestion({ question: 'Qual atributo de img é obrigatório para acessibilidade?', options: ['src', 'alt', 'width', 'height'], correctIndex: 1, explanation: 'alt descreve a imagem para leitores de tela.' }),
    createQuestion({ question: 'Por que definir width e height?', options: ['Melhora a resolução', 'Evita layout shift (CLS)', 'Reduz o tamanho', 'Acelera o download'], correctIndex: 1, explanation: 'Sem width/height, a imagem ao carregar empurra o conteúdo para baixo.' }),
    createQuestion({ question: 'Qual formato é ideal para logotipos?', options: ['JPEG', 'SVG', 'GIF', 'BMP'], correctIndex: 1, explanation: 'SVG é vetorial, escalável e suporta transparência.' }),
  ],
})

/* ───────── Module 7 Quiz ───────── */
const htmlListsQuiz = createQuiz({
  id: 'html-lists-quiz',
  title: 'Quiz: Listas',
  questions: [
    createQuestion({ question: 'Quando usar ol em vez de ul?', options: ['Ordem importa', 'Ordem não importa', 'Sempre', 'Nunca'], correctIndex: 0, explanation: 'ol para sequências onde a ordem importa.' }),
    createQuestion({ question: 'Qual tag define item de lista?', options: ['<item>', '<li>', '<dd>', '<dt>'], correctIndex: 1, explanation: '<li> (list item) para cada elemento.' }),
    createQuestion({ question: 'Para que serve <dl>?', options: ['Download', 'Definições (termo + descrição)', 'Lista aninhada', 'Links'], correctIndex: 1, explanation: '<dl> com <dt> e <dd> para glossários.' }),
  ],
})

/* ───────── Module 8 Quiz ───────── */
const htmlTablesQuiz = createQuiz({
  id: 'html-tables-quiz',
  title: 'Quiz: Tabelas',
  questions: [
    createQuestion({ question: 'Qual tag é para cabeçalho de tabela?', options: ['<td>', '<th>', '<thead>', '<caption>'], correctIndex: 1, explanation: '<th> (table header) para células de cabeçalho.' }),
    createQuestion({ question: 'Para que serve scope no <th>?', options: ['Largura', 'Conectar cabeçalho às células', 'Cor', 'Alinhamento'], correctIndex: 1, explanation: 'scope conecta semanticamente o cabeçalho às células.' }),
    createQuestion({ question: 'Por que não usar tabelas para layout?', options: ['São feias', 'Quebram acessibilidade', 'São lentas', 'Não funcionam'], correctIndex: 1, explanation: 'Tabelas para layout prejudicam acessibilidade.' }),
  ],
})

/* ───────── Module 9 Quiz ───────── */
const htmlFormsQuiz = createQuiz({
  id: 'html-forms-quiz',
  title: 'Quiz: Formulários',
  questions: [
    createQuestion({ question: 'Como associar label ao input?', options: ['for no label + id no input', 'name igual', 'Placeholder', 'Automaticamente'], correctIndex: 0, explanation: '<label for="id"> + <input id="id">' }),
    createQuestion({ question: 'Qual atributo torna campo obrigatório?', options: ['obrigatory', 'required', 'mandatory', 'force'], correctIndex: 1, explanation: 'required bloqueia envio se campo vazio.' }),
    createQuestion({ question: 'Qual tipo de input valida email?', options: ['text', 'email', 'url', 'tel'], correctIndex: 1, explanation: 'type="email" valida formato e mostra teclado com @.' }),
  ],
})

/* ───────── Module 10 Quiz ───────── */
const htmlSemanticQuiz = createQuiz({
  id: 'html-semantic-quiz',
  title: 'Quiz: HTML Semântico',
  questions: [
    createQuestion({ question: 'Qual tag representa o conteúdo principal?', options: ['<header>', '<main>', '<section>', '<article>'], correctIndex: 1, explanation: '<main> envolve o conteúdo principal da página.' }),
    createQuestion({ question: 'Para que serve a tag <nav>?', options: ['Navegação', 'Notas', 'Novos artigos', 'Números'], correctIndex: 0, explanation: '<nav> define links de navegação.' }),
    createQuestion({ question: 'Qual a diferença entre article e section?', options: ['Nenhuma', 'Article é independente, section agrupa', 'Section é maior', 'Article é para blogs'], correctIndex: 1, explanation: 'Article faz sentido sozinho (RSS), section agrupa conteúdo relacionado.' }),
  ],
})

/* ───────── Module 11 Quiz ───────── */
const htmlSeoQuiz = createQuiz({
  id: 'html-seo-quiz',
  title: 'Quiz: SEO',
  questions: [
    createQuestion({ question: 'Qual meta tag fornece o snippet do Google?', options: ['keywords', 'description', 'author', 'robots'], correctIndex: 1, explanation: 'meta description aparece como resumo nos resultados.' }),
    createQuestion({ question: 'O que OG tags controlam?', options: ['SEO', 'Redes sociais', 'Velocidade', 'Cores'], correctIndex: 1, explanation: 'Open Graph controla como o link aparece em redes sociais.' }),
    createQuestion({ question: 'O que é URL amigável?', options: ['/p?id=1', '/curso-html5', '/pagina.php', '/123'], correctIndex: 1, explanation: 'URLs descritivas com hífens são melhores para SEO.' }),
  ],
})

/* ───────── Module 12 Quiz ───────── */
const htmlA11yQuiz = createQuiz({
  id: 'html-a11y-quiz',
  title: 'Quiz: Acessibilidade',
  questions: [
    createQuestion({ question: 'O que significa WCAG?', options: ['World Computer Group', 'Web Content Accessibility Guidelines', 'Web Color Guide', 'W3C Code'], correctIndex: 1, explanation: 'Diretrizes de acessibilidade do W3C.' }),
    createQuestion({ question: 'Qual a regra de ouro do ARIA?', options: ['Usar sempre', 'No ARIA > bad ARIA', 'ARIA é obrigatório', 'Evitar'], correctIndex: 1, explanation: 'Prefira HTML semântico, ARIA só quando necessário.' }),
    createQuestion({ question: 'Contraste mínimo recomendado?', options: ['2:1', '3:1', '4.5:1', '7:1'], correctIndex: 2, explanation: 'WCAG exige 4.5:1 para texto normal.' }),
  ],
})

/* ───────── Module 13 Quiz ───────── */
const htmlModernoQuiz = createQuiz({
  id: 'html-moderno-quiz',
  title: 'Quiz: HTML Moderno',
  questions: [
    createQuestion({ question: 'Atributo essencial para controlar mídia?', options: ['autoplay', 'controls', 'loop', 'muted'], correctIndex: 1, explanation: 'controls permite play, pause, volume.' }),
    createQuestion({ question: 'Por que múltiplos <source>?', options: ['Qualidade', 'Fallback de formatos', 'Velocidade', 'Vários vídeos'], correctIndex: 1, explanation: 'Fallback se navegador não suportar o primeiro formato.' }),
    createQuestion({ question: 'Atributo obrigatório em iframe para acessibilidade?', options: ['src', 'title', 'width', 'height'], correctIndex: 1, explanation: 'title descreve o conteúdo do iframe.' }),
  ],
})

/* ───────── Module 1 Mini Project ───────── */
const htmlIntroMiniProject = createMiniProject({
  id: 'html-intro-mini',
  title: 'Micro-Projeto: Página de Perfil',
  description: 'Crie sua primeira página web: um perfil profissional.',
  context: 'Você vai criar a página de perfil que João, do contexto da aula, gostaria de ter para mostrar seu trabalho para agências.',
  requirements: [
    'DOCTYPE HTML5 e lang="pt"',
    'Meta charset UTF-8 e viewport',
    'Title: "Meu Perfil - [Seu Nome]"',
    'h1 com seu nome',
    'p com sua área de atuação',
    'p com um resumo profissional',
  ],
  starterHtml: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Meu Perfil</title>\n</head>\n<body>\n  <h1>Seu Nome</h1>\n  <p>Sua área de atuação</p>\n  <p>Resumo profissional</p>\n</body>\n</html>',
  starterCss: 'body { font-family: system-ui, sans-serif; max-width: 640px; margin: 0 auto; padding: 2rem; line-height: 1.6; }\nh1 { color: #059669; }',
  hint: 'Preencha o h1 com seu nome, o primeiro p com sua profissão, o segundo p com um resumo.',
  rubric: [
    'Estrutura HTML completa',
    'Meta tags configuradas',
    'Headings e parágrafos corretos',
    'Código indentado',
  ],
})

/* ───────── Module 4 Mini Project ───────── */
const htmlTextsMiniProject = createMiniProject({
  id: 'html-texts-mini',
  title: 'Micro-Projeto: Página de Artigo',
  description: 'Crie um artigo de blog usando headings e formatação semântica.',
  context: 'Você é o editor de um blog de tecnologia e precisa publicar um artigo sobre HTML. Use headings hierárquicos e formatação semântica.',
  requirements: [
    'h1 com título do artigo',
    'Mínimo 3 seções com h2',
    'Subseções com h3',
    'strong em palavras importantes',
    'em em palavras com ênfase',
    'blockquote para citação',
  ],
  starterHtml: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Artigo: HTML5</title>\n</head>\n<body>\n  <article>\n    <h1></h1>\n  </article>\n</body>\n</html>',
  starterCss: 'body { font-family: system-ui; max-width: 720px; margin: 0 auto; padding: 2rem; line-height: 1.7; }\nh1 { color: #059669; }\nblockquote { border-left: 4px solid #059669; padding-left: 1rem; }',
  hint: 'Estruture com h1, depois h2 para seções, h3 para subseções. Use strong em dados importantes.',
  rubric: [
    'Hierarquia de headings correta',
    'strong e em usados semanticamente',
    'blockquote presente',
    'Código organizado',
  ],
})

/* ───────── Module 5 Mini Project ───────── */
const htmlLinksMiniProject = createMiniProject({
  id: 'html-links-mini',
  title: 'Micro-Projeto: Mapa do Site',
  description: 'Crie uma página com navegação completa usando links.',
  context: 'Um site precisa de uma página de navegação com links internos, externos e âncoras.',
  requirements: [
    'nav com 4 links internos',
    'Link externo com target e rel seguros',
    'Âncora "#topo" para voltar ao início',
    'Link para email (mailto:)',
    'Texto descritivo em todos os links',
  ],
  starterHtml: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Navegação</title>\n</head>\n<body>\n  <nav>\n    \n  </nav>\n  <main>\n    \n  </main>\n</body>\n</html>',
  starterCss: 'body { font-family: system-ui; max-width: 640px; margin: 0 auto; padding: 2rem; }\nnav a { display: block; margin: 0.5rem 0; }',
  hint: 'Links externos precisam de target="_blank" + rel="noopener noreferrer".',
  rubric: [
    'Links internos e externos',
    'Segurança em links externos',
    'Âncora funcional',
    'Texto descritivo',
  ],
})

/* ───────── Module 10 Mini Project ───────── */
const htmlSemanticMiniProject = createMiniProject({
  id: 'html-semantic-mini',
  title: 'Micro-Projeto: Página de Notícia',
  description: 'Estruture uma página de notícia usando tags semânticas HTML5.',
  context: 'Você trabalha no portal de notícias WebStart News e precisa estruturar uma matéria usando HTML semântico.',
  requirements: [
    'header com logo e nav',
    'main com article',
    'article com header (título + data)',
    'Sections com h3 dentro do article',
    'aside com notícias relacionadas',
    'footer com copyright',
  ],
  starterHtml: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>WebStart News</title>\n</head>\n<body>\n  <header>\n    <h1>WebStart News</h1>\n    <nav>\n      <a href="/">Início</a>\n    </nav>\n  </header>\n  <main>\n    <article>\n      \n    </article>\n    <aside>\n      \n    </aside>\n  </main>\n  <footer>\n    \n  </footer>\n</body>\n</html>',
  starterCss: 'body { font-family: system-ui; max-width: 960px; margin: 0 auto; padding: 1rem; }\nheader, footer { background: #ecfdf5; padding: 1rem; }\nmain { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }',
  hint: 'Use article para a notícia principal, aside para links relacionados, section para dividir o artigo.',
  rubric: [
    'header, main, footer usados corretamente',
    'article com header interno',
    'aside com conteúdo complementar',
    'Sem divs desnecessárias',
  ],
})

/* ───────── Module 14 Lab ───────── */
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
    'Seção de módulos',
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
    miniProject: htmlIntroMiniProject,
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
    quiz: htmlTextsQuiz,
    lab: null,
    miniProject: htmlTextsMiniProject,
  }),
  createModule({
    id: 'html-links-module',
    courseId: 'html',
    title: 'Links',
    description: 'Hipertexto, âncoras, links internos e externos.',
    order: 5,
    lessons: ['html-links'],
    quiz: htmlLinksQuiz,
    lab: null,
    miniProject: htmlLinksMiniProject,
  }),
  createModule({
    id: 'html-images-module',
    courseId: 'html',
    title: 'Imagens',
    description: 'Formatos, otimização e acessibilidade.',
    order: 6,
    lessons: ['html-images'],
    quiz: htmlImagesQuiz,
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
    quiz: htmlListsQuiz,
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
    quiz: htmlTablesQuiz,
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
    quiz: htmlFormsQuiz,
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
    miniProject: htmlSemanticMiniProject,
  }),
  createModule({
    id: 'html-seo-module',
    courseId: 'html',
    title: 'SEO para Iniciantes',
    description: 'Meta tags, headings e indexação.',
    order: 11,
    lessons: ['html-seo'],
    quiz: htmlSeoQuiz,
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
    quiz: htmlA11yQuiz,
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
    quiz: htmlModernoQuiz,
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
  createModule({
    id: 'html-video-exercises-module',
    courseId: 'html-exercises',
    title: 'Exercícios em Vídeo',
    description: 'Coloque em prática todos os conceitos aprendidos através de exercícios guiados em vídeo.',
    order: 15,
    lessons: ['html-video-ex-1'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),

  // ─── Módulos de Vídeo — Trilha HTML ─────────────────────────────────────
  createModule({
    id: 'html-vid-intro',
    courseId: 'html',
    title: 'Introdução ao Curso (Vídeo)',
    description: 'Apresentação, convenções e visão geral do curso de HTML5 e CSS3.',
    order: 15,
    lessons: ['html-vid-intro-1', 'html-vid-intro-2', 'html-vid-intro-3', 'html-vid-intro-4', 'html-vid-intro-5'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-vid-fundamentals',
    courseId: 'html',
    title: 'Fundamentos da Web (Vídeo)',
    description: 'Internet, domínio, hospedagem, front-end e back-end explicados em vídeo.',
    order: 16,
    lessons: ['html-vid-fund-1', 'html-vid-fund-2', 'html-vid-fund-3', 'html-vid-fund-4', 'html-vid-fund-5'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-vid-basics',
    courseId: 'html',
    title: 'HTML Básico (Vídeo)',
    description: 'Ferramentas, primeiro código, parágrafos e símbolos em vídeo.',
    order: 17,
    lessons: ['html-vid-basics-1', 'html-vid-basics-2', 'html-vid-basics-3', 'html-vid-basics-4'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-vid-images',
    courseId: 'html',
    title: 'Imagens (Vídeo)',
    description: 'Formatos, otimização, tag img, favicon e imagens responsivas em vídeo.',
    order: 18,
    lessons: ['html-vid-img-1', 'html-vid-img-2', 'html-vid-img-3', 'html-vid-img-4', 'html-vid-img-5', 'html-vid-img-6', 'html-vid-img-7'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-vid-texts',
    courseId: 'html',
    title: 'Textos e Semântica (Vídeo)',
    description: 'Títulos, semântica, formatação e citações em vídeo.',
    order: 19,
    lessons: ['html-vid-text-1', 'html-vid-text-2', 'html-vid-text-3', 'html-vid-text-4', 'html-vid-text-5'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-vid-lists',
    courseId: 'html',
    title: 'Listas (Vídeo)',
    description: 'Listas ordenadas, não ordenadas, mistas e de definição em vídeo.',
    order: 20,
    lessons: ['html-vid-list-1', 'html-vid-list-2'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-vid-links',
    courseId: 'html',
    title: 'Links (Vídeo)',
    description: 'Âncoras, links internos e download em vídeo.',
    order: 21,
    lessons: ['html-vid-link-1', 'html-vid-link-2', 'html-vid-link-3'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-vid-media',
    courseId: 'html',
    title: 'Mídia (Vídeo)',
    description: 'Áudio, vídeo, iframe e formatos multimídia em vídeo.',
    order: 22,
    lessons: ['html-vid-media-1', 'html-vid-media-2', 'html-vid-media-3', 'html-vid-media-4'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
]
