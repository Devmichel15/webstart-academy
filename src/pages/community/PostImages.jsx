import { useState } from 'react'
import { projectImageUrl } from '../../services/projectImageService.js'
import { ImageLightbox } from './ImageLightbox.jsx'

const MAX_VISIBLE = 4

function gridClasses(count) {
  if (count === 1) return 'grid-cols-1'
  if (count === 3) return 'grid-cols-2 grid-rows-2'
  return 'grid-cols-2'
}

function cellClasses(count, index) {
  if (count === 1) return 'aspect-video'
  if (count === 3 && index === 0) return 'row-span-2 h-full'
  return 'aspect-square'
}

function PostImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
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
      <div className={`mb-3 grid gap-1 overflow-hidden rounded-2xl ${gridClasses(paths.length)}`}>
        {images.map((image, index) => (
          <button
            key={paths[index]}
            type="button"
            onClick={() => setLightboxIndex(index)}
            aria-label={`Ampliar ${image.alt}`}
            className={`group relative overflow-hidden bg-accent-soft ${cellClasses(paths.length, index)}`}
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
