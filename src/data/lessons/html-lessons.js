import { createLesson } from '../schemas.js'

export const htmlLessons = [
  createLesson({
    id: 'html-intro',
    courseId: 'html',
    moduleId: 'html-fundamentals',
    title: 'Introdução ao HTML5',
    description: 'Entenda o que é HTML e como a web funciona.',
    duration: 15,
    xp: 25,
    order: 1,
    illustration: 'code',
    objectives: [
      'Compreender o papel do HTML na web',
      'Entender a relação entre HTML, CSS e JavaScript',
      'Saber o que é o DOM e como o navegador interpreta HTML',
      'Criar seu primeiro documento HTML',
    ],
    prerequisites: [],
    introduction:
      'HTML é a espinha dorsal da web. Toda página que você acessa — do Google ao YouTube — usa HTML para estruturar seu conteúdo. Nesta aula, você vai entender como a web funciona e criar sua primeira página.',
    history:
      'HTML foi criado por Tim Berners-Lee em 1991 no CERN (Suíça). Ele precisava de um sistema para compartilhar documentos científicos entre pesquisadores. A primeira versão tinha apenas 18 tags. Em 2014, HTML5 se tornou o padrão oficial, adicionando tags semânticas, suporte a áudio/vídeo nativo e APIs poderosas.',
    concept:
      'HTML (HyperText Markup Language) é uma linguagem de marcação que usa tags para definir a estrutura e o significado do conteúdo. Cada tag diz ao navegador o tipo de informação que está sendo exibida: títulos, parágrafos, imagens, links, etc.',
    howItWorks:
      'O navegador baixa o arquivo HTML, faz o parsing (análise sintática) e constrói o DOM (Document Object Model) — uma representação em árvore de todos os elementos da página. Depois, ele aplica o CSS para estilizar e executa JavaScript para interatividade.',
    realWorldApplications: [
      'Toda página web usa HTML — Google, YouTube, Wikipedia, Twitter',
      'Emails em HTML para newsletters e campanhas',
      'Documentos e relatórios em formato web',
      'Interfaces de smart TVs e dispositivos IoT',
      'Aplicativos mobile híbridos (React Native, Ionic)',
    ],
    bestPractices: [
      'Sempre declare <!DOCTYPE html> no início',
      'Use lang="pt" para acessibilidade',
      'Mantenha uma hierarquia clara de headings',
      'Prefira tags semânticas a divs genéricas',
    ],
    commonMistakes: [
      '❌ Esquecer DOCTYPE — causa modo quirks no navegador',
      '❌ Ignorar a hierarquia de headings (pular de h1 para h4)',
      '❌ Usar div para tudo — prefira tags semânticas',
      '❌ Não fechar tags corretamente',
      '❌ Misturar conteúdo e estilo no HTML',
    ],
    deepDive:
      'O parser HTML do navegador é extremamente tolerante a erros. Isso foi uma decisão de design desde o início para que a web fosse acessível a todos. No entanto, HTML válido é crucial para SEO, acessibilidade e manutenção. O validador do W3C (validator.w3.org) pode verificar seu código.',
    curiosities: [
      'O primeiro site da história ainda está online: info.cern.ch',
      'HTML não é uma linguagem de programação — é uma linguagem de marcação',
      'Existem mais de 140 tags HTML, mas você usa cerca de 20 regularmente',
      'O símbolo < e > das tags foi inspirado em sinais matemáticos',
    ],
    example: {
      html: '<!DOCTYPE html>\n<html lang="pt">\n  <head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Minha primeira página</title>\n  </head>\n  <body>\n    <h1>Olá, WebStart!</h1>\n    <p>Esta é minha primeira página HTML.</p>\n  </body>\n</html>',
      css: 'body {\n  font-family: system-ui, sans-serif;\n  max-width: 640px;\n  margin: 0 auto;\n  padding: 2rem;\n  line-height: 1.6;\n}\nh1 { color: #059669; }',
    },
    playground: {
      html: '<h1>WebStart Academy</h1>\n<p>Edite este texto e veja o preview</p>',
      css: 'body {\n  font-family: system-ui, sans-serif;\n  padding: 2rem;\n}\nh1 { color: #059669; }',
    },
    challenge: {
      prompt: 'Modifique o playground para mostrar seu nome e um parágrafo sobre você.',
      starterCode: '<h1></h1>\n<p></p>',
      hint: 'Use h1 para seu nome e p para a descrição.',
    },
    exercise: {
      prompt:
        'Crie uma página completa com título "WebStart Academy" e um parágrafo de boas-vindas. Inclua DOCTYPE, head com charset e title, e body com h1 e p.',
      starterCode:
        '<!DOCTYPE html>\n<html lang="pt">\n  <head>\n    \n  </head>\n  <body>\n    \n  </body>\n</html>',
      hint: 'No head, adicione <meta charset="UTF-8"> e <title>. No body, use <h1> e <p>.',
    },
    summary: [
      'HTML estrutura o conteúdo da web usando tags de marcação',
      'Navegadores constroem o DOM a partir do HTML',
      'HTML5 é o padrão atual desde 2014',
      'Sempre declare DOCTYPE e use lang no HTML',
    ],
    checklist: [
      'Entendi o papel do HTML na web',
      'Sei o que é o DOM',
      'Criei meu primeiro documento HTML',
      'Configurei charset e viewport',
    ],
  }),

  createLesson({
    id: 'html-structure',
    courseId: 'html',
    moduleId: 'html-fundamentals',
    title: 'Estrutura Base',
    description: 'DOCTYPE, html, head e body — os blocos fundamentais.',
    duration: 15,
    xp: 25,
    order: 2,
    illustration: 'structure',
    objectives: [
      'Entender a anatomia de um documento HTML',
      'Configurar metadados essenciais (charset, viewport, title)',
      'Diferenciar head de body',
    ],
    prerequisites: ['HTML: Introdução ao HTML5'],
    introduction:
      'Todo documento HTML segue uma estrutura padrão. Assim como uma casa precisa de fundações, paredes e telhado, uma página HTML precisa de DOCTYPE, head e body.',
    concept:
      'A estrutura base do HTML é composta por três partes principais: DOCTYPE (declara o tipo de documento), <html> (elemento raiz), <head> (metadados) e <body> (conteúdo visível). O DOCTYPE deve ser sempre a primeira linha.',
    example: {
      html: '<!DOCTYPE html>\n<html lang="pt">\n  <head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>WebStart Academy</title>\n  </head>\n  <body>\n    <main>\n      <h1>Bem-vindo!</h1>\n      <p>Conteúdo principal aqui.</p>\n    </main>\n  </body>\n</html>',
      css: 'main { max-width: 720px; margin: 0 auto; padding: 2rem; }',
    },
    exercise: {
      prompt: 'Monte a estrutura base completa com lang="pt", meta charset, meta viewport, title e um body com um heading.',
      starterCode: '<!DOCTYPE html>\n<html>\n  \n</html>',
      hint: 'Adicione head com meta charset, meta viewport, title e body com um main.',
    },
    summary: [
      'DOCTYPE define a versão do HTML (HTML5)',
      'head contém metadados não visíveis',
      'body contém o conteúdo visível da página',
      'Sempre configure charset e viewport',
    ],
    checklist: [
      'Sei montar a estrutura base completa',
      'Configurei charset UTF-8',
      'Configurei viewport para responsividade',
      'Entendo a diferença entre head e body',
    ],
  }),

  createLesson({
    id: 'html-tags',
    courseId: 'html',
    moduleId: 'html-fundamentals',
    title: 'Tags e Elementos',
    description: 'Tags de abertura, fechamento e elementos vazios.',
    duration: 15,
    xp: 25,
    order: 3,
    illustration: 'tags',
    objectives: [
      'Entender a sintaxe de tags HTML',
      'Diferenciar tags com conteúdo de elementos vazios',
      'Usar atributos para modificar elementos',
    ],
    prerequisites: ['HTML: Estrutura Base'],
    concept:
      'A maioria das tags tem abertura (<tag>) e fechamento (</tag>). Elementos vazios como <br> e <img> não precisam de fechamento. Atributos como class, id, href e src modificam ou configuram os elementos.',
    bestPractices: [
      'Sempre feche tags não vazias',
      'Use aspas duplas para valores de atributos',
      'Prefira class a id para estilos (class é reutilizável)',
    ],
    commonMistakes: [
      '❌ Esquecer de fechar tags como <p> ou <div>',
      '❌ Usar o mesmo id em múltiplos elementos',
      '❌ Esquecer aspas em atributos',
      '❌ Usar tags obsoletas como <center> ou <font>',
    ],
    example: {
      html: '<article class="card">\n  <h2 id="titulo">Artigo</h2>\n  <p>Texto do artigo com <strong>ênfase</strong>.</p>\n  <br>\n  <img src="logo.png" alt="Logo WebStart">\n</article>',
      css: '.card { border: 2px solid #059669; padding: 1rem; border-radius: 8px; }',
    },
    exercise: {
      prompt: 'Crie um article com h2, p e uma imagem com alt descritivo.',
      starterCode: '<article>\n  \n</article>',
      hint: 'Todo img precisa de alt para acessibilidade.',
    },
    summary: [
      'Tags abrem e fecham com <tag> e </tag>',
      'Elementos vazios como <br> e <img> não fecham',
      'Atributos personalizam elementos',
    ],
    checklist: [
      'Diferencio tag de atributo',
      'Usei class e id corretamente',
      'Entendo elementos vazios',
    ],
  }),

  createLesson({
    id: 'html-headings',
    courseId: 'html',
    moduleId: 'html-fundamentals',
    title: 'Títulos',
    description: 'Hierarquia com h1 até h6.',
    duration: 12,
    xp: 25,
    order: 4,
    illustration: 'headings',
    objectives: [
      'Entender a hierarquia de headings (h1 a h6)',
      'Saber usar headings para SEO e acessibilidade',
      'Criar uma estrutura de conteúdo clara',
    ],
    prerequisites: ['HTML: Tags e Elementos'],
    concept:
      'Headings (h1 a h6) definem a hierarquia do conteúdo. h1 é o mais importante (um por página), h2 para seções principais, h3 para subseções, e assim por diante. Nunca pule níveis.',
    bestPractices: [
      'Use apenas um h1 por página',
      'Não pule níveis de heading (h1 → h3 é erro)',
      'Headings devem descrever o conteúdo que segue',
    ],
    commonMistakes: [
      '❌ Múltiplos h1 na mesma página',
      '❌ Usar headings apenas pelo tamanho da fonte (use CSS)',
      '❌ Pular de h1 para h4 sem h2/h3 intermediários',
    ],
    example: {
      html: '<h1>WebStart Academy</h1>\n  <section>\n    <h2>Cursos</h2>\n    <article>\n      <h3>HTML5</h3>\n      <p>Estrutura semântica moderna.</p>\n    </article>\n  </section>',
      css: 'h1 { color: #059669; font-size: 2.5rem; }\nh2 { margin-top: 2rem; border-bottom: 2px solid #064e3b; }',
    },
    exercise: {
      prompt: 'Crie uma hierarquia h1 > h2 > h3 para um artigo sobre HTML. O h1 deve ser "Guia HTML", h2 "Tags" e h3 "Tags Semânticas".',
      starterCode: '',
      hint: 'Comece com um h1 principal. Use section ou article para agrupar.',
    },
    summary: [
      'Apenas um h1 por página',
      'Respeite a hierarquia semântica',
      'Headings melhoram SEO e acessibilidade',
    ],
    checklist: [
      'Usei h1 a h6 corretamente',
      'Não pulei níveis de heading',
      'Entendo a importância semântica',
    ],
  }),

  createLesson({
    id: 'html-paragraphs',
    courseId: 'html',
    moduleId: 'html-fundamentals',
    title: 'Parágrafos e Texto',
    description: 'p, strong, em, span e formatação semântica.',
    duration: 12,
    xp: 25,
    order: 5,
    illustration: 'text',
    objectives: [
      'Usar a tag p para parágrafos',
      'Aplicar ênfase semântica com strong e em',
      'Diferenciar formatação semântica de visual',
    ],
    prerequisites: ['HTML: Tags e Elementos'],
    concept:
      'Parágrafos são definidos com <p>. Use <strong> para importância (negrito semântico) e <em> para ênfase (itálico semântico). <span> é um elemento genérico inline para estilização.',
    bestPractices: [
      'Evite múltiplos <br> para espaçamento — use CSS margin',
      'strong = importância, em = ênfase suave',
      'Mantenha linhas de texto com ~60-80 caracteres',
    ],
    commonMistakes: [
      '❌ Usar <br> para espaçar parágrafos',
      '❌ Usar <b> e <i> em vez de <strong> e <em>',
      '❌ Colocar blocos inteiros em <span>',
    ],
    example: {
      html: '<p>O <strong>HTML5</strong> é a base da web moderna.</p>\n<p>Aprender <em>marcação semântica</em> é essencial para <span class="highlight">acessibilidade</span>.</p>',
      css: 'p { line-height: 1.7; margin-bottom: 1rem; }\n.highlight { background: #ecfdf5; padding: 0.1rem 0.3rem; }',
    },
    exercise: {
      prompt: 'Escreva dois parágrafos sobre HTML. Use strong em uma palavra importante e em em uma palavra com ênfase.',
      starterCode: '',
      hint: 'strong = importante, em = ênfase. Não confunda com b e i.',
    },
    summary: [
      'p para blocos de texto',
      'strong e em são tags semânticas',
      'Evite br para layout — use CSS',
    ],
    checklist: [
      'Formatei texto com strong e em',
      'Usei parágrafos corretamente',
      'Entendo formatação semântica',
    ],
  }),

  createLesson({
    id: 'html-links',
    courseId: 'html',
    moduleId: 'html-content-media',
    title: 'Links',
    description: 'Navegação com anchor tags e href.',
    duration: 12,
    xp: 25,
    order: 1,
    illustration: 'links',
    objectives: [
      'Criar links internos e externos com a tag <a>',
      'Entender os atributos href, target e rel',
      'Usar âncoras para navegação na mesma página',
    ],
    concept:
      'A tag <a> (anchor) cria hyperlinks. O atributo href define o destino. Use target="_blank" para abrir em nova aba e rel="noopener noreferrer" por segurança.',
    bestPractices: [
      'Use texto descritivo no link (não "clique aqui")',
      'Links externos: target="_blank" + rel="noopener"',
      'Links internos: caminhos relativos',
    ],
    commonMistakes: [
      '❌ Esquecer rel="noopener" em links externos',
      '❌ Links quebrados (href vazio ou errado)',
      '❌ Texto do link não descritivo',
    ],
    example: {
      html: '<a href="https://developer.mozilla.org" target="_blank" rel="noopener">MDN Web Docs</a>\n<a href="#secao">Ir para seção</a>\n<a href="contato.html">Contato</a>',
      css: 'a { color: #059669; font-weight: 600; text-decoration: underline; }\na:hover { color: #064e3b; }',
    },
    exercise: {
      prompt: 'Crie um link externo para o site da MDN (developer.mozilla.org) com target="_blank" e rel="noopener", e um link interno #topo.',
      starterCode: '',
      hint: 'Links internos usam #id. O destino precisa ter um elemento com esse id.',
    },
    summary: [
      'href define o destino do link',
      'Use rel="noopener" em links externos',
      'Âncoras (#id) navegam na mesma página',
    ],
    checklist: [
      'Criei links internos e externos',
      'Entendi target e rel',
      'Usei texto descritivo nos links',
    ],
  }),

  createLesson({
    id: 'html-images',
    courseId: 'html',
    moduleId: 'html-content-media',
    title: 'Imagens',
    description: 'img, src, alt, width e height.',
    duration: 12,
    xp: 25,
    order: 2,
    illustration: 'images',
    objectives: [
      'Inserir imagens com a tag <img>',
      'Usar alt descritivo para acessibilidade',
      'Configurar width e height para evitar layout shift',
    ],
    concept:
      'A tag <img> é um elemento vazio que insere imagens. src aponta para o arquivo. alt descreve a imagem (obrigatório para acessibilidade). width e height definem dimensões.',
    bestPractices: [
      'Sempre preencha alt com descrição significativa',
      'Defina width e height para evitar CLS (Cumulative Layout Shift)',
      'Prefira formatos modernos: WebP com fallback para JPEG/PNG',
    ],
    commonMistakes: [
      '❌ alt vazio ou genérico ("imagem", "foto")',
      '❌ Não definir dimensões (causa layout shift)',
      '❌ Usar imagens muito grandes sem compactação',
    ],
    example: {
      html: '<img src="https://placehold.co/400x200/059669/white?text=WebStart" alt="Banner WebStart Academy com fundo verde" width="400" height="200">',
      css: 'img { border-radius: 8px; border: 2px solid #064e3b; max-width: 100%; height: auto; }',
    },
    exercise: {
      prompt: 'Adicione uma imagem com alt descritivo e dimensões definidas. Use uma URL de placeholder.',
      starterCode: '',
      hint: 'alt deve descrever o conteúdo da imagem, não dizer "imagem de". Ex: "Gráfico mostrando evolução de vendas".',
    },
    summary: [
      'alt é obrigatório para acessibilidade',
      'width/height evitam layout shift',
      'Compacte imagens para performance',
    ],
    checklist: [
      'Usei alt descritivo em todas as imagens',
      'Defini width e height',
      'Imagens estão responsivas (max-width: 100%)',
    ],
  }),

  createLesson({
    id: 'html-lists',
    courseId: 'html',
    moduleId: 'html-content-media',
    title: 'Listas',
    description: 'Listas ordenadas, não ordenadas e de definição.',
    duration: 12,
    xp: 25,
    order: 3,
    illustration: 'lists',
    objectives: [
      'Criar listas ordenadas (ol) e não ordenadas (ul)',
      'Aninhar listas para hierarquias complexas',
      'Escolher o tipo correto de lista',
    ],
    concept:
      '<ul> cria listas com marcadores (bullets). <ol> cria listas numeradas. Cada item usa <li>. Listas podem ser aninhadas dentro de <li> para sub-itens.',
    bestPractices: [
      'Use ol para passos sequenciais ou rankings',
      'Use ul para itens sem ordem específica',
      'Aninhe listas para hierarquias (ex: menu com submenu)',
    ],
    commonMistakes: [
      '❌ Usar <br> para simular listas',
      '❌ Usar ul quando a ordem importa (use ol)',
    ],
    example: {
      html: '<h3>Stack WebStart</h3>\n<ol>\n  <li>HTML5</li>\n  <li>CSS3</li>\n  <li>JavaScript</li>\n  <li>React</li>\n</ol>',
      css: 'ol { padding-left: 1.5rem; }\nli { margin: 0.4rem 0; line-height: 1.5; }',
    },
    exercise: {
      prompt: 'Crie uma lista ordenada com os 3 primeiros passos para aprender programação web.',
      starterCode: '',
      hint: 'Use ol para passos sequenciais. Cada passo é um li.',
    },
    summary: [
      'ul = unordered (marcadores)',
      'ol = ordered (numerada)',
      'li = list item (cada elemento)',
    ],
    checklist: [
      'Criei ul e ol corretamente',
      'Aninhei listas quando necessário',
      'Escolhi o tipo correto para cada caso',
    ],
  }),

  createLesson({
    id: 'html-tables',
    courseId: 'html',
    moduleId: 'html-semantic',
    title: 'Tabelas',
    description: 'table, tr, th, td e thead/tbody.',
    duration: 15,
    xp: 25,
    order: 1,
    illustration: 'tables',
    objectives: [
      'Criar tabelas HTML com estrutura correta',
      'Usar thead, tbody, th e td apropriadamente',
      'Saber quando usar tabelas (e quando não usar)',
    ],
    concept:
      'Tabelas são para dados tabulares. Use <thead> para cabeçalhos, <tbody> para dados, <tr> para linhas, <th> para células de cabeçalho e <td> para células de dados.',
    bestPractices: [
      'Use thead/tbody para semântica e acessibilidade',
      'Nunca use tabelas para layout de página',
      'Use scope="col" ou scope="row" em th para acessibilidade',
    ],
    commonMistakes: ['❌ Usar tabelas para layout (use Grid/Flexbox)', '❌ Esquecer thead/tbody'],
    example: {
      html: '<table>\n  <thead>\n    <tr><th>Curso</th><th>Duração</th><th>Nível</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>HTML5</td><td>2h</td><td>Iniciante</td></tr>\n    <tr><td>CSS3</td><td>2h</td><td>Iniciante</td></tr>\n  </tbody>\n</table>',
      css: 'table { border-collapse: collapse; width: 100%; }\nth, td { border: 2px solid #064e3b; padding: 0.75rem; text-align: left; }\nth { background: #ecfdf5; font-weight: 800; }',
    },
    exercise: {
      prompt: 'Crie uma tabela com 3 colunas (Produto, Preço, Estoque) e 3 linhas de dados.',
      starterCode: '<table>\n  \n</table>',
      hint: 'Use thead com th e tbody com td.',
    },
    summary: [
      'th = cabeçalho, td = dado',
      'Use thead/tbody para semântica',
      'Tabelas são para dados, não para layout',
    ],
    checklist: [
      'Estruturei com thead e tbody',
      'Usei th e td corretamente',
      'Não usei tabelas para layout',
    ],
  }),

  createLesson({
    id: 'html-semantic',
    courseId: 'html',
    moduleId: 'html-semantic',
    title: 'HTML Semântico',
    description: 'header, nav, main, section, article, footer.',
    duration: 20,
    xp: 35,
    order: 2,
    illustration: 'semantic',
    objectives: [
      'Conhecer as principais tags semânticas HTML5',
      'Estruturar páginas usando landmarks semânticos',
      'Entender os benefícios de SEO e acessibilidade',
    ],
    introduction:
      'Antes do HTML5, páginas eram estruturadas com <div>. Hoje, tags semânticas como <header>, <nav>, <main>, <article>, <section>, <aside> e <footer> dão significado real ao conteúdo.',
    concept:
      'Tags semânticas descrevem o propósito do conteúdo, não apenas sua aparência. Leitores de tela usam landmarks para navegação. Motores de busca usam semântica para entender a página.',
    bestPractices: [
      'main: conteúdo principal (use uma vez)',
      'nav: links de navegação principais',
      'article: conteúdo independente (blog post, notícia)',
      'section: agrupa conteúdo relacionado',
      'aside: conteúdo complementar (sidebar)',
    ],
    commonMistakes: [
      '❌ Colocar tudo dentro de divs sem semântica',
      '❌ Múltiplos <main> na mesma página',
      '❌ Usar <article> para conteúdo que não é independente',
    ],
    example: {
      html: '<header>\n  <nav>\n    <a href="/">Home</a>\n    <a href="/cursos">Cursos</a>\n  </nav>\n</header>\n<main>\n  <article>\n    <h1>HTML Semântico</h1>\n    <section>\n      <h2>O que é?</h2>\n      <p>Conteúdo da seção...</p>\n    </section>\n  </article>\n  <aside>\n    <h2>Artigos relacionados</h2>\n  </aside>\n</main>\n<footer>© 2026 WebStart</footer>',
      css: 'header, footer { background: #ecfdf5; padding: 1.5rem; }\nmain { max-width: 960px; margin: 2rem auto; display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }',
    },
    exercise: {
      prompt: 'Estruture uma página com header (logo + nav), main (article com 2 sections), aside (links) e footer.',
      starterCode: '',
      hint: 'main contém o conteúdo principal. Article para o conteúdo central. Aside para complementar.',
    },
    summary: [
      'Tags semânticas dão significado ao conteúdo',
      'main = conteúdo principal (único por página)',
      'Melhora SEO, acessibilidade e manutenção',
      'Leitores de tela navegam por landmarks',
    ],
    checklist: [
      'Usei landmarks semânticos (header, main, footer)',
      'Article e section usados corretamente',
      'Aside para conteúdo complementar',
      'Evitei divs desnecessárias',
    ],
  }),

  createLesson({
    id: 'html-forms',
    courseId: 'html',
    moduleId: 'html-forms',
    title: 'Formulários',
    description: 'form, input, label, textarea e button.',
    duration: 20,
    xp: 35,
    order: 1,
    illustration: 'forms',
    objectives: [
      'Criar formulários HTML com campos variados',
      'Associar labels a inputs corretamente',
      'Entender os principais tipos de input',
      'Implementar acessibilidade em formulários',
    ],
    introduction:
      'Formulários são a principal forma de interação do usuário com a web. De cadastros a pesquisas, eles coletam dados que alimentam aplicações.',
    concept:
      '<form> envolve todos os campos. <label> associado ao input via for/id é essencial para acessibilidade. Input types: text, email, password, number, date, etc. <fieldset> + <legend> agrupa campos relacionados.',
    bestPractices: [
      'Sempre use <label> com for associado ao id do input',
      'Use o type correto (email, tel, number, etc.)',
      'Agrupe campos com fieldset e legend',
      'Campos obrigatórios: use atributo required',
    ],
    commonMistakes: [
      '❌ Esquecer label (input sem acessibilidade)',
      '❌ Type errado (text para email, sem validação)',
      '❌ Não usar fieldset para grupos de campos',
      '❌ Placeholder como substituto de label',
    ],
    example: {
      html: '<form>\n  <fieldset>\n    <legend>Dados Pessoais</legend>\n    <label for="nome">Nome:</label>\n    <input type="text" id="nome" required>\n    <label for="email">Email:</label>\n    <input type="email" id="email" required>\n  </fieldset>\n  <button type="submit">Enviar</button>\n</form>',
      css: 'form { max-width: 400px; display: grid; gap: 0.75rem; }\nfieldset { border: 2px solid #064e3b; padding: 1rem; }\ninput, textarea { padding: 0.5rem; border: 2px solid #064e3b; border-radius: 4px; }\nbutton { background: #059669; color: white; padding: 0.75rem; font-weight: bold; border: none; cursor: pointer; }',
    },
    exercise: {
      prompt: 'Crie um formulário de cadastro com campos: nome, email, senha, e um select para país. Use fieldset, labels associados e botão submit.',
      starterCode: '<form>\n  \n</form>',
      hint: 'Associe cada label ao input com for/id. Use fieldset para agrupar.',
    },
    summary: [
      'label + input com for/id = acessibilidade',
      'Use types corretos (email, password, etc.)',
      'Fieldset + legend organizam grupos',
      'button type="submit" envia o formulário',
    ],
    checklist: [
      'Criei labels associados a cada input',
      'Usei tipos de input adequados',
      'Agrupei campos com fieldset',
      'Formulário está acessível',
    ],
  }),

  createLesson({
    id: 'html-seo',
    courseId: 'html',
    moduleId: 'html-seo-module',
    title: 'SEO para Iniciantes',
    description: 'Meta tags, headings, indexação e otimização para motores de busca.',
    duration: 15,
    xp: 25,
    order: 1,
    illustration: 'search',
    objectives: [
      'Entender o que é SEO',
      'Conhecer meta tags importantes',
      'Saber usar headings para SEO',
      'Compreender indexação',
    ],
    introduction:
      'SEO (Search Engine Optimization) é o conjunto de práticas para melhorar o posicionamento do seu site nos resultados de busca. Nesta aula, você vai aprender os fundamentos para começar com o pé direito.',
    history:
      'Os primeiros mecanismos de busca (Archie 1990, Yahoo 1994) usavam índices manuais. O Google revolucionou em 1998 com o algoritmo PageRank, que avalia a relevância pelos links recebidos.',
    concept:
      'SEO envolve otimização on-page (conteúdo, meta tags, headings) e off-page (links externos, autoridade). Mecanismos de busca usam crawlers para indexar páginas e algoritmos para ranqueá-las.',
    howItWorks:
      'O crawler do Google (Googlebot) visita seu site, analisa o HTML, segue links e adiciona ao índice. Quando alguém pesquisa, o algoritmo busca no índice as páginas mais relevantes usando centenas de fatores.',
    realWorldApplications: [
      'Sites de e-commerce',
      'Blogs',
      'Landing pages',
      'Portfólios',
      'Sites institucionais',
    ],
    bestPractices: [
      'Use title único por página',
      'Meta description atraente',
      'Headings com hierarquia (h1 único)',
      'URL amigável e descritiva',
    ],
    commonMistakes: [
      '- Conteúdo duplicado',
      '- Título genérico (sem palavras-chave)',
      '- Ignorar meta description',
      '- Excesso de headings h1',
    ],
    deepDive:
      'O Google avalia mais de 200 fatores de ranqueamento. Os mais importantes incluem: conteúdo relevante, velocidade de carregamento (Core Web Vitals), mobile-friendliness, backlinks de qualidade e segurança HTTPS.',
    curiosities: [
      'Google processa 8,5 bilhões de pesquisas por dia',
      '15% das pesquisas são inéditas',
      'PageRank foi nomeado em homenagem a Larry Page',
    ],
    example: {
      html: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>WebStart Academy - Aprenda HTML</title>\n  <meta name="description" content="Curso completo de HTML para iniciantes. Aprenda tags, semântica e boas práticas.">\n  <meta name="keywords" content="HTML, curso, web, iniciante">\n</head>\n<body>\n  <h1>WebStart Academy</h1>\n  <p>O melhor lugar para aprender HTML.</p>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; max-width: 640px; margin: 0 auto; padding: 2rem; }',
    },
    playground: {
      html: '<h1>Título Principal</h1>\n<p>Descrição da página</p>',
      css: 'body { font-family: system-ui; padding: 1rem; }',
    },
    challenge: {
      prompt: 'Otimize o playground adicionando meta tags SEO no head.',
      starterCode: '<!DOCTYPE html>\n<html>\n<head>\n  \n</head>\n<body>\n  <h1>Meu Site</h1>\n</body>\n</html>',
      hint: 'Adicione meta description e um title descritivo.',
    },
    exercise: {
      prompt: 'Crie uma página completa sobre HTML com title, meta description, h1 único e headings hierárquicos.',
      starterCode: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  \n</head>\n<body>\n  \n</body>\n</html>',
      hint: 'Use h1 para o título principal, h2 para seções, h3 para subseções.',
    },
    summary: [
      'SEO melhora o posicionamento em buscadores',
      'Meta tags e headings são fundamentais',
      'Conteúdo relevante é o fator mais importante',
      'Core Web Vitals impactam o ranqueamento',
    ],
    checklist: [
      'Title e meta description configurados',
      'Hierarquia de headings correta',
      'URL amigável',
      'Conteúdo relevante e original',
    ],
  }),

  createLesson({
    id: 'html-accessibility',
    courseId: 'html',
    moduleId: 'html-a11y-module',
    title: 'Acessibilidade Web',
    description: 'Leitores de tela, labels, ARIA e navegação inclusiva.',
    duration: 20,
    xp: 35,
    order: 1,
    illustration: 'accessibility',
    objectives: [
      'Entender o que é acessibilidade web',
      'Usar tags semânticas para acessibilidade',
      'Implementar atributos ARIA',
      'Criar formulários acessíveis',
    ],
    introduction:
      'A web é para todos. Pessoas com deficiência visual, auditiva, motora ou cognitiva devem conseguir acessar e interagir com seu site. Acessibilidade não é opcional - é direito.',
    history:
      'A WCAG (Web Content Accessibility Guidelines) foi criada pelo W3C em 1999. A versão 2.1 (2018) define os critérios atuais. No Brasil, a Lei Brasileira de Inclusão (2015) exige acessibilidade digital.',
    concept:
      'Acessibilidade web significa que pessoas com deficiência podem perceber, entender, navegar e interagir com a web. Envolve: leitores de tela (NVDA, VoiceOver), navegação por teclado, contraste de cores, texto alternativo.',
    howItWorks:
      'Leitores de tela interpretam o DOM e anunciam o conteúdo. Tags semânticas criam landmarks para navegação. ARIA (Accessible Rich Internet Applications) fornece informações adicionais quando HTML nativo não é suficiente.',
    realWorldApplications: [
      'Gov.br (governo)',
      'Wikipedia',
      'BBC',
      'Apple',
      'Microsoft',
    ],
    bestPractices: [
      'Alt descritivo em todas as imagens',
      'Labels associados a inputs',
      'Contraste mínimo 4.5:1',
      'Navegação por teclado funcional',
    ],
    commonMistakes: [
      '- Imagens sem alt text',
      '- Formulários sem label',
      '- Baixo contraste de cores',
      '- Dependência apenas de mouse',
    ],
    deepDive:
      'ARIA adiciona atributos como role, aria-label, aria-labelledby, aria-hidden. Use ARIA apenas quando o HTML semântico não resolver - "No ARIA is better than bad ARIA."',
    curiosities: [
      '15% da população mundial tem alguma deficiência',
      'O VoiceOver da Apple vem integrado em todo iPhone',
      'Sites acessíveis tem melhor SEO',
    ],
    example: {
      html: '<form>\n  <label for="nome">Nome</label>\n  <input type="text" id="nome" name="nome" required aria-required="true">\n  <label for="email">Email</label>\n  <input type="email" id="email" name="email" required>\n  <button type="submit">Enviar</button>\n</form>',
      css: 'form { max-width: 400px; margin: 0 auto; display: grid; gap: 0.75rem; }\nlabel { font-weight: bold; }\ninput { padding: 0.5rem; border: 2px solid #064e3b; }',
    },
    playground: {
      html: '<img src="https://via.placeholder.com/150" alt="">\n<p>Conteúdo da página</p>',
      css: 'body { font-family: system-ui; padding: 1rem; }',
    },
    challenge: {
      prompt: 'Adicione alt text descritivo à imagem e um label a um campo de input.',
      starterCode: '<img src="foto.jpg" alt="">\n<input type="text">',
      hint: 'O alt deve descrever o conteúdo da imagem. O label deve ter for ligado ao id do input.',
    },
    exercise: {
      prompt: 'Crie um formulário de contato acessível com labels, fieldset e legend.',
      starterCode: '<form>\n  <fieldset>\n    <legend>Seus dados</legend>\n    \n  </fieldset>\n</form>',
      hint: 'Adicione label+input para nome e email, e um textarea para mensagem.',
    },
    summary: [
      'Acessibilidade é direito de todos',
      'Tags semânticas ajudam leitores de tela',
      'ARIA complementa o HTML nativo',
      'Contraste e navegação por teclado são essenciais',
    ],
    checklist: [
      'Imagens com alt text',
      'Labels associados',
      'Navegação por teclado testada',
      'Contraste verificado',
    ],
  }),

  createLesson({
    id: 'html-moderno',
    courseId: 'html',
    moduleId: 'html-moderno-module',
    title: 'HTML Moderno',
    description: 'audio, video, iframe, dialog, progress e meter.',
    duration: 15,
    xp: 25,
    order: 1,
    illustration: 'play',
    objectives: [
      'Incorporar audio e video nativamente',
      'Usar iframe para conteúdo externo',
      'Criar modais com dialog',
      'Usar progress e meter para dados',
    ],
    introduction:
      'HTML5 trouxe tags poderosas que antes só funcionavam com plugins (Flash). Hoje você pode adicionar vídeo, áudio, modais e barras de progresso sem nenhuma biblioteca externa.',
    history:
      'Antes do HTML5, vídeos na web dependiam do Flash Player (Adobe) ou Silverlight (Microsoft). O elemento <video> foi introduzido em 2010 e eliminou a necessidade de plugins.',
    concept:
      'Tags multimídia nativas: <video>, <audio>, <iframe> para incorporar conteúdo externo, <dialog> para modais nativos, <progress> para barras de progresso, <meter> para medições.',
    howItWorks:
      '<video> e <audio> usam o atributo src ou elementos <source> internos. <dialog> manipula o atributo open e métodos showModal(). <progress> reflete o progresso via value/max. <meter> mostra um valor dentro de um intervalo.',
    realWorldApplications: [
      'YouTube (<video>)',
      'Spotify (<audio>)',
      'Google Maps (<iframe>)',
      'Modais de cookies (<dialog>)',
      'Upload de arquivos (<progress>)',
    ],
    bestPractices: [
      'Use vários formatos de vídeo (mp4, webm)',
      'Adicione controls ao video/audio',
      'Iframe com title para acessibilidade',
      'Use showModal() para dialog',
    ],
    commonMistakes: [
      '- Esquecer atributo controls',
      '- Iframe sem title',
      '- Dialog sem botão de fechar',
      '- Apenas um formato de mídia',
    ],
    deepDive:
      'O elemento <dialog> suporta display: modal (com backdrop nativo) e métodos show()/showModal()/close(). O backdrop pode ser estilizado com ::backdrop pseudo-elemento.',
    curiosities: [
      'O <dialog> só teve suporte total em 2022',
      '<progress> não anima por padrão',
      '<meter> pode ter atributos min, max, low, high, optimum',
    ],
    example: {
      html: '<video controls width="400">\n  <source src="video.mp4" type="video/mp4">\n  <source src="video.webm" type="video/webm">\n  Seu navegador não suporta vídeo.\n</video>\n\n<dialog open>\n  <p>Bem-vindo ao site!</p>\n  <button onclick="this.closest(\'dialog\').close()">Fechar</button>\n</dialog>\n\n<progress value="70" max="100"></progress>',
      css: 'body { font-family: system-ui; padding: 2rem; }\ndialog { border: 2px solid #064e3b; border-radius: 8px; padding: 2rem; }',
    },
    playground: {
      html: '<video controls width="300">\n  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">\n</video>\n<progress value="50" max="100"></progress>',
      css: 'body { font-family: system-ui; padding: 1rem; }',
    },
    challenge: {
      prompt: 'Crie uma página com um player de vídeo e um botão que abre um dialog.',
      starterCode: '<video controls>\n  <source src="video.mp4" type="video/mp4">\n</video>\n<dialog>\n  \n</dialog>',
      hint: 'Use controls no video. No dialog, adicione um parágrafo e botão para fechar.',
    },
    exercise: {
      prompt: 'Crie uma página com iframe incorporando um mapa, um player de áudio com controles e uma barra de progresso.',
      starterCode: '<h1>Mídia na Web</h1>\n',
      hint: 'Use <iframe> para o mapa, <audio controls> para o player, <progress> para a barra.',
    },
    summary: [
      'HTML5 nativo substitui plugins como Flash',
      '<video> e <audio> são suportados nativamente',
      '<dialog> cria modais sem JavaScript',
      '<progress> e <meter> exibem dados visuais',
    ],
    checklist: [
      'Vídeo com controles e sources alternativos',
      'Áudio funcional',
      'Dialog com botão de fechar',
      'Iframe com title',
    ],
  }),
]
