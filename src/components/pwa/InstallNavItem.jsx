import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useInstall } from "../../contexts/InstallContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg border-3 px-3 py-2.5 text-sm font-bold transition-all ${
    isActive
      ? "border-strong bg-brand-500 text-white shadow-[3px_3px_0_0_#064e3b] dark:shadow-[3px_3px_0_0_#34d399]"
      : "border-transparent text-primary hover:border-strong hover:bg-surface-hover"
  }`;

/**
 * Item de navegação "Instalar app".
 *
 * Quando o browser consegue abrir o diálogo nativo, o item instala logo. Se o
 * utilizador recusar o diálogo (ou se o browser não o oferecer), caímos no
 * guia manual — nunca um botão sem efeito.
 */
export function InstallNavItem({ to, label, icon: Icon, onClick }) {
  const navigate = useNavigate();
  const { showInfo, showSuccess } = useToast();
  const { canPrompt, installed, install } = useInstall();
  const [busy, setBusy] = useState(false);

  const handleInstall = async () => {
    onClick?.();
    if (installed) return;

    setBusy(true);
    try {
      const result = await install();
      if (result.status === "accepted") {
        showSuccess("WebStart instalada! Abre-a pelo ícone no teu ecrã.");
        return;
      }
      if (result.status === "dismissed") {
        showInfo("Podes sempre instalar a app depois em “Instalar app”.");
        return;
      }
      navigate(to);
    } finally {
      setBusy(false);
    }
  };

  if (canPrompt && !installed) {
    return (
      <button
        type="button"
        onClick={handleInstall}
        disabled={busy}
        className={linkClasses({ isActive: false })}
      >
        <Icon size={18} />
        {label}
      </button>
    );
  }

  return (
    <NavLink to={to} end={to === "/"} onClick={onClick} className={linkClasses}>
      <Icon size={18} />
      {label}
    </NavLink>
  );
}
