import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function useGsapReveal(deps = []) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return

    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
    )
  }, deps)

  return ref
}
