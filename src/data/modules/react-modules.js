import { createModule } from '../schemas.js'

// ─── REACTJS — Módulos ────────────────────────────────────────────────────────
// Trilha oficial produzida pela WebStart Academy.
// Playlist: https://www.youtube.com/watch?v=XjJK7Gc_TDQ&list=PLSN1shsnVim8
// Instrutor: Michel César
// courseId: 'react' (trilha ReactJS)
//
// Estrutura preparada para evoluir: novas aulas podem ser acrescentadas aos
// módulos existentes ou em novos módulos sem alterar a arquitetura.

export const reactModules = [
  createModule({
    id: 'react-mod-fundamentos',
    courseId: 'react',
    title: 'Fundamentos e Componentização',
    description:
      'Primeiros passos com ReactJS: ambiente com Node.js, npm e Vite, JSX, componentes funcionais e props.',
    order: 1,
    lessons: ['react-vid-1', 'react-vid-2'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
  createModule({
    id: 'react-mod-interatividade',
    courseId: 'react',
    title: 'Interatividade com Hooks',
    description:
      'Torne as interfaces dinâmicas com estado (useState), renderização condicional e efeitos colaterais com useEffect em JSX.',
    order: 2,
    lessons: ['react-vid-3', 'react-vid-4', 'react-vid-5'],
    quiz: null,
    lab: null,
    miniProject: null,
  }),
]
