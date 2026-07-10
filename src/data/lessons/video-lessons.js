export function createVideoLesson({
  id,
  courseId,
  moduleId,
  title,
  description,
  youtubeUrl,
  embedUrl,
  duration = '',
  order = 1,
  objectives = [],
  materials = [],
}) {
  return {
    id,
    courseId,
    moduleId,
    title,
    description,
    youtubeUrl,
    embedUrl,
    duration,
    order,
    objectives,
    materials,
    type: 'videoLesson',
  }
}

export const videoLessons = [
  createVideoLesson({
    id: 'html-video-ex-1',
    courseId: 'html-exercises',
    moduleId: 'html-video-exercises-module',
    title: 'Exercício 1 - Estrutura Básica em HTML',
    description: 'Aplicando os conceitos aprendidos no módulo anterior através de um exercício guiado em vídeo.',
    youtubeUrl: 'https://youtu.be/K-MbGXnhGvQ',
    embedUrl: 'https://www.youtube.com/embed/K-MbGXnhGvQ',
    duration: '',
    order: 1,
    objectives: [
      'Reforçar a estrutura básica de um documento HTML',
      'Praticar a criação de DOCTYPE, html, head e body',
      'Aplicar meta tags essenciais (charset, viewport)',
      'Criar uma página funcional do zero junto com o vídeo',
    ],
    materials: [
      'Editor de código (VS Code ou similar)',
      'Navegador web atualizado',
      'Bloco de notas ou terminal',
    ],
  }),
]
