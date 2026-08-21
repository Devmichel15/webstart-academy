import { Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { SEO } from '../components/seo/SEO'
import { Navbar } from '../../landing/components/Navbar'
import { Footer } from '../../landing/components/Footer'
import { Hero } from '../../landing/sections/Hero'
import { Problem } from '../../landing/sections/Problem'
import { Solution } from '../../landing/sections/Solution'
import { Trails } from '../../landing/sections/Trails'
import { Gamification } from '../../landing/sections/Gamification'
import { Projects } from '../../landing/sections/Projects'
import { Community } from '../../landing/sections/Community'
import { Networking } from '../../landing/sections/Networking'
import { Proof } from '../../landing/sections/Proof'
import { Journey } from '../../landing/sections/Journey'
import { Manifesto } from '../../landing/sections/Manifesto'
import { FinalCta } from '../../landing/sections/FinalCta'

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas" role="status" aria-live="polite">
      <Loader2 className="h-10 w-10 animate-spin text-brand-500" aria-hidden="true" />
      <span className="sr-only">Carregando WebStart Academy...</span>
    </div>
  )
}

function LandingView() {
  return (
    <>
      <SEO
        title="WebStart Academy — Aprenda Programação Gratuitamente"
        description="Aprenda programação gratuitamente, construa projetos, evolua suas habilidades e faça parte da comunidade WebStart."
        url="/"
        keywords="aprender programação, curso gratuito, html, css, javascript, comunidade dev, webstart academy"
      />
      <div className="ws-landing min-h-screen overflow-x-clip bg-canvas font-body text-primary antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:font-bold focus:text-white"
        >
          Pular para o conteúdo
        </a>
        <Navbar />
        <main id="conteudo">
          <Hero />
          <Problem />
          <Solution />
          <Trails />
          <Gamification />
          <Projects />
          <Community />
          <Networking />
          <Proof />
          <Journey />
          <Manifesto />
          <FinalCta />
        </main>
        <Footer />
      </div>
    </>
  )
}

export function HomeGate() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AuthLoading />
  }

  if (!user && location.pathname === '/') {
    return <LandingView />
  }

  return <Outlet />
}
