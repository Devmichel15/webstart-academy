import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNotificationContext } from "../../contexts/NotificationContext.jsx";
import { useAuthContext } from "../../contexts/AuthContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";

const DISMISS_KEY = "webstart:push-onboarding-dismissed";

export function PushOnboarding({
  open = false,
  beforeSignIn = false,
  onClose,
} = {}) {
  const {
    supported,
    permission,
    devices,
    busy,
    enable,
    enableBeforeSignIn,
    error,
  } =
    useNotificationContext();
  const { isAuthenticated } = useAuthContext();
  const { showSuccess } = useToast();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const controlled = typeof onClose === "function";

  useEffect(() => {
    if (controlled) return;
    if (!isAuthenticated || !supported || permission !== "default") return;
    if (devices && devices.length > 0) return;
    if (
      ["/onboarding", "/login", "/registro", "/avaliacao-perfil", "/recuperar-senha", "/email-preferences"].includes(
        location.pathname,
      ) ||
      location.pathname.startsWith("/u/")
    ) {
      return;
    }

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() < dismissedUntil) return;

    const t = setTimeout(() => setVisible(true), 250);
    return () => clearTimeout(t);
  }, [
    controlled,
    open,
    isAuthenticated,
    supported,
    permission,
    devices,
    location.pathname,
  ]);

  useEffect(() => {
    if (!controlled && (permission === "granted" || permission === "denied")) {
      const t = setTimeout(() => setVisible(false), 0);
      return () => clearTimeout(t);
    }
  }, [controlled, permission]);

  if (!(controlled ? open : visible)) return null;

  const dismiss = (days = 7) => {
    if (controlled) {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + days * 86400000),
      );
      onClose();
      return;
    }
    localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 86400000));
    setVisible(false);
  };

  const handleEnable = async () => {
    const res = beforeSignIn && !isAuthenticated
      ? await enableBeforeSignIn()
      : await enable();
    if (res) {
      if (controlled) onClose();
      else setVisible(false);
      showSuccess(
        beforeSignIn && !isAuthenticated
          ? "Permissão guardada. As notificações serão associadas à tua conta quando entrares."
          : "Notificações ativadas com sucesso neste dispositivo.",
      );
    } else if (permission === "denied" && !controlled) {
      dismiss(30);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed bottom-4 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 rounded-2xl border border-white/10 bg-zinc-900/95 p-4 text-white shadow-2xl backdrop-blur"
    >
      <p className="text-sm font-semibold">Ativa as notificações</p>
      <p className="mt-1 text-xs text-zinc-300">
        Recebe lembretes para continuar os teus cursos, conquistas e novidades da
        comunidade. Só pedimos permissão quando clicares em ativar.
      </p>
      {controlled && !isAuthenticated ? (
        <p className="mt-2 text-xs text-zinc-300">
          Se ativares agora, associamos as notificações à tua conta quando
          terminares o registo.
        </p>
      ) : null}
      {!supported ? (
        <p className="mt-2 text-xs text-zinc-300">
          Este browser não suporta notificações push. Podes continuar e ativá-las
          mais tarde noutro dispositivo.
        </p>
      ) : null}
      {permission === "denied" ? (
        <p className="mt-2 text-xs text-zinc-400">
          A permissão foi recusada. Podes alterá-la nas definições do browser.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        {supported && permission !== "denied" ? (
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "A ativar..." : "Ativar notificações"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => dismiss(7)}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300"
        >
          Talvez mais tarde
        </button>
      </div>
    </div>
  );
}
