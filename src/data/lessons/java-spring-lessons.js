import { createVideoLesson } from './video-lessons.js'

const CREDIT = '\n\nVídeo original: Fernanda Kipper — Curso de JAVA + SPRING.'

export const javaSpringLessons = [
  createVideoLesson({
    id: 'java-spring-vid-1',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-fundamentos',
    title: 'Curso de PROGRAMAÇÃO JAVA para INICIANTES | Fundamentos + Programação Orientada Objetos',
    description:
      'Fundamentos de Java e programação orientada a objetos, apresentados num curso para iniciantes.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=nODe5lFcGpg',
    embedUrl: 'https://www.youtube.com/embed/nODe5lFcGpg',
    duration: '1:49:22',
    order: 1,
    objectives: [
      'Estudar fundamentos da linguagem Java',
      'Acompanhar a introdução à programação orientada a objetos',
    ],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-2',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-fundamentos',
    title: 'CURSO de JAVA INTERMEDIÁRIO | Estruturas de dados, Stream API, Generics, Packages, Records',
    description:
      'Estudo de estruturas de dados, Stream API, Generics, Packages e Records em Java.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=jLropHUgI1A',
    embedUrl: 'https://www.youtube.com/embed/jLropHUgI1A',
    duration: '50:12',
    order: 2,
    objectives: [
      'Conhecer estruturas de dados e recursos intermediários de Java',
      'Explorar Stream API, Generics, Packages e Records',
    ],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-3',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-fundamentos',
    title: 'Entendendo COLETOR DE LIXO DO JAVA (memória Heap, Stack, Garbage Collector)',
    description:
      'Visão geral de heap, stack e garbage collection em Java, incluindo coletores G1, ZGC, Shenandoah e Parallel GC.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=cgUfurMJosE',
    embedUrl: 'https://www.youtube.com/embed/cgUfurMJosE',
    duration: '32:05',
    order: 3,
    objectives: [
      'Distinguir heap e stack',
      'Conhecer coletores de lixo e a sua relação com a performance',
    ],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-4',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-spring',
    title: 'CURSO DE SPRING para INICIANTES | Tutorial Completo de Java Spring',
    description:
      'Introdução ao Spring Boot e ao desenvolvimento de aplicações Java com Spring.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=YY_hf0FOIcU',
    embedUrl: 'https://www.youtube.com/embed/YY_hf0FOIcU',
    duration: '51:25',
    order: 4,
    objectives: ['Conhecer o framework Spring para desenvolvimento Java'],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-5',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-spring',
    title: 'COMO TRATAR EXCEÇÕES NO JAVA SPRING',
    description:
      'Tratamento de erros em Spring Boot, incluindo exceções customizadas, Controller Advice e respostas JSON.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=GmbK-O3v3Gg',
    embedUrl: 'https://www.youtube.com/embed/GmbK-O3v3Gg',
    duration: '18:32',
    order: 5,
    objectives: [
      'Aplicar tratamento de exceções numa aplicação Spring Boot',
      'Conhecer exceções customizadas e Controller Advice',
    ],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-6',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-spring',
    title: 'Autenticação e Autorização com Spring Security, JWT Tokens e Roles',
    description:
      'Implementação de autenticação stateless com JWT e autorização por roles usando Spring Security.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=5w-YCcOjPD0',
    embedUrl: 'https://www.youtube.com/embed/5w-YCcOjPD0',
    duration: '1:15:53',
    order: 6,
    objectives: [
      'Implementar autenticação com Spring Security e JWT',
      'Controlar autorização com roles',
    ],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-7',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-spring',
    title: 'Criando Migrations com Flyway no seu projeto Java Spring & PostgreSQL',
    description:
      'Uso do Flyway para versionar e aplicar migrations num projeto Java Spring com PostgreSQL.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=LX5jaieOIAk',
    embedUrl: 'https://www.youtube.com/embed/LX5jaieOIAk',
    duration: '12:09',
    order: 7,
    objectives: [
      'Criar e gerir migrations com Flyway',
      'Compreender o versionamento de alterações no schema PostgreSQL',
    ],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-8',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-backend',
    title: 'Criando BACKEND COMPLETO do ZERO com JAVA SPRING + POSTGRES + AWS',
    description:
      'Construção de um back-end com Java Spring Boot e PostgreSQL, com publicação na AWS.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=d0KaNzAMVO4',
    embedUrl: 'https://www.youtube.com/embed/d0KaNzAMVO4',
    duration: '2:10:39',
    order: 8,
    objectives: [
      'Acompanhar a construção de um back-end com Spring Boot e PostgreSQL',
      'Conhecer o deploy da aplicação na AWS',
    ],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-9',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-backend',
    title: 'PROJETO FULLSTACK COM LOGIN USANDO SPRING SECURITY + JWT | BACKEND',
    description:
      'Construção do back-end de uma aplicação fullstack de login e cadastro com Spring Security e JWT.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=tJCyNV1G0P4',
    embedUrl: 'https://www.youtube.com/embed/tJCyNV1G0P4',
    duration: '58:19',
    order: 9,
    objectives: [
      'Acompanhar a criação de um back-end para login e cadastro',
      'Usar Spring Security e JWT para autenticação e autorização',
    ],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-10',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-backend',
    title: 'RESOLVENDO DESAFIO FULLSTACK com JAVA SPRING E DOCKER | Parte 1 (Projeto Java Completo)',
    description:
      'Primeira parte da resolução de um desafio fullstack com Java Spring e Docker.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=wp5PjmwYymA',
    embedUrl: 'https://www.youtube.com/embed/wp5PjmwYymA',
    duration: '47:08',
    order: 10,
    objectives: [
      'Acompanhar a primeira parte de um desafio técnico com Java Spring e Docker',
    ],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-11',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-backend',
    title: 'Como fazer DEPLOY de aplicação JAVA SPRING NA AWS',
    description:
      'Deploy de uma aplicação Java Spring Boot na AWS EC2.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=bEkCdlrxF54',
    embedUrl: 'https://www.youtube.com/embed/bEkCdlrxF54',
    duration: '42:34',
    order: 11,
    objectives: ['Acompanhar a publicação de uma aplicação Java Spring Boot na AWS EC2'],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-12',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-cloud',
    title: 'CONSTRUINDO MICROSERVIÇOS COM JAVA',
    description:
      'Introdução à criação e comunicação entre microsserviços com Java e Spring.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=yACzWg9gUGM',
    embedUrl: 'https://www.youtube.com/embed/yACzWg9gUGM',
    duration: '2:06:08',
    order: 12,
    objectives: [
      'Compreender o conceito de microsserviços',
      'Acompanhar a construção e comunicação entre serviços Java',
    ],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-13',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-cloud',
    title: 'CRIANDO MICROSERVIÇO com SPRING usando Modo Gratuito da Oracle Cloud',
    description:
      'Criação de um microsserviço com Spring na modalidade gratuita da Oracle Cloud.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=n377IabhD-o',
    embedUrl: 'https://www.youtube.com/embed/n377IabhD-o',
    duration: '39:13',
    order: 13,
    objectives: ['Acompanhar a criação de um microsserviço Spring na Oracle Cloud'],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-14',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-cloud',
    title: 'Projeto BACKEND do ZERO | Gerador de QR Code com Java, AWS S3 e Docker',
    description:
      'Construção de um gerador de QR Code com Java 21, Spring Boot, Docker e AWS S3.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=71WGVa79BWE',
    embedUrl: 'https://www.youtube.com/embed/71WGVa79BWE',
    duration: '40:41',
    order: 14,
    objectives: [
      'Acompanhar a criação de um projeto back-end gerador de QR Code',
      'Conhecer a integração indicada no vídeo com Docker e AWS S3',
    ],
    materials: ['Navegador web'],
  }),
  createVideoLesson({
    id: 'java-spring-vid-15',
    courseId: 'java-spring',
    moduleId: 'java-spring-mod-threads',
    title: 'Java Avançado | Programação Paralela com Threads',
    description:
      'Introdução à programação paralela com threads em Java.' +
      CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=C7OyP5X3bUU',
    embedUrl: 'https://www.youtube.com/embed/C7OyP5X3bUU',
    duration: '1:43:28',
    order: 15,
    objectives: ['Conhecer programação paralela com threads em Java'],
    materials: ['Navegador web'],
  }),
]
