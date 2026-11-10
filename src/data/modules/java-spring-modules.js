import { createModule } from '../schemas.js'

export const javaSpringModules = [
  createModule({
    id: 'java-spring-mod-fundamentos',
    courseId: 'java-spring',
    title: 'Fundamentos de Java',
    description:
      'Objetivos: consolidar fundamentos e orientação a objetos, conhecer recursos intermediários da linguagem e compreender heap, stack e garbage collection.',
    order: 1,
    lessons: ['java-spring-vid-1', 'java-spring-vid-2', 'java-spring-vid-3'],
  }),
  createModule({
    id: 'java-spring-mod-spring',
    courseId: 'java-spring',
    title: 'Spring, Segurança e Persistência',
    description:
      'Objetivos: iniciar o desenvolvimento com Spring, tratar erros, implementar autenticação e autorização e versionar o schema com Flyway e PostgreSQL.',
    order: 2,
    lessons: [
      'java-spring-vid-4',
      'java-spring-vid-5',
      'java-spring-vid-6',
      'java-spring-vid-7',
    ],
  }),
  createModule({
    id: 'java-spring-mod-backend',
    courseId: 'java-spring',
    title: 'Back-end Java em Projetos Reais',
    description:
      'Objetivos: acompanhar a construção de back-ends com Spring, autenticação para uma aplicação fullstack, resolução de desafios técnicos e publicação na AWS.',
    order: 3,
    lessons: [
      'java-spring-vid-8',
      'java-spring-vid-9',
      'java-spring-vid-10',
      'java-spring-vid-11',
    ],
  }),
  createModule({
    id: 'java-spring-mod-cloud',
    courseId: 'java-spring',
    title: 'Microsserviços e Projetos em Cloud',
    description:
      'Objetivos: compreender a construção e comunicação entre microsserviços Java e acompanhar projetos Spring com Oracle Cloud, Docker e AWS S3.',
    order: 4,
    lessons: [
      'java-spring-vid-12',
      'java-spring-vid-13',
      'java-spring-vid-14',
    ],
  }),
  createModule({
    id: 'java-spring-mod-threads',
    courseId: 'java-spring',
    title: 'Java Avançado: Threads',
    description:
      'Objetivos: conhecer programação paralela com threads em Java como tópico avançado após os módulos de back-end e cloud.',
    order: 5,
    lessons: ['java-spring-vid-15'],
  }),
]
