import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNotificationContext } from "../../contexts/NotificationContext.jsx";

const DISMISS_KEY = "webstart:push-onboarding-dismissed";

export function PushOnboarding() {
  const { supported, permission, devices, busy, enable, error } =
    useNotificationContext();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!supported) return;
    if (permission !== "default") return;
    if (devices && devices.length > 0) return;
    if (location.pathname.includes("/aula") || location.pathname.includes("/video-aula")) return;

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() < dismissedUntil) return;

    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [supported, permission, devices, location.pathname]);

  useEffect(() => {
    if (permission === "granted" || permission === "denied") {
      const t = setTimeout(() => setVisible(false), 0);
      return () => clearTimeout(t);
    }
  }, [permission]);

  if (!visible) return null;

  const dismiss = (days = 7) => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 86400000));
    setVisible(false);
  };

  const handleEnable = async () => {
    const res = await enable();
    if (res) {
      setVisible(false);
    } else if (permission === "denied") {
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
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleEnable}
          disabled={busy}
          className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "A ativar..." : "Ativar notificações"}
        </button>
        <button
          type="button"
          onClick={() => dismiss(7)}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300"
        >
          Talvez mais tarde
        </button>
      </div>
      {permission === "denied" ? (
        <p className="mt-2 text-xs text-zinc-400">
          A permissão foi recusada. Podes alterá-la nas definições do browser.
        </p>
      ) : null}
    </div>
  );
}
