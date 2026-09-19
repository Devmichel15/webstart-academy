import {
  CheckCircle2,
  Download,
  Globe,
  HelpCircle,
  Home,
  MoreVertical,
  Share2,
  Smartphone,
} from "lucide-react";
import { SEO } from "../components/seo/SEO.jsx";
import { Header } from "../components/layout/Header.jsx";
import { Card } from "../components/ui/Card.jsx";
import { useInstall } from "../contexts/InstallContext.jsx";

const androidSteps = [
  "Abre a Webstart no Chrome.",
  "Toca nos três pontos no canto superior direito.",
  'Escolhe "Instalar aplicação" ou "Adicionar ao ecrã principal".',
  'Confirma em "Instalar". O ícone aparece junto às tuas outras aplicações.',
];

const iosSteps = [
  "Abre a Webstart no Safari. Este passo não funciona dentro do WhatsApp ou Instagram.",
  "Toca no botão Partilhar: é o quadrado com uma seta para cima.",
  'Desliza para baixo e escolhe "Adicionar ao Ecrã Principal".',
  'Toca em "Adicionar". Depois, abre a Webstart pelo novo ícone.',
];

const computerSteps = [
  "Abre a Webstart no Chrome ou Edge.",
  "Procura o ícone de instalação na barra de endereço, ou abre o menu do navegador.",
  'Escolhe "Instalar Webstart" e confirma.',
];

function StepList({ steps }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={step} className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-strong bg-accent font-black text-white">
            {index + 1}
          </span>
          <span className="pt-1 text-sm leading-6 text-reading">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function InstallAction() {
  const { canPrompt, installed, isIos, supports, graceElapsed, install } =
    useInstall();

  const scrollToGuide = () => {
    document
      .getElementById("guia-manual")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (installed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-2xl bg-brand-500/10 px-5 py-3 font-black text-brand-700 dark:text-brand-300">
        <CheckCircle2 size={19} />
        App já instalada
      </span>
    );
  }

  if (canPrompt) {
    const handleInstall = () => {
      install();
    };
    return (
      <button
        type="button"
        onClick={handleInstall}
        className="brutal-btn inline-flex items-center justify-center gap-2 bg-accent px-5 py-3 font-black text-white"
      >
        <Download size={19} />
        Instalar agora
      </button>
    );
  }

  const fallbackMessage = isIos
    ? "No iPhone, a instalação é feita pelo Safari. Segue os passos manuais abaixo."
    : !supports
      ? "Este navegador não oferece instalação com um toque. Usa os passos manuais abaixo."
      : graceElapsed
        ? "Não foi possível abrir a janela de instalação automaticamente. Usa os passos manuais abaixo."
        : null;

  if (!fallbackMessage) {
    return (
      <button
        type="button"
        disabled
        className="brutal-btn inline-flex items-center justify-center gap-2 bg-accent px-5 py-3 font-black text-white opacity-60"
      >
        <Download size={19} />
        A preparar instalação...
      </button>
    );
  }

  return (
    <span className="flex flex-col items-start gap-3">
      <span className="text-sm font-semibold leading-6 text-secondary">
        {fallbackMessage}
      </span>
      <button
        type="button"
        onClick={scrollToGuide}
        className="brutal-btn inline-flex items-center justify-center gap-2 bg-accent px-5 py-3 font-black text-white"
      >
        <Download size={19} />
        Ver passos manuais
      </button>
    </span>
  );
}

export default function InstallApp() {
  return (
    <>
      <SEO
        title="Instalar a Webstart"
        description="Aprende a instalar a Webstart no telemóvel, tablet ou computador."
        url="/instalar-app"
      />
      <div className="mx-auto max-w-5xl">
        <Header
          title="Instalar a Webstart"
          subtitle="A Webstart fica no teu ecrã como uma aplicação normal. Não precisas de ir à Play Store ou App Store."
        />

        <section className="mb-8 border-3 border-strong bg-accent-soft p-5 shadow-brutal md:p-7">
          <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center border-3 border-strong bg-accent text-white">
                <Smartphone size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-primary">
                  Queres um atalho rápido?
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-reading">
                  No Android ou computador, este botão abre a janela de
                  instalação quando o teu navegador a disponibilizar. No iPhone,
                  segue os passos do Safari abaixo.
                </p>
              </div>
            </div>
            <InstallAction />
          </div>
        </section>

        <section
          id="guia-manual"
          className="mb-4 flex items-center gap-2 scroll-mt-24"
        >
          <Home size={21} className="text-accent" />
          <h2 className="text-xl font-black">Escolhe o teu aparelho</h2>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border-2 border-strong bg-brand-100 text-brand-800">
                <Smartphone size={22} />
              </div>
              <div>
                <h3 className="font-black">Android</h3>
                <p className="text-xs font-semibold text-secondary">Chrome</p>
              </div>
            </div>
            <StepList steps={androidSteps} />
            <div className="mt-5 flex items-start gap-2 border-t-2 border pt-4 text-xs leading-5 text-secondary">
              <MoreVertical size={17} className="mt-0.5 shrink-0" />
              <span>Procura o menu dos três pontos no topo da página.</span>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border-2 border-strong bg-brand-100 text-brand-800">
                <Share2 size={22} />
              </div>
              <div>
                <h3 className="font-black">iPhone ou iPad</h3>
                <p className="text-xs font-semibold text-secondary">Safari</p>
              </div>
            </div>
            <StepList steps={iosSteps} />
            <div className="mt-5 flex items-start gap-2 border-t-2 border pt-4 text-xs leading-5 text-secondary">
              <Share2 size={17} className="mt-0.5 shrink-0" />
              <span>O botão Partilhar fica normalmente na barra inferior.</span>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border-2 border-strong bg-brand-100 text-brand-800">
                <Globe size={22} />
              </div>
              <div>
                <h3 className="font-black">Computador</h3>
                <p className="text-xs font-semibold text-secondary">
                  Chrome ou Edge
                </p>
              </div>
            </div>
            <StepList steps={computerSteps} />
            <div className="mt-5 flex items-start gap-2 border-t-2 border pt-4 text-xs leading-5 text-secondary">
              <Download size={17} className="mt-0.5 shrink-0" />
              <span>
                O ícone de instalação pode aparecer no lado direito da barra de
                endereço.
              </span>
            </div>
          </Card>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <HelpCircle size={21} className="text-accent" />
              <h2 className="font-black">Não encontras a opção?</h2>
            </div>
            <ul className="space-y-2 text-sm leading-6 text-reading">
              <li>
                • Confirma que estás a abrir a Webstart no Chrome, Edge ou
                Safari.
              </li>
              <li>
                • No iPhone, usa o Safari e não o navegador dentro de outra
                aplicação.
              </li>
              <li>
                • Atualiza a página e tenta novamente com ligação à internet.
              </li>
            </ul>
          </Card>
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Home size={21} className="text-accent" />
              <h2 className="font-black">Como sei que deu certo?</h2>
            </div>
            <p className="text-sm leading-6 text-reading">
              Vais ver um ícone da Webstart no ecrã inicial ou no menu de
              aplicações. A partir daí, toca nesse ícone sempre que quiseres
              estudar.
            </p>
          </Card>
        </section>
      </div>
    </>
  );
}
