import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clearInstallDismissal,
  isInstallDismissed,
  markInstallDismissed,
} from "../utils/installInvite.js";

const InstallContext = createContext(null);

const GRACE_MS = 6000;

/**
 * O `beforeinstallprompt` pode chegar antes de o React montar (o evento
 * dispara quando o service worker fica pronto). Capturá-lo ao nível do módulo
 * evita perdê-lo; os subscritores do provider recebem-no depois.
 */
let capturedPrompt = null;
const promptSubscribers = new Set();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    capturedPrompt = event;
    for (const subscriber of promptSubscribers) subscriber(event);
  });
}

function detectDevice() {
  const userAgent = window.navigator.userAgent || "";
  const uaData = window.navigator.userAgentData;
  const platform = uaData?.platform || window.navigator.platform || "";

  const ios =
    /iphone|ipad|ipod/i.test(userAgent) ||
    (/macintel|iphone|ipad/i.test(platform) &&
      window.navigator.maxTouchPoints > 1);

  const android =
    uaData?.mobile && /android/i.test(platform)
      ? true
      : /android/i.test(userAgent) || /android/i.test(platform);

  return {
    android,
    ios,
    desktop: !android && !ios,
  };
}

/**
 * A app está a correr instalada (standalone)?
 *
 * `display-mode` é a forma padronizada (Chrome/Edge/Android); no iOS o
 * `navigator.standalone` é o indicador oficial do "Adicionar ao ecrã
 * principal". Os dois são verificados — e `minimal-ui` também conta, porque o
 * iOS serve a app instalada com esse display-mode em algumas versões.
 */
function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator;
  if (nav.standalone === true) return true;
  const modes = ["standalone", "fullscreen", "minimal-ui"];
  return modes.some(
    (mode) => window.matchMedia?.(`(display-mode: ${mode})`)?.matches === true,
  );
}

function supportsBeforeInstallPrompt() {
  return (
    typeof window !== "undefined" && "onbeforeinstallprompt" in window
  );
}

export function InstallProvider({ children }) {
  const [device] = useState(() => detectDevice());
  const deferredPromptRef = useRef(capturedPrompt);
  const [deferredPrompt, setDeferredPrompt] = useState(() => capturedPrompt);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [graceElapsed, setGraceElapsed] = useState(false);
  const [dismissed, setDismissed] = useState(() => isInstallDismissed());
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    const handlePromptCaptured = (event) => {
      deferredPromptRef.current = event;
      setDeferredPrompt(event);
    };
    promptSubscribers.add(handlePromptCaptured);

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      capturedPrompt = null;
      setDeferredPrompt(null);
      setInstalled(true);
      // A app está instalada: o pedido já não faz sentido. Liberta a recusa
      // anterior para que uma futura desinstalação volte a poder convidar.
      clearInstallDismissal();
      setDismissed(false);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    const graceTimer = window.setTimeout(() => setGraceElapsed(true), GRACE_MS);

    // A app pode ser aberta já em modo standalone depois de instalada:
    // o `display-mode` só é verdade no momento em que a app arranca, por isso
    // também o ouvimos para atualizar o estado.
    const displayModeQueries = ["standalone", "fullscreen", "minimal-ui"]
      .map((mode) => window.matchMedia?.(`(display-mode: ${mode})`))
      .filter(Boolean);
    const handleDisplayModeChange = () => setInstalled(isStandalone());
    for (const query of displayModeQueries) {
      query.addEventListener?.("change", handleDisplayModeChange);
    }

    return () => {
      promptSubscribers.delete(handlePromptCaptured);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.clearTimeout(graceTimer);
      for (const query of displayModeQueries) {
        query.removeEventListener?.("change", handleDisplayModeChange);
      }
    };
  }, []);

  /**
   * Lança o diálogo nativo de instalação.
   *
   * Devolve sempre um resultado normalizado, para a UI nunca ficar à espera
   * de um `undefined`:
   *   - `{ status: "accepted" }`  → o utilizador aceitou instalar.
   *   - `{ status: "dismissed" }` → o utilizador fechou o diálogo.
   *   - `{ status: "unavailable" }` → não há evento guardado (o navegador só
   *     permite um diálogo por gesto, ou nunca o ofereceu).
   */
  const install = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return { status: "unavailable", platform: null };

    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      const status = choice?.outcome === "accepted" ? "accepted" : "dismissed";
      if (status === "accepted") setInstalled(true);
      return { status, platform: choice?.platform || null };
    } catch (error) {
      console.warn("[InstallContext] native install prompt failed:", error);
      return { status: "unavailable", platform: null };
    } finally {
      // O evento só pode ser usado uma vez: o navegador ignora os seguintes.
      deferredPromptRef.current = null;
      capturedPrompt = null;
      setDeferredPrompt(null);
    }
  }, []);

  /** O utilizador recusou o convite: não voltamos a chazar neste dispositivo. */
  const dismissInstall = useCallback(() => {
    markInstallDismissed();
    setDismissed(true);
    setWelcomeOpen(false);
  }, []);

  const openWelcome = useCallback(() => setWelcomeOpen(true), []);
  const closeWelcome = useCallback(() => setWelcomeOpen(false), []);

  const value = useMemo(
    () => ({
      deferredPrompt,
      installed,
      device,
      isIos: device.ios,
      supports: supportsBeforeInstallPrompt(),
      canPrompt: deferredPrompt !== null,
      graceElapsed,
      dismissed,
      welcomeOpen,
      openWelcome,
      closeWelcome,
      dismissInstall,
      install,
    }),
    [
      deferredPrompt,
      installed,
      device,
      graceElapsed,
      dismissed,
      welcomeOpen,
      openWelcome,
      closeWelcome,
      dismissInstall,
      install,
    ],
  );

  return (
    <InstallContext.Provider value={value}>{children}</InstallContext.Provider>
  );
}

export function useInstall() {
  const context = useContext(InstallContext);
  if (!context) {
    throw new Error("useInstall must be used inside <InstallProvider>");
  }
  return context;
}
