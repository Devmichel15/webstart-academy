const { selectNotificationMessage } = require('../services/notificationMessages')

function buildNewLessonEmail(
  user,
  courseName,
  lessonTitle,
  lessonId,
  message = selectNotificationMessage('learning'),
) {
  const firstName =
    typeof user.name === 'string' && user.name.trim()
      ? user.name.trim().split(/\s+/)[0]
      : ''
  const greeting = firstName ? `Olá, ${firstName}! ` : ''
  const appUrl = process.env.APP_URL || 'https://webstart-academy.web.app'
  const lessonUrl = lessonId ? `${appUrl}/aula/${lessonId}` : appUrl
  const unsubscribeUrl = user._unsubscribeUrl || `${appUrl}/email-preferences?uid=${user.uid || ''}`

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <div style="background: linear-gradient(135deg, #064e3b, #065f46); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${message.title}</h1>
        <p style="color: #a7f3d0; margin: 8px 0 0;">${greeting}${message.body}</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #64748b;">Na trilha</p>
        <p style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #064e3b;">${courseName}</p>

        <div style="background: white; border: 2px solid #064e3b; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Nova aula</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700;">${lessonTitle}</p>
        </div>

        <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
          Esta aula chegou agora à plataforma. Aproveita para aprender algo novo!
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${lessonUrl}"
           style="display: inline-block; background: #064e3b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
          Assistir Agora
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

module.exports = { buildNewLessonEmail }
