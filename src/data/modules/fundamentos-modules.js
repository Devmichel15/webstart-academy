import { createModule } from '../schemas.js'

// ─── LÓGICA DE PROGRAMAÇÃO — Módulos ─────────────────────────────────────────
// Playlist: https://www.youtube.com/playlist?list=PLfzRxaru7YPtu8TPQChFnLN9rGXoXfNUQ
// Instrutor: Cataline
// courseId mantido como 'fundamentos-web' para compatibilidade com o sistema de progresso.

export const fundamentosModules = [
  createModule({
    id: 'logica-mod-introducao',
    courseId: 'fundamentos-web',
    title: 'Módulo 1 — Introdução à Lógica de Programação',
    description: 'Conceitos essenciais de lógica, algoritmos e a base do pensamento computacional.',
    order: 1,
    lessons: ['logica-vid-1', 'logica-vid-2', 'logica-vid-3'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'logica-mod-variaveis',
    courseId: 'fundamentos-web',
    title: 'Módulo 2 — Variáveis e Tipos de Dados',
    description: 'Entenda como armazenar informações com variáveis e os diferentes tipos de dados.',
    order: 2,
    lessons: ['logica-vid-4', 'logica-vid-5'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'logica-mod-operadores',
    courseId: 'fundamentos-web',
    title: 'Módulo 3 — Operadores',
    description: 'Operadores matemáticos, de comparação e lógicos para construir expressões.',
    order: 3,
    lessons: ['logica-vid-6', 'logica-vid-7', 'logica-vid-8'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'logica-mod-controle',
    courseId: 'fundamentos-web',
    title: 'Módulo 4 — Estruturas de Controle',
    description: 'Condicionais e laços de repetição para controlar o fluxo dos seus algoritmos.',
    order: 4,
    lessons: ['logica-vid-9', 'logica-vid-10'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'logica-mod-funcoes',
    courseId: 'fundamentos-web',
    title: 'Módulo 5 — Funções',
    description: 'Crie blocos de código reutilizáveis com funções.',
    order: 5,
    lessons: ['logica-vid-11'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'logica-mod-projetos',
    courseId: 'fundamentos-web',
    title: 'Módulo 6 — Projetos Práticos',
    description: 'Aplique tudo que aprendeu em projetos práticos do dia a dia da programação.',
    order: 6,
    lessons: ['logica-vid-12', 'logica-vid-13', 'logica-vid-14'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
]
