import { useState } from 'react'
import { projectImageUrl } from '../../services/projectImageService.js'
import { ImageLightbox } from './ImageLightbox.jsx'

const MAX_VISIBLE = 4

function gridClasses(count) {
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  if (count === 3) return 'grid-cols-2'
  return 'grid-cols-2'
}

function cellClasses(count, index) {
  if (count === 1) return 'aspect-[16/10] col-span-2'
  if (count === 3 && index === 2) return 'aspect-[2/1] col-span-2'
  return 'aspect-square'
}

function PostImage({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
    />
  )
}

export function PostImages({ imagePaths = [], title = '' }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const closeLightbox = () => setLightboxIndex(null)
  const navigateLightbox = (next) => setLightboxIndex(next)

  const paths = (imagePaths || []).filter(Boolean).slice(0, MAX_VISIBLE)
  if (paths.length === 0) return null

  const images = paths.map((path, index) => ({
    src: projectImageUrl(path),
    alt: title ? `${title} — imagem ${index + 1}` : `Imagem ${index + 1}`,
  }))

  return (
    <>
      <div className={`mb-3 grid gap-1 ${gridClasses(paths.length)}`}>
        {images.map((image, index) => (
          <button
            key={paths[index]}
            type="button"
            onClick={() => setLightboxIndex(index)}
            aria-label={`Ampliar ${image.alt}`}
            className={`group relative overflow-hidden rounded-xl border-2 border-strong bg-accent-soft ${cellClasses(paths.length, index)}`}
          >
            <PostImage src={image.src} alt={image.alt} />
            <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </>
  )
}
