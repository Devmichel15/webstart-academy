-- SQL intensive trail with one curated PostgreSQL video lesson.

insert into public.courses (
  id,
  title,
  slug,
  description,
  difficulty,
  estimated_hours,
  total_lessons,
  icon,
  color,
  status,
  sort_order,
  instructor,
  required_trail,
  extra
)
values (
  'sql-intensive',
  'SQL Intensivo com PostgreSQL',
  'sql-intensivo',
  'Aprende SQL num curso intensivo de uma hora, do zero ao avançado, com exemplos em PostgreSQL.',
  'beginner',
  1,
  1,
  'database',
  'brand',
  'available',
  13,
  'Stack Mobile',
  null,
  '{"level": 1, "xp": 500, "modules": ["sql-intensive-module"], "completion": null, "origin": "external"}'::jsonb
)
on conflict (id) do update set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  difficulty = excluded.difficulty,
  estimated_hours = excluded.estimated_hours,
  total_lessons = excluded.total_lessons,
  icon = excluded.icon,
  color = excluded.color,
  status = excluded.status,
  sort_order = excluded.sort_order,
  instructor = excluded.instructor,
  required_trail = excluded.required_trail,
  extra = excluded.extra;

insert into public.modules (id, course_id, title, description, "order", extra)
values (
  'sql-intensive-module',
  'sql-intensive',
  'SQL com PostgreSQL: do Zero ao Avançado',
  'Curso intensivo de uma hora para conhecer SQL e praticar consultas em PostgreSQL.',
  1,
  '{"lessons": ["sql-intensive-video-1"], "quiz": null, "lab": null, "miniProject": null}'::jsonb
)
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  description = excluded.description,
  "order" = excluded."order",
  extra = excluded.extra;

insert into public.lessons (
  id,
  module_id,
  course_id,
  title,
  "order",
  estimated_time,
  resources,
  extra
)
values (
  'sql-intensive-video-1',
  'sql-intensive-module',
  'sql-intensive',
  'Curso Completo de SQL com PostgreSQL — Do Zero ao Avançado',
  1,
  60,
  '{"objectives": ["Conhecer os fundamentos de SQL", "Praticar consultas numa base de dados PostgreSQL", "Acompanhar um percurso intensivo do básico a conceitos avançados"], "materials": ["Navegador web"]}'::jsonb,
  '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=9cAKQWodpvM", "embedUrl": "https://www.youtube.com/embed/9cAKQWodpvM", "duration": "1:00:00"}'::jsonb
)
on conflict (id) do update set
  module_id = excluded.module_id,
  course_id = excluded.course_id,
  title = excluded.title,
  "order" = excluded."order",
  estimated_time = excluded.estimated_time,
  resources = excluded.resources,
  extra = excluded.extra;
