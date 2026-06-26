import { createLesson } from '../schemas.js'

export const fundamentosLessons = [
  createLesson({
    id: 'web-intro',
    courseId: 'fundamentos-web',
    moduleId: 'web-fundamentos',
    title: 'O que e a Internet',
    description: 'Historia, ARPANET, redes, clientes e servidores.',
    duration: 15,
    xp: 25,
    order: 1,
    illustration: 'globe',
    objectives: [
      'Compreender a origem da Internet',
      'Entender o que e ARPANET',
      'Diferenciar cliente de servidor',
      'Identificar os tipos de rede',
    ],
    introduction:
      'A Internet conecta bilhoes de dispositivos no mundo todo. Mas como ela surgiu? E como ela realmente funciona? Nesta aula, vamos voltar no tempo e entender a base de tudo.',
    history:
      'A Internet nasceu do projeto ARPANET, criado pelo Departamento de Defesa dos EUA em 1969. O objetivo era criar uma rede descentralizada que sobrevivesse a ataques. O primeiro no foi na UCLA. Em 1983, ARPANET adotou o protocolo TCP/IP, e em 1991 Tim Berners-Lee criou a World Wide Web.',
    concept:
      'A Internet e uma rede global de computadores interconectados que se comunicam usando protocolos padronizados. Clientes (seu celular, PC) fazem requisicoes a servidores (computadores poderosos que armazenam sites), que respondem com dados.',
    howItWorks:
      'Dados sao divididos em pacotes, cada um com origem e destino. Os pacotes viajam por roteadores, que decidem a melhor rota. No destino, os pacotes sao remontados. Tudo isso acontece em milesimos de segundos.',
    realWorldApplications: [
      'Navegacao web',
      'Email e comunicacao',
      'Streaming de video',
      'Jogos online',
      'Internet das Coisas (IoT)',
    ],
    bestPractices: [
      'Use conexoes seguras (HTTPS)',
      'Mantenha dispositivos atualizados',
      'Use redes Wi-Fi confiaveis',
      'Nao compartilhe dados sensiveis em redes publicas',
    ],
    commonMistakes: [
      '- Confundir Internet com Web',
      '- Achar que a nuvem nao usa servidores fisicos',
      '- Ignorar a diferenca entre cliente e servidor',
      '- Subestimar a importancia dos protocolos',
    ],
    deepDive:
      'O protocolo TCP/IP e a espinha dorsal. IP (Internet Protocol) cuida do roteamento; TCP (Transmission Control Protocol) garante que todos os pacotes cheguem em ordem. Sem TCP/IP, a Internet nao funcionaria.',
    curiosities: [
      'O primeiro email foi enviado em 1971 por Ray Tomlinson',
      'Existem mais de 5 bilhoes de usuarios de Internet no mundo',
      'O cabo de fibra otica mais longo liga EUA ao Japao (9.000 km)',
      'O primeiro site ainda esta online: info.cern.ch',
    ],
    example: {
      html: '<h1>Cliente e Servidor</h1>\n<div class="diagrama">\n  <div class="cliente">Cliente (PC / Celular)</div>\n  <div class="seta">-- requisicao --></div>\n  <div class="servidor">Servidor</div>\n  <div class="seta"><-- resposta --</div>\n</div>',
      css: '.diagrama { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; font-family: monospace; } .cliente, .servidor { background: #e0f2fe; padding: 0.5rem 1rem; border-radius: 0.5rem; } .seta { color: #64748b; font-size: 0.875rem; }',
    },
    playground: {
      html: '<h1>Internet</h1><p>A rede global</p>',
      css: 'body { font-family: system-ui; padding: 1rem; }',
    },
    challenge: {
      prompt: 'Explique a diferenca entre cliente e servidor no playground.',
      starterCode: '<h1>Cliente vs Servidor</h1>\n<p></p>',
      hint: 'Cliente pede, servidor responde.',
    },
    exercise: {
      prompt: 'Crie um resumo visual da historia da Internet com titulos e paragrafos.',
      starterCode: '<h1>Historia da Internet</h1>\n',
      hint: 'Use h2 para marcos importantes e p para descrever.',
    },
    summary: [
      'Internet e uma rede global descentralizada',
      'ARPANET foi a precursora da Internet',
      'Clientes consomem, servidores fornecem',
      'TCP/IP e o protocolo fundamental',
    ],
    checklist: [
      'Entendi o que e ARPANET',
      'Sei a diferenca entre cliente e servidor',
      'Compreendo o papel do TCP/IP',
      'Identifico os tipos de rede',
    ],
  }),

  createLesson({
    id: 'web-dns-http',
    courseId: 'fundamentos-web',
    moduleId: 'web-fundamentos',
    title: 'Como um site chega ate voce',
    description: 'DNS, hospedagem, servidores, HTTP e HTTPS.',
    duration: 15,
    xp: 25,
    order: 2,
    illustration: 'globe',
    objectives: [
      'Entender o que e DNS',
      'Compreender HTTP e HTTPS',
      'Diferenciar hospedagem de dominio',
      'Explicar o fluxo de uma requisicao web',
    ],
    introduction:
      'Voce digita um endereco e o site aparece magicamente. Mas o que acontece entre a tecla Enter e a pagina carregada? Nesta aula, vamos desvendar esse processo passo a passo.',
    history:
      'DNS foi criado em 1983 por Paul Mockapetris para substituir o arquivo hosts.txt que listava todos os enderecos manualmente. HTTP foi criado por Tim Berners-Lee em 1991. HTTPS surgiu em 1994 pela Netscape para permitir transacoes seguras.',
    concept:
      'DNS traduz nomes (google.com) em IPs (142.250.218.14). HTTP e o protocolo de comunicacao entre cliente e servidor. HTTPS adiciona criptografia SSL/TLS para proteger os dados trafegados.',
    howItWorks:
      'Voce digita um URL -> DNS resolve o IP -> Conexao TCP e estabelecida -> Requisicao HTTP e enviada -> Servidor processa e responde -> Navegador renderiza o conteudo. Tudo em milesimos de segundos.',
    realWorldApplications: [
      'Navegacao web diaria',
      'Redes de distribuicao de conteudo (CDN)',
      'Consumo de APIs REST',
      'Streaming de midia',
      'Sites de comercio eletronico',
    ],
    bestPractices: [
      'Use HTTPS em todos os sites',
      'Escolha uma boa hospedagem com suporte a SSL',
      'Configure registros DNS corretamente',
      'Use CDN para melhorar performance global',
    ],
    commonMistakes: [
      '- Confundir dominio com hospedagem',
      '- Ignorar a instalacao de certificado SSL',
      '- Manter registros DNS desatualizados',
      '- Nao redirecionar HTTP para HTTPS',
    ],
    deepDive:
      'TLS (Transport Layer Security) usa criptografia assimetrica para estabelecer conexao segura e depois simetrica para transferencia de dados. E o que mantem senhas e dados de cartao protegidos durante a navegacao.',
    curiosities: [
      'DNS e comparado a agenda telefonica da Internet',
      'HTTPS foi criado pela Netscape em 1994',
      'Existem 13 servidores DNS raiz no mundo',
      'Uma requisicao web pode passar por dezenas de roteadores',
    ],
    example: {
      html: '<h1>Fluxo de uma requisicao</h1>\n<ol>\n  <li>Digitar URL</li>\n  <li>DNS resolve o IP</li>\n  <li>Conexao TCP estabelecida</li>\n  <li>Requisicao HTTP enviada</li>\n  <li>Servidor responde</li>\n  <li>Pagina renderizada</li>\n</ol>',
      css: 'ol { font-family: system-ui; line-height: 2; } li { padding: 0.25rem 0; }',
    },
    playground: {
      html: '<h1>DNS</h1><p>Traduz nomes em IPs</p>',
      css: 'body { font-family: system-ui; padding: 1rem; }',
    },
    challenge: {
      prompt: 'Descreva o caminho percorrido por uma requisicao web desde a URL ate a pagina carregada.',
      starterCode: '<h1>Caminho da requisicao</h1>\n<ul>\n</ul>',
      hint: 'Comece com a digitacao da URL, depois DNS, conexao e resposta.',
    },
    exercise: {
      prompt: 'Crie uma pagina que liste as diferencas entre HTTP e HTTPS.',
      starterCode: '<h1>HTTP vs HTTPS</h1>\n',
      hint: 'Pense em seguranca, criptografia e porta padrao.',
    },
    summary: [
      'DNS traduz nomes de dominio em enderecos IP',
      'HTTP e o protocolo de comunicacao da web',
      'HTTPS adiciona criptografia com SSL/TLS',
      'Hospedagem armazena os arquivos do site',
    ],
    checklist: [
      'Entendo o fluxo de resolucao DNS',
      'Sei a diferenca entre HTTP e HTTPS',
      'Compreendo o que e hospedagem',
      'Sei explicar o caminho de uma requisicao',
    ],
  }),

  createLesson({
    id: 'web-front-back',
    courseId: 'fundamentos-web',
    moduleId: 'web-fundamentos',
    title: 'Como a Web funciona',
    description: 'Frontend, Backend, Bancos de Dados e APIs.',
    duration: 15,
    xp: 25,
    order: 3,
    illustration: 'code2',
    objectives: [
      'Diferenciar frontend de backend',
      'Entender o papel de APIs',
      'Conhecer bancos de dados relacionais e NoSQL',
      'Compreender o fluxo completo de uma aplicacao web',
    ],
    introduction:
      'Um site moderno nao e apenas uma pagina bonita. Por tras dos botoes e animacoes existe um ecossistema inteiro: servidores, bancos de dados e APIs que se comunicam para entregar a experiencia completa.',
    history:
      'Nos anos 90, sites eram paginas estaticas em HTML puro. Com o tempo, JavaScript permitiu interatividade no navegador, e linguagens como PHP e ASP surgiram para gerar conteudo no servidor. Hoje temos frameworks robustos nos dois lados.',
    concept:
      'Frontend e a parte visual com que o usuario interage (HTML, CSS, JavaScript). Backend e a logica no servidor que processa dados (Node.js, Python, Java). APIs sao pontes que conectam frontend e backend.',
    howItWorks:
      'O navegador faz requisicoes para o backend via API. O backend consulta o banco de dados, processa a logica e retorna dados estruturados (JSON). O frontend recebe e renderiza para o usuario.',
    realWorldApplications: [
      'Redes sociais (frontend + API + banco)',
      'Lojas virtuais com carrinho de compras',
      'Aplicativos de banco online',
      'Plataformas de streaming',
      'Sistemas de gestao empresarial (ERP)',
    ],
    bestPractices: [
      'Separe frontend e backend em camadas distintas',
      'Documente suas APIs com clareza',
      'Use bancos de dados adequados ao tipo de dado',
      'Valide dados tanto no frontend quanto no backend',
    ],
    commonMistakes: [
      '- Misturar logica de banco com codigo de apresentacao',
      '- Criar APIs sem documentacao',
      '- Ignorar indices no banco de dados',
      '- Processar dados sensiveis apenas no frontend',
    ],
    deepDive:
      'APIs REST usam metodos HTTP (GET, POST, PUT, DELETE) para operar recursos. Cada requisicao e stateless, ou seja, o servidor nao mantem estado entre chamadas. Isso torna o sistema escalavel e simples de manter.',
    curiosities: [
      'O termo full-stack surgiu para devs que trabalham nos dois lados',
      'GraphQL foi criado pelo Facebook como alternativa ao REST',
      'Bancos NoSQL como MongoDB surgiram para lidar com dados nao estruturados',
      'O primeiro servidor web rodou em um NeXTcube de Tim Berners-Lee',
    ],
    example: {
      html: '<h1>Arquitetura web</h1>\n<div class="camadas">\n  <div class="camada">Frontend (HTML / CSS / JS)</div>\n  <div class="seta"> | </div>\n  <div class="camada">API (REST / GraphQL)</div>\n  <div class="seta"> | </div>\n  <div class="camada">Backend (logica)</div>\n  <div class="seta"> | </div>\n  <div class="camada">Banco de Dados</div>\n</div>',
      css: '.camadas { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; font-family: monospace; } .camada { background: #dbeafe; padding: 0.5rem 1rem; border-radius: 0.5rem; } .seta { color: #94a3b8; }',
    },
    playground: {
      html: '<h1>Frontend e Backend</h1><p>Duas faces da web</p>',
      css: 'body { font-family: system-ui; padding: 1rem; }',
    },
    challenge: {
      prompt: 'Explique como frontend, backend e banco de dados se comunicam em uma aplicacao web.',
      starterCode: '<h1>Comunicacao web</h1>\n<ol>\n</ol>',
      hint: 'O navegador faz requisicoes para o servidor, que consulta o banco.',
    },
    exercise: {
      prompt: 'Crie uma pagina que descreva o papel de cada camada de uma aplicacao web.',
      starterCode: '<h1>Camadas da web</h1>\n',
      hint: 'Use divs ou sections para representar cada camada.',
    },
    summary: [
      'Frontend cuida da interface visual do usuario',
      'Backend processa a logica e regras de negocio',
      'Bancos de dados armazenam informacoes de forma estruturada',
      'APIs conectam frontend e backend de forma padronizada',
    ],
    checklist: [
      'Sei diferenciar frontend de backend',
      'Entendo o papel de uma API',
      'Conheco bancos de dados relacionais e NoSQL',
      'Compreendo o fluxo completo de uma aplicacao',
    ],
  }),

  createLesson({
    id: 'web-ecosystem',
    courseId: 'fundamentos-web',
    moduleId: 'web-fundamentos',
    title: 'Ecossistema do Desenvolvedor Web',
    description: 'HTML, CSS, JavaScript, Frameworks, Deploy e Dominios.',
    duration: 15,
    xp: 25,
    order: 4,
    illustration: 'bookOpen',
    objectives: [
      'Conhecer as ferramentas do desenvolvedor web',
      'Entender o papel de frameworks',
      'Saber o que e deploy',
      'Conhecer Git e versionamento de codigo',
    ],
    introduction:
      'O desenvolvedor web moderno conta com um ecossistema rico de ferramentas, frameworks e praticas. Desde o editor de codigo ate o deploy em producao, cada etapa exige conhecimento especifico.',
    history:
      'O desenvolvimento web comecou com HTML estatico. Depois veio CSS para estilizar e JavaScript para interagir. Frameworks como jQuery simplificaram o JS, e hoje temos React, Vue e Angular. No backend, Node.js popularizou JavaScript fora do navegador.',
    concept:
      'Frameworks sao conjuntos de ferramentas que aceleram o desenvolvimento. Git e um sistema de controle de versao que rastreia mudancas no codigo. Deploy e o processo de publicar o site em um servidor para acesso publico.',
    howItWorks:
      'O dev escreve codigo em um editor (VS Code), usa Git para versionar, envia para um repositorio (GitHub), e faz deploy usando servicos como Vercel, Netlify ou AWS. O resultado fica acessivel via dominio na Internet.',
    realWorldApplications: [
      'Portfolio pessoal com HTML, CSS e JS puro',
      'Aplicacao React com deploy na Vercel',
      'API Node.js hospedada na Render',
      'Site institucional com CMS e dominio proprio',
      'Loja virtual com framework e integracao de pagamento',
    ],
    bestPractices: [
      'Use Git desde o primeiro projeto',
      'Escolha frameworks adequados ao tamanho do projeto',
      'Configure CI/CD para automatizar deploys',
      'Mantenha dependencias atualizadas e seguras',
    ],
    commonMistakes: [
      '- Querer aprender todos os frameworks de uma vez',
      '- Ignorar controle de versao em projetos',
      '- Fazer deploy sem testar antes',
      '- Nao configurar dominio DNS corretamente',
    ],
    deepDive:
      'CI/CD (Integracao Continua / Entrega Continua) automatiza testes e deploys. Cada push no repositorio dispara uma pipeline que executa testes, faz build e publica a aplicacao. Isso reduz erros manuais e agiliza entregas.',
    curiosities: [
      'O VS Code e o editor mais usado por devs web',
      'Git foi criado por Linus Torvalds em 2005',
      'O Node.js permitiu JavaScript no backend a partir de 2009',
      'Existem mais de 1.800 frameworks JavaScript catalogados',
    ],
    example: {
      html: '<h1>Fluxo de desenvolvimento</h1>\n<ol>\n  <li>Editar codigo no VS Code</li>\n  <li>Versionar com Git</li>\n  <li>Enviar para o GitHub</li>\n  <li>CI/CD executa testes</li>\n  <li>Deploy automatico</li>\n  <li>Site no ar!</li>\n</ol>',
      css: 'ol { font-family: system-ui; line-height: 2; } li { padding: 0.25rem 0; }',
    },
    playground: {
      html: '<h1>Ecossistema web</h1><p>Ferramentas do dev moderno</p>',
      css: 'body { font-family: system-ui; padding: 1rem; }',
    },
    challenge: {
      prompt: 'Descreva o fluxo completo desde a criacao do codigo ate o site no ar.',
      starterCode: '<h1>Do codigo ao deploy</h1>\n<ul>\n</ul>',
      hint: 'Pense em editor, versionamento, CI/CD e publicacao.',
    },
    exercise: {
      prompt: 'Crie uma pagina que apresente as principais ferramentas do desenvolvedor web.',
      starterCode: '<h1>Ferramentas do dev web</h1>\n',
      hint: 'Liste editores, frameworks, plataformas de deploy e controle de versao.',
    },
    summary: [
      'Frameworks aceleram o desenvolvimento web',
      'Git permite rastrear e colaborar em codigo',
      'Deploy publica a aplicacao para usuarios finais',
      'Dominios personalizados dao identidade ao site',
    ],
    checklist: [
      'Conheco as principais ferramentas do dev web',
      'Entendo o papel de frameworks',
      'Sei o que e deploy e CI/CD',
      'Compreendo a importancia do Git',
    ],
  }),
]
