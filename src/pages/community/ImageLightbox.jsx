import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export function ImageLightbox({ images, index, onClose, onNavigate }) {
  const total = images.length
  const current = images[index] || null
  const hasPrev = index > 0
  const hasNext = index < total - 1

  useEffect(() => {
    if (!current) return undefined
    const handler = (event) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft' && hasPrev) onNavigate(index - 1)
      else if (event.key === 'ArrowRight' && hasNext) onNavigate(index + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current, hasPrev, hasNext, index, onClose, onNavigate])

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de imagem"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
      >
        <X size={22} />
      </button>

      <button
        type="button"
        aria-label="Imagem anterior"
        disabled={!hasPrev}
        onClick={(e) => { e.stopPropagation(); if (hasPrev) onNavigate(index - 1) }}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg border-2 border-white/30 bg-black/50 p-2 text-white hover:bg-black/70 disabled:opacity-30"
      >
        <ChevronLeft size={22} />
      </button>

      <img
        src={current.src}
        alt={current.alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] rounded-lg border-2 border-white/20 object-contain"
      />

      <button
        type="button"
        aria-label="Imagem seguinte"
        disabled={!hasNext}
        onClick={(e) => { e.stopPropagation(); if (hasNext) onNavigate(index + 1) }}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg border-2 border-white/30 bg-black/50 p-2 text-white hover:bg-black/70 disabled:opacity-30"
      >
        <ChevronRight size={22} />
      </button>

      {total > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border-2 border-white/20 bg-black/60 px-3 py-1 text-xs font-bold text-white">
          {index + 1} / {total}
        </p>
      )}
    </div>
  )
}
