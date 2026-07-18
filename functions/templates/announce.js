function buildAnnounceEmail(user) {
  const firstName = (user.name || 'Aluno').split(' ')[0]
  const appUrl = process.env.APP_URL || 'https://webstart-academy.web.app'
  const unsubscribeUrl = user._unsubscribeUrl || `${appUrl}/email-preferences?uid=${user.uid || ''}`

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <div style="background: linear-gradient(135deg, #064e3b, #065f46); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Parabéns, ${firstName}!</h1>
        <p style="color: #a7f3d0; margin: 8px 0 0;">O módulo de CSS da plataforma está completo.</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 12px;">A trilha de <strong>CSS3</strong> da WebStart Academy está agora completa com todas as video-aulas disponiveis.</p>
        <p style="margin: 0 0 12px;">E há mais uma novidade: <strong>a partir de agora, todas as trilhas da WebStart passam a ser em formato video</strong>. Mais conteúdo, mais prático, mais facil de acompanhar.</p>
        <p style="margin: 0;">Continua a aprender — o proximo modulo está a espera de ti!</p>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${appUrl}"
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

module.exports = { buildAnnounceEmail }
