import { createRoadmap, createCourse, createFinalProject, createFinalEvaluation, createCertificate, createNextSteps } from './schemas.js'
import { htmlModules } from './modules/html-modules.js'
import { cssModules } from './modules/css-modules.js'
import { htmlLessons } from './lessons/html-lessons.js'
import { cssLessons } from './lessons/css-lessons.js'

export const roadmaps = [
  createRoadmap({
    id: 'fundamentos',
    title: 'Fundamentos da Internet',
    description: 'A base para tudo. Aprenda como a web funciona, do protocolo ao pixel.',
    icon: 'globe',
    color: 'brand',
    order: 0,
    courses: ['fundamentos-web'],
  }),
  createRoadmap({
    id: 'frontend',
    title: 'Front-End Development',
    description: 'Do zero ao primeiro site profissional. Aprenda HTML, CSS e os fundamentos da web.',
    icon: 'code2',
    color: 'brand',
    order: 1,
    courses: ['html', 'css', 'javascript'],
  }),
  createRoadmap({
    id: 'backend',
    title: 'Back-End & APIs',
    description: 'Em breve — servidores, bancos de dados e APIs REST.',
    icon: 'terminal',
    color: 'brand',
    order: 2,
    courses: [],
  }),
]

export const courses = [
  createCourse({
    id: 'html',
    title: 'HTML5',
    description: 'Estruture páginas web com marcação semântica moderna.',
    icon: 'code',
    color: 'brand',
    roadmapId: 'frontend',
    order: 1,
    difficulty: 'beginner',
    estimatedHours: 4,
    modules: ['html-fundamentals', 'html-content-media', 'html-semantic', 'html-forms'],
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
      certificate: createCertificate({
        title: 'Certificado HTML5 WebStart',
        description: 'Certifica que o aluno concluiu o curso de HTML5 com domínio em estruturação semântica de páginas web.',
      }),
      nextSteps: createNextSteps({
        recommendations: [
          { courseId: 'css', label: 'CSS3 — Estilize suas páginas' },
          { courseId: null, label: 'JavaScript — Torne suas páginas interativas' },
          { courseId: null, label: 'Prática no Laboratório WebStart' },
        ],
      }),
    },
  }),
  createCourse({
    id: 'fundamentos-web',
    title: 'Fundamentos da Web',
    description: 'Como a internet funciona — protocolos, DNS, navegadores e o modelo cliente-servidor.',
    icon: 'globe',
    color: 'brand',
    roadmapId: 'fundamentos',
    order: 1,
    difficulty: 'beginner',
    estimatedHours: 2,
    modules: [],
    status: 'available',
  }),
  createCourse({
    id: 'javascript',
    title: 'JavaScript',
    description: 'Torne suas páginas interativas com a linguagem da web.',
    icon: 'fileJson',
    color: 'brand',
    roadmapId: 'frontend',
    order: 3,
    difficulty: 'beginner',
    estimatedHours: 6,
    modules: [],
    status: 'soon',
  }),
  createCourse({
    id: 'css',
    title: 'CSS3',
    description: 'Estilize interfaces com layout, cores e animações.',
    icon: 'palette',
    color: 'brand',
    roadmapId: 'frontend',
    order: 2,
    difficulty: 'beginner',
    estimatedHours: 4,
    modules: ['css-fundamentals', 'css-layout', 'css-advanced'],
    status: 'building',
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
      certificate: createCertificate({
        title: 'Certificado CSS3 WebStart',
        description: 'Certifica que o aluno concluiu o curso de CSS3 com domínio em estilização, layout e design responsivo.',
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
]

export function getCourseById(id) {
  return courses.find((c) => c.id === id) || null
}

export function getRoadmapById(id) {
  return roadmaps.find((r) => r.id === id) || null
}

export function getCoursesByRoadmap(roadmapId) {
  return courses.filter((c) => c.roadmapId === roadmapId).sort((a, b) => a.order - b.order)
}

export function getModuleData(moduleId) {
  const allMods = [...htmlModules, ...cssModules]
  return allMods.find((m) => m.id === moduleId) || null
}

export function getCourseWithModules(courseId) {
  const course = getCourseById(courseId)
  if (!course) return null
  const modules = course.modules.map((mId) => getModuleData(mId)).filter(Boolean)
  return { ...course, moduleData: modules }
}

export function getModuleLessons(moduleId) {
  const mod = getModuleData(moduleId)
  if (!mod) return []
  const allLessons = [...htmlLessons, ...cssLessons]
  return mod.lessons.map((lId) => allLessons.find((l) => l.id === lId)).filter(Boolean)
}
