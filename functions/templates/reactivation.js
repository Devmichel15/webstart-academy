function buildReactivationEmail(user, courseName, nextLessonId) {
  const firstName = (user.name || 'Aluno').split(' ')[0]
  const appUrl = process.env.APP_URL || 'https://webstart-academy.web.app'
  const lessonUrl = nextLessonId ? `${appUrl}/aula/${nextLessonId}` : appUrl
  const unsubscribeUrl = user._unsubscribeUrl || `${appUrl}/email-preferences?uid=${user.uid || ''}`

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <div style="background: linear-gradient(135deg, #064e3b, #065f46); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Olá, ${firstName}! 👋</h1>
        <p style="color: #a7f3d0; margin: 8px 0 0;">Estamos com saudades do teu progresso.</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 12px;">Estás na trilha <strong>${courseName}</strong> e tinhas um ótimo ritmo. Não pares agora!</p>
        <div style="display: flex; gap: 16px; margin: 16px 0;">
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 24px; font-weight: 900; color: #064e3b;">${user.xp || 0}</div>
            <div style="font-size: 12px; color: #64748b;">XP ganho</div>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 24px; font-weight: 900; color: #064e3b;">${user.streak || 0}</div>
            <div style="font-size: 12px; color: #64748b;">Dias seguidos</div>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 24px; font-weight: 900; color: #064e3b;">${user.completedLessons || 0}</div>
            <div style="font-size: 12px; color: #64748b;">Aulas</div>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${lessonUrl}"
           style="display: inline-block; background: #064e3b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
          Continuar a aprender →
        </a>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 12px;">
        WebStart Academy — Aprende desenvolvimento web do zero.
      </p>
      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 8px;">
        <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Cancelar subscrição de emails</a>
      </p>
    </body>
    </html>
  `
}

module.exports = { buildReactivationEmail }
