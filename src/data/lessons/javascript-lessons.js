import { createVideoLesson } from './video-lessons.js'

const JS_CREDIT = '\n\nConteúdo por: DevClub (https://www.youtube.com/@canaldevclub)'

export const javascriptLessons = [
  // ═══════════════════════════════════════════════════════════════════════════
  // JAVASCRIPT — VÍDEO AULAS (trilha javascript)
  // Fonte: https://www.youtube.com/playlist?list=PLsFVybaG4mODFwCuV06yLitVTikKF09sy
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── MÓDULO: Fundamentos do JavaScript ────────────────────────────────────
  createVideoLesson({
    id: 'js-vid-1',
    courseId: 'javascript',
    moduleId: 'js-vid-fundamentals',
    title: 'Curso de JavaScript Completo pt.1',
    description: 'Introdução ao curso completo de JavaScript do DevClub. Aprenda os fundamentos da linguagem mais usada na web.' + JS_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=UVLT52VcRkY',
    embedUrl: 'https://www.youtube.com/embed/UVLT52VcRkY',
    duration: '16:51',
    order: 1,
    objectives: [
      'Compreender o que é JavaScript e sua importância na web',
      'Configurar o ambiente de desenvolvimento',
      'Escrever o primeiro código JavaScript',
    ],
    materials: [
      'Navegador web atualizado',
      'Editor de código (VS Code ou similar)',
    ],
  }),
  createVideoLesson({
    id: 'js-vid-2',
    courseId: 'javascript',
    moduleId: 'js-vid-fundamentals',
    title: 'Variáveis e Tipos de Dados',
    description: 'Domine variáveis e tipos de dados em JavaScript — let, const, string, number, boolean e mais.' + JS_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=4Y87KSByqOY',
    embedUrl: 'https://www.youtube.com/embed/4Y87KSByqOY',
    duration: '25:08',
    order: 2,
    objectives: [
      'Entender a diferença entre var, let e const',
      'Conhecer os tipos de dados primitivos',
      'Declarar e utilizar variáveis corretamente',
    ],
    materials: [
      'Navegador web',
      'Editor de código',
    ],
  }),
  createVideoLesson({
    id: 'js-vid-3',
    courseId: 'javascript',
    moduleId: 'js-vid-fundamentals',
    title: 'Condicionais If & Else',
    description: 'Estruturas condicionais em JavaScript — if, else, else if e operadores de comparação.' + JS_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=K0osjIl2BBw',
    embedUrl: 'https://www.youtube.com/embed/K0osjIl2BBw',
    duration: '14:59',
    order: 3,
    objectives: [
      'Usar estruturas condicionais if/else',
      'Combinar condições com operadores lógicos',
      'Tomar decisões no código com base em condições',
    ],
    materials: [
      'Navegador web',
      'Editor de código',
    ],
  }),
  createVideoLesson({
    id: 'js-vid-4',
    courseId: 'javascript',
    moduleId: 'js-vid-fundamentals',
    title: 'Funções em JavaScript',
    description: 'Aprenda a criar e utilizar funções em JavaScript de forma simples e direta.' + JS_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=RTfMHMQp2e4',
    embedUrl: 'https://www.youtube.com/embed/RTfMHMQp2e4',
    duration: '22:30',
    order: 4,
    objectives: [
      'Declarar funções com function e arrow function',
      'Passar parâmetros e retornar valores',
      'Entender escopo de variáveis em funções',
    ],
    materials: [
      'Navegador web',
      'Editor de código',
    ],
  }),

  // ─── MÓDULO: DOM e Loops ──────────────────────────────────────────────────
  createVideoLesson({
    id: 'js-vid-5',
    courseId: 'javascript',
    moduleId: 'js-vid-dom-loops',
    title: 'JavaScript, a Web e a DOM na Prática',
    description: 'Entenda como JavaScript interage com a web e manipula o DOM na prática.' + JS_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=DcN49TD7it0',
    embedUrl: 'https://www.youtube.com/embed/DcN49TD7it0',
    duration: '28:17',
    order: 1,
    objectives: [
      'Entender o que é o DOM (Document Object Model)',
      'Selecionar elementos com querySelector',
      'Manipular conteúdo e estilos de elementos',
    ],
    materials: [
      'Navegador web',
      'Editor de código',
    ],
  }),
  createVideoLesson({
    id: 'js-vid-6',
    courseId: 'javascript',
    moduleId: 'js-vid-dom-loops',
    title: 'Loops: For, For Of e For In',
    description: 'Aprenda a usar loops em JavaScript — for, for of e for in de forma simples e direta.' + JS_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=Ah_PWZw6pNQ',
    embedUrl: 'https://www.youtube.com/embed/Ah_PWZw6pNQ',
    duration: '19:14',
    order: 2,
    objectives: [
      'Usar o loop clássico for',
      'Iterar arrays com for of',
      'Iterar objetos com for in',
    ],
    materials: [
      'Navegador web',
      'Editor de código',
    ],
  }),
  createVideoLesson({
    id: 'js-vid-7',
    courseId: 'javascript',
    moduleId: 'js-vid-dom-loops',
    title: 'Método forEach',
    description: 'Aprenda a usar o método forEach de forma rápida e simples em JavaScript.' + JS_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=9I8_AxWWNkg',
    embedUrl: 'https://www.youtube.com/embed/9I8_AxWWNkg',
    duration: '10:04',
    order: 3,
    objectives: [
      'Usar o método forEach para iterar arrays',
      'Entender a sintaxe e os parâmetros do callback',
      'Comparar forEach com outros loops',
    ],
    materials: [
      'Navegador web',
      'Editor de código',
    ],
  }),

  // ─── MÓDULO: Arrays e Métodos ─────────────────────────────────────────────
  createVideoLesson({
    id: 'js-vid-8',
    courseId: 'javascript',
    moduleId: 'js-vid-arrays',
    title: 'Objeto Math em JavaScript',
    description: 'Tudo o que você precisa saber sobre o objeto Math em JavaScript.' + JS_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=zltocZWqhak',
    embedUrl: 'https://www.youtube.com/embed/zltocZWqhak',
    duration: '9:10',
    order: 1,
    objectives: [
      'Usar métodos matemáticos (Math.round, Math.floor, etc.)',
      'Gerar números aleatórios com Math.random',
      'Conhecer outras propriedades do objeto Math',
    ],
    materials: [
      'Navegador web',
      'Editor de código',
    ],
  }),
  createVideoLesson({
    id: 'js-vid-9',
    courseId: 'javascript',
    moduleId: 'js-vid-arrays',
    title: 'Map, Reduce e Filter na Prática',
    description: 'Domine os métodos map, reduce e filter para manipulação de arrays em JavaScript.' + JS_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=Ar2cMgpjkLM',
    embedUrl: 'https://www.youtube.com/embed/Ar2cMgpjkLM',
    duration: '37:08',
    order: 2,
    objectives: [
      'Transformar arrays com map',
      'Filtrar elementos com filter',
      'Acumular valores com reduce',
    ],
    materials: [
      'Navegador web',
      'Editor de código',
    ],
  }),
]
