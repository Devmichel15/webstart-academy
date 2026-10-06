import { createVideoLesson } from './video-lessons.js'

// ─── PYTHON 3 — Vídeo Aulas ───────────────────────────────────────────────────
// Playlist do Mundo 1: https://www.youtube.com/playlist?list=PLHz_AreHm4dlKP6QQCekuIPky1CiwmdI6
// Instrutor: Gustavo Guanabara — Canal Curso em Vídeo
// courseId: 'python'

const PYTHON_CREDIT = '\n\nVídeo original: Curso Python 3 — Gustavo Guanabara (https://www.youtube.com/@cursoemvideo)'

export const pythonLessons = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PYTHON — MÓDULO 1: Mundo 1 — Fundamentos
  // ═══════════════════════════════════════════════════════════════════════════

  createVideoLesson({
    id: 'python-vid-1',
    courseId: 'python',
    moduleId: 'python-mod-mundo1',
    title: 'Aula 1 — Seja um Programador',
    description: 'Apresentação do curso de Python 3. Entenda o que é programação, o que você vai aprender e como se preparar para a jornada.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=S9uPNppGsGo',
    embedUrl: 'https://www.youtube.com/embed/S9uPNppGsGo',
    duration: '',
    order: 1,
    objectives: ['Conhecer o curso de Python 3', 'Entender o que é programação'],
    materials: ['Navegador web'],
  }),

  createVideoLesson({
    id: 'python-vid-2',
    courseId: 'python',
    moduleId: 'python-mod-mundo1',
    title: 'Aula 2 — Para que serve o Python?',
    description: 'Conheça as principais aplicações da linguagem Python no mercado: ciência de dados, automação, web, inteligência artificial e muito mais.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=Mp0vhMDI7fA',
    embedUrl: 'https://www.youtube.com/embed/Mp0vhMDI7fA',
    duration: '',
    order: 2,
    objectives: ['Conhecer as aplicações de Python', 'Entender o mercado da linguagem'],
    materials: ['Navegador web'],
  }),

  createVideoLesson({
    id: 'python-vid-3',
    courseId: 'python',
    moduleId: 'python-mod-mundo1',
    title: 'Aula 3 — Instalando o Python3 e o IDLE',
    description: 'Passo a passo para instalar o Python 3 e o ambiente IDLE no seu sistema operacional. Configure seu ambiente de desenvolvimento.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=VuKvR1J2LQE',
    embedUrl: 'https://www.youtube.com/embed/VuKvR1J2LQE',
    duration: '',
    order: 3,
    objectives: ['Instalar o Python 3', 'Configurar o IDLE'],
    materials: ['Computador com internet', 'python.org'],
  }),

  createVideoLesson({
    id: 'python-vid-4',
    courseId: 'python',
    moduleId: 'python-mod-mundo1',
    title: 'Aula 4 — Primeiros Comandos em Python3',
    description: 'Escreva seus primeiros comandos em Python 3: print, input, variáveis e tipos básicos. Seu primeiro programa funcionando!' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=31llNGKWDdo',
    embedUrl: 'https://www.youtube.com/embed/31llNGKWDdo',
    duration: '',
    order: 4,
    objectives: ['Usar print() e input()', 'Criar variáveis simples'],
    materials: ['Python 3 instalado', 'IDLE ou VS Code'],
  }),

  createVideoLesson({
    id: 'python-vid-5',
    courseId: 'python',
    moduleId: 'python-mod-mundo1',
    title: 'Aula 5 — Instalando o PyCharm e o QPython3',
    description: 'Configure o PyCharm, uma das IDEs mais completas para Python. Também veja como usar o QPython3 para programar no celular.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=ElRd0cbXIv4',
    embedUrl: 'https://www.youtube.com/embed/ElRd0cbXIv4',
    duration: '',
    order: 5,
    objectives: ['Instalar e configurar o PyCharm', 'Conhecer o QPython3'],
    materials: ['Python 3 instalado', 'jetbrains.com'],
  }),

  createVideoLesson({
    id: 'python-vid-6',
    courseId: 'python',
    moduleId: 'python-mod-mundo1',
    title: 'Aula 6 — Tipos Primitivos e Saída de Dados',
    description: 'Aprenda os tipos primitivos do Python: int, float, bool e str. Entenda como funciona a saída de dados com print() e formatação.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=hdDHg1p3YVc',
    embedUrl: 'https://www.youtube.com/embed/hdDHg1p3YVc',
    duration: '',
    order: 6,
    objectives: ['Conhecer int, float, bool e str', 'Formatar saída com print()'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-7',
    courseId: 'python',
    moduleId: 'python-mod-mundo1',
    title: 'Aula 7 — Operadores Aritméticos',
    description: 'Use os operadores aritméticos do Python: soma, subtração, multiplicação, divisão, módulo, potenciação e divisão inteira.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=Vw6gLypRKmY',
    embedUrl: 'https://www.youtube.com/embed/Vw6gLypRKmY',
    duration: '',
    order: 7,
    objectives: ['Usar operadores +, -, *, /, //, %, **', 'Criar expressões matemáticas em Python'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-8',
    courseId: 'python',
    moduleId: 'python-mod-mundo1',
    title: 'Aula 8 — Utilizando Módulos',
    description: 'Aprenda a importar e usar módulos do Python: math, random e outros. Expanda as funcionalidades da sua linguagem.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=oOUyhGNib2Q',
    embedUrl: 'https://www.youtube.com/embed/oOUyhGNib2Q',
    duration: '',
    order: 8,
    objectives: ['Importar módulos com import', 'Usar math e random'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-9',
    courseId: 'python',
    moduleId: 'python-mod-mundo1',
    title: 'Aula 9 — Manipulando Texto (Strings)',
    description: 'Trabalhe com strings em Python: fatiamento, métodos, formatação, upper, lower, strip, replace e muito mais.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=a7DH88vk2Sk',
    embedUrl: 'https://www.youtube.com/embed/a7DH88vk2Sk',
    duration: '',
    order: 9,
    objectives: ['Manipular strings', 'Usar métodos de string'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-10',
    courseId: 'python',
    moduleId: 'python-mod-mundo1',
    title: 'Aula 10 — Condições (Parte 1)',
    description: 'Aprenda estruturas condicionais em Python com if, else e operadores de comparação. Tome decisões no seu código.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=K10u3XIf1-Q',
    embedUrl: 'https://www.youtube.com/embed/K10u3XIf1-Q',
    duration: '',
    order: 10,
    objectives: ['Usar if e else', 'Aplicar operadores de comparação'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-11',
    courseId: 'python',
    moduleId: 'python-mod-mundo1',
    title: 'Aula 11 — Cores no Terminal',
    description: 'Adicione cor ao seu terminal Python com a biblioteca colorama. Deixe seus programas mais bonitos e interativos.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=0hBIhkcA8O8',
    embedUrl: 'https://www.youtube.com/embed/0hBIhkcA8O8',
    duration: '',
    order: 11,
    objectives: ['Usar colorama para colorir o terminal', 'Criar programas mais visuais'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PYTHON — MÓDULO 2: Mundo 2 — Estruturas de Controle
  // ═══════════════════════════════════════════════════════════════════════════

  createVideoLesson({
    id: 'python-vid-12',
    courseId: 'python',
    moduleId: 'python-mod-mundo2',
    title: 'Mundo 02 — Dicas e Regras',
    description: 'Revisão das dicas e regras do Mundo 2 do curso de Python, preparando para as próximas aulas.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=nJkVHusJp6E',
    embedUrl: 'https://www.youtube.com/embed/nJkVHusJp6E',
    duration: '',
    order: 1,
    objectives: ['Revisar as dicas do Mundo 2', 'Conhecer as regras dos próximos conteúdos'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-13',
    courseId: 'python',
    moduleId: 'python-mod-mundo2',
    title: 'Aula 12 — Condições Aninhadas',
    description: 'Aprofunde-se em condicionais com elif, operadores lógicos (and, or, not) e condições aninhadas para lógica mais complexa.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=j9bYDjaAYzw',
    embedUrl: 'https://www.youtube.com/embed/j9bYDjaAYzw',
    duration: '',
    order: 2,
    objectives: ['Usar elif', 'Combinar condições com and, or, not'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-14',
    courseId: 'python',
    moduleId: 'python-mod-mundo2',
    title: 'Aula 13 — Estrutura de Repetição for',
    description: 'Domine o laço for em Python: itere sobre sequências, use range() e controle o fluxo das repetições.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=cL4YDtFnCt4',
    embedUrl: 'https://www.youtube.com/embed/cL4YDtFnCt4',
    duration: '',
    order: 3,
    objectives: ['Usar for com range()', 'Iterar sobre listas e strings'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-15',
    courseId: 'python',
    moduleId: 'python-mod-mundo2',
    title: 'Aula 14 — Estrutura de Repetição while',
    description: 'Aprenda o laço while para repetições baseadas em condição. Crie loops dinâmicos e entenda quando usar for vs while.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=LH6OIn2lBaI',
    embedUrl: 'https://www.youtube.com/embed/LH6OIn2lBaI',
    duration: '',
    order: 4,
    objectives: ['Usar while com condição', 'Criar menus e validações com while'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-16',
    courseId: 'python',
    moduleId: 'python-mod-mundo2',
    title: 'Aula 15 — Interrompendo Repetições',
    description: 'Use break, continue e else em loops. Controle com precisão o fluxo de execução dos seus laços de repetição.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=1OFp_-R2B2A',
    embedUrl: 'https://www.youtube.com/embed/1OFp_-R2B2A',
    duration: '',
    order: 5,
    objectives: ['Usar break e continue', 'Aplicar else em loops'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PYTHON — MÓDULO 3: Mundo 3 — Estruturas Compostas
  // ═══════════════════════════════════════════════════════════════════════════

  createVideoLesson({
    id: 'python-vid-17',
    courseId: 'python',
    moduleId: 'python-mod-mundo3',
    title: 'Aula 16 — Tuplas',
    description: 'Aprenda a usar tuplas em Python: coleções imutáveis, quando usar em vez de listas e as principais operações disponíveis.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=0LB3FSfjvao',
    embedUrl: 'https://www.youtube.com/embed/0LB3FSfjvao',
    duration: '',
    order: 1,
    objectives: ['Criar e manipular tuplas', 'Entender imutabilidade'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-18',
    courseId: 'python',
    moduleId: 'python-mod-mundo3',
    title: 'Aula 17 — Listas (Parte 1)',
    description: 'Domine as listas em Python: criação, acesso, adição, remoção, ordenação e os principais métodos da estrutura de lista.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=N1hTsbW50eM',
    embedUrl: 'https://www.youtube.com/embed/N1hTsbW50eM',
    duration: '',
    order: 2,
    objectives: ['Criar e manipular listas', 'Usar append, remove, sort, pop'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-19',
    courseId: 'python',
    moduleId: 'python-mod-mundo3',
    title: 'Aula 17 — Listas (Parte 2)',
    description: 'Avance com listas: listas compostas, list comprehension, matrizes e operações avançadas com coleções em Python.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=YV_JQmZNFsk',
    embedUrl: 'https://www.youtube.com/embed/YV_JQmZNFsk',
    duration: '',
    order: 3,
    objectives: ['Usar list comprehension', 'Trabalhar com matrizes e listas compostas'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-20',
    courseId: 'python',
    moduleId: 'python-mod-mundo3',
    title: 'Aula 19 — Dicionários',
    description: 'Aprenda dicionários em Python: pares chave-valor, métodos keys(), values(), items() e operações fundamentais.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=ZWj8o692qGY',
    embedUrl: 'https://www.youtube.com/embed/ZWj8o692qGY',
    duration: '',
    order: 4,
    objectives: ['Criar dicionários', 'Acessar, adicionar e remover pares chave-valor'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-21',
    courseId: 'python',
    moduleId: 'python-mod-mundo3',
    title: 'Aula 20 — Funções (Parte 1)',
    description: 'Crie funções reutilizáveis em Python com def, parâmetros, argumentos e retorno de valores. Estruture melhor seu código.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=ezfr9d7wd_k',
    embedUrl: 'https://www.youtube.com/embed/ezfr9d7wd_k',
    duration: '',
    order: 5,
    objectives: ['Criar funções com def', 'Usar parâmetros e return'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-22',
    courseId: 'python',
    moduleId: 'python-mod-mundo3',
    title: 'Aula 21 — Funções (Parte 2)',
    description: 'Avance em funções Python: escopo de variáveis, funções com múltiplos retornos, parâmetros padrão e funções lambda.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=etjJ_4Eqrk8',
    embedUrl: 'https://www.youtube.com/embed/etjJ_4Eqrk8',
    duration: '',
    order: 6,
    objectives: ['Entender escopo global e local', 'Criar parâmetros padrão e lambda'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),

  createVideoLesson({
    id: 'python-vid-23',
    courseId: 'python',
    moduleId: 'python-mod-mundo3',
    title: 'Aula 22 — Módulos e Pacotes',
    description: 'Organize seu código em módulos e pacotes Python. Aprenda a criar, importar e distribuir seus próprios módulos.' + PYTHON_CREDIT,
    youtubeUrl: 'https://www.youtube.com/watch?v=s3r8_Aug4y8',
    embedUrl: 'https://www.youtube.com/embed/s3r8_Aug4y8',
    duration: '',
    order: 7,
    objectives: ['Criar módulos Python', 'Organizar código em pacotes'],
    materials: ['Python 3 instalado', 'IDLE ou PyCharm'],
  }),
]
