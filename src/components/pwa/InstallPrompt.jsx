import { useState } from "react";
import { Download, Share2, X } from "lucide-react";
import {
  INSTALL_DISMISSED_KEY,
  useInstall,
} from "../../contexts/InstallContext.jsx";

export function InstallPrompt() {
  const { canPrompt, installed, isIos, install } = useInstall();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(INSTALL_DISMISSED_KEY) === "true",
  );

  const dismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    setDismissed(true);
  };

  if (dismissed || installed) return null;

  const showIosPrompt = isIos && !canPrompt;
  if (!canPrompt && !showIosPrompt) return null;

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
        <img
          src="/icons/icon-192.png"
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg"
        />
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
      {canPrompt && (
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