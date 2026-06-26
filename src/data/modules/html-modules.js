import { createModule, createQuiz, createQuestion, createLab, createMiniProject } from '../schemas.js'

export const htmlFundamentalsQuiz = createQuiz({
  id: 'html-fundamentals-quiz',
  title: 'Quiz: Fundamentos do HTML',
  questions: [
    createQuestion({
      question: 'O que significa HTML?',
      options: ['HyperText Markup Language', 'Home Tool Markup Language', 'HyperTool Modern Language'],
      correctIndex: 0,
      explanation: 'HTML é a sigla para HyperText Markup Language, a linguagem de marcação padrão para a web.',
    }),
    createQuestion({
      question: 'Qual tag é usada para criar o maior título?',
      options: ['<heading>', '<h1>', '<h6>', '<head>'],
      correctIndex: 1,
      explanation: '<h1> é a tag de título mais importante, usada uma vez por página.',
    }),
    createQuestion({
      question: 'Onde os metadados do documento ficam?',
      options: ['<body>', '<main>', '<head>', '<footer>'],
      correctIndex: 2,
      explanation: '<head> contém metadados como charset, viewport e title.',
    }),
    createQuestion({
      question: 'Qual atributo é obrigatório em uma tag <img>?',
      options: ['src', 'href', 'class', 'style'],
      correctIndex: 0,
      explanation: 'src (source) é obrigatório para especificar o caminho da imagem.',
    }),
    createQuestion({
      question: 'DOCTYPE html declara qual versão do HTML?',
      options: ['HTML4', 'XHTML', 'HTML5', 'HTML3'],
      correctIndex: 2,
      explanation: '<!DOCTYPE html> declara que o documento usa HTML5.',
    }),
  ],
})

export const htmlFundamentalsLab = createLab({
  id: 'html-fundamentals-lab',
  title: 'Laboratório: Estrutura Base',
  description: 'Pratique montando a estrutura completa de um documento HTML.',
  context:
    'Você é um desenvolvedor júnior na WebStart Academy e precisa criar a estrutura base de uma página de documentação interna.',
  starterHtml: '<!DOCTYPE html>\n<html lang="pt">\n  <head>\n    \n  </head>\n  <body>\n    \n  </body>\n</html>',
  starterCss: 'body {\n  font-family: system-ui, sans-serif;\n  max-width: 720px;\n  margin: 0 auto;\n  padding: 2rem;\n}',
  hint: 'Adicione meta charset, meta viewport e title no head. No body, use h1 + p.',
  checklist: [
    'DOCTYPE declarado',
    'meta charset definido',
    'meta viewport configurado',
    'title preenchido',
    'Conteúdo semântico no body',
  ],
})

export const htmlFundamentalsMiniProject = createMiniProject({
  id: 'html-fundamentals-mini',
  title: 'Mini Projeto: Página de Documentação',
  description: 'Crie uma página de documentação usando a estrutura base aprendida.',
  context:
    'A equipe da WebStart precisa de uma página de documentação interna. Você ficou responsável por criar a estrutura HTML completa com explicações sobre as tags que aprendeu.',
  requirements: [
    'DOCTYPE HTML5 e lang="pt"',
    'meta charset e viewport',
    'Título na aba (title)',
    'Um h1 principal',
    'Pelo menos 2 seções com h2',
    'Parágrafo em cada seção',
    'Uma imagem ilustrativa',
    'Um link externo',
  ],
  starterHtml: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Documentação WebStart</title>\n</head>\n<body>\n  <h1>Bem-vindo à Documentação</h1>\n  \n</body>\n</html>',
  starterCss: 'body {\n  font-family: system-ui, sans-serif;\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 2rem;\n  line-height: 1.6;\n}\nh1 { color: #059669; }',
  hint: 'Pense na hierarquia: h1 → h2 → p. Use section para agrupar conteúdo.',
  rubric: [
    'Estrutura base completa',
    'Tags semânticas usadas corretamente',
    'Hierarquia de headings respeitada',
    'Imagem com alt descritivo',
    'Link funcional',
    'Código limpo e indentado',
  ],
})

export const htmlSemanticQuiz = createQuiz({
  id: 'html-semantic-quiz',
  title: 'Quiz: HTML Semântico',
  questions: [
    createQuestion({
      question: 'Qual tag representa o conteúdo principal da página?',
      options: ['<header>', '<main>', '<section>', '<article>'],
      correctIndex: 1,
      explanation: '<main> envolve o conteúdo principal e deve ser usado uma vez por página.',
    }),
    createQuestion({
      question: 'Para que serve a tag <nav>?',
      options: ['Navegação entre páginas', 'Notas de rodapé', 'Novos artigos', 'Números de lista'],
      correctIndex: 0,
      explanation: '<nav> define um conjunto de links de navegação.',
    }),
  ],
})

export const htmlSemanticLab = createLab({
  id: 'html-semantic-lab',
  title: 'Laboratório: Página Semântica',
  description: 'Estruture uma página completa usando apenas tags semânticas HTML5.',
  context:
    'Você precisa refatorar uma página que foi feita inteiramente com <div> e transformá-la em HTML semântico.',
  starterHtml: '<header>\n  <h1>WebStart Academy</h1>\n  <nav>\n    <a href="#">Início</a>\n    <a href="#">Cursos</a>\n  </nav>\n</header>\n<main>\n  \n</main>\n<footer>\n  <p>© 2026 WebStart</p>\n</footer>',
  starterCss: 'body { margin: 0; font-family: system-ui, sans-serif; }\nheader, footer { background: #ecfdf5; padding: 2rem; text-align: center; }\nmain { max-width: 720px; margin: 2rem auto; padding: 1rem; }',
  hint: 'Use article para conteúdo independente, section para agrupar temas e aside para informação complementar.',
  checklist: [
    'header com título e nav',
    'main com conteúdo principal',
    'article usado corretamente',
    'section agrupando temas',
    'footer com informações',
    'Nenhuma div desnecessária',
  ],
})

export const htmlSemanticMiniProject = createMiniProject({
  id: 'html-semantic-mini',
  title: 'Mini Projeto: Blog Semântico',
  description: 'Crie a estrutura de um blog usando HTML semântico completo.',
  context:
    'A WebStart Academy quer lançar um blog de tecnologia. Você precisa criar a estrutura HTML de um artigo de blog, incluindo header, artigo com seções, sidebar com links e footer.',
  requirements: [
    'Header com nav',
    'Article com título e múltiplas seções',
    'Aside com links relacionados',
    'Footer com copyright',
    'Imagem no artigo com alt',
    'Lista de referências',
  ],
  starterHtml: '<header>\n  <h1>WebStart Blog</h1>\n  <nav>\n    <a href="#">HTML</a>\n    <a href="#">CSS</a>\n  </nav>\n</header>\n<main>\n  <article>\n    <h2>Meu Primeiro Artigo</h2>\n    \n  </article>\n  <aside>\n    <h3>Links Relacionados</h3>\n  </aside>\n</main>\n<footer>\n  <p>© 2026 WebStart</p>\n</footer>',
  starterCss: 'body { margin: 0; font-family: system-ui, sans-serif; }\nheader, footer { background: #ecfdf5; padding: 2rem; text-align: center; }\nmain { max-width: 960px; margin: 2rem auto; display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; padding: 1rem; }\naside { background: #f0fdf4; padding: 1rem; border: 2px solid #059669; }\n@media (max-width: 640px) { main { grid-template-columns: 1fr; } }',
  hint: 'Use article > section para dividir o conteúdo. Aside pode conter uma lista de links.',
  rubric: [
    'Estrutura semântica completa',
    'Landmarks corretos (header, main, footer)',
    'Article bem estruturado',
    'Aside com conteúdo relevante',
    'Responsivo',
    'Código limpo',
  ],
})

export const htmlFormsQuiz = createQuiz({
  id: 'html-forms-quiz',
  title: 'Quiz: Formulários e Mídia',
  questions: [
    createQuestion({
      question: 'Qual atributo associa um <label> a um <input>?',
      options: ['name', 'id', 'for', 'class'],
      correctIndex: 2,
      explanation: 'O atributo for do label deve corresponder ao id do input.',
    }),
    createQuestion({
      question: 'Qual tipo de input é usado para senhas?',
      options: ['text', 'password', 'hidden', 'email'],
      correctIndex: 1,
      explanation: 'type="password" oculta os caracteres digitados.',
    }),
  ],
})

export const htmlFormsLab = createLab({
  id: 'html-forms-lab',
  title: 'Laboratório: Formulário de Contato',
  description: 'Crie um formulário de contato completo e acessível.',
  context:
    'A WebStart precisa de um formulário de contato para sua landing page. O formulário deve ser acessível e seguir as melhores práticas.',
  starterHtml: '<form>\n  <label for="nome">Nome:</label>\n  <input type="text" id="nome" name="nome" required>\n  \n  <button type="submit">Enviar</button>\n</form>',
  starterCss: 'form { max-width: 400px; margin: 0 auto; display: grid; gap: 0.75rem; }\ninput, textarea { padding: 0.5rem; border: 2px solid #064e3b; border-radius: 4px; }\nbutton { background: #059669; color: white; border: none; padding: 0.75rem; font-weight: bold; cursor: pointer; }',
  hint: 'Adicione campo de email, textarea para mensagem e fieldset para agrupar.',
  checklist: [
    'Label associado a cada input',
    'Campos: nome, email, mensagem',
    'Textarea para mensagem longa',
    'Button type submit',
    'Fieldset agrupando dados pessoais',
  ],
})

export const htmlFormsMiniProject = createMiniProject({
  id: 'html-forms-mini',
  title: 'Mini Projeto: Página de Cadastro',
  description: 'Crie uma página de cadastro completa com formulário e informações.',
  context:
    'A WebStart Academy está lançando um novo curso e precisa de uma página de cadastro de interesse. Crie uma página com formulário completo e informações sobre o curso.',
  requirements: [
    'Header com título',
    'Formulário com nome, email, telefone e select',
    'Checkbox para aceitar termos',
    'Botão de envio',
    'Footer com informações',
    'Usar apenas tags semânticas',
  ],
  starterHtml: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Cadastro - WebStart</title>\n</head>\n<body>\n  <header>\n    <h1>WebStart Academy</h1>\n    <p>Cadastre-se para novas turmas</p>\n  </header>\n  <main>\n    <form>\n      \n    </form>\n  </main>\n</body>\n</html>',
  starterCss: 'body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; }\nheader { text-align: center; margin-bottom: 2rem; }\nform { display: grid; gap: 1rem; }\nlabel { font-weight: bold; }\ninput, select { padding: 0.5rem; border: 2px solid #064e3b; border-radius: 4px; }',
  hint: 'Use fieldset para agrupar campos relacionados e legend para descrever o grupo.',
  rubric: [
    'Formulário completo e funcional',
    'Todos os labels associados',
    'Campos com tipos corretos',
    'HTML semântico',
    'Acessibilidade',
    'Design limpo',
  ],
})

export const htmlModules = [
  createModule({
    id: 'html-fundamentals',
    courseId: 'html',
    title: 'Fundamentos do HTML',
    description: 'Estrutura base, tags, títulos, parágrafos e os blocos fundamentais da web.',
    order: 1,
    lessons: ['html-intro', 'html-structure', 'html-tags', 'html-headings', 'html-paragraphs'],
    quiz: htmlFundamentalsQuiz,
    lab: htmlFundamentalsLab,
    miniProject: htmlFundamentalsMiniProject,
  }),
  createModule({
    id: 'html-content-media',
    courseId: 'html',
    title: 'Conteúdo e Mídia',
    description: 'Links, imagens, listas e como enriquecer suas páginas.',
    order: 2,
    lessons: ['html-links', 'html-images', 'html-lists'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'html-semantic',
    courseId: 'html',
    title: 'HTML Semântico',
    description: 'Tags semânticas, tabelas e a importância da marcação com significado.',
    order: 3,
    lessons: ['html-tables', 'html-semantic'],
    quiz: htmlSemanticQuiz,
    lab: htmlSemanticLab,
    miniProject: htmlSemanticMiniProject,
  }),
  createModule({
    id: 'html-forms',
    courseId: 'html',
    title: 'Formulários e Interação',
    description: 'Formulários, inputs e captura de dados do usuário.',
    order: 4,
    lessons: ['html-forms'],
    quiz: htmlFormsQuiz,
    lab: htmlFormsLab,
    miniProject: htmlFormsMiniProject,
  }),
]
