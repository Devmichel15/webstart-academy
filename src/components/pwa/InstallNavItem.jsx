import { NavLink } from "react-router-dom";
import { useInstall } from "../../contexts/InstallContext.jsx";

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg border-3 px-3 py-2.5 text-sm font-bold transition-all ${
    isActive
      ? "border-strong bg-brand-500 text-white shadow-[3px_3px_0_0_#064e3b] dark:shadow-[3px_3px_0_0_#34d399]"
      : "border-transparent text-primary hover:border-strong hover:bg-surface-hover"
  }`;

export function InstallNavItem({ to, label, icon: Icon, onClick }) {
  const { canPrompt, install } = useInstall();

  if (canPrompt) {
    return (
      <button
        type="button"
        onClick={() => {
          onClick?.();
          install();
        }}
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

