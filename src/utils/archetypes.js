export function getArchetype(experience, objective) {
  if (experience === 'never_coded') {
    if (objective === 'first_job' || objective === 'career_change') {
      return 'Recomeço Determinado'
    }
    return 'Explorador Curioso'
  }

  if (experience === 'tried_alone') {
    return 'Autodidata em Reconstrução'
  }

  if (experience === 'know_basics') {
    if (objective === 'first_job' || objective === 'career_change') {
      return 'Prestes a Decolar'
    }
    return 'Construtor em Formação'
  }

  if (experience === 'built_projects') {
    return 'Desenvolvedor em Evolução'
  }

  return 'Explorador Curioso'
}

export const ARCHETYPE_DESCRIPTIONS = {
  'Recomeço Determinado':
    'Você tomou a decisão consciente de mudar sua trajetória. Sua determinação em buscar uma nova oportunidade no mercado tech será o combustível principal.',
  'Explorador Curioso':
    'Sua grande vantagem é o fascínio pela criação. Você aprende melhor descobrindo como as coisas funcionam na prática, sem pressão externa.',
  'Autodidata em Reconstrução':
    'Você já provou que tem garra ao tentar sozinho. Agora, com a estrutura e método corretos, todo aquele esforço anterior vai se conectar.',
  'Prestes a Decolar':
    'Você já possui a base teórica e lógica. O próximo salto é transformar esse conhecimento em confiança e projetos de nível de mercado.',
  'Construtor em Formação':
    'Seu foco é criar coisas reais. Com a direção certa, você rapidamente transformará ideias em aplicações web completas e funcionais.',
  'Desenvolvedor em Evolução':
    'Você já cria projetos por conta própria. Seu caminho aqui é refinar boas práticas, dominar tecnologias modernas e alcançar excelência sênior.',
}
