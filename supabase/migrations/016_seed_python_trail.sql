-- ═══════════════════════════════════════════════════════════════
-- WebStart Academy — 016_seed_python_trail.sql
-- Insere a trilha Python (curso, módulos e aulas) nas tabelas do
-- Supabase para que lesson_progress respeite a FK lesson_id → lessons.id.
-- Idempotente: usa INSERT ... ON CONFLICT DO NOTHING.
-- ═══════════════════════════════════════════════════════════════

-- ─── COURSE ──────────────────────────────────────────────────

insert into public.courses (id, title, slug, description, difficulty, estimated_hours, icon, color, status, sort_order, instructor, required_trail, extra)
values (
  'python',
  'Python 3',
  'python',
  'Aprenda Python 3 do zero com Gustavo Guanabara (Curso em Vídeo). Fundamentos, tipos primitivos, operadores, módulos, strings, condicionais, repetições, listas, dicionários e funções.',
  'beginner',
  30,
  'code2',
  'brand',
  'available',
  6,
  'Gustavo Guanabara (Curso em Vídeo)',
  null,
  '{"level": 3, "xp": 2500, "completion": null}'::jsonb
)
on conflict (id) do nothing;

-- ─── MODULES ─────────────────────────────────────────────────

insert into public.modules (id, course_id, title, description, "order", extra)
values
  (
    'python-mod-mundo1',
    'python',
    'Mundo 1 — Fundamentos de Python',
    'Primeiros passos com Python: instalação, tipos primitivos, operadores, módulos, strings e condicionais.',
    1,
    '{"quiz": null, "lab": null, "miniProject": null}'::jsonb
  ),
  (
    'python-mod-mundo2',
    'python',
    'Mundo 2 — Estruturas de Controle',
    'Condicionais aninhadas, estruturas de repetição for e while, interrupções e lógica de fluxo avançada.',
    2,
    '{"quiz": null, "lab": null, "miniProject": null}'::jsonb
  ),
  (
    'python-mod-mundo3',
    'python',
    'Mundo 3 — Estruturas Compostas',
    'Tuplas, listas, dicionários, funções, módulos, pacotes e tratamento de erros em Python.',
    3,
    '{"quiz": null, "lab": null, "miniProject": null}'::jsonb
  )
on conflict (id) do nothing;

-- ─── LESSONS — Mundo 1 ───────────────────────────────────────

insert into public.lessons (id, module_id, course_id, title, "order", resources, extra)
values
  (
    'python-vid-1',
    'python-mod-mundo1',
    'python',
    'Aula 1 — Seja um Programador',
    1,
    '{"objectives": ["Conhecer o curso de Python 3", "Entender o que é programação"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=S9uPNppGsGo", "embedUrl": "https://www.youtube.com/embed/S9uPNppGsGo", "duration": ""}'::jsonb
  ),
  (
    'python-vid-2',
    'python-mod-mundo1',
    'python',
    'Aula 2 — Para que serve o Python?',
    2,
    '{"objectives": ["Conhecer as aplicações de Python", "Entender o mercado da linguagem"], "materials": ["Navegador web"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=Mp0vhMDI7fA", "embedUrl": "https://www.youtube.com/embed/Mp0vhMDI7fA", "duration": ""}'::jsonb
  ),
  (
    'python-vid-3',
    'python-mod-mundo1',
    'python',
    'Aula 3 — Instalando o Python3 e o IDLE',
    3,
    '{"objectives": ["Instalar o Python 3", "Configurar o IDLE"], "materials": ["Computador com internet"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=VuKvR1J2LQE", "embedUrl": "https://www.youtube.com/embed/VuKvR1J2LQE", "duration": ""}'::jsonb
  ),
  (
    'python-vid-4',
    'python-mod-mundo1',
    'python',
    'Aula 4 — Primeiros Comandos em Python3',
    4,
    '{"objectives": ["Usar print() e input()", "Criar variáveis simples"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=31llNGKWDdo", "embedUrl": "https://www.youtube.com/embed/31llNGKWDdo", "duration": ""}'::jsonb
  ),
  (
    'python-vid-5',
    'python-mod-mundo1',
    'python',
    'Aula 5 — Instalando o PyCharm e o QPython3',
    5,
    '{"objectives": ["Instalar e configurar o PyCharm", "Conhecer o QPython3"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=ElRd0cbXIv4", "embedUrl": "https://www.youtube.com/embed/ElRd0cbXIv4", "duration": ""}'::jsonb
  ),
  (
    'python-vid-6',
    'python-mod-mundo1',
    'python',
    'Aula 6 — Tipos Primitivos e Saída de Dados',
    6,
    '{"objectives": ["Conhecer int, float, bool e str", "Formatar saída com print()"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=hdDHg1p3YVc", "embedUrl": "https://www.youtube.com/embed/hdDHg1p3YVc", "duration": ""}'::jsonb
  ),
  (
    'python-vid-7',
    'python-mod-mundo1',
    'python',
    'Aula 7 — Operadores Aritméticos',
    7,
    '{"objectives": ["Usar operadores +, -, *, /, //, %, **", "Criar expressões matemáticas"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=Vw6gLypRKmY", "embedUrl": "https://www.youtube.com/embed/Vw6gLypRKmY", "duration": ""}'::jsonb
  ),
  (
    'python-vid-8',
    'python-mod-mundo1',
    'python',
    'Aula 8 — Utilizando Módulos',
    8,
    '{"objectives": ["Importar módulos com import", "Usar math e random"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=oOUyhGNib2Q", "embedUrl": "https://www.youtube.com/embed/oOUyhGNib2Q", "duration": ""}'::jsonb
  ),
  (
    'python-vid-9',
    'python-mod-mundo1',
    'python',
    'Aula 9 — Manipulando Texto (Strings)',
    9,
    '{"objectives": ["Manipular strings", "Usar métodos de string"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=a7DH88vk2Sk", "embedUrl": "https://www.youtube.com/embed/a7DH88vk2Sk", "duration": ""}'::jsonb
  ),
  (
    'python-vid-10',
    'python-mod-mundo1',
    'python',
    'Aula 10 — Condições (Parte 1)',
    10,
    '{"objectives": ["Usar if e else", "Aplicar operadores de comparação"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=K10u3XIf1-Q", "embedUrl": "https://www.youtube.com/embed/K10u3XIf1-Q", "duration": ""}'::jsonb
  ),
  (
    'python-vid-11',
    'python-mod-mundo1',
    'python',
    'Aula 11 — Cores no Terminal',
    11,
    '{"objectives": ["Usar colorama para colorir o terminal", "Criar programas mais visuais"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=0hBIhkcA8O8", "embedUrl": "https://www.youtube.com/embed/0hBIhkcA8O8", "duration": ""}'::jsonb
  )
on conflict (id) do nothing;

-- ─── LESSONS — Mundo 2 ───────────────────────────────────────

insert into public.lessons (id, module_id, course_id, title, "order", resources, extra)
values
  (
    'python-vid-12',
    'python-mod-mundo2',
    'python',
    'Mundo 02 — Dicas e Regras',
    1,
    '{"objectives": ["Revisar as dicas do Mundo 2", "Conhecer as regras dos próximos conteúdos"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=nJkVHusJp6E", "embedUrl": "https://www.youtube.com/embed/nJkVHusJp6E", "duration": ""}'::jsonb
  ),
  (
    'python-vid-13',
    'python-mod-mundo2',
    'python',
    'Aula 12 — Condições Aninhadas',
    2,
    '{"objectives": ["Usar elif", "Combinar condições com and, or, not"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=j9bYDjaAYzw", "embedUrl": "https://www.youtube.com/embed/j9bYDjaAYzw", "duration": ""}'::jsonb
  ),
  (
    'python-vid-14',
    'python-mod-mundo2',
    'python',
    'Aula 13 — Estrutura de Repetição for',
    3,
    '{"objectives": ["Usar for com range()", "Iterar sobre listas e strings"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=cL4YDtFnCt4", "embedUrl": "https://www.youtube.com/embed/cL4YDtFnCt4", "duration": ""}'::jsonb
  ),
  (
    'python-vid-15',
    'python-mod-mundo2',
    'python',
    'Aula 14 — Estrutura de Repetição while',
    4,
    '{"objectives": ["Usar while com condição", "Criar menus e validações com while"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=LH6OIn2lBaI", "embedUrl": "https://www.youtube.com/embed/LH6OIn2lBaI", "duration": ""}'::jsonb
  ),
  (
    'python-vid-16',
    'python-mod-mundo2',
    'python',
    'Aula 15 — Interrompendo Repetições',
    5,
    '{"objectives": ["Usar break e continue", "Aplicar else em loops"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=1OFp_-R2B2A", "embedUrl": "https://www.youtube.com/embed/1OFp_-R2B2A", "duration": ""}'::jsonb
  )
on conflict (id) do nothing;

-- ─── LESSONS — Mundo 3 ───────────────────────────────────────

insert into public.lessons (id, module_id, course_id, title, "order", resources, extra)
values
  (
    'python-vid-17',
    'python-mod-mundo3',
    'python',
    'Aula 16 — Tuplas',
    1,
    '{"objectives": ["Criar e manipular tuplas", "Entender imutabilidade"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=0LB3FSfjvao", "embedUrl": "https://www.youtube.com/embed/0LB3FSfjvao", "duration": ""}'::jsonb
  ),
  (
    'python-vid-18',
    'python-mod-mundo3',
    'python',
    'Aula 17 — Listas (Parte 1)',
    2,
    '{"objectives": ["Criar e manipular listas", "Usar append, remove, sort, pop"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=N1hTsbW50eM", "embedUrl": "https://www.youtube.com/embed/N1hTsbW50eM", "duration": ""}'::jsonb
  ),
  (
    'python-vid-19',
    'python-mod-mundo3',
    'python',
    'Aula 17 — Listas (Parte 2)',
    3,
    '{"objectives": ["Usar list comprehension", "Trabalhar com matrizes e listas compostas"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=YV_JQmZNFsk", "embedUrl": "https://www.youtube.com/embed/YV_JQmZNFsk", "duration": ""}'::jsonb
  ),
  (
    'python-vid-20',
    'python-mod-mundo3',
    'python',
    'Aula 19 — Dicionários',
    4,
    '{"objectives": ["Criar dicionários", "Acessar, adicionar e remover pares chave-valor"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=ZWj8o692qGY", "embedUrl": "https://www.youtube.com/embed/ZWj8o692qGY", "duration": ""}'::jsonb
  ),
  (
    'python-vid-21',
    'python-mod-mundo3',
    'python',
    'Aula 20 — Funções (Parte 1)',
    5,
    '{"objectives": ["Criar funções com def", "Usar parâmetros e return"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=ezfr9d7wd_k", "embedUrl": "https://www.youtube.com/embed/ezfr9d7wd_k", "duration": ""}'::jsonb
  ),
  (
    'python-vid-22',
    'python-mod-mundo3',
    'python',
    'Aula 21 — Funções (Parte 2)',
    6,
    '{"objectives": ["Entender escopo global e local", "Criar parâmetros padrão e lambda"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=etjJ_4Eqrk8", "embedUrl": "https://www.youtube.com/embed/etjJ_4Eqrk8", "duration": ""}'::jsonb
  ),
  (
    'python-vid-23',
    'python-mod-mundo3',
    'python',
    'Aula 22 — Módulos e Pacotes',
    7,
    '{"objectives": ["Criar módulos Python", "Organizar código em pacotes"], "materials": ["Python 3 instalado"]}'::jsonb,
    '{"type": "videoLesson", "youtubeUrl": "https://www.youtube.com/watch?v=s3r8_Aug4y8", "embedUrl": "https://www.youtube.com/embed/s3r8_Aug4y8", "duration": ""}'::jsonb
  )
on conflict (id) do nothing;
