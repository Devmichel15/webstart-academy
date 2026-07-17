import { createModule } from '../schemas.js'

export const cssModules = [
  // ─── Módulo de Vídeo — Trilha CSS ───────────────────────────────────────
  createModule({
    id: 'css-vid-intro',
    courseId: 'css',
    title: 'Introdução ao CSS (Vídeo)',
    description: 'Formas de aplicar CSS: inline, interno e externo em vídeo.',
    order: 1,
    lessons: ['css-vid-intro-1', 'css-vid-intro-2', 'css-vid-intro-3'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
]
