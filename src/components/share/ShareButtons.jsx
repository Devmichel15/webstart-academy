import { useState } from 'react'
import { Copy, Download, MessageCircle, Music2 } from 'lucide-react'
import { Button } from '../ui/Button'
import {
  buildShareText,
  copyToClipboard,
  downloadShareCardImage,
  renderShareCardToCanvas,
  shareViaTikTok,
  shareViaWhatsApp,
} from '../../utils/shareUtils'
import { useToast } from '../../contexts/ToastContext'

export function ShareButtons({ shareData, showInstagramDownload = true, className = '' }) {
  const { showSuccess, showError } = useToast()
  const [copying, setCopying] = useState(false)

  const text = buildShareText(shareData)

  const handleWhatsApp = () => {
    shareViaWhatsApp(text)
  }

  const handleInstagram = () => {
    const canvas = renderShareCardToCanvas(shareData)
    downloadShareCardImage(canvas)
    showSuccess('Story baixado! Publique no Instagram.')
  }

  const handleTikTok = () => {
    shareViaTikTok(text)
    showSuccess('Texto copiado! Abra o TikTok para publicar.')
  }

  const handleCopy = async () => {
    setCopying(true)
    try {
      await copyToClipboard(text)
      showSuccess('Link copiado!')
    } catch {
      showError('Não foi possível copiar.')
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button variant="secondary" size="sm" onClick={handleWhatsApp} className="!border-green-600 !text-green-700 dark:!text-green-400">
        <MessageCircle size={16} />
        WhatsApp
      </Button>
      {showInstagramDownload && (
        <Button variant="secondary" size="sm" onClick={handleInstagram} className="!border-pink-600 !text-pink-700 dark:!text-pink-400">
          <Download size={16} />
          Instagram Story
        </Button>
      )}
      <Button variant="secondary" size="sm" onClick={handleTikTok} className="!border-zinc-800 !text-zinc-800 dark:!text-zinc-200">
        <Music2 size={16} />
        TikTok
      </Button>
      <Button variant="secondary" size="sm" onClick={handleCopy} disabled={copying}>
        <Copy size={16} />
        {copying ? 'Copiando...' : 'Copiar'}
      </Button>
    </div>
  )
}
