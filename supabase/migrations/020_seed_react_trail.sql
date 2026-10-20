-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 020_seed_react_trail.sql
-- Insere a trilha oficial ReactJS (curso, módulos e aulas) nas
-- tabelas do Supabase para que lesson_progress respeite a FK
-- lesson_id → lessons.id.
--
-- Produção: WebStart Academy · Lecionado por Michel César
-- Playlist: https://www.youtube.com/watch?v=XjJK7Gc_TDQ&list=PLSN1shsnVim8
-- Idempotente: módulos e aulas usam INSERT ... ON CONFLICT DO NOTHING;
-- o curso usa DO UPDATE para substituir a linha placeholder "react"
-- (status 'soon') que já existe em algumas bases de dados.
-- ═══════════════════════════════════════════════════════════════

-- ─── COURSE ──────────────────────────────────────────────────

insert into public.courses (id, title, slug, description, difficulty, estimated_hours, icon, color, status, sort_order, instructor, required_trail, extra)
values (
  'react',
  'ReactJS para Iniciantes',
  'react',
  'Formação prática para aprender ReactJS desde o zero: configuração do ambiente com Node.js, npm e Vite, JSX, componentização, props, estado com useState e renderização condicional, com explicações aprofundadas, exemplos de código e projetos progressivos.',
  'beginner',
  3,
  'atom',
  'brand',
  'available',
  8,
  'Michel César',
  'javascript',
  '{"level": 2, "xp": 800, "completion": null, "origin": "webstart", "producer": "WebStart"}'::jsonb
)
on conflict (id) do update set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  difficulty = excluded.difficulty,
  estimated_hours = excluded.estimated_hours,
  icon = excluded.icon,
  color = excluded.color,
  status = excluded.status,
  sort_order = excluded.sort_order,
  instructor = excluded.instructor,
  required_trail = excluded.required_trail,
  extra = excluded.extra;

-- ─── MODULES ─────────────────────────────────────────────────

insert into public.modules (id, course_id, title, description, "order", extra)
values
  (
    'react-mod-fundamentos',
    'react',
    'Fundamentos e Componentização',
    'Primeiros passos com ReactJS: ambiente com Node.js, npm e Vite, JSX, componentes funcionais e props.',
    1,
    '{"quiz": null, "lab": null, "miniProject": null}'::jsonb
  ),
  (
    'react-mod-interatividade',
    'react',
    'Interatividade com Hooks',
    'Torne as interfaces dinâmicas com estado (useState) e renderização condicional em JSX.',
    2,
    '{"quiz": null, "lab": null, "miniProject": null}'::jsonb
  )
on conflict (id) do nothing;

-- ─── LESSONS — Fundamentos e Componentização ─────────────────

insert into public.lessons (id, module_id, course_id, title, "order", resources, extra)
values
  (
    'react-vid-1',
    'react-mod-fundamentos',
    'react',
    'Introdução ao ReactJS: Origem, Node.js, npm e Vite',
    1,
    '{"objectives": ["Entender o que é o ReactJS e por que usá-lo", "Instalar e configurar o Node.js e o npm", "Criar um projeto React com o Vite", "Compreender a estrutura inicial de um projeto React"], "materials": ["Node.js instalado", "VS Code", "Terminal", "Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=Adlyk4PV6zE", "embedUrl": "https://www.youtube.com/embed/Adlyk4PV6zE", "duration": "26:03"}'::jsonb
  ),
  (
    'react-vid-2',
    'react-mod-fundamentos',
    'react',
    'JSX, Componentização e Props',
    2,
    '{"objectives": ["Compreender a sintaxe JSX", "Criar componentes funcionais reutilizáveis", "Passar dados entre componentes com props", "Organizar a interface em componentes"], "materials": ["Node.js instalado", "VS Code", "Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=TiRMcV0yuMk", "embedUrl": "https://www.youtube.com/embed/TiRMcV0yuMk", "duration": "25:42"}'::jsonb
  )
on conflict (id) do nothing;

-- ─── LESSONS — Interatividade com Hooks ──────────────────────

insert into public.lessons (id, module_id, course_id, title, "order", resources, extra)
values
  (
    'react-vid-3',
    'react-mod-interatividade',
    'react',
    'Estado com useState',
    1,
    '{"objectives": ["Entender o conceito de estado em React", "Usar o hook useState para guardar dados", "Atualizar o estado a partir de eventos", "Criar componentes dinâmicos e interativos"], "materials": ["Node.js instalado", "VS Code", "Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=XjJK7Gc_TDQ", "embedUrl": "https://www.youtube.com/embed/XjJK7Gc_TDQ", "duration": "25:48"}'::jsonb
  ),
  (
    'react-vid-4',
    'react-mod-interatividade',
    'react',
    'Renderização Condicional',
    2,
    '{"objectives": ["Aplicar renderização condicional em JSX", "Usar operadores ternários e lógicos em JSX", "Controlar o que é apresentado conforme o estado", "Construir interfaces que reagem aos dados"], "materials": ["Node.js instalado", "VS Code", "Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=q7X3F-O_ccA", "embedUrl": "https://www.youtube.com/embed/q7X3F-O_ccA", "duration": "11:39"}'::jsonb
  )
on conflict (id) do nothing;
