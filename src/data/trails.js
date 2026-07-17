import { createTrail, createFinalProject, createFinalEvaluation, createNextSteps } from './schemas.js'
import { htmlModules } from './modules/html-modules.js'
import { cssModules } from './modules/css-modules.js'
import { fundamentosModules } from './modules/fundamentos-modules.js'
import { htmlLessons } from './lessons/html-lessons.js'
import { cssLessons } from './lessons/css-lessons.js'
import { fundamentosLessons } from './lessons/fundamentos-lessons.js'
import { videoLessons } from './lessons/video-lessons.js'

export const TRAIL_ORDER = [
  'fundamentos-web',
  'html',
  'html-exercises',
  'css',
  'javascript',
  'git-github',
  'react',
  'backend',
  'database',
  'apis',
  'deploy',
]

export const trails = [
  createTrail({
    id: 'fundamentos-web',
    slug: 'fundamentos-da-web',
    title: 'Fundamentos da Web',
    description: 'Como a internet funciona — protocolos, DNS, navegadores e o modelo cliente-servidor.',
    icon: 'globe',
    color: 'brand',
    order: 0,
    difficulty: 'beginner',
    estimatedHours: 2,
    modules: ['web-fundamentos'],
    status: 'available',
    requiredTrail: null,
    xp: 500,
    level: 1,
    cover: null,
  }),
  createTrail({
    id: 'html',
    slug: 'html5',
    title: 'HTML5',
    description: 'Estruture páginas web com marcação semântica moderna.',
    icon: 'code',
    color: 'brand',
    order: 1,
    difficulty: 'beginner',
    estimatedHours: 4,
    modules: ['html-vid-intro', 'html-vid-fundamentals', 'html-vid-basics', 'html-vid-images', 'html-vid-texts', 'html-vid-lists', 'html-vid-links', 'html-vid-media'],
    status: 'available',
    requiredTrail: 'fundamentos-web',
    xp: 1000,
    level: 2,
    cover: null,
    completion: {
      finalProject: createFinalProject({
        title: 'Landing Page WebStart',
        description: 'Crie uma landing page completa para a WebStart Academy usando tudo que aprendeu.',
        context:
          'Você foi contratado como desenvolvedor front-end para criar a landing page da WebStart Academy. A página deve representar a identidade brutalista da marca: cores verdes, bordas grossas, sombras marcantes.',
        requirements: [
          'DOCTYPE HTML5 com lang="pt"',
          'Header com logo e navegação',
          'Hero section com título, subtítulo e CTA',
          'Seção de features com grid de cards',
          'Tabela de módulos/cursos',
          'Formulário de contato funcional',
          'Footer completo',
          'Apenas HTML semântico (sem CSS ainda)',
          'Imagens com alt descritivo',
          'Links internos e externos',
        ],
        deliverables: ['Arquivo index.html completo', 'Pasta assets com imagens'],
        rubric: [
          'HTML semântico usado corretamente',
          'Hierarquia de headings respeitada',
          'Formulário acessível',
          'Código limpo e indentado',
          'Todas as imagens têm alt',
        ],
      }),
      finalEvaluation: createFinalEvaluation({
        questions: [
          { question: 'Qual a diferença entre HTML e CSS?', answer: 'HTML estrutura, CSS estiliza.' },
          { question: 'Por que usar tags semânticas?', answer: 'SEO, acessibilidade, manutenção.' },
          { question: 'O que é o DOM?', answer: 'Representação em árvore dos elementos HTML.' },
        ],
      }),
      nextSteps: createNextSteps({
        recommendations: [
          { courseId: 'html-exercises', label: 'HTML Exercícios em Vídeo — Pratique o que aprendeu' },
          { courseId: 'css', label: 'CSS3 — Estilize suas páginas' },
          { courseId: null, label: 'Prática no Laboratório WebStart' },
        ],
      }),
    },
  }),
  createTrail({
    id: 'html-exercises',
    slug: 'html-exercicios-em-video',
    title: 'HTML • Exercícios em Vídeo',
    description: 'Coloque em prática todos os conceitos de HTML aprendidos através de exercícios guiados em vídeo.',
    icon: 'playCircle',
    color: 'brand',
    order: 2,
    difficulty: 'beginner',
    estimatedHours: 1,
    modules: ['html-video-exercises-module'],
    status: 'available',
    requiredTrail: 'html',
    xp: 200,
    level: 1,
    cover: null,
  }),
  createTrail({
    id: 'css',
    slug: 'css3',
    title: 'CSS3',
    description: 'Estilize interfaces com layout, cores e animações.',
    icon: 'palette',
    color: 'brand',
    order: 3,
    difficulty: 'beginner',
    estimatedHours: 4,
    modules: ['css-vid-intro', 'css-vid-colors', 'css-vid-typography', 'css-vid-selectors', 'css-vid-boxmodel', 'css-vid-backgrounds', 'css-vid-responsive', 'css-vid-flexbox', 'css-vid-grid'],
    status: 'building',
    requiredTrail: 'html-exercises',
    xp: 1000,
    level: 2,
    cover: null,
    completion: {
      finalProject: createFinalProject({
        title: 'Landing Page Estilizada',
        description: 'Estilize a landing page HTML com o design system brutalista da WebStart.',
        context:
          'A landing page HTML já está pronta. Agora você precisa aplicar o design system WebStart: bordas grossas, sombras offset, paleta verde, animações sutis e layout responsivo.',
        requirements: [
          'Design system com variáveis CSS',
          'Layout responsivo (mobile-first)',
          'Flexbox e Grid no layout',
          'Header com navegação estilizada',
          'Hero com CTA animado',
          'Cards com hover effect',
          'Tabela estilizada',
          'Formulário com estados (focus, hover)',
          'Footer consistente',
          'Micro-interações (transitions)',
        ],
        deliverables: ['Arquivo styles.css completo', 'Landing page responsiva'],
        rubric: [
          'Design system consistente',
          'Responsividade funcional',
          'Animações sutis e com propósito',
          'Código CSS organizado',
          'Layout funciona em mobile e desktop',
        ],
      }),
      finalEvaluation: createFinalEvaluation({
        questions: [
          { question: 'Qual a diferença entre Flexbox e Grid?', answer: 'Flex é 1D, Grid é 2D.' },
          { question: 'O que é mobile-first?', answer: 'Estilizar para mobile primeiro, depois adicionar breakpoints.' },
          { question: 'Por que usar variáveis CSS?', answer: 'Reutilização, manutenção, temas.' },
        ],
      }),
      nextSteps: createNextSteps({
        recommendations: [
          { courseId: null, label: 'JavaScript — Interatividade e lógica' },
          { courseId: null, label: 'Laboratório WebStart — Pratique mais' },
          { courseId: null, label: 'React — O próximo passo' },
        ],
      }),
    },
  }),
  createTrail({
    id: 'javascript',
    slug: 'javascript',
    title: 'JavaScript',
    description: 'Torne suas páginas interativas com a linguagem da web.',
    icon: 'fileJson',
    color: 'brand',
    order: 4,
    difficulty: 'beginner',
    estimatedHours: 6,
    modules: [],
    status: 'soon',
    requiredTrail: 'css',
    xp: 1500,
    level: 3,
    cover: null,
  }),
  createTrail({
    id: 'git-github',
    slug: 'git-e-github',
    title: 'Git & GitHub',
    description: 'Controle de versão, colaboração e deploy com Git e GitHub.',
    icon: 'gitBranch',
    color: 'brand',
    order: 5,
    difficulty: 'beginner',
    estimatedHours: 3,
    modules: [],
    status: 'soon',
    requiredTrail: 'javascript',
    xp: 800,
    level: 2,
    cover: null,
  }),
  createTrail({
    id: 'react',
    slug: 'react',
    title: 'React',
    description: 'Construa interfaces modernas e reativas com componentização.',
    icon: 'atom',
    color: 'brand',
    order: 6,
    difficulty: 'intermediate',
    estimatedHours: 8,
    modules: [],
    status: 'soon',
    requiredTrail: 'git-github',
    xp: 2000,
    level: 4,
    cover: null,
  }),
  createTrail({
    id: 'backend',
    slug: 'backend-com-node',
    title: 'Back-end com Node.js',
    description: 'Servidores, rotas, middleware e lógica do lado do servidor.',
    icon: 'terminal',
    color: 'brand',
    order: 7,
    difficulty: 'intermediate',
    estimatedHours: 6,
    modules: [],
    status: 'soon',
    requiredTrail: 'react',
    xp: 1500,
    level: 3,
    cover: null,
  }),
  createTrail({
    id: 'database',
    slug: 'banco-de-dados',
    title: 'Banco de Dados',
    description: 'Modelagem, SQL e integração com bancos de dados relacionais.',
    icon: 'database',
    color: 'brand',
    order: 8,
    difficulty: 'intermediate',
    estimatedHours: 5,
    modules: [],
    status: 'soon',
    requiredTrail: 'backend',
    xp: 1200,
    level: 3,
    cover: null,
  }),
  createTrail({
    id: 'apis',
    slug: 'apis-rest',
    title: 'APIs REST',
    description: 'Crie e consuma APIs RESTful completas com autenticação e documentação.',
    icon: 'link2',
    color: 'brand',
    order: 9,
    difficulty: 'advanced',
    estimatedHours: 6,
    modules: [],
    status: 'soon',
    requiredTrail: 'database',
    xp: 1500,
    level: 4,
    cover: null,
  }),
  createTrail({
    id: 'deploy',
    slug: 'deploy-e-devops',
    title: 'Deploy & DevOps',
    description: 'Publicação, CI/CD, cloud hosting e infraestrutura moderna.',
    icon: 'cloud',
    color: 'brand',
    order: 10,
    difficulty: 'advanced',
    estimatedHours: 4,
    modules: [],
    status: 'soon',
    requiredTrail: 'apis',
    xp: 1000,
    level: 4,
    cover: null,
  }),
]

export function getTrailById(id) {
  return trails.find((t) => t.id === id) || null
}

export function getTrailWithModules(trailId) {
  const trail = getTrailById(trailId)
  if (!trail) return null
  const modules = trail.modules.map((mId) => getModuleData(mId)).filter(Boolean)
  return { ...trail, moduleData: modules }
}

export function getModuleData(moduleId) {
  const allMods = [...htmlModules, ...cssModules, ...fundamentosModules]
  return allMods.find((m) => m.id === moduleId) || null
}

export function getModuleLessons(moduleId) {
  const mod = getModuleData(moduleId)
  if (!mod) return []
  const allLessons = [...htmlLessons, ...cssLessons, ...fundamentosLessons, ...videoLessons]
  return mod.lessons.map((lId) => allLessons.find((l) => l.id === lId)).filter(Boolean)
}

export function getNextTrailId(currentId) {
  const idx = TRAIL_ORDER.indexOf(currentId)
  if (idx === -1 || idx >= TRAIL_ORDER.length - 1) return null
  return TRAIL_ORDER[idx + 1]
}

export function getPreviousTrailId(currentId) {
  const idx = TRAIL_ORDER.indexOf(currentId)
  if (idx <= 0) return null
  return TRAIL_ORDER[idx - 1]
}
