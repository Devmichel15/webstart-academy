import { getPublicProfileUrl } from './username.js'

export function buildShareText({ name, title, xpEarned, streak, level, badge, tagline }) {
  const lines = [
    '🔥 WebStart Achievement',
    '',
    `👨‍💻 ${name}`,
    '',
    `💡 ${title}`,
    '',
    xpEarned ? `⭐ XP ganho: +${xpEarned} XP` : null,
    streak ? `🔥 Streak: ${streak} dias` : null,
    badge ? `🏅 Badge: ${badge}` : null,
    level ? `📈 Nível: ${level}` : null,
    '',
    tagline ? `"${tagline}"` : null,
    '',
    '👉 webstart.app',
  ].filter(Boolean)

  return lines.join('\n')
}

export function shareViaWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
}

export function shareViaTikTok(text) {
  const url = `https://www.tiktok.com/upload?lang=pt-BR`
  navigator.clipboard?.writeText(text)
  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  return ok
}

export async function downloadShareCardImage(canvas) {
  const link = document.createElement('a')
  link.download = `webstart-achievement-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function renderShareCardToCanvas(data, width = 1080, height = 1920) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const mono = `'Cascadia Code','Fira Code','JetBrains Mono','Consolas',monospace`
  const sans = `'Segoe UI',system-ui,sans-serif`
  const BRAND = '#10b981'
  const BG = '#0a0a0a'
  const TEXT = '#e8e8e8'
  const MUTED = '#a0a0b0'
  const PAD = width * 0.075

  // ── Background ──
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, width, height)

  // ── Border ──
  const borderW = Math.round(width * 0.008)
  ctx.strokeStyle = BRAND
  ctx.lineWidth = Math.max(3, borderW)
  const b = Math.max(6, Math.round(width * 0.012))
  ctx.strokeRect(b, b, width - b * 2, height - b * 2)

  // ── Watermark ──
  ctx.save()
  ctx.fillStyle = 'rgba(16, 185, 129, 0.035)'
  ctx.font = `900 ${width * 0.12}px ${sans}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText('WebStart', width - PAD * 0.5, height - PAD * 0.5)
  ctx.restore()

  // ── Header: Logo mark ──
  const logoSize = Math.round(width * 0.035)
  const logoX = PAD
  const logoY = PAD * 0.8
  ctx.fillStyle = BRAND
  const lr = Math.round(logoSize * 0.15)
  roundRect(ctx, logoX, logoY, logoSize, logoSize, lr)
  ctx.fill()

  ctx.fillStyle = BG
  ctx.font = `900 ${Math.round(logoSize * 0.45)}px ${sans}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('WS', logoX + logoSize / 2, logoY + logoSize / 2)

  // ── Header: @username ──
  ctx.fillStyle = MUTED
  ctx.font = `600 ${Math.round(width * 0.022)}px ${mono}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(`@${data.name || 'aluno'}`, logoX + logoSize + PAD * 0.3, logoY + logoSize / 2)

  // ── Header: Level badge ──
  const lvlX = width - PAD
  const lvlText = `LVL ${data.level || 1}`
  ctx.font = `700 ${Math.round(width * 0.02)}px ${mono}`
  const lvlW = ctx.measureText(lvlText).width + PAD * 0.4
  const lvlH = Math.round(width * 0.045)
  const lvlY2 = logoY + (logoSize - lvlH) / 2
  ctx.strokeStyle = BRAND
  ctx.lineWidth = 2
  roundRect(ctx, lvlX - lvlW, lvlY2, lvlW, lvlH, 4)
  ctx.stroke()

  ctx.fillStyle = BRAND
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillText(lvlText, lvlX - PAD * 0.15, lvlY2 + lvlH / 2)

  // ── Divider ──
  const divY = logoY + logoSize + PAD * 0.5
  ctx.strokeStyle = BRAND
  ctx.globalAlpha = 0.4
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, divY)
  ctx.lineTo(width - PAD, divY)
  ctx.stroke()
  ctx.globalAlpha = 1

  // ── Title ──
  let contentY = divY + PAD * 0.6
  const titleSize = Math.round(width * 0.045)
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 ${titleSize}px ${mono}`
  const maxW = width - PAD * 2
  contentY = wrapText(ctx, data.title || 'Conquista!', PAD, contentY, maxW, titleSize * 1.5)

  // ── Tagline ──
  if (data.tagline) {
    contentY += PAD * 0.2
    ctx.fillStyle = MUTED
    ctx.font = `${Math.round(width * 0.024)}px ${mono}`
    contentY = wrapText(ctx, data.tagline, PAD, contentY, maxW, width * 0.038)
  }

  // ── Stats divider ──
  contentY += PAD * 0.3
  ctx.strokeStyle = BRAND
  ctx.globalAlpha = 0.25
  ctx.setLineDash([Math.round(width * 0.008), Math.round(width * 0.008)])
  ctx.beginPath()
  ctx.moveTo(PAD, contentY)
  ctx.lineTo(width - PAD, contentY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  contentY += PAD * 0.5

  // ── Stats ──
  const stats = [
    data.xpEarned ? { icon: '⭐', label: `+${data.xpEarned} XP` } : null,
    data.streak ? { icon: '🔥', label: `Streak: ${data.streak} dias` } : null,
    data.badge ? { icon: '🏆', label: `Badge: ${data.badge}` } : null,
  ].filter(Boolean)

  ctx.font = `700 ${Math.round(width * 0.028)}px ${mono}`
  const statH = width * 0.055
  const iconW = width * 0.045

  for (const stat of stats) {
    ctx.fillStyle = TEXT

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${Math.round(width * 0.032)}px ${sans}`
    ctx.fillText(stat.icon, PAD + iconW / 2, contentY + statH / 2)

    ctx.textAlign = 'left'
    ctx.font = `700 ${Math.round(width * 0.028)}px ${mono}`
    ctx.fillText(stat.label, PAD + iconW + PAD * 0.15, contentY + statH / 2)

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.06)'
    ctx.lineWidth = 1
    const lineY = contentY + statH
    ctx.beginPath()
    ctx.moveTo(PAD, lineY)
    ctx.lineTo(width - PAD, lineY)
    ctx.stroke()

    contentY = lineY
  }

  // ── Footer ──
  ctx.fillStyle = 'rgba(16, 185, 129, 0.35)'
  ctx.font = `700 ${Math.round(width * 0.02)}px ${mono}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('WEBSTART.APP', width / 2, height - PAD * 0.5)

  return canvas
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y)
      line = word
      y += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, y)
  return y + lineHeight * 0.5
}

export function buildProfileShareText(user) {
  return buildShareText({
    name: user.name,
    title: `Perfil WebStart — Nível ${user.level}`,
    streak: user.streak,
    level: user.level,
    badge: user.latestBadge,
    tagline: 'Dev em construção na WebStart Academy',
  }) + `\n\n${getPublicProfileUrl(user.username)}`
}
