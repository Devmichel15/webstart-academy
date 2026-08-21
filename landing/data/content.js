export const stats = {
  members: 90,
  trails: 12,
  achievements: 12,
}

export const trails = [
  { id: 'fundamentos-web', title: 'Lógica de Programação', color: '#818cf8', status: 'available', devicon: null, lucideIcon: 'code' },
  { id: 'html', title: 'HTML5', color: '#F06539', status: 'available', devicon: 'devicon-html5-plain-wordmark' },
  { id: 'html-exercises', title: 'HTML • Exercícios em Vídeo', color: '#F06539', status: 'available', devicon: 'devicon-html5-plain', badge: 'Exercícios' },
  { id: 'css', title: 'CSS3', color: '#2196F3', status: 'available', devicon: 'devicon-css3-plain-wordmark' },
  { id: 'javascript', title: 'JavaScript Completo & Prático', color: '#F7DF1E', textDark: true, status: 'available', devicon: 'devicon-javascript-plain' },
  { id: 'php', title: 'PHP Moderno', color: '#9B9DD4', status: 'available', devicon: 'devicon-php-plain' },
  { id: 'git-github', title: 'Git & GitHub', color: '#F4725B', status: 'available', devicon: 'devicon-git-plain' },
  { id: 'react', title: 'React', color: '#90E0EF', textDark: true, status: 'soon', devicon: 'devicon-react-original' },
  { id: 'backend', title: 'Back-end com Node.js', color: '#4ADE80', textDark: true, status: 'soon', devicon: 'devicon-nodejs-plain' },
  { id: 'database', title: 'Banco de Dados', color: '#60A5FA', status: 'soon', devicon: 'devicon-postgresql-plain' },
  { id: 'apis', title: 'APIs REST', color: '#FF8A5C', status: 'soon', devicon: null, lucideIcon: 'link' },
  { id: 'deploy', title: 'Deploy & DevOps', color: '#60C4F0', status: 'soon', devicon: 'devicon-docker-plain' },
]

export const featuredAchievements = [
  { id: 'first-lesson', title: 'Primeiro Passo', description: 'Concluiu a primeira aula.', icon: 'sparkles', xpReward: 50 },
  { id: 'first-website', title: 'Primeiro Website', description: 'Completou o primeiro exercício prático.', icon: 'globe', xpReward: 100 },
  { id: 'list-master', title: 'Mestre das Listas', description: 'Dominou exercícios com listas HTML.', icon: 'list', xpReward: 75 },
  { id: 'project-builder', title: 'Construtor de Projetos', description: 'Concluiu um mini-projeto.', icon: 'hammer', xpReward: 150 },
  { id: 'xp-2000', title: 'Veterano', description: 'Acumulou 2000 XP.', icon: 'trophy', xpReward: 100 },
  { id: 'graduate', title: 'WebStart Graduate', description: 'Concluiu todos os módulos.', icon: 'award', xpReward: 500 },
]

export const totalAchievements = 12

export const xpTable = [
  { activity: 'Aula concluída', xp: 50 },
  { activity: 'Laboratório concluído', xp: 50 },
  { activity: 'Exercício concluído', xp: 120 },
  { activity: 'Mini-projeto concluído', xp: 300 },
  { activity: 'Módulo concluído', xp: 200 },
  { activity: 'Curso concluído', xp: 1000 },
]

export const streakBonuses = [
  { days: 3, bonus: '+25 XP' },
  { days: 7, bonus: '+50 XP' },
  { days: 14, bonus: '+75 XP' },
]

export const instructors = ['Matheus Battisti (Hora de Codar)', 'Carlos Uchoa (Horadev)']

export const journeySteps = [
  { step: '01', title: 'COMEÇAR', description: 'Crie sua conta gratuita em menos de um minuto. Sem cartão, sem burocracia.' },
  { step: '02', title: 'APRENDER', description: 'Siga trilhas estruturadas na ordem certa, com aulas completas e quizzes.' },
  { step: '03', title: 'PRATICAR', description: 'Resolva exercícios e escreva código de verdade no laboratório.' },
  { step: '04', title: 'CONSTRUIR', description: 'Entregue mini-projetos e o projeto final de cada trilha.' },
  { step: '05', title: 'COMPARTILHAR', description: 'Mostre conquistas no seu perfil público e celebre cada marco.' },
  { step: '06', title: 'EVOLUIR', description: 'Suba de nível, mantenha a streak e continue para as próximas trilhas.' },
]
