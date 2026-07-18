import { createModule } from '../schemas.js'

export const javascriptModules = [
  // ─── Módulos de Vídeo — Trilha JavaScript ─────────────────────────────────
  createModule({
    id: 'js-vid-fundamentals',
    courseId: 'javascript',
    title: 'Fundamentos do JavaScript (Vídeo)',
    description: 'Variáveis, tipos de dados, condicionais e funções em JavaScript.',
    order: 1,
    lessons: ['js-vid-1', 'js-vid-2', 'js-vid-3', 'js-vid-4'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'js-vid-dom-loops',
    courseId: 'javascript',
    title: 'DOM e Loops (Vídeo)',
    description: 'Manipulação do DOM, loops e métodos de iteração em JavaScript.',
    order: 2,
    lessons: ['js-vid-5', 'js-vid-6', 'js-vid-7'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'js-vid-arrays',
    courseId: 'javascript',
    title: 'Arrays e Métodos (Vídeo)',
    description: 'Objeto Math, map, reduce e filter para manipulação de dados.',
    order: 3,
    lessons: ['js-vid-8', 'js-vid-9'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
]
