import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Share2, X } from "lucide-react";
import { useInstall } from "../../contexts/InstallContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";

/**
 * Banner persistente de instalação.
 *
 * Aparece só quando o navegador consegue instalar a app com um gesto
 * (Android/Chrome/Edge) ou quando o utilizador está em iOS, onde a
 * instalação é manual. Nunca bloqueia a plataforma: fechar o banner regista a
 * recusa e o utilizador pode sempre voltar a instalar em "/instalar-app".
 */
export function InstallPrompt() {
  const navigate = useNavigate();
  const { showSuccess, showInfo } = useToast();
  const { canPrompt, installed, isIos, dismissed, dismissInstall, install } =
    useInstall();
  const [busy, setBusy] = useState(false);

  const handleInstall = async () => {
    setBusy(true);
    try {
      const result = await install();
      if (result.status === "accepted") {
        showSuccess("WebStart instalada! Abre-a pelo ícone no teu ecrã.");
        return;
      }
      if (result.status === "dismissed") {
        dismissInstall();
        showInfo("Sem problema — podes instalar a app mais tarde em “Instalar app”.");
        return;
      }
      showInfo(
        "Este navegador não abre a instalação automaticamente. Vê o passo a passo em “Instalar app”.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (dismissed || installed) return null;

  const showIosPrompt = isIos && !canPrompt;
  if (!canPrompt && !showIosPrompt) return null;

  return (
    <aside className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-md border-3 border-primary bg-surface p-4 text-primary shadow-brutal md:inset-x-auto md:right-6">
      <button
        type="button"
        onClick={dismissInstall}
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
          <p className="font-bold">Instalar a WebStart</p>
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
          onClick={handleInstall}
          disabled={busy}
          className="brutal-btn mt-3 flex w-full items-center justify-center gap-2 bg-accent px-3 py-2 font-bold text-white disabled:opacity-60"
        >
          <Download size={17} />
          Instalar App
        </button>
      )}
      {showIosPrompt && (
        <button
          type="button"
          onClick={() => {
            dismissInstall();
            navigate("/instalar-app");
          }}
          className="mt-3 w-full rounded-lg border-2 border-primary px-3 py-2 text-sm font-bold text-primary hover:bg-surface-hover"
        >
          Ver passo a passo
        </button>
      )}
    </aside>
  );
}
