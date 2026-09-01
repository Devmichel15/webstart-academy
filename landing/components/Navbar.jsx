import { useEffect, useState } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'
import logoUrl from '../assets/logo-dark-bg.svg'

const navLinks = [
  { label: 'Método', href: '#metodo' },
  { label: 'Trilhas', href: '#trilhas' },
  { label: 'Feed', href: '#comunidade' },
  { label: 'Manifesto', href: '#manifesto' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b-3 transition-colors duration-300 ${
        scrolled ? 'border-border bg-canvas/85 backdrop-blur-md' : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="wrap flex h-16 items-center justify-between gap-4" aria-label="Navegação principal">
        <a href="#" className="flex items-center gap-2.5" aria-label="WebStart Academy — início">
          <img src={logoUrl} alt="" className="h-9 w-auto" width="36" height="37" />
          <span className="text-lg font-black tracking-tight">
            WebStart<span className="text-accent">.</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-bold text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-bold text-primary transition-colors hover:text-accent"
          >
            Entrar
          </a>
          <a
            href="/registro"
            className="brutal-btn brutal-btn-solid inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
          >
            Começar gratuitamente
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-strong bg-surface text-primary lg:hidden"
          aria-expanded={open}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-t-2 border-border bg-canvas/95 backdrop-blur-md lg:hidden">
          <div className="wrap flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 font-bold text-primary transition-colors hover:bg-surface-hover"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t-2 border-border pt-4">
              <a
                href="/login"
                className="rounded-lg border-3 border-strong bg-surface px-4 py-3 text-center font-bold text-primary"
              >
                Entrar
              </a>
              <a
                href="/registro"
                className="rounded-lg border-3 border-brand-800 bg-brand-500 px-4 py-3 text-center font-bold text-white"
              >
                Começar gratuitamente
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
