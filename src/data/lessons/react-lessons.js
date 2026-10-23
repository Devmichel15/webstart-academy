import { createVideoLesson } from './video-lessons.js'

// ─── REACTJS — VÍDEO AULAS (trilha oficial 'react') ───────────────────────────
// Produção: WebStart Academy — Lecionado por Michel César
// Playlist oficial: https://www.youtube.com/watch?v=XjJK7Gc_TDQ&list=PLSN1shsnVim8
//
// NOTA: As aulas abaixo correspondem aos vídeos publicados na playlist oficial.
// A playlist não é importada automaticamente (não há YouTube Data API
// configurada); novas aulas devem ser adicionadas aqui seguindo o padrão
// `<prefixo>-vid-<n>` com IDs estáveis.

const REACT_CREDIT =
  '\n\nVídeo original: WebStart Academy — ReactJS para Iniciantes, lecionado por Michel César.'

export const reactLessons = [
  // ═══════════════════════════════════════════════════════════════════════════
  // REACTJS — VÍDEO AULAS (trilha react)
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── MÓDULO: Fundamentos e Componentização ───────────────────────────────
  createVideoLesson({
    id: 'react-vid-1',
    courseId: 'react',
    moduleId: 'react-mod-fundamentos',
    title: 'Introdução ao ReactJS: Origem, Node.js, npm e Vite',
    description:
      'Apresentação da formação e dos primeiros passos com ReactJS: a origem da biblioteca, a instalação do Node.js, os fundamentos do npm e a criação do primeiro projeto com Vite.' +
      REACT_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=Adlyk4PV6zE',
    embedUrl: 'https://www.youtube.com/embed/Adlyk4PV6zE',
    duration: '26:03',
    order: 1,
    objectives: [
      'Entender o que é o ReactJS e por que usá-lo',
      'Instalar e configurar o Node.js e o npm',
      'Criar um projeto React com o Vite',
      'Compreender a estrutura inicial de um projeto React',
    ],
    materials: ['Node.js instalado', 'VS Code', 'Terminal', 'Navegador web'],
  }),
  createVideoLesson({
    id: 'react-vid-2',
    courseId: 'react',
    moduleId: 'react-mod-fundamentos',
    title: 'JSX, Componentização e Props',
    description:
      'Vamos compreender o JSX, criar os primeiros componentes funcionais e passar dados entre eles com props, aplicando a componentização na prática.' +
      REACT_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=TiRMcV0yuMk',
    embedUrl: 'https://www.youtube.com/embed/TiRMcV0yuMk',
    duration: '25:42',
    order: 2,
    objectives: [
      'Compreender a sintaxe JSX',
      'Criar componentes funcionais reutilizáveis',
      'Passar dados entre componentes com props',
      'Organizar a interface em componentes',
    ],
    materials: ['Node.js instalado', 'VS Code', 'Navegador web'],
  }),

  // ─── MÓDULO: Interatividade com Hooks ────────────────────────────────────
  createVideoLesson({
    id: 'react-vid-3',
    courseId: 'react',
    moduleId: 'react-mod-interatividade',
    title: 'Estado com useState',
    description:
      'Introdução ao estado em React com o hook useState: como guardar dados, atualizar a interface em resposta a ações do utilizador e re-renderizar componentes.' +
      REACT_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=XjJK7Gc_TDQ',
    embedUrl: 'https://www.youtube.com/embed/XjJK7Gc_TDQ',
    duration: '25:48',
    order: 1,
    objectives: [
      'Entender o conceito de estado em React',
      'Usar o hook useState para guardar dados',
      'Atualizar o estado a partir de eventos',
      'Criar componentes dinâmicos e interativos',
    ],
    materials: ['Node.js instalado', 'VS Code', 'Navegador web'],
  }),
  createVideoLesson({
    id: 'react-vid-4',
    courseId: 'react',
    moduleId: 'react-mod-interatividade',
    title: 'Renderização Condicional',
    description:
      'Aprenda a mostrar ou esconder partes da interface com renderização condicional, combinando estado e expressões JSX para construir experiências mais ricas.' +
      REACT_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=q7X3F-O_ccA',
    embedUrl: 'https://www.youtube.com/embed/q7X3F-O_ccA',
    duration: '11:39',
    order: 2,
    objectives: [
      'Aplicar renderização condicional em JSX',
      'Usar operadores ternários e lógicos em JSX',
      'Controlar o que é apresentado conforme o estado',
      'Construir interfaces que reagem aos dados',
    ],
    materials: ['Node.js instalado', 'VS Code', 'Navegador web'],
  }),
  createVideoLesson({
    id: 'react-vid-5',
    courseId: 'react',
    moduleId: 'react-mod-interatividade',
    title: 'useEffect na Prática',
    description:
      'Aprenda a usar o hook useEffect para executar efeitos colaterais em componentes React, como sincronizar dados e reagir a alterações de estado.' +
      REACT_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=_XIuODDXM8o',
    embedUrl: 'https://www.youtube.com/embed/_XIuODDXM8o',
    duration: '20:29',
    order: 3,
    objectives: [
      'Entender o conceito de efeitos colaterais em React',
      'Usar o hook useEffect para executar efeitos',
      'Controlar quando um efeito é executado',
      'Aplicar useEffect em componentes na prática',
    ],
    materials: ['Node.js instalado', 'VS Code', 'Navegador web'],
  }),
]
