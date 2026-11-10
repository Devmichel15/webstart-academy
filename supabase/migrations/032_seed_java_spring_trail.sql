-- Seed the 15 publicly available videos from Fernanda Kipper's Java + Spring playlist.
-- The original playlist also contains three members-only videos, which are omitted.
-- Inserts are idempotent and never update existing course, module, lesson, or progress rows.

do $$
begin
  if exists (
    select 1
    from public.courses
    where (id = 'java-spring' and (
      title is distinct from 'Java + Spring: Fundamentos a Back-end em Produção'
      or slug is distinct from 'java-spring'
    ))
    or (slug = 'java-spring' and id is distinct from 'java-spring')
  ) then
    raise exception 'A course id or slug for java-spring is already used by another course.';
  end if;

  if exists (
    select 1
    from public.modules
    where id in (
      'java-spring-mod-fundamentos',
      'java-spring-mod-spring',
      'java-spring-mod-backend',
      'java-spring-mod-cloud',
      'java-spring-mod-threads'
    )
      and course_id is distinct from 'java-spring'
  ) then
    raise exception 'A module id reserved for java-spring belongs to another course.';
  end if;

  if exists (
    select 1
    from public.lessons lesson
    join (values
      ('java-spring-vid-1', 'java-spring-mod-fundamentos', 'https://www.youtube.com/watch?v=nODe5lFcGpg'),
      ('java-spring-vid-2', 'java-spring-mod-fundamentos', 'https://www.youtube.com/watch?v=jLropHUgI1A'),
      ('java-spring-vid-3', 'java-spring-mod-fundamentos', 'https://www.youtube.com/watch?v=cgUfurMJosE'),
      ('java-spring-vid-4', 'java-spring-mod-spring', 'https://www.youtube.com/watch?v=YY_hf0FOIcU'),
      ('java-spring-vid-5', 'java-spring-mod-spring', 'https://www.youtube.com/watch?v=GmbK-O3v3Gg'),
      ('java-spring-vid-6', 'java-spring-mod-spring', 'https://www.youtube.com/watch?v=5w-YCcOjPD0'),
      ('java-spring-vid-7', 'java-spring-mod-spring', 'https://www.youtube.com/watch?v=LX5jaieOIAk'),
      ('java-spring-vid-8', 'java-spring-mod-backend', 'https://www.youtube.com/watch?v=d0KaNzAMVO4'),
      ('java-spring-vid-9', 'java-spring-mod-backend', 'https://www.youtube.com/watch?v=tJCyNV1G0P4'),
      ('java-spring-vid-10', 'java-spring-mod-backend', 'https://www.youtube.com/watch?v=wp5PjmwYymA'),
      ('java-spring-vid-11', 'java-spring-mod-backend', 'https://www.youtube.com/watch?v=bEkCdlrxF54'),
      ('java-spring-vid-12', 'java-spring-mod-cloud', 'https://www.youtube.com/watch?v=yACzWg9gUGM'),
      ('java-spring-vid-13', 'java-spring-mod-cloud', 'https://www.youtube.com/watch?v=n377IabhD-o'),
      ('java-spring-vid-14', 'java-spring-mod-cloud', 'https://www.youtube.com/watch?v=71WGVa79BWE'),
      ('java-spring-vid-15', 'java-spring-mod-threads', 'https://www.youtube.com/watch?v=C7OyP5X3bUU')
    ) as expected(id, module_id, youtube_url) on lesson.id = expected.id
    where lesson.course_id is distinct from 'java-spring'
      or lesson.module_id is distinct from expected.module_id
      or lesson.extra->>'youtubeUrl' is distinct from expected.youtube_url
  ) then
    raise exception 'A lesson id reserved for java-spring has conflicting course, module, or video data.';
  end if;
end
$$;

insert into public.courses (
  id, title, slug, description, difficulty, estimated_hours, total_lessons,
  icon, color, status, sort_order, instructor, required_trail, extra
)
values (
  'java-spring',
  'Java + Spring: Fundamentos a Back-end em Produção',
  'java-spring',
  'Trilha de 15 vídeos públicos de Fernanda Kipper, começando pelos fundamentos de Java e orientação a objetos e avançando por Spring Boot, segurança com JWT, PostgreSQL e Flyway, projetos de back-end, deploy em AWS, microsserviços, cloud e threads. Sem pré-requisito formal identificado; a sequência começa em fundamentos. Ao concluir, o aluno deverá conseguir acompanhar e construir back-ends Java com Spring, integrar autenticação e persistência e compreender os conceitos de deploy, microsserviços e programação paralela. Três vídeos exclusivos para membros da playlist original foram omitidos.',
  'intermediate',
  16,
  15,
  'coffee',
  'brand',
  'available',
  14,
  'Fernanda Kipper',
  null,
  '{"level": 3, "xp": 1500, "modules": ["java-spring-mod-fundamentos", "java-spring-mod-spring", "java-spring-mod-backend", "java-spring-mod-cloud", "java-spring-mod-threads"], "completion": null, "origin": "external"}'::jsonb
)
on conflict (id) do nothing;

insert into public.modules (id, course_id, title, description, "order", extra)
values
  (
    'java-spring-mod-fundamentos',
    'java-spring',
    'Fundamentos de Java',
    'Objetivos: consolidar fundamentos e orientação a objetos, conhecer recursos intermediários da linguagem e compreender heap, stack e garbage collection.',
    1,
    '{"lessons": ["java-spring-vid-1", "java-spring-vid-2", "java-spring-vid-3"], "quiz": null, "lab": null, "miniProject": null}'::jsonb
  ),
  (
    'java-spring-mod-spring',
    'java-spring',
    'Spring, Segurança e Persistência',
    'Objetivos: iniciar o desenvolvimento com Spring, tratar erros, implementar autenticação e autorização e versionar o schema com Flyway e PostgreSQL.',
    2,
    '{"lessons": ["java-spring-vid-4", "java-spring-vid-5", "java-spring-vid-6", "java-spring-vid-7"], "quiz": null, "lab": null, "miniProject": null}'::jsonb
  ),
  (
    'java-spring-mod-backend',
    'java-spring',
    'Back-end Java em Projetos Reais',
    'Objetivos: acompanhar a construção de back-ends com Spring, autenticação para uma aplicação fullstack, resolução de desafios técnicos e publicação na AWS.',
    3,
    '{"lessons": ["java-spring-vid-8", "java-spring-vid-9", "java-spring-vid-10", "java-spring-vid-11"], "quiz": null, "lab": null, "miniProject": null}'::jsonb
  ),
  (
    'java-spring-mod-cloud',
    'java-spring',
    'Microsserviços e Projetos em Cloud',
    'Objetivos: compreender a construção e comunicação entre microsserviços Java e acompanhar projetos Spring com Oracle Cloud, Docker e AWS S3.',
    4,
    '{"lessons": ["java-spring-vid-12", "java-spring-vid-13", "java-spring-vid-14"], "quiz": null, "lab": null, "miniProject": null}'::jsonb
  ),
  (
    'java-spring-mod-threads',
    'java-spring',
    'Java Avançado: Threads',
    'Objetivos: conhecer programação paralela com threads em Java como tópico avançado após os módulos de back-end e cloud.',
    5,
    '{"lessons": ["java-spring-vid-15"], "quiz": null, "lab": null, "miniProject": null}'::jsonb
  )
on conflict (id) do nothing;

insert into public.lessons (
  id, module_id, course_id, title, content, "order", estimated_time, resources, extra
)
values
  (
    'java-spring-vid-1',
    'java-spring-mod-fundamentos',
    'java-spring',
    'Curso de PROGRAMAÇÃO JAVA para INICIANTES | Fundamentos + Programação Orientada Objetos',
    'Fundamentos de Java e programação orientada a objetos, apresentados num curso para iniciantes.',
    1,
    109,
    '{"objectives": ["Estudar fundamentos da linguagem Java", "Acompanhar a introdução à programação orientada a objetos"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=nODe5lFcGpg", "embedUrl": "https://www.youtube.com/embed/nODe5lFcGpg", "duration": "1:49:22"}'::jsonb
  ),
  (
    'java-spring-vid-2',
    'java-spring-mod-fundamentos',
    'java-spring',
    'CURSO de JAVA INTERMEDIÁRIO | Estruturas de dados, Stream API, Generics, Packages, Records',
    'Estudo de estruturas de dados, Stream API, Generics, Packages e Records em Java.',
    2,
    50,
    '{"objectives": ["Conhecer estruturas de dados e recursos intermediários de Java", "Explorar Stream API, Generics, Packages e Records"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=jLropHUgI1A", "embedUrl": "https://www.youtube.com/embed/jLropHUgI1A", "duration": "50:12"}'::jsonb
  ),
  (
    'java-spring-vid-3',
    'java-spring-mod-fundamentos',
    'java-spring',
    'Entendendo COLETOR DE LIXO DO JAVA (memória Heap, Stack, Garbage Collector)',
    'Visão geral de heap, stack e garbage collection em Java, incluindo coletores G1, ZGC, Shenandoah e Parallel GC.',
    3,
    32,
    '{"objectives": ["Distinguir heap e stack", "Conhecer coletores de lixo e a sua relação com a performance"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=cgUfurMJosE", "embedUrl": "https://www.youtube.com/embed/cgUfurMJosE", "duration": "32:05"}'::jsonb
  ),
  (
    'java-spring-vid-4',
    'java-spring-mod-spring',
    'java-spring',
    'CURSO DE SPRING para INICIANTES | Tutorial Completo de Java Spring',
    'Introdução ao Spring Boot e ao desenvolvimento de aplicações Java com Spring.',
    4,
    51,
    '{"objectives": ["Conhecer o framework Spring para desenvolvimento Java"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=YY_hf0FOIcU", "embedUrl": "https://www.youtube.com/embed/YY_hf0FOIcU", "duration": "51:25"}'::jsonb
  ),
  (
    'java-spring-vid-5',
    'java-spring-mod-spring',
    'java-spring',
    'COMO TRATAR EXCEÇÕES NO JAVA SPRING',
    'Tratamento de erros em Spring Boot, incluindo exceções customizadas, Controller Advice e respostas JSON.',
    5,
    19,
    '{"objectives": ["Aplicar tratamento de exceções numa aplicação Spring Boot", "Conhecer exceções customizadas e Controller Advice"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=GmbK-O3v3Gg", "embedUrl": "https://www.youtube.com/embed/GmbK-O3v3Gg", "duration": "18:32"}'::jsonb
  ),
  (
    'java-spring-vid-6',
    'java-spring-mod-spring',
    'java-spring',
    'Autenticação e Autorização com Spring Security, JWT Tokens e Roles',
    'Implementação de autenticação stateless com JWT e autorização por roles usando Spring Security.',
    6,
    76,
    '{"objectives": ["Implementar autenticação com Spring Security e JWT", "Controlar autorização com roles"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=5w-YCcOjPD0", "embedUrl": "https://www.youtube.com/embed/5w-YCcOjPD0", "duration": "1:15:53"}'::jsonb
  ),
  (
    'java-spring-vid-7',
    'java-spring-mod-spring',
    'java-spring',
    'Criando Migrations com Flyway no seu projeto Java Spring & PostgreSQL',
    'Uso do Flyway para versionar e aplicar migrations num projeto Java Spring com PostgreSQL.',
    7,
    12,
    '{"objectives": ["Criar e gerir migrations com Flyway", "Compreender o versionamento de alterações no schema PostgreSQL"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=LX5jaieOIAk", "embedUrl": "https://www.youtube.com/embed/LX5jaieOIAk", "duration": "12:09"}'::jsonb
  ),
  (
    'java-spring-vid-8',
    'java-spring-mod-backend',
    'java-spring',
    'Criando BACKEND COMPLETO do ZERO com JAVA SPRING + POSTGRES + AWS',
    'Construção de um back-end com Java Spring Boot e PostgreSQL, com publicação na AWS.',
    8,
    131,
    '{"objectives": ["Acompanhar a construção de um back-end com Spring Boot e PostgreSQL", "Conhecer o deploy da aplicação na AWS"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=d0KaNzAMVO4", "embedUrl": "https://www.youtube.com/embed/d0KaNzAMVO4", "duration": "2:10:39"}'::jsonb
  ),
  (
    'java-spring-vid-9',
    'java-spring-mod-backend',
    'java-spring',
    'PROJETO FULLSTACK COM LOGIN USANDO SPRING SECURITY + JWT | BACKEND',
    'Construção do back-end de uma aplicação fullstack de login e cadastro com Spring Security e JWT.',
    9,
    58,
    '{"objectives": ["Acompanhar a criação de um back-end para login e cadastro", "Usar Spring Security e JWT para autenticação e autorização"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=tJCyNV1G0P4", "embedUrl": "https://www.youtube.com/embed/tJCyNV1G0P4", "duration": "58:19"}'::jsonb
  ),
  (
    'java-spring-vid-10',
    'java-spring-mod-backend',
    'java-spring',
    'RESOLVENDO DESAFIO FULLSTACK com JAVA SPRING E DOCKER | Parte 1 (Projeto Java Completo)',
    'Primeira parte da resolução de um desafio fullstack com Java Spring e Docker.',
    10,
    47,
    '{"objectives": ["Acompanhar a primeira parte de um desafio técnico com Java Spring e Docker"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=wp5PjmwYymA", "embedUrl": "https://www.youtube.com/embed/wp5PjmwYymA", "duration": "47:08"}'::jsonb
  ),
  (
    'java-spring-vid-11',
    'java-spring-mod-backend',
    'java-spring',
    'Como fazer DEPLOY de aplicação JAVA SPRING NA AWS',
    'Deploy de uma aplicação Java Spring Boot na AWS EC2.',
    11,
    43,
    '{"objectives": ["Acompanhar a publicação de uma aplicação Java Spring Boot na AWS EC2"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=bEkCdlrxF54", "embedUrl": "https://www.youtube.com/embed/bEkCdlrxF54", "duration": "42:34"}'::jsonb
  ),
  (
    'java-spring-vid-12',
    'java-spring-mod-cloud',
    'java-spring',
    'CONSTRUINDO MICROSERVIÇOS COM JAVA',
    'Introdução à criação e comunicação entre microsserviços com Java e Spring.',
    12,
    126,
    '{"objectives": ["Compreender o conceito de microsserviços", "Acompanhar a construção e comunicação entre serviços Java"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=yACzWg9gUGM", "embedUrl": "https://www.youtube.com/embed/yACzWg9gUGM", "duration": "2:06:08"}'::jsonb
  ),
  (
    'java-spring-vid-13',
    'java-spring-mod-cloud',
    'java-spring',
    'CRIANDO MICROSERVIÇO com SPRING usando Modo Gratuito da Oracle Cloud',
    'Criação de um microsserviço com Spring na modalidade gratuita da Oracle Cloud.',
    13,
    39,
    '{"objectives": ["Acompanhar a criação de um microsserviço Spring na Oracle Cloud"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=n377IabhD-o", "embedUrl": "https://www.youtube.com/embed/n377IabhD-o", "duration": "39:13"}'::jsonb
  ),
  (
    'java-spring-vid-14',
    'java-spring-mod-cloud',
    'java-spring',
    'Projeto BACKEND do ZERO | Gerador de QR Code com Java, AWS S3 e Docker',
    'Construção de um gerador de QR Code com Java 21, Spring Boot, Docker e AWS S3.',
    14,
    41,
    '{"objectives": ["Acompanhar a criação de um projeto back-end gerador de QR Code", "Conhecer a integração indicada no vídeo com Docker e AWS S3"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=71WGVa79BWE", "embedUrl": "https://www.youtube.com/embed/71WGVa79BWE", "duration": "40:41"}'::jsonb
  ),
  (
    'java-spring-vid-15',
    'java-spring-mod-threads',
    'java-spring',
    'Java Avançado | Programação Paralela com Threads',
    'Introdução à programação paralela com threads em Java.',
    15,
    103,
    '{"objectives": ["Conhecer programação paralela com threads em Java"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=C7OyP5X3bUU", "embedUrl": "https://www.youtube.com/embed/C7OyP5X3bUU", "duration": "1:43:28"}'::jsonb
  )
on conflict (id) do nothing;
