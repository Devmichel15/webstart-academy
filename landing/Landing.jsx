import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { Hero } from './sections/Hero'
import { Problem } from './sections/Problem'
import { Solution } from './sections/Solution'
import { Trails } from './sections/Trails'
import { Gamification } from './sections/Gamification'
import { Projects } from './sections/Projects'
import { Community } from './sections/Community'
import { Networking } from './sections/Networking'
import { Proof } from './sections/Proof'
import { Journey } from './sections/Journey'
import { Manifesto } from './sections/Manifesto'
import { FinalCta } from './sections/FinalCta'

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-clip bg-canvas font-body text-primary antialiased">
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
  )
}
