import logoUrl from '../assets/logo-dark-bg.svg'

const columns = [
  {
    title: 'Navegar',
    links: [
      { label: 'O método WebStart', href: '#metodo' },
      { label: 'Trilhas e cursos', href: '#trilhas' },
      { label: 'Comunidade', href: '#comunidade' },
      { label: 'Sua jornada', href: '#jornada' },
      { label: 'Manifesto', href: '#manifesto' },
    ],
  },
  {
    title: 'Plataforma',
    links: [
      { label: 'Começar gratuitamente', href: '/registro' },
      { label: 'Entrar na minha conta', href: '/login' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t-3 border-border bg-surface">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <a href="#" className="flex items-center gap-2.5" aria-label="WebStart Academy — voltar ao topo">
            <img src={logoUrl} alt="" className="h-9 w-auto" width="36" height="37" loading="lazy" />
            <span className="text-lg font-black tracking-tight">
              WebStart<span className="text-accent">.</span>
            </span>
          </a>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-secondary">
            Uma comunidade gratuita para aprender programação, construir projetos reais e evoluir junto com outras
            pessoas da área de tecnologia.
          </p>
          <p className="mt-4 inline-flex rounded-lg border-2 border-border bg-elevated px-3 py-1.5 font-mono text-xs font-semibold text-accent">
            +90 membros · +12 trilhas · 100% gratuito
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-muted">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm font-semibold text-secondary transition-colors hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t-2 border-border">
        <div className="wrap flex flex-col items-center justify-between gap-2 py-6 text-xs font-semibold text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} WebStart Academy. Todos os direitos reservados.</p>
          <p>Feito pela comunidade, para a comunidade.</p>
        </div>
      </div>
    </footer>
  )
}
