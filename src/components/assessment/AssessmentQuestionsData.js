export const QUESTIONS = [
  {
    id: 'experience',
    title: 'Pra começar, me conta sua relação com programação até hoje.',
    subtext: 'Não existe resposta errada aqui — isso só ajuda a calibrar o ritmo certo pra você.',
    options: [
      {
        value: 'never_coded',
        label: 'Nunca escrevi uma linha de código na vida.',
        icon: 'Sparkles',
      },
      {
        value: 'tried_alone',
        label: 'Já tentei aprender sozinho, mas nunca levei a sério.',
        icon: 'Compass',
      },
      {
        value: 'know_basics',
        label: 'Sei o básico, mas travo quando preciso criar algo do zero.',
        icon: 'Code2',
      },
      {
        value: 'built_projects',
        label: 'Já consegui criar alguns projetos, quero evoluir de nível.',
        icon: 'Rocket',
      },
    ],
    getMicrocopy: () => 'Entendido. Isso já muda como vamos te apresentar o conteúdo.',
  },
  {
    id: 'objective',
    title: 'O que faria você sentir que valeu a pena ter começado?',
    subtext: "Pense no motivo real, não no que 'parece certo' dizer.",
    options: [
      {
        value: 'first_job',
        label: 'Conseguir meu primeiro emprego ou estágio em tech.',
        icon: 'Briefcase',
      },
      {
        value: 'career_change',
        label: 'Trocar de carreira, mesmo que com calma.',
        icon: 'TrendingUp',
      },
      {
        value: 'build_projects',
        label: 'Criar meus próprios projetos e produtos.',
        icon: 'Layers',
      },
      {
        value: 'curiosity',
        label: 'Só quero entender como as coisas funcionam por trás.',
        icon: 'Cpu',
      },
    ],
    getMicrocopy: () => 'Perfeito, isso vai direcionar todo o seu plano.',
  },
  {
    id: 'interest',
    title: 'Se você pudesse escolher agora, o que mais te chama atenção?',
    subtext: 'Se não souber, tudo bem — é literalmente pra isso que estamos aqui.',
    options: [
      {
        value: 'web',
        label: 'Criar sites e aplicações web.',
        icon: 'Globe',
      },
      {
        value: 'mobile',
        label: 'Criar aplicativos para celular.',
        icon: 'Smartphone',
      },
      {
        value: 'data_ai',
        label: 'Trabalhar com dados, IA e automações.',
        icon: 'Bot',
      },
      {
        value: 'undecided',
        label: 'Ainda não sei — quero que me ajudem a decidir.',
        icon: 'HelpCircle',
      },
    ],
    getMicrocopy: (val) =>
      val === 'undecided'
        ? 'Sem problema, vamos descobrir isso juntos ao longo do caminho.'
        : 'Boa escolha.',
  },
  {
    id: 'studyTime',
    title: 'Sendo realista, quanto tempo você consegue dedicar por semana?',
    subtext: 'Prefira subestimar — um plano que você cumpre vale mais que um que te frustra.',
    options: [
      {
        value: 'less_3h',
        label: 'Menos de 3 horas, nas brechas do dia.',
        icon: 'Clock1',
      },
      {
        value: '3_7h',
        label: 'Entre 3 e 7 horas, algumas noites ou fins de semana.',
        icon: 'Clock4',
      },
      {
        value: '7_15h',
        label: 'Entre 7 e 15 horas, já tenho uma rotina pra isso.',
        icon: 'Clock8',
      },
      {
        value: '15h_plus',
        label: 'Mais de 15 horas, é minha prioridade agora.',
        icon: 'Flame',
      },
    ],
    getMicrocopy: () => 'Anotado. Seu plano vai respeitar esse ritmo.',
  },
  {
    id: 'difficulty',
    title: 'O que mais te atrapalha quando você tenta aprender por conta própria?',
    subtext: 'Essa é provavelmente a pergunta mais importante de todas.',
    options: [
      {
        value: 'no_direction',
        label: 'Muita informação solta, não sei nem por onde começar.',
        icon: 'MapPinOff',
      },
      {
        value: 'dont_finish',
        label: 'Começo animado e não consigo terminar o que comecei.',
        icon: 'BatteryLow',
      },
      {
        value: 'theory_no_practice',
        label: 'Entendo a teoria, mas travo total na hora de praticar.',
        icon: 'AlertCircle',
      },
      {
        value: 'just_need_structure',
        label: 'Nunca tive um bloqueio grande, só falta estrutura e direção.',
        icon: 'CheckCircle2',
      },
    ],
    getMicrocopy: () => 'Faz muito mais sentido agora. Vamos trabalhar exatamente nisso.',
  },
  {
    id: 'confidence',
    title: 'Hoje, o quanto você acredita que consegue aprender a programar?',
    subtext: 'Seja honesto — isso não vai ser usado contra você, só a favor.',
    options: [
      {
        value: 'afraid',
        label: 'Sinceramente, tenho bastante medo de não conseguir.',
        icon: 'HeartHandshake',
      },
      {
        value: 'need_guidance',
        label: 'Acho que consigo, mas preciso de alguém guiando o caminho.',
        icon: 'Compass',
      },
      {
        value: 'just_need_push',
        label: 'Tenho confiança, só falta o empurrão certo pra começar.',
        icon: 'Zap',
      },
      {
        value: 'fully_confident',
        label: 'Tenho total certeza, só preciso da estrutura certa.',
        icon: 'Trophy',
      },
    ],
    getMicrocopy: () => 'Guarda essa resposta. Você vai lembrar dela lá na frente.',
  },
  {
    id: 'motivation',
    title: 'Por fim: o que te fez decidir tentar aprender programação agora?',
    subtext: 'Essa resposta vai aparecer de novo pra você, quando for importante lembrar.',
    options: [
      {
        value: 'financial',
        label: 'Preciso mudar de vida financeiramente.',
        icon: 'DollarSign',
      },
      {
        value: 'freedom',
        label: 'Quero mais liberdade — trabalhar de onde e quando eu quiser.',
        icon: 'Sun',
      },
      {
        value: 'prove_to_myself',
        label: 'Quero provar pra mim mesmo que eu consigo.',
        icon: 'ShieldCheck',
      },
      {
        value: 'love_creating',
        label: 'Simplesmente amo a ideia de criar coisas.',
        icon: 'Wand2',
      },
    ],
    getMicrocopy: () => 'Perfeito. Agora temos tudo que precisamos.',
  },
]
