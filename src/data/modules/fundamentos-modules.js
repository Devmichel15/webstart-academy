import { createModule, createLab, createMiniProject } from '../schemas.js'

export const webFinalLab = createLab({
  id: 'web-final-lab',
  title: 'Laboratório: Mapa Visual da Internet',
  description: 'Crie uma página que explique visualmente como a Internet funciona.',
  context:
    'Você foi contratado para criar uma página educativa que mostre o fluxo completo de como um site chega até o usuário. Use títulos, listas e imagens para ilustrar o processo.',
  starterHtml: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Como a Internet Funciona</title>\n</head>\n<body>\n  <h1>Mapa da Internet</h1>\n  \n</body>\n</html>',
  starterCss: 'body {\n  font-family: system-ui, sans-serif;\n  max-width: 720px;\n  margin: 0 auto;\n  padding: 2rem;\n  line-height: 1.6;\n}\nh1 { color: #059669; }\nh2 { margin-top: 2rem; }',
  hint: 'Use h2 para cada etapa (DNS, Servidor, HTTP, Navegador) e p para explicar cada uma. Adicione uma imagem ilustrativa no final.',
  checklist: [
    'Título principal com h1',
    'Cada etapa explicada com h2 + p',
    'Pelo menos 4 etapas do fluxo',
    'Imagem ilustrativa com alt',
    'Lista de curiosidades',
    'Código limpo e indentado',
  ],
})

export const webFinalMiniProject = createMiniProject({
  id: 'web-final-mini',
  title: 'Mini Projeto: Guia Visual da Internet',
  description: 'Crie uma página completa que funcione como um guia visual sobre os fundamentos da Internet.',
  context:
    'A WebStart Academy precisa de um material didático sobre fundamentos da Internet. Crie uma página que explique os conceitos de forma clara e visual, usando tudo que aprendeu.',
  requirements: [
    'DOCTYPE HTML5 e lang="pt"',
    'meta charset e viewport',
    'Título descritivo',
    'Seção sobre a história da Internet',
    'Seção explicando cliente vs servidor',
    'Seção sobre DNS e HTTP',
    'Seção sobre frontend e backend',
    'Lista de tecnologias web',
    'Imagens ilustrativas',
    'Links para fontes de pesquisa',
  ],
  starterHtml: '<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Guia da Internet - WebStart</title>\n</head>\n<body>\n  <h1>Guia Completo da Internet</h1>\n  \n</body>\n</html>',
  starterCss: 'body {\n  font-family: system-ui, sans-serif;\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 2rem;\n  line-height: 1.6;\n}\nh1 { color: #059669; text-align: center; }\nh2 { border-bottom: 2px solid #059669; padding-bottom: 0.5rem; }',
  hint: 'Organize cada conceito em uma seção separada com h2. Use listas para tecnologias. Adicione uma imagem representativa.',
  rubric: [
    'Estrutura HTML completa',
    'Todas as seções obrigatórias',
    'Hierarquia de headings correta',
    'Imagens com alt descritivo',
    'Links funcionais',
    'Código bem indentado',
  ],
})

export const fundamentosModules = [
  createModule({
    id: 'web-fundamentos',
    courseId: 'fundamentos-web',
    title: 'Fundamentos da Internet',
    description: 'História, DNS, HTTP, frontend, backend e o ecossistema web.',
    order: 1,
    lessons: ['web-intro', 'web-dns-http', 'web-front-back', 'web-ecosystem'],
    quiz: null,
    lab: webFinalLab,
    miniProject: webFinalMiniProject,
  }),
]
