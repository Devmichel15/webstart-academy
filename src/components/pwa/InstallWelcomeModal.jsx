import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Maximize2,
  Share2,
  Smartphone,
  WifiOff,
  Zap,
} from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { useInstall } from "../../contexts/InstallContext.jsx";
import { useAuthContext } from "../../contexts/AuthContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import {
  clearRegistrationPending,
  hasBeenInvited,
  markInvited,
  readRegistrationPending,
  registrationPendingMatches,
} from "../../utils/installInvite.js";

const benefits = [
  {
    icon: Zap,
    title: "Acesso num toque",
    text: "O ícone da WebStart fica no ecrã inicial, ao lado das tuas outras apps.",
  },
  {
    icon: WifiOff,
    title: "Estuda sem ligação",
    text: "As aulas continuam disponíveis mesmo quando o Wi-Fi falha.",
  },
  {
    icon: Maximize2,
    title: "Sem distrações",
    text: "A app abre em ecrã inteiro, sem as barras do browser a roubar espaço.",
  },
];

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Convite de boas-vindas à instalação da app.
 *
 * Aparece depois de a conta ser criada (ver `src/utils/installInvite.js`) e
 * nunca bloqueia a plataforma: fechar, cancelar ou continuar no navegador leva
 * sempre ao mesmo sítio.
 */
export function InstallWelcomeModal() {
  const navigate = useNavigate();
  const { showSuccess, showInfo } = useToast();
  const { user, isAuthenticated } = useAuthContext();
  const {
    welcomeOpen,
    openWelcome,
    closeWelcome,
    dismissInstall,
    installed,
    dismissed,
    canPrompt,
    isIos,
    supports,
    graceElapsed,
    install,
  } = useInstall();

  const dialogRef = useRef(null);
  const primaryRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Todas as saídas do convite registam a recusa: o utilizador já foi
  // convidado e pode sempre instalar mais tarde em "/instalar-app". Sem isto,
  // o banner inferior voltava a aparecer logo a seguir ao modal.
  const handleDismiss = useCallback(() => {
    dismissInstall();
    closeWelcome();
    previousFocusRef.current?.focus?.();
  }, [dismissInstall, closeWelcome]);

  const handleInstall = useCallback(async () => {
    const result = await install();

    if (result.status === "accepted") {
      closeWelcome();
      showSuccess("WebStart instalada! Abre-a pelo ícone no teu ecrã.");
      return;
    }

    if (result.status === "dismissed") {
      // Recusa explícita no diálogo nativo: não voltamos a chazar.
      handleDismiss();
      showInfo("Sem problema — podes instalar a app mais tarde em “Instalar app”.");
      return;
    }

    // Não foi possível abrir o diálogo nativo: oferecemos a alternativa real.
    showInfo(
      "Este navegador não abre a instalação automaticamente. Vê o passo a passo em “Instalar app”.",
    );
  }, [install, handleDismiss, closeWelcome, showSuccess, showInfo]);

  // ─── Quando é que o convite aparece? ─────────────────────────────────────
  //
  // Só depois de a conta ser criada. O `Register.jsx` marca o registo como
  // pendente; aqui confirmamos que a conta autenticada é a mesma, que a app
  // ainda não está instalada e que o utilizador ainda não foi convidado.
  // A marca é consumida de imediato, por isso o convite não volta a abrir em
  // visitas seguintes.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const pending = readRegistrationPending();
    if (!pending) return;
    if (!registrationPendingMatches(pending, user)) return;

    clearRegistrationPending();

    if (installed || dismissed) return;
    if (hasBeenInvited(user.id)) return;

    markInvited(user.id);
    openWelcome();
  }, [isAuthenticated, user, installed, dismissed, openWelcome]);

  // Foco no botão principal quando o convite abre; devolve o foco a quem o
  // abriu quando fecha.
  useEffect(() => {
    if (!welcomeOpen) return undefined;

    previousFocusRef.current = document.activeElement;
    const focusTimer = window.setTimeout(() => {
      primaryRef.current?.focus?.();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleDismiss();
        return;
      }

      if (event.key !== "Tab") return;

      // Focus trap simples: o foco não sai do diálogo enquanto ele estiver aberto.
      const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [welcomeOpen, handleDismiss]);

  if (!welcomeOpen) return null;

  const showIosInstructions = isIos && !canPrompt;
  const manualGuideAvailable = !canPrompt;

  const primaryAction = () => {
    if (canPrompt) {
      return (
        <Button
          ref={primaryRef}
          size="lg"
          onClick={handleInstall}
          className="w-full"
        >
          <Download size={18} />
          Instalar WebStart
        </Button>
      );
    }

    if (showIosInstructions) {
      return (
        <Button
          ref={primaryRef}
          size="lg"
          variant="secondary"
          onClick={() => {
            closeWelcome();
            navigate("/instalar-app");
          }}
          className="w-full"
        >
          Ver passo a passo
          <ArrowRight size={18} />
        </Button>
      );
    }

    if (!supports || graceElapsed) {
      return (
        <Button
          ref={primaryRef}
          size="lg"
          variant="secondary"
          onClick={() => {
            closeWelcome();
            navigate("/instalar-app");
          }}
          className="w-full"
        >
          Ver passo a passo
          <ArrowRight size={18} />
        </Button>
      );
    }

    // O `beforeinstallprompt` ainda não chegou (o Chrome dá-nos o evento
    // alguns segundos depois do carregamento).
    return (
      <Button ref={primaryRef} size="lg" disabled className="w-full">
        A preparar a instalação…
      </Button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-canvas/85 p-4 backdrop-blur-md sm:items-center"
      onClick={handleDismiss}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-welcome-title"
        aria-describedby="install-welcome-description"
        className="brutal-card relative w-full max-w-md rounded-2xl p-6 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border-3 border-border-strong bg-accent-soft">
            <img
              src="/icons/icon-192.png"
              alt=""
              className="h-10 w-10 rounded-lg"
            />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-border-strong bg-surface px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
              <Smartphone size={13} />
              Nova app
            </span>
            <h2
              id="install-welcome-title"
              className="mt-2 text-xl font-black leading-tight text-primary sm:text-2xl"
            >
              Leva a WebStart contigo
            </h2>
          </div>
        </div>

        <p
          id="install-welcome-description"
          className="mt-4 text-sm leading-6 text-reading"
        >
          A conta já está criada. Instala a WebStart para teres as aulas sempre
          à mão — é grátis e não precisas da Play Store nem da App Store.
        </p>

        {showIosInstructions ? (
          <div className="mt-4 rounded-xl border-2 border-border-strong bg-accent-soft p-4">
            <p className="flex items-center gap-2 text-sm font-black text-primary">
              <Share2 size={17} aria-hidden="true" />
              No iPhone e no iPad
            </p>
            <ol className="mt-2 space-y-1.5 text-sm leading-6 text-reading">
              <li>1. Abre a WebStart no Safari.</li>
              <li>
                2. Toca em <Share2 size={14} className="inline-block" aria-hidden="true" />{" "}
                Partilhar.
              </li>
              <li>3. Escolhe “Adicionar ao ecrã principal”.</li>
            </ol>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <li key={benefit.title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-border-strong bg-accent text-white">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-primary">
                      {benefit.title}
                    </span>
                    <span className="block text-sm leading-6 text-reading">
                      {benefit.text}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {primaryAction()}

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg px-3 py-2 text-sm font-bold text-secondary hover:bg-surface-hover hover:text-primary"
          >
            Continuar no navegador
          </button>
        </div>

        {manualGuideAvailable && !showIosInstructions && (
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-secondary">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Se preferires instalar manualmente, o guia passo a passo está em{" "}
              <button
                type="button"
                onClick={() => {
                  closeWelcome();
                  navigate("/instalar-app");
                }}
                className="font-bold underline underline-offset-2 hover:text-primary"
              >
                Instalar app
              </button>
              .
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
