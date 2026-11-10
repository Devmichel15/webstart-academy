type NotificationMessage = {
  id: string;
  title: string;
  body: string;
  context?: string;
};

export const NOTIFICATION_MESSAGES: Record<string, NotificationMessage[]> = {
  welcome: [
    { id: "welcome-first-steps", title: "Bem-vindo à WebStart!", body: "Escolhe uma trilha e começa pela primeira aula. Vamos ao teu ritmo." },
    { id: "welcome-start", title: "A tua próxima etapa começa aqui.", body: "Já tens tudo pronto para começar a aprender. Escolhe por onde queres começar." },
    { id: "welcome-hello", title: "Olá, {{name}}! Bora começar?", body: "Explora as trilhas e dá o primeiro passo na tua aprendizagem." },
  ],
  motivation: [
    { id: "motivation-step", title: "Bora dar mais um passo?", body: "Uma aula de cada vez. É assim que se constrói conhecimento. Continua!" },
    { id: "motivation-next-level", title: "O teu próximo nível começa aqui.", body: "Não precisas aprender tudo hoje. Só precisas continuar." },
    { id: "motivation-next-level-personal", title: "{{name}}, o teu próximo nível começa aqui.", body: "Não precisas aprender tudo hoje. Só precisas continuar." },
    { id: "motivation-keep-going", title: "Não pares agora!", body: "Cada aula que concluis é mais uma habilidade que ganhas." },
    { id: "motivation-keep-going-personal", title: "{{name}}, não pares agora!", body: "Cada aula que concluis é mais uma habilidade que ganhas." },
    { id: "motivation-peer-lesson", context: "lesson_completed", title: "{{actorName}} concluiu mais uma aula!", body: "{{name}}, bora continuar também?" },
    { id: "motivation-peer-lesson-2", context: "lesson_completed", title: "{{actorName}} avançou mais uma aula.", body: "Bora dar mais um passo nos teus estudos também?" },
  ],
  inactivity: [
    { id: "inactivity-disappeared", title: "Então, desapareceste? 👀", body: "A tua próxima aula continua à tua espera. Bora voltar aos estudos?" },
    { id: "inactivity-missed", title: "A WebStart já sente a tua falta!", body: "Volta e retoma de onde paraste. Ainda temos muito para aprender." },
    { id: "inactivity-return", title: "Que tal voltar à aprendizagem?", body: "O conhecimento que procuras continua à tua espera." },
  ],
  progress: [
    { id: "progress-evolving", title: "Estás a evoluir mesmo!", body: "Já concluíste mais uma aula. Continua nesse ritmo!" },
    { id: "progress-distance", title: "Olha só até onde já chegaste!", body: "Cada aula concluída é mais uma habilidade construída." },
    { id: "progress-achievement", title: "Mais uma conquista para a conta!", body: "O teu esforço está a dar frutos. Continua!" },
  ],
  learning: [
    { id: "learning-next-lesson", title: "Mais uma aula na conta!", body: "Bora aprender mais uma coisa hoje?" },
    { id: "learning-today", title: "O que vamos aprender hoje?", body: "A tua próxima aula está pronta. Só falta começares." },
    { id: "learning-evolve", title: "Aprender também é evoluir.", body: "Reserva uns minutos e continua a tua jornada." },
  ],
  completion: [
    { id: "completion-mission", title: "Missão cumprida! 🔥", body: "Mais uma etapa concluída. Estás cada vez mais perto de dominar esta área." },
    { id: "completion-stage", title: "Conseguiste! Mais uma etapa concluída.", body: "O teu progresso merece ser celebrado. Continua assim!" },
  ],
  reminders: [
    { id: "reminder-small-step", title: "Tens uns minutos para aprender?", body: "Uma aula curta já é um bom passo para manteres o ritmo." },
    { id: "reminder-pick-up", title: "A tua aprendizagem continua por aqui.", body: "Quando tiveres um momento, retoma de onde paraste." },
    { id: "reminder-lesson", title: "Há uma aula à tua espera.", body: "Abre a WebStart e continua no teu ritmo." },
  ],
  announcements: [
    { id: "announcement-new-content", title: "Chegou conteúdo novo!", body: "Há novidades para explorar na WebStart. Vê o que mudou." },
    { id: "announcement-update", title: "Temos novidades para ti.", body: "A WebStart está a crescer. Passa por lá para conhecer o novo conteúdo." },
    { id: "announcement-ready", title: "Já podes descobrir o que há de novo.", body: "O próximo conteúdo está pronto para explorares." },
  ],
  community: [
    { id: "community-new-post", context: "new_post", title: "Projeto novo na comunidade", body: "{{actorName}} publicou um projeto novo. Espreita!" },
    { id: "community-new-post-2", context: "new_post", title: "Há novidades na comunidade.", body: "{{actorName}} partilhou um projeto novo." },
    { id: "community-project-like", context: "project_liked", title: "Deram like ao teu projeto!", body: "{{actorName}} gostou de um projeto teu." },
    { id: "community-project-like-2", context: "project_liked", title: "O teu projeto recebeu um like.", body: "Foi {{actorName}}. Continua a partilhar o teu trabalho!" },
  ],
  comments: [
    { id: "comment-project", context: "project_commented", title: "Comentaram o teu projeto!", body: "{{actorName}} deixou um comentário num dos teus projetos." },
    { id: "comment-project-2", context: "project_commented", title: "Há um comentário novo.", body: "{{actorName}} passou pelo teu projeto e deixou uma mensagem." },
  ],
};

function renderMessage(message: NotificationMessage, variables: Record<string, unknown>) {
  const render = (text: string) =>
    text
      .replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
        const value = variables[key];
        return value === undefined || value === null ? "" : String(value).trim();
      })
      .replace(/\s+([,!.?;:])/g, "$1")
      .replace(/,\s*([!.?])/g, "$1")
      .replace(/^[,!.?;:\s]+/, "")
      .replace(/\s+/g, " ")
      .trim();

  return { ...message, title: render(message.title), body: render(message.body) };
}

export function selectNotificationMessage(
  category: string,
  {
    context,
    previousMessageId,
    previousMessage,
    variables = {},
    random = Math.random,
  }: {
    context?: string;
    previousMessageId?: string;
    previousMessage?: { title?: string; body?: string } | null;
    variables?: Record<string, unknown>;
    random?: () => number;
  } = {},
) {
  const categoryMessages = NOTIFICATION_MESSAGES[category];
  if (!categoryMessages) {
    throw new Error(`Categoria de notificação desconhecida: ${category}`);
  }
  const messages = categoryMessages.filter(
    (message) => message.context === context,
  );
  if (messages.length === 0) {
    throw new Error(`Não há mensagens para o contexto "${context}" em "${category}".`);
  }

  const alternatives = messages.filter(
    (message) =>
      message.id !== previousMessageId &&
      message.title !== previousMessage?.title,
  );
  const candidates = alternatives.length > 0 ? alternatives : messages;
  const sample = random();
  if (!Number.isFinite(sample)) {
    throw new Error("O seletor aleatório tem de devolver um número finito.");
  }
  const index = Math.min(
    Math.max(Math.floor(sample * candidates.length), 0),
    candidates.length - 1,
  );

  return { category, ...renderMessage(candidates[index], variables) };
}
