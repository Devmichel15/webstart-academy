import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

const DISMISSED_KEY = "webstart-pwa-install-dismissed";

function isIosDevice() {
  return (
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1)
  );
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showIosPrompt, setShowIosPrompt] = useState(
    () => isIosDevice() && !isStandalone(),
  );
  const [dismissed, setDismissed] = useState(
    () => isStandalone() || localStorage.getItem(DISMISSED_KEY) === "true",
  );

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY) === "true")
      return undefined;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleAppInstalled = () => {
      setInstallEvent(null);
      setShowIosPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
    setInstallEvent(null);
    setShowIosPrompt(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  };

  if (dismissed || (!installEvent && !showIosPrompt)) return null;

  return (
    <aside className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-md border-3 border-primary bg-surface p-4 text-primary shadow-brutal md:inset-x-auto md:right-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar aviso de instalação"
        className="absolute right-2 top-2 p-1 text-secondary hover:text-primary"
      >
        <X size={18} />
      </button>
      <div className="flex items-start gap-3 pr-5">
        <img src="/pwa-192.svg" alt="" className="h-12 w-12 shrink-0" />
        <div>
          <p className="font-bold">Leva a Webstart contigo</p>
          {showIosPrompt ? (
            <p className="mt-1 text-sm text-reading">
              Toca em{" "}
              <Share2
                className="mx-1 inline-block"
                size={15}
                aria-hidden="true"
              />{" "}
              Partilhar {"->"} Adicionar ao Ecrã Principal.
            </p>
          ) : (
            <p className="mt-1 text-sm text-reading">
              Instala a app para aprender mesmo sem ligação.
            </p>
          )}
        </div>
      </div>
      {installEvent && (
        <button
          type="button"
          onClick={install}
          className="brutal-btn mt-3 flex w-full items-center justify-center gap-2 bg-accent px-3 py-2 font-bold text-white"
        >
          <Download size={17} />
          Instalar App
        </button>
      )}
    </aside>
  );
}
