function createLesson({
  id,
  courseId,
  title,
  description,
  duration = 15,
  xp = 25,
  heroSubtitle,
  illustration,
  sections,
  example,
  exercise,
  summary,
  checklist,
}) {
  return {
    id,
    courseId,
    title,
    description,
    duration,
    xp,
    hero: {
      title,
      subtitle: heroSubtitle,
    },
    illustration,
    sections,
    example,
    exercise,
    summary,
    checklist,
  }
}

const htmlLessons = [
  createLesson({
    id: 'html-intro',
    courseId: 'html',
    title: 'Introdução ao HTML5',
    description: 'Entenda o que é HTML e como a web funciona.',
    heroSubtitle: 'A linguagem que estrutura toda a internet.',
    illustration: 'code',
    sections: [
      {
        title: 'O que é HTML?',
        content:
          'HTML (HyperText Markup Language) é a linguagem de marcação usada para estruturar conteúdo na web. Não é uma linguagem de programação — ela define a semântica e a hierarquia dos elementos.',
      },
      {
        title: 'Como o navegador interpreta HTML',
        content:
          'O navegador lê o arquivo HTML, constrói o DOM (Document Object Model) e renderiza a página. CSS estiliza e JavaScript adiciona comportamento.',
      },
    ],
    example: {
      html: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>Minha primeira página</title>\n  </head>\n  <body>\n    <h1>Olá, WebStart!</h1>\n  </body>\n</html>',
      css: 'body { font-family: sans-serif; padding: 2rem; }',
    },
    exercise: {
      prompt: 'Crie uma página com título "WebStart" e um parágrafo de boas-vindas.',
      starterCode: '<!DOCTYPE html>\n<html>\n  <body>\n    \n  </body>\n</html>',
      hint: 'Use <h1> para o título e <p> para o parágrafo.',
    },
    summary: ['HTML estrutura conteúdo', 'Navegadores interpretam tags', 'HTML5 é o padrão atual'],
    checklist: ['Entendi o papel do HTML', 'Sei o que é o DOM', 'Criei minha primeira estrutura'],
  }),
  createLesson({
    id: 'html-structure',
    courseId: 'html',
    title: 'Estrutura Base',
    description: 'DOCTYPE, html, head e body — os blocos fundamentais.',
    heroSubtitle: 'Todo documento HTML começa aqui.',
    illustration: 'structure',
    sections: [
      {
        title: 'Anatomia de um documento',
        content:
          '<!DOCTYPE html> declara HTML5. <html> envolve tudo. <head> contém metadados. <body> contém o conteúdo visível.',
      },
      {
        title: 'Metadados importantes',
        content:
          'Use charset UTF-8, viewport para responsividade e title para SEO e abas do navegador.',
      },
    ],
    example: {
      html: '<!DOCTYPE html>\n<html lang="pt">\n  <head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>WebStart Academy</title>\n  </head>\n  <body>\n    <main>Conteúdo principal</main>\n  </body>\n</html>',
      css: 'main { max-width: 720px; margin: 0 auto; }',
    },
    exercise: {
      prompt: 'Monte a estrutura base completa com lang="pt" e meta viewport.',
      starterCode: '<!DOCTYPE html>\n<html>\n  \n</html>',
      hint: 'Adicione head com meta charset e body com um main.',
    },
    summary: ['DOCTYPE define HTML5', 'head = metadados', 'body = conteúdo visível'],
    checklist: ['Sei montar a estrutura base', 'Configurei charset e viewport'],
  }),
  createLesson({
    id: 'html-tags',
    courseId: 'html',
    title: 'Tags e Elementos',
    description: 'Tags de abertura, fechamento e elementos vazios.',
    heroSubtitle: 'Os blocos de construção do HTML.',
    illustration: 'tags',
    sections: [
      {
        title: 'Sintaxe das tags',
        content: 'A maioria das tags tem abertura <tag> e fechamento </tag>. Elementos vazios como <br> e <img> não precisam de fechamento.',
      },
      {
        title: 'Atributos',
        content: 'Atributos modificam elementos: class, id, href, src, alt são os mais comuns.',
      },
    ],
    example: {
      html: '<article class="card">\n  <h2 id="titulo">Artigo</h2>\n  <p>Texto do artigo.</p>\n  <br>\n  <img src="logo.png" alt="Logo">\n</article>',
      css: '.card { border: 2px solid #059669; padding: 1rem; }',
    },
    exercise: {
      prompt: 'Crie um article com h2, p e uma imagem com alt descritivo.',
      starterCode: '<article>\n  \n</article>',
      hint: 'Todo img precisa de alt para acessibilidade.',
    },
    summary: ['Tags abrem e fecham', 'Atributos personalizam elementos', 'Elementos vazios existem'],
    checklist: ['Diferencio tag de atributo', 'Usei class e id corretamente'],
  }),
  createLesson({
    id: 'html-headings',
    courseId: 'html',
    title: 'Títulos',
    description: 'Hierarquia com h1 até h6.',
    heroSubtitle: 'Organize conteúdo com hierarquia clara.',
    illustration: 'headings',
    sections: [
      {
        title: 'Hierarquia semântica',
        content: 'Use apenas um h1 por página. h2 para seções, h3 para subseções. Não pule níveis.',
      },
      {
        title: 'SEO e acessibilidade',
        content: 'Títulos bem estruturados ajudam leitores de tela e motores de busca a entender o conteúdo.',
      },
    ],
    example: {
      html: '<h1>WebStart Academy</h1>\n<h2>Curso HTML</h2>\n<h3>Módulo: Títulos</h3>\n<p>Conteúdo da aula.</p>',
      css: 'h1 { color: #059669; } h2 { margin-top: 1.5rem; }',
    },
    exercise: {
      prompt: 'Crie hierarquia h1 > h2 > h3 para um artigo sobre HTML.',
      starterCode: '',
      hint: 'Comece com um h1 principal.',
    },
    summary: ['Um h1 por página', 'Respeite a hierarquia', 'Títulos melhoram SEO'],
    checklist: ['Usei h1 a h6 corretamente', 'Não pulei níveis de heading'],
  }),
  createLesson({
    id: 'html-paragraphs',
    courseId: 'html',
    title: 'Parágrafos e Texto',
    description: 'p, strong, em, span e formatação semântica.',
    heroSubtitle: 'Escreva conteúdo legível e semântico.',
    illustration: 'text',
    sections: [
      {
        title: 'Parágrafos',
        content: 'Use <p> para blocos de texto. Evite múltiplos <br> para espaçamento — use CSS.',
      },
      {
        title: 'Ênfase semântica',
        content: '<strong> indica importância. <em> indica ênfase. <span> é genérico para estilo inline.',
      },
    ],
    example: {
      html: '<p>O <strong>HTML5</strong> é a base da web moderna.</p>\n<p>Aprender <em>marcação semântica</em> faz diferença.</p>',
      css: 'p { line-height: 1.7; margin-bottom: 1rem; }',
    },
    exercise: {
      prompt: 'Escreva dois parágrafos usando strong e em.',
      starterCode: '',
      hint: 'strong = importante, em = ênfase.',
    },
    summary: ['p para parágrafos', 'strong e em são semânticos', 'Evite br para layout'],
    checklist: ['Formatei texto corretamente', 'Usei ênfase semântica'],
  }),
  createLesson({
    id: 'html-links',
    courseId: 'html',
    title: 'Links',
    description: 'Navegação com anchor tags e href.',
    heroSubtitle: 'Conecte páginas e recursos.',
    illustration: 'links',
    sections: [
      {
        title: 'Tag <a>',
        content: 'href define o destino. target="_blank" abre nova aba. rel="noopener" é recomendado por segurança.',
      },
      {
        title: 'Links internos e externos',
        content: 'Use caminhos relativos para páginas internas e URLs completas para sites externos.',
      },
    ],
    example: {
      html: '<a href="https://developer.mozilla.org">MDN Docs</a>\n<a href="#modulos">Ir para módulos</a>\n<a href="contato.html">Contato</a>',
      css: 'a { color: #059669; font-weight: 600; }',
    },
    exercise: {
      prompt: 'Crie um link externo para MDN e um link interno #topo.',
      starterCode: '',
      hint: 'Links internos usam #id.',
    },
    summary: ['href define destino', 'Use rel em links externos', 'Âncoras navegam na mesma página'],
    checklist: ['Criei links internos e externos', 'Entendi target e rel'],
  }),
  createLesson({
    id: 'html-images',
    courseId: 'html',
    title: 'Imagens',
    description: 'img, src, alt, width e height.',
    heroSubtitle: 'Imagens acessíveis e otimizadas.',
    illustration: 'images',
    sections: [
      {
        title: 'Tag img',
        content: 'src aponta para o arquivo. alt descreve a imagem para acessibilidade e quando ela não carrega.',
      },
      {
        title: 'Boas práticas',
        content: 'Defina width/height para evitar layout shift. Use formatos modernos como WebP quando possível.',
      },
    ],
    example: {
      html: '<img src="https://placehold.co/400x200/059669/white?text=WebStart" alt="Banner WebStart" width="400" height="200">',
      css: 'img { border-radius: 8px; border: 2px solid #064e3b; }',
    },
    exercise: {
      prompt: 'Adicione uma imagem com alt descritivo e dimensões.',
      starterCode: '',
      hint: 'alt deve descrever o conteúdo, não dizer "imagem de".',
    },
    summary: ['alt é obrigatório', 'width/height evitam CLS', 'Escolha formatos adequados'],
    checklist: ['Usei alt corretamente', 'Defini dimensões da imagem'],
  }),
  createLesson({
    id: 'html-lists',
    courseId: 'html',
    title: 'Listas',
    description: 'Listas ordenadas, não ordenadas e de definição.',
    heroSubtitle: 'Organize informação em sequência.',
    illustration: 'lists',
    sections: [
      {
        title: 'ul e ol',
        content: '<ul> cria listas com marcadores. <ol> cria listas numeradas. Cada item usa <li>.',
      },
      {
        title: 'Listas aninhadas',
        content: 'Você pode aninhar listas dentro de <li> para hierarquias complexas.',
      },
    ],
    example: {
      html: '<h3>Stack WebStart</h3>\n<ul>\n  <li>HTML5</li>\n  <li>CSS3</li>\n  <li>JavaScript</li>\n</ul>',
      css: 'ul { padding-left: 1.5rem; } li { margin: 0.4rem 0; }',
    },
    exercise: {
      prompt: 'Crie uma lista ordenada com 3 passos de aprendizagem.',
      starterCode: '',
      hint: 'Use ol para passos sequenciais.',
    },
    summary: ['ul = sem ordem', 'ol = com ordem', 'li = item da lista'],
    checklist: ['Criei ul e ol', 'Aninhei listas quando necessário'],
  }),
  createLesson({
    id: 'html-tables',
    courseId: 'html',
    title: 'Tabelas',
    description: 'table, tr, th, td e thead/tbody.',
    heroSubtitle: 'Dados tabulares bem estruturados.',
    illustration: 'tables',
    sections: [
      {
        title: 'Estrutura de tabelas',
        content: 'Use table > thead/tbody > tr > th/td. th para cabeçalhos, td para células de dados.',
      },
      {
        title: 'Quando usar tabelas',
        content: 'Tabelas são para dados tabulares, não para layout de página — use CSS Grid/Flexbox para layout.',
      },
    ],
    example: {
      html: '<table>\n  <thead>\n    <tr><th>Módulo</th><th>Status</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>HTML</td><td>Em progresso</td></tr>\n  </tbody>\n</table>',
      css: 'table { border-collapse: collapse; width: 100%; }\nth, td { border: 2px solid #064e3b; padding: 0.5rem; }',
    },
    exercise: {
      prompt: 'Crie uma tabela com 2 colunas e 3 linhas de dados.',
      starterCode: '<table>\n  \n</table>',
      hint: 'Use thead para cabeçalhos.',
    },
    summary: ['th = cabeçalho', 'td = dado', 'Não use table para layout'],
    checklist: ['Estruturei thead e tbody', 'Usei th e td corretamente'],
  }),
  createLesson({
    id: 'html-forms',
    courseId: 'html',
    title: 'Formulários',
    description: 'form, input, label, textarea e button.',
    heroSubtitle: 'Colete dados do usuário.',
    illustration: 'forms',
    sections: [
      {
        title: 'Elementos de formulário',
        content: 'form envolve campos. label associa texto ao input via for/id. input types: text, email, password, etc.',
      },
      {
        title: 'Acessibilidade em forms',
        content: 'Sempre use label. Agrupe campos relacionados com fieldset e legend.',
      },
    ],
    example: {
      html: '<form>\n  <label for="email">Email:</label>\n  <input type="email" id="email" required>\n  <button type="submit">Enviar</button>\n</form>',
      css: 'form { display: grid; gap: 0.75rem; max-width: 320px; }\ninput { padding: 0.5rem; border: 2px solid #064e3b; }',
    },
    exercise: {
      prompt: 'Crie um form com nome, email e botão submit.',
      starterCode: '<form>\n  \n</form>',
      hint: 'Associe cada label ao input com for/id.',
    },
    summary: ['label + input = acessível', 'Use types corretos', 'button type="submit" envia form'],
    checklist: ['Criei labels associados', 'Usei tipos de input adequados'],
  }),
  createLesson({
    id: 'html-semantic',
    courseId: 'html',
    title: 'HTML Semântico',
    description: 'header, nav, main, section, article, footer.',
    heroSubtitle: 'Marcação com significado real.',
    illustration: 'semantic',
    sections: [
      {
        title: 'Tags semânticas HTML5',
        content: 'header, nav, main, section, article, aside e footer dão significado estrutural ao conteúdo.',
      },
      {
        title: 'Benefícios',
        content: 'Melhor SEO, acessibilidade e manutenção. Leitores de tela navegam por landmarks.',
      },
    ],
    example: {
      html: '<header><nav>WebStart</nav></header>\n<main>\n  <article>\n    <h1>Aula Semântica</h1>\n    <section><p>Conteúdo...</p></section>\n  </article>\n</main>\n<footer>© WebStart</footer>',
      css: 'header, footer { background: #ecfdf5; padding: 1rem; }',
    },
    exercise: {
      prompt: 'Monte layout com header, main, article e footer.',
      starterCode: '',
      hint: 'main deve conter o conteúdo principal único.',
    },
    summary: ['Tags semânticas dão significado', 'main = conteúdo principal', 'Melhora SEO e a11y'],
    checklist: ['Usei landmarks semânticos', 'Evitei divs desnecessárias'],
  }),
  createLesson({
    id: 'html-project',
    courseId: 'html',
    title: 'Projeto Final HTML',
    description: 'Landing page completa usando tudo que aprendeu.',
    heroSubtitle: 'Construa sua primeira landing page.',
    illustration: 'project',
    sections: [
      {
        title: 'Briefing do projeto',
        content: 'Crie uma landing page para a WebStart Academy com hero, features, tabela de módulos e formulário de contato.',
      },
      {
        title: 'Critérios de avaliação',
        content: 'HTML semântico, hierarquia de headings, imagens com alt, links funcionais e formulário acessível.',
      },
    ],
    example: {
      html: '<header><h1>WebStart Academy</h1><nav><a href="#cursos">Cursos</a></nav></header>\n<main>\n  <section id="cursos"><h2>Cursos</h2><ul><li>HTML5</li><li>CSS3</li></ul></section>\n</main>',
      css: 'body { font-family: sans-serif; margin: 0; }\nheader { padding: 2rem; background: #ecfdf5; }',
    },
    exercise: {
      prompt: 'Complete a landing page com seção de features e form de contato.',
      starterCode: '<header><h1>WebStart</h1></header>\n<main></main>\n<footer>2026</footer>',
      hint: 'Use section, ul, form e tags semânticas.',
    },
    summary: ['Projeto integra todos os módulos', 'Semântica é essencial', 'Pratique no laboratório'],
    checklist: ['Landing page completa', 'Revisei acessibilidade', 'Testei no preview'],
  }),
]

const cssLessons = [
  createLesson({
    id: 'css-intro',
    courseId: 'css',
    title: 'Introdução ao CSS3',
    description: 'O que é CSS e como estilizar HTML.',
    heroSubtitle: 'Dê vida visual ao seu HTML.',
    illustration: 'palette',
    sections: [
      {
        title: 'CSS na prática',
        content: 'CSS (Cascading Style Sheets) controla aparência: cores, tipografia, layout e animações.',
      },
      {
        title: 'Formas de aplicar CSS',
        content: 'Inline (evite), internal (<style>) e external (arquivo .css linkado) — prefira external.',
      },
    ],
    example: {
      html: '<h1 class="title">WebStart</h1>\n<p class="subtitle">Aprenda CSS na prática</p>',
      css: '.title { color: #059669; font-size: 2rem; }\n.subtitle { color: #065f46; }',
    },
    exercise: {
      prompt: 'Estilize um h1 verde e um p com fonte maior.',
      starterCode: 'h1 {}\np {}',
      hint: 'Use color e font-size.',
    },
    summary: ['CSS estiliza HTML', 'Prefira CSS externo', 'Seletores aplicam regras'],
    checklist: ['Entendi o papel do CSS', 'Apliquei estilos básicos'],
  }),
  createLesson({
    id: 'css-selectors',
    courseId: 'css',
    title: 'Seletores',
    description: 'Elemento, classe, id e seletores combinados.',
    heroSubtitle: 'Aponte para os elementos certos.',
    illustration: 'target',
    sections: [
      {
        title: 'Tipos de seletores',
        content: 'Seletor de elemento (p), classe (.card), id (#hero) e combinadores (>, +, ~).',
      },
      {
        title: 'Especificidade',
        content: 'id > class > elemento. Evite !important. Prefira classes reutilizáveis.',
      },
    ],
    example: {
      html: '<div class="card"><p class="card__title">Título</p></div>',
      css: '.card { padding: 1rem; }\n.card__title { font-weight: bold; }',
    },
    exercise: {
      prompt: 'Crie estilos para .btn e .btn-primary.',
      starterCode: '.btn {}\n.btn-primary {}',
      hint: 'btn-primary pode ter background verde.',
    },
    summary: ['Classes são reutilizáveis', 'Ids devem ser únicos', 'Especificidade importa'],
    checklist: ['Usei seletores de classe', 'Entendi especificidade'],
  }),
  createLesson({
    id: 'css-colors',
    courseId: 'css',
    title: 'Cores',
    description: 'Hex, RGB, HSL e variáveis CSS.',
    heroSubtitle: 'Paleta WebStart: verde e branco.',
    illustration: 'colors',
    sections: [
      {
        title: 'Formatos de cor',
        content: 'Hex (#059669), rgb(), hsl() e named colors. HSL facilita criar variações.',
      },
      {
        title: 'CSS Variables',
        content: 'Defina --brand em :root e reutilize com var(--brand) em todo o projeto.',
      },
    ],
    example: {
      html: '<div class="badge">WebStart</div>',
      css: ':root { --brand: #059669; }\n.badge { background: var(--brand); color: white; padding: 0.5rem 1rem; }',
    },
    exercise: {
      prompt: 'Defina variáveis --primary e --bg e aplique em body e h1.',
      starterCode: ':root {}\nbody {}\nh1 {}',
      hint: 'Use var(--primary) para referenciar.',
    },
    summary: ['HSL facilita ajustes', 'Variáveis CSS escalam', 'Mantenha contraste acessível'],
    checklist: ['Usei variáveis CSS', 'Testei contraste de cores'],
  }),
  createLesson({
    id: 'css-typography',
    courseId: 'css',
    title: 'Tipografia',
    description: 'font-family, size, weight, line-height.',
    heroSubtitle: 'Texto legível e profissional.',
    illustration: 'typography',
    sections: [
      {
        title: 'Propriedades tipográficas',
        content: 'font-family define fonte. font-size o tamanho. font-weight a espessura. line-height o espaçamento entre linhas.',
      },
      {
        title: 'Escala tipográfica',
        content: 'Use uma escala consistente (1.25 ou 1.333) para headings e corpo.',
      },
    ],
    example: {
      html: '<h1>WebStart</h1>\n<p>Academia online de HTML e CSS.</p>',
      css: 'body { font-family: system-ui, sans-serif; line-height: 1.6; }\nh1 { font-size: 2.5rem; font-weight: 800; }',
    },
    exercise: {
      prompt: 'Configure font-family, line-height 1.7 e h1 com 2rem.',
      starterCode: 'body {}\nh1 {}',
      hint: 'line-height melhora legibilidade.',
    },
    summary: ['line-height ~1.5-1.7', 'Use system fonts ou web fonts', 'Escala consistente'],
    checklist: ['Configurei tipografia base', 'Ajustei headings'],
  }),
  createLesson({
    id: 'css-spacing',
    courseId: 'css',
    title: 'Espaçamentos',
    description: 'margin, padding e gap.',
    heroSubtitle: 'Respire entre os elementos.',
    illustration: 'spacing',
    sections: [
      {
        title: 'Box spacing',
        content: 'margin empurra elementos para fora. padding empurra conteúdo para dentro. gap funciona em flex/grid.',
      },
      {
        title: 'Shorthand',
        content: 'margin: 1rem 2rem (vertical horizontal). padding: 1rem (todos os lados).',
      },
    ],
    example: {
      html: '<div class="box"><p>Conteúdo</p></div>',
      css: '.box { padding: 1.5rem; margin: 1rem; border: 2px solid #064e3b; }',
    },
    exercise: {
      prompt: 'Crie .card com padding 1.5rem e margin-bottom 1rem.',
      starterCode: '.card {}',
      hint: 'padding interno, margin externo.',
    },
    summary: ['margin = externo', 'padding = interno', 'gap para flex/grid'],
    checklist: ['Diferencio margin e padding', 'Usei shorthand'],
  }),
  createLesson({
    id: 'css-box-model',
    courseId: 'css',
    title: 'Box Model',
    description: 'content, padding, border, margin e box-sizing.',
    heroSubtitle: 'Entenda como o CSS calcula tamanhos.',
    illustration: 'box',
    sections: [
      {
        title: 'O Box Model',
        content: 'Todo elemento é uma caixa: content → padding → border → margin.',
      },
      {
        title: 'box-sizing: border-box',
        content: 'Com border-box, width inclui padding e border — muito mais previsível para layout.',
      },
    ],
    example: {
      html: '<div class="box">Box Model</div>',
      css: '* { box-sizing: border-box; }\n.box { width: 200px; padding: 20px; border: 3px solid #059669; }',
    },
    exercise: {
      prompt: 'Aplique border-box globalmente e crie box de 300px com padding 16px.',
      starterCode: '* {}\n.box {}',
      hint: 'box-sizing: border-box no universal selector.',
    },
    summary: ['border-box é padrão moderno', 'Box = content+padding+border+margin'],
    checklist: ['Entendi o box model', 'Usei border-box'],
  }),
  createLesson({
    id: 'css-flexbox',
    courseId: 'css',
    title: 'Flexbox',
    description: 'display flex, justify-content, align-items.',
    heroSubtitle: 'Layout flexível em uma dimensão.',
    illustration: 'flex',
    sections: [
      {
        title: 'Flex container',
        content: 'display: flex no pai. justify-content alinha no eixo principal. align-items no cruzado.',
      },
      {
        title: 'Flex items',
        content: 'flex: 1 faz item crescer. gap substitui margins entre items.',
      },
    ],
    example: {
      html: '<div class="row">\n  <div class="item">A</div>\n  <div class="item">B</div>\n</div>',
      css: '.row { display: flex; gap: 1rem; justify-content: center; }\n.item { flex: 1; padding: 1rem; background: #ecfdf5; }',
    },
    exercise: {
      prompt: 'Crie flex row centralizado com gap 1rem e 3 items.',
      starterCode: '.row {}\n.item {}',
      hint: 'display: flex; justify-content: center;',
    },
    summary: ['Flex = 1 dimensão', 'justify + align controlam posição', 'gap > margin hack'],
    checklist: ['Criei layout flex', 'Usei justify e align'],
  }),
  createLesson({
    id: 'css-grid',
    courseId: 'css',
    title: 'Grid',
    description: 'display grid, grid-template-columns.',
    heroSubtitle: 'Layout bidimensional poderoso.',
    illustration: 'grid',
    sections: [
      {
        title: 'CSS Grid',
        content: 'display: grid. grid-template-columns define colunas. gap espaça células.',
      },
      {
        title: 'Grid vs Flex',
        content: 'Grid para layouts 2D (páginas, dashboards). Flex para alinhar items em linha/coluna.',
      },
    ],
    example: {
      html: '<div class="grid">\n  <div>1</div><div>2</div><div>3</div><div>4</div>\n</div>',
      css: '.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }',
    },
    exercise: {
      prompt: 'Grid 3 colunas iguais com gap 1.5rem.',
      starterCode: '.grid {}',
      hint: 'repeat(3, 1fr).',
    },
    summary: ['Grid = 2 dimensões', 'repeat() simplifica colunas', 'Combine com Flex'],
    checklist: ['Criei grid layout', 'Usei repeat e fr'],
  }),
  createLesson({
    id: 'css-responsive',
    courseId: 'css',
    title: 'Responsividade',
    description: 'Media queries, unidades relativas e mobile-first.',
    heroSubtitle: 'Funcione em qualquer tela.',
    illustration: 'responsive',
    sections: [
      {
        title: 'Mobile-first',
        content: 'Estilize para mobile primeiro, depois adicione @media (min-width) para telas maiores.',
      },
      {
        title: 'Unidades relativas',
        content: 'rem, em, %, vw/vh adaptam melhor que px fixos.',
      },
    ],
    example: {
      html: '<div class="container">Responsivo</div>',
      css: '.container { padding: 1rem; }\n@media (min-width: 768px) { .container { max-width: 720px; margin: 0 auto; } }',
    },
    exercise: {
      prompt: 'Container 100% mobile, max-width 960px em telas > 768px.',
      starterCode: '.container {}',
      hint: '@media (min-width: 768px) { ... }',
    },
    summary: ['Mobile-first', 'rem/% > px fixo', 'Media queries adaptam layout'],
    checklist: ['Usei media queries', 'Pensei mobile-first'],
  }),
  createLesson({
    id: 'css-animations',
    courseId: 'css',
    title: 'Animações',
    description: 'transition, transform e @keyframes.',
    heroSubtitle: 'Micro-interações que encantam.',
    illustration: 'motion',
    sections: [
      {
        title: 'Transitions',
        content: 'transition: property duration easing. Ideal para hover e estados.',
      },
      {
        title: 'Keyframes',
        content: '@keyframes define animações complexas. animation aplica com duration e iteration.',
      },
    ],
    example: {
      html: '<button class="btn">Hover me</button>',
      css: '.btn { transition: transform 0.2s; }\n.btn:hover { transform: translateY(-2px); }',
    },
    exercise: {
      prompt: 'Botão com transition no hover (scale 1.05).',
      starterCode: '.btn {}\n.btn:hover {}',
      hint: 'transform: scale(1.05).',
    },
    summary: ['transition para estados', 'keyframes para loops', 'Use com moderação'],
    checklist: ['Criei hover animado', 'Entendi transition vs animation'],
  }),
  createLesson({
    id: 'css-project',
    courseId: 'css',
    title: 'Projeto Final CSS',
    description: 'Estilize a landing page HTML com design WebStart.',
    heroSubtitle: 'Brutalismo moderno verde e branco.',
    illustration: 'project',
    sections: [
      {
        title: 'Design System WebStart',
        content: 'Bordas grossas, sombras duras, paleta verde/branco, cards elevados e tipografia bold.',
      },
      {
        title: 'Entrega',
        content: 'Landing responsiva com flex/grid, variáveis CSS, animações sutis e dark mode opcional.',
      },
    ],
    example: {
      html: '<div class="hero"><h1>WebStart</h1></div>',
      css: ':root { --green: #059669; --shadow: 4px 4px 0 #064e3b; }\n.hero { border: 3px solid #064e3b; box-shadow: var(--shadow); padding: 2rem; }',
    },
    exercise: {
      prompt: 'Estilize landing completa com cards, grid e hover animations.',
      starterCode: ':root {}\n.hero {}\n.card {}',
      hint: 'Use border 3px, box-shadow offset e verde brand.',
    },
    summary: ['Projeto integra CSS completo', 'Design system consistente', 'Responsivo e animado'],
    checklist: ['Landing estilizada', 'Design responsivo', 'Pronto para certificado'],
  }),
]

export const courses = [
  {
    id: 'html',
    title: 'HTML5',
    description: 'Estruture páginas web com marcação semântica moderna.',
    icon: 'code',
    color: 'brand',
    lessons: htmlLessons,
  },
  {
    id: 'css',
    title: 'CSS3',
    description: 'Estilize interfaces com layout, cores e animações.',
    icon: 'palette',
    color: 'brand',
    lessons: cssLessons,
  },
]

export const allLessons = [...htmlLessons, ...cssLessons]

export function getLessonById(lessonId) {
  return allLessons.find((lesson) => lesson.id === lessonId)
}

export function getCourseById(courseId) {
  return courses.find((course) => course.id === courseId)
}

export function getNextLesson(lessonId) {
  const index = allLessons.findIndex((lesson) => lesson.id === lessonId)
  return index >= 0 ? allLessons[index + 1] : null
}
