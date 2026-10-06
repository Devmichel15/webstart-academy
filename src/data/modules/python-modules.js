import { createModule } from '../schemas.js'

// ─── PYTHON 3 — Módulos ───────────────────────────────────────────────────────
// Playlist do Mundo 1: https://www.youtube.com/playlist?list=PLHz_AreHm4dlKP6QQCekuIPky1CiwmdI6
// Instrutor: Gustavo Guanabara (Curso em Vídeo - brasil)
// courseId: 'python' (trilha Python)

export const pythonModules = [
  createModule({
    id: 'python-mod-mundo1',
    courseId: 'python',
    title: 'Mundo 1 — Fundamentos de Python',
    description: 'Primeiros passos com Python: instalação, tipos primitivos, operadores, módulos, strings e condicionais.',
    order: 1,
    lessons: [
      'python-vid-1',
      'python-vid-2',
      'python-vid-3',
      'python-vid-4',
      'python-vid-5',
      'python-vid-6',
      'python-vid-7',
      'python-vid-8',
      'python-vid-9',
      'python-vid-10',
      'python-vid-11',
    ],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'python-mod-mundo2',
    courseId: 'python',
    title: 'Mundo 2 — Estruturas de Controle',
    description: 'Condicionais aninhadas, estruturas de repetição for e while, interrupções e lógica de fluxo avançada.',
    order: 2,
    lessons: [
      'python-vid-12',
      'python-vid-13',
      'python-vid-14',
      'python-vid-15',
      'python-vid-16',
    ],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'python-mod-mundo3',
    courseId: 'python',
    title: 'Mundo 3 — Estruturas Compostas',
    description: 'Tuplas, listas, dicionários, funções, módulos, pacotes e tratamento de erros em Python.',
    order: 3,
    lessons: [
      'python-vid-17',
      'python-vid-18',
      'python-vid-19',
      'python-vid-20',
      'python-vid-21',
      'python-vid-22',
      'python-vid-23',
    ],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
]
