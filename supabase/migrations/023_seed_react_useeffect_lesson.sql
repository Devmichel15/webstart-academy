-- ─────────────────────────────────────────────────────────────────────────────
-- WebStart Academy — 023_seed_react_useeffect_lesson.sql
-- Adiciona a Aula 05 (useEffect na Prática) à trilha oficial ReactJS.
--
-- Produção: WebStart Academy — Lecionado por Michel César
-- Vídeo: https://www.youtube.com/watch?v=_XIuODDXM8o
-- Idempotente: INSERT ... ON CONFLICT DO NOTHING e UPDATE de metadados.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── COURSE ──────────────────────────────────────────────────────────────────

update public.courses
set description = 'Formação prática para aprender ReactJS desde o zero: configuração do ambiente com Node.js, npm e Vite, JSX, componentização, props, estado com useState, renderização condicional e efeitos colaterais com useEffect, com explicações aprofundadas, exemplos de código e projetos progressivos.'
where id = 'react';

-- ─── MODULE ──────────────────────────────────────────────────────────────────

update public.modules
set description = 'Torne as interfaces dinâmicas com estado (useState), renderização condicional e efeitos colaterais com useEffect em JSX.'
where id = 'react-mod-interatividade';

-- ─── LESSON — Aula 05 ────────────────────────────────────────────────────────

insert into public.lessons (id, module_id, course_id, title, "order", resources, extra)
values
  (
    'react-vid-5',
    'react-mod-interatividade',
    'react',
    'useEffect na Prática',
    3,
    '{"objectives": ["Entender o conceito de efeitos colaterais em React", "Usar o hook useEffect para executar efeitos", "Controlar quando um efeito é executado", "Aplicar useEffect em componentes na prática"], "materials": ["Node.js instalado", "VS Code", "Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=_XIuODDXM8o", "embedUrl": "https://www.youtube.com/embed/_XIuODDXM8o", "duration": "20:29"}'::jsonb
  )
on conflict (id) do nothing;
