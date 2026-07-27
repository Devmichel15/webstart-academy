import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const JS_CREDIT = '\n\nConteúdo por: Matheus Battisti - Hora de Codar (https://www.youtube.com/@HoradeCodar)'

const rawVideos = [
  { num: 1, id: 'TkD0QMyBa28', title: 'Curso JavaScript #01 - Introdução', module: 'js-mod-intro-fundamentos' },
  { num: 2, id: 'rQseLH4LDXQ', title: 'Curso JavaScript #02 - Primeiro programa', module: 'js-mod-intro-fundamentos' },
  { num: 3, id: 'xmk1PjuYHIw', title: 'Curso JavaScript #03 - Como inserir código JavaScript em uma página web', module: 'js-mod-intro-fundamentos' },
  { num: 4, id: 'oN7L8oQWyPY', title: 'Curso JavaScript #04 - Particularidades da linguagem JavaScript', module: 'js-mod-intro-fundamentos' },
  { num: 5, id: 'sIXUNUqnoXI', title: 'Curso JavaScript #05 - Declarando variáveis', module: 'js-mod-intro-fundamentos' },
  { num: 6, id: '7Isq6ekQT1k', title: 'Curso JavaScript #06 - Tipos de dados', module: 'js-mod-intro-fundamentos' },
  { num: 7, id: '59PcA9YsoQ0', title: 'Curso JavaScript #07 - Como utilizar strings', module: 'js-mod-intro-fundamentos' },
  { num: 8, id: 'Otd2KA4LrzU', title: 'Curso JavaScript #08 - Boolean', module: 'js-mod-intro-fundamentos' },
  { num: 9, id: 'AoSTIPwYXWc', title: 'Curso JavaScript #09 - null e undefined', module: 'js-mod-intro-fundamentos' },
  { num: 10, id: 'x89T_rGiFiY', title: 'Curso JavaScript #10 - Tipos de dados Objeto', module: 'js-mod-intro-fundamentos' },
  { num: 11, id: 'bDDpv-BL2v0', title: 'Curso JavaScript #11 - Arrays', module: 'js-mod-intro-fundamentos' },

  { num: 12, id: 'DGvRhPgsuMo', title: 'Curso JavaScript #12 - Operador condicional if', module: 'js-mod-estruturas-controle' },
  { num: 13, id: 'I9QXIDcxkIE', title: 'Curso JavaScript #13 - Operadores de comparação', module: 'js-mod-estruturas-controle' },
  { num: 14, id: 'G95Se9RNhoA', title: 'Curso JavaScript #14 - Else if e else', module: 'js-mod-estruturas-controle' },
  { num: 15, id: 'jbs4087iV7k', title: 'Curso JavaScript #15 - Comparação de valor e tipo de dado (=== e !==)', module: 'js-mod-estruturas-controle' },
  { num: 16, id: 'jQgKM0L5DYs', title: 'Curso JavaScript #16 - Operador lógico AND (&&)', module: 'js-mod-estruturas-controle' },
  { num: 17, id: 'Ie5GRz7QupY', title: 'Curso JavaScript #17 - Operador lógico OR (||)', module: 'js-mod-estruturas-controle' },
  { num: 18, id: 'CHuuY1DeIa4', title: 'Curso JavaScript #18 - Operador lógico NOT (!)', module: 'js-mod-estruturas-controle' },
  { num: 19, id: 'R-jwbPkJZvA', title: 'Curso JavaScript #19 - Estrutura de repetição while', module: 'js-mod-estruturas-controle' },
  { num: 20, id: 'uL8-YwULUHA', title: 'Curso JavaScript #20 - Operadores de atribuição', module: 'js-mod-estruturas-controle' },
  { num: 21, id: 'wiUUASSieOE', title: 'Curso JavaScript #21 - for (estrutura de repetição - loop)', module: 'js-mod-estruturas-controle' },
  { num: 22, id: '1q05l_Vgukg', title: 'Curso JavaScript #22 - break e continue', module: 'js-mod-estruturas-controle' },

  { num: 23, id: 'ItzRdMj1lzw', title: 'Curso JavaScript #23 - funções (function)', module: 'js-mod-funcoes-escopo' },
  { num: 24, id: 'VPXLOXz2Xzg', title: 'Curso JavaScript #24 - Alterando o DOM com um for', module: 'js-mod-funcoes-escopo' },
  { num: 25, id: '5XExYUXaItg', title: 'Curso JavaScript #25 - Escopo em JS (scope)', module: 'js-mod-funcoes-escopo' },
  { num: 26, id: 'kugQNQl8sF0', title: 'Curso JavaScript #26 - let e const', module: 'js-mod-funcoes-escopo' },
  { num: 27, id: 'wLeSTjpTfsg', title: 'Curso JavaScript #27 - Métodos numéricos (parseInt, parseFloat)', module: 'js-mod-funcoes-escopo' },
  { num: 28, id: '2LkSVSenlA0', title: 'Curso JavaScript #28 - Funções de string (toUpperCase, toLowerCase, length)', module: 'js-mod-funcoes-escopo' },
  { num: 29, id: 'BKw97_UOR1o', title: 'Curso JavaScript #29 - Funções de string PARTE 2', module: 'js-mod-funcoes-escopo' },
  { num: 30, id: '6A0qz-tybc0', title: 'Curso JavaScript #30 - Funções de array', module: 'js-mod-funcoes-escopo' },
  { num: 31, id: 'jk74IvG4Eh8', title: 'Curso JavaScript #31 - Funções de Array PARTE 2', module: 'js-mod-funcoes-escopo' },
  { num: 32, id: 'GQ8jMODjh0k', title: 'Curso JavaScript #32 - Criando Objetos com métodos', module: 'js-mod-funcoes-escopo' },
  { num: 33, id: 'WsbMaN3PP9I', title: 'Curso JavaScript #33 - Utilizando o this', module: 'js-mod-funcoes-escopo' },

  { num: 34, id: 'snaMsZuYoFo', title: 'Curso JavaScript #34 - O que é DOM? (Document Object Model)', module: 'js-mod-dom-eventos' },
  { num: 35, id: 'BbwQHFVpQWs', title: 'Curso JavaScript #35 - Acessando elementos através do DOM', module: 'js-mod-dom-eventos' },
  { num: 36, id: 'rqj4SlhfCR0', title: 'Curso JavaScript #36 - querySelector e querySelectorAll', module: 'js-mod-dom-eventos' },
  { num: 37, id: 'nA3QJYFGsYc', title: 'Curso JavaScript #37 - Alterar conteúdo do elemento (textContent e innerHTML)', module: 'js-mod-dom-eventos' },
  { num: 38, id: 'eC-z9oHLzBc', title: 'Curso JavaScript #38 - Criando elementos com DOM (createElement)', module: 'js-mod-dom-eventos' },
  { num: 39, id: 'pSkaIyRAt7w', title: 'Curso JavaScript #39 - Removendo elementos (removeChild)', module: 'js-mod-dom-eventos' },
  { num: 40, id: '0XJyTa6B-GA', title: 'Curso JavaScript #40 - Inserindo elementos (appendChild e insertBefore)', module: 'js-mod-dom-eventos' },
  { num: 41, id: 'c5av-lPRt6A', title: 'Curso JavaScript #41 - Trocando elementos (replaceChild)', module: 'js-mod-dom-eventos' },
  { num: 42, id: 'NvaRXr4gdWU', title: 'Curso JavaScript #42 - Adicionando atributo (setAttribute)', module: 'js-mod-dom-eventos' },
  { num: 43, id: '7KBjz6f27zA', title: 'Curso JavaScript #43 - Adicionando CSS pelo DOM', module: 'js-mod-dom-eventos' },
  { num: 44, id: 'peEiczr8LSI', title: 'Curso JavaScript #44 - Propriedades do document', module: 'js-mod-dom-eventos' },
  { num: 45, id: 'jFfg_IdZAc8', title: 'Curso JavaScript #45 - Callback functions', module: 'js-mod-dom-eventos' },
  { num: 46, id: 'tXnY9-gVN1E', title: 'Curso JavaScript #46 - setTimeout e setInterval', module: 'js-mod-dom-eventos' },
  { num: 47, id: 'KV1ph8CYWi4', title: 'Curso JavaScript #47 - clearTimeout e clearInterval', module: 'js-mod-dom-eventos' },
  { num: 48, id: '8nnLz8GtQe4', title: 'Curso JavaScript #48 - Eventos e onload', module: 'js-mod-dom-eventos' },
  { num: 49, id: 'cjpQU6NutU0', title: 'Curso JavaScript #49 - Eventos click e dblclick do DOM', module: 'js-mod-dom-eventos' },
  { num: 50, id: 'U8-NbkaDJf0', title: 'Curso JavaScript #50 - Eventos mouseover e mouseout', module: 'js-mod-dom-eventos' },
  { num: 51, id: '0vQMTKeIkcE', title: 'Curso JavaScript #51 - Eventos keydown e keyup', module: 'js-mod-dom-eventos' },

  { num: 52, id: 'KNk0Cex3zcM', title: 'Curso JavaScript #52 - Criando o projeto do curso', module: 'js-mod-projeto-pratico' },
  { num: 53, id: 'VM4S9yffT1w', title: 'Curso JavaScript #53 - Finalizando o projeto com CSS', module: 'js-mod-projeto-pratico' },
  { num: 54, id: 'UZNUB9-tUAY', title: 'Curso JavaScript #54 - Adicionando eventos ao projeto', module: 'js-mod-projeto-pratico' },

  // Complementary Videos
  { num: 55, id: 'BWPUSXzSWA8', title: 'Aprenda JSON em 20 minutos', module: 'js-mod-assincrono-apis' },
  { num: 56, id: 'we5Ac8U21lI', title: 'Tudo sobre Async e Await - Funções assíncronas em JavaScript', module: 'js-mod-assincrono-apis' },
  { num: 57, id: 'hyMCPZNLXps', title: 'Curso de JavaScript para iniciantes - aprenda os fundamentos de JavaScript', module: 'js-mod-tecnicas-avancadas' },
  { num: 58, id: 'KCfaPZ2t2yA', title: 'CRIE UMA CALCULADORA COM HTML CSS E JAVASCRIPT', module: 'js-mod-projetos-praticos-1' },
  { num: 59, id: 'qIGYM4S8x50', title: 'APRENDA FETCH API DE JAVASCRIPT COM PROJETO', module: 'js-mod-assincrono-apis' },
  { num: 60, id: 'FMaEIVdaAFo', title: 'AUTOCOMPLETAR ENDEREÇO PELO CEP - PROJETO DE HTML, CSS E JAVASCRIPT (API VIACEP)', module: 'js-mod-assincrono-apis' },
  { num: 61, id: 'mnjQeXqA3Z0', title: '10 MÉTODOS DE ARRAY QUE TODO DESENVOLVEDOR PRECISA CONHECER', module: 'js-mod-tecnicas-avancadas' },
  { num: 62, id: 'i1dNnS6pXAo', title: 'COMO APLICAR DARK MODE COM HTML, CSS E JAVASCRIPT', module: 'js-mod-projetos-praticos-1' },
  { num: 63, id: 'kj6GFACwLYo', title: 'MODAL COM JAVASCRIPT - PROJETO DE HTML, CSS E JAVASCRIPT', module: 'js-mod-projetos-praticos-1' },
  { num: 64, id: 'HSssE1PRQcA', title: 'Projeto de JavaScript para iniciantes - To Do List com JavaScript puro', module: 'js-mod-projetos-praticos-1' },
  { num: 65, id: 'dHPP83T9dAs', title: 'Gerador de senhas seguras com JavaScript - Projeto de JavaScript', module: 'js-mod-projetos-praticos-1' },
  { num: 66, id: 'E3sKnfq4myo', title: 'Clone página iPhone 13 Pro - Projeto de HTML e CSS para iniciantes', module: 'js-mod-projetos-praticos-1' },
  { num: 67, id: 'VS8EBgPwsSU', title: 'Aplicação de Clima com OpenWeather API - Projeto de JavaScript com API', module: 'js-mod-assincrono-apis' },
  { num: 68, id: 'Jx_msqDaiCg', title: 'Projeto Calculadora de IMC com JavaScript - Projeto HTML CSS e JavaScript', module: 'js-mod-projetos-praticos-1' },
  { num: 69, id: 'fFCqaZ8Tz-Y', title: 'Gerador de box shadow com JavaScript - Projeto de JavaScript', module: 'js-mod-projetos-praticos-1' },
  { num: 70, id: 'TtDi0xrEvAE', title: 'CLONE DO GOOGLE KEEP COM JAVASCRIPT', module: 'js-mod-projetos-praticos-1' },
  { num: 71, id: 'NbhoeLj6lBs', title: 'REACT.JS E AXIOS - CONSUMIR DADOS DE API COM REACT E AXIOS', module: 'js-mod-assincrono-apis' },
  { num: 72, id: 'e9w8GIV0Yq4', title: 'Axios x Fetch: qual é a melhor biblioteca para fazer requisições HTTP em JavaScript?', module: 'js-mod-assincrono-apis' },
  { num: 73, id: 'rudAiGQ-mes', title: 'Como criar um formulário incrível com validações em JavaScript - Tutorial Passo a Passo', module: 'js-mod-projetos-praticos-2' },
  { num: 74, id: 'SbST27OWpmo', title: 'Aprenda a Programar um Cronômetro com JavaScript - Projeto de JavaScript para iniciantes', module: 'js-mod-projetos-praticos-2' },
  { num: 75, id: 'NyxoqGTFrqo', title: '7 Recursos de JavaScript que todo Dev precisa saber - Técnicas para ter JavaScript avançado', module: 'js-mod-tecnicas-avancadas' },
  { num: 76, id: '0SFRhpzHw94', title: 'Princípios de Clean Code em JavaScript: Melhore Sua Produtividade', module: 'js-mod-tecnicas-avancadas' },
  { num: 77, id: '7wksVf3g3z4', title: 'Como remover caracteres especiais em JavaScript', module: 'js-mod-tecnicas-avancadas' },
  { num: 78, id: 'wzJy46B-8eA', title: 'Como adicionar elementos a um objeto JavaScript', module: 'js-mod-tecnicas-avancadas' },
  { num: 79, id: 'ICVQj1FGEDM', title: 'Dicas práticas para chamar múltiplas funções em um onclick em JavaScript', module: 'js-mod-tecnicas-avancadas' },
  { num: 80, id: 'oQ3_p4oCzDE', title: 'Como gerar PDF com JavaScript', module: 'js-mod-tecnicas-avancadas' },
  { num: 81, id: 'wdq7Yad6jWM', title: 'Como verificar se string é data em JavaScript? As melhores técnicas!', module: 'js-mod-tecnicas-avancadas' },
  { num: 82, id: 'x8CM9e23-yo', title: 'Contador de caracteres e palavras - Projeto com HTML, CSS e JavaScript', module: 'js-mod-projetos-praticos-2' },
  { num: 83, id: 'MOsJdRmQoko', title: 'Teste de velocidade de digitação - PROJETO com HTML, CSS e JAVASCRIPT', module: 'js-mod-projetos-praticos-2' },
  { num: 84, id: 'OYPbr6ZG3pc', title: 'CURSO DE JAVASCRIPT COM EXERCÍCIOS E PROJETOS', module: 'js-mod-tecnicas-avancadas' },
  { num: 85, id: 'F0bZ1YN0unQ', title: 'JAVASCRIPT COM NOVAS FUNCIONALIDADES EM 2024 - novos métodos de array, groupBy, Temporal API e mais!', module: 'js-mod-tecnicas-avancadas' },
  { num: 86, id: 'J6LCE7jHgmU', title: '7 conceitos de JS que todo dev demora para aprender por completo e são OBRIGATÓRIOS!', module: 'js-mod-tecnicas-avancadas' },
  { num: 87, id: 'oz4wSEhRRuU', title: 'Como criar uma barra de navegação responsiva - Menu Navbar Responsivo com HTML CSS e JavaScript', module: 'js-mod-projetos-praticos-2' },
  { num: 88, id: 'aJH2KybHFDI', title: 'Projeto Verificador de Força de Senha com JavaScript - Projeto de JavaScript para inciantes', module: 'js-mod-projetos-praticos-2' },
  { num: 89, id: '3pWHFh4lST4', title: 'Mostrar ou ocultar a senha com JavaScript - Olho de mostrar senha com JS', module: 'js-mod-projetos-praticos-2' },
  { num: 90, id: 'RBP_W06QfrY', title: 'Como validar e-mail com JavaScript e regex - Validação de e-mail com JavaScript', module: 'js-mod-projetos-praticos-2' },
  { num: 91, id: 'jbzZUuN1sRA', title: 'Como fazer async await no foreach', module: 'js-mod-assincrono-apis' },
  { num: 92, id: 'n_vmS00Az2w', title: 'PROJETO CONVERSOR DE TEXTO PARA AUDIO - COMO CONVERTER TEXTO PARA AUDIO COM JAVASCRIPT', module: 'js-mod-projetos-praticos-2' },
]

// Group order per module
const moduleOrders = {}

const lessonsCode = `import { createVideoLesson } from './video-lessons.js'

const JS_CREDIT = '\\n\\nConteúdo por: Matheus Battisti - Hora de Codar (https://www.youtube.com/@HoradeCodar)'

export const javascriptLessons = [\n` +
rawVideos.map((v) => {
  moduleOrders[v.module] = (moduleOrders[v.module] || 0) + 1
  const orderInModule = moduleOrders[v.module]
  const lessonId = `js-vid-${v.num}`
  const youtubeUrl = `https://www.youtube.com/watch?v=${v.id}`
  const embedUrl = `https://www.youtube.com/embed/${v.id}`

  let desc = `Aula prática sobre ${v.title}. Aprenda a aplicar este conceito na construção de aplicações web.`
  if (v.num <= 54) {
    desc = `Aula ${v.num} do Curso de JavaScript Completo: ${v.title.replace(/^Curso JavaScript #\\d+ - /, '')}. Aprenda passo a passo os conceitos e aplicações práticas.`
  }

  const obj = [
    `Compreender e aplicar o conceito de: ${v.title}`,
    `Desenvolver habilidades práticas com exemplos em JavaScript`,
    `Integrar o aprendizado na construção de soluções web`,
  ]

  const mat = [
    'Navegador web (Google Chrome, Firefox ou Edge)',
    'Editor de código (VS Code ou similar)',
  ]

  return `  createVideoLesson({
    id: '${lessonId}',
    courseId: 'javascript',
    moduleId: '${v.module}',
    title: ${JSON.stringify(v.title)},
    description: ${JSON.stringify(desc)} + JS_CREDIT,
    youtubeUrl: '${youtubeUrl}',
    embedUrl: '${embedUrl}',
    duration: '',
    order: ${orderInModule},
    objectives: ${JSON.stringify(obj, null, 6).replace(/\n/g, '\n    ')},
    materials: ${JSON.stringify(mat, null, 6).replace(/\n/g, '\n    ')},
  }),`
}).join('\n') + '\n]\n'

// Build Modules
const modulesMap = {
  'js-mod-intro-fundamentos': {
    title: 'Módulo 1: Introdução e Sintaxe Básica',
    description: 'Fundamentos do JavaScript, ambiente de desenvolvimento, variáveis e tipos de dados primitivos e estruturados.',
    order: 1,
  },
  'js-mod-estruturas-controle': {
    title: 'Módulo 2: Estruturas de Controle e Repetição',
    description: 'Tomada de decisões com condicionais if/else e estruturas de repetição (loops while e for).',
    order: 2,
  },
  'js-mod-funcoes-escopo': {
    title: 'Módulo 3: Funções, Escopo e Métodos Embutidos',
    description: 'Criação de funções, escopos de variáveis (let/const), métodos para manipulação de strings, números, arrays e objetos.',
    order: 3,
  },
  'js-mod-dom-eventos': {
    title: 'Módulo 4: Manipulação do DOM e Eventos',
    description: 'Seleção, inserção, alteração e remoção de elementos na árvore DOM, temporizadores e manipulação de eventos de usuário.',
    order: 4,
  },
  'js-mod-projeto-pratico': {
    title: 'Módulo 5: Projeto Prático do Curso Principal',
    description: 'Construção de um projeto completo aplicando todo o conhecimento de HTML, CSS, manipulação de DOM e eventos.',
    order: 5,
  },
  'js-mod-assincrono-apis': {
    title: 'Módulo 6: JavaScript Assíncrono, JSON e APIs',
    description: 'Trabalhando com dados assíncronos, requisições HTTP, JSON, Promises, Async/Await, Fetch API, ViaCEP e Axios.',
    order: 6,
  },
  'js-mod-projetos-praticos-1': {
    title: 'Módulo 7: Projetos Práticos e Aplicações - Parte 1',
    description: 'Projetos guiados passo a passo: Calculadora, Dark Mode, Modal, Lista de Tarefas, Gerador de Senhas, Clone iPhone, Calculadora IMC, Box Shadow e Keep Clone.',
    order: 7,
  },
  'js-mod-projetos-praticos-2': {
    title: 'Módulo 8: Projetos Práticos e Aplicações - Parte 2',
    description: 'Projetos e funcionalidades interativas: Formulários com Validação, Cronômetro, Contador de Palavras, Teste de Digitação, Navbar Responsiva, Verificador de Senha e Conversor de Áudio.',
    order: 8,
  },
  'js-mod-tecnicas-avancadas': {
    title: 'Módulo 9: Recursos Avançados, Clean Code e Boas Práticas',
    description: 'Métodos modernos de Array, recursos de ES6+, Clean Code, manipulação de datas, objetos, utilitários em JS e novidades recentes da linguagem.',
    order: 9,
  },
}

const moduleLessons = {}
rawVideos.forEach((v) => {
  if (!moduleLessons[v.module]) moduleLessons[v.module] = []
  moduleLessons[v.module].push(`js-vid-${v.num}`)
})

const modulesCode = `import { createModule } from '../schemas.js'

export const javascriptModules = [\n` +
Object.keys(modulesMap).map((mId) => {
  const m = modulesMap[mId]
  const lessonsArr = moduleLessons[mId] || []
  return `  createModule({
    id: '${mId}',
    courseId: 'javascript',
    title: ${JSON.stringify(m.title)},
    description: ${JSON.stringify(m.description)},
    order: ${m.order},
    lessons: ${JSON.stringify(lessonsArr)},
    quiz: null,
    lab: null,
    miniProject: null,
  }),`
}).join('\n') + '\n]\n'

fs.writeFileSync(path.join(rootDir, 'src/data/lessons/javascript-lessons.js'), lessonsCode)
fs.writeFileSync(path.join(rootDir, 'src/data/modules/javascript-modules.js'), modulesCode)
console.log('Successfully generated javascript-lessons.js and javascript-modules.js!')
