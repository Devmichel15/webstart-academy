import { createModule } from '../schemas.js'

export const sqlModules = [
  createModule({
    id: 'sql-intensive-module',
    courseId: 'sql-intensive',
    title: 'SQL com PostgreSQL: do Zero ao Avançado',
    description:
      'Curso intensivo de uma hora para conhecer SQL e praticar consultas em PostgreSQL.',
    order: 1,
    lessons: ['sql-intensive-video-1'],
  }),
]
