import { Link } from "react-router-dom";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Send,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useNotificationContext } from "../../contexts/NotificationContext.jsx";
import { CATEGORY_LABELS, PUSH_CATEGORIES } from "../../utils/pushPayload.js";
import { isIosWithoutInstalledApp } from "../../services/pushService.js";

const CATEGORY_KEYS = {
  learning: "learning_enabled",
  streak: "streak_enabled",
  community: "community_enabled",
  comments: "comments_enabled",
  reminders: "reminders_enabled",
  study_activity: "study_activity_enabled",
};

const PERMISSION_LABEL = {
  granted: "Permissão concedida",
  denied: "Permissão negada",
  default: "Permissão por confirmar",
  unsupported: "Sem suporte",
};

function platformLabel(platform) {
  if (platform === "android") return "Android";
  if (platform === "ios") return "iOS";
  if (platform === "desktop") return "Computador";
  return "Dispositivo";
}

export function NotificationSettings() {
  const {
    supported,
    permission,
    preferences,
    devices,
    busy,
    error,
    notice,
    enable,
    disable,
    sendTest,
    updatePreferences,
  } = useNotificationContext();

  const enabled = Boolean(preferences?.push_enabled) && permission === "granted";
  const blocked = permission === "denied";
  const needsInstall = supported && isIosWithoutInstalledApp();

  if (!supported) {
    return (
      <section className="rounded-xl border-2 border-strong bg-surface p-6">
        <div className="flex items-center gap-2 text-primary">
          <ShieldAlert size={20} />
          <h2 className="text-base font-bold">Notificações push indisponíveis</h2>
        </div>
        <p className="mt-2 text-sm text-secondary">
          Este navegador não suporta notificações push. Usa Chrome, Edge,
          Firefox ou Safari (com a app instalada no iPhone/iPad) para as
          receberes.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border-2 border-strong bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-primary">
              Notificações push
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Recebe avisos no teu dispositivo — lembretes de estudo, respostas
              a comentários e novidades da comunidade. A permissão só é pedida
              quando decides ativar.
            </p>
          </div>
          <span className="shrink-0 rounded-full border-2 border-strong px-3 py-1 text-xs font-bold text-secondary">
            {PERMISSION_LABEL[permission] || "Permissão por confirmar"}
          </span>
        </div>

        {needsInstall && (
          <p className="mt-3 rounded-lg border-2 border-accent bg-accent-soft px-3 py-2 text-sm font-semibold text-primary">
            No iPhone e iPad só há notificações depois de instalares a WebStart
            no ecrã principal.{" "}
            <Link
              to="/instalar-app"
              className="font-black text-accent underline"
            >
              Ver como instalar
            </Link>
          </p>
        )}

        {blocked && (
          <p className="mt-3 rounded-lg border-2 border-strong bg-surface-hover px-3 py-2 text-sm font-semibold text-secondary">
            O browser bloqueou as notificações neste dispositivo. Reativa-as nas
            permissões do site (cadeado na barra de endereço) e volta a carregar
            em "Ativar notificações".
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {enabled ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={disable}
            >
              <BellOff size={16} /> Desativar neste dispositivo
            </Button>
          ) : (
            <Button type="button" disabled={busy} onClick={enable}>
              <Bell size={16} /> Ativar notificações
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !enabled}
            onClick={sendTest}
            title={
              enabled
                ? "Envia uma notificação para os teus dispositivos"
                : "Ativa primeiro as notificações"
            }
          >
            <Send size={16} /> Enviar notificação de teste
          </Button>
        </div>

        {notice && (
          <p
            role="status"
            className="mt-3 flex items-center gap-2 text-sm font-semibold text-accent"
          >
            <CheckCircle2 size={16} /> {notice}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>

      <div className="rounded-xl border-2 border-strong bg-surface p-5">
        <h3 className="text-sm font-bold text-primary">O que queres receber</h3>
        <p className="mt-1 text-sm text-secondary">
          Estas preferências pertencem à tua conta e aplicam-se a todos os
          teus dispositivos.
        </p>

        <div className="mt-4 space-y-3">
          {PUSH_CATEGORIES.map((category) => {
            const key = CATEGORY_KEYS[category];
            const checked = Boolean(preferences?.[key]);
            return (
              <label key={category} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={busy}
                  onChange={(event) =>
                    updatePreferences({ [key]: event.target.checked })
                  }
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <span className="text-sm">
                  <span className="block font-bold">
                    {CATEGORY_LABELS[category]}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border-2 border-strong bg-surface p-5">
        <h3 className="text-sm font-bold text-primary">
          Dispositivos registados
        </h3>
        {devices.length === 0 ? (
          <p className="mt-2 text-sm text-secondary">
            Ainda não há dispositivos registados. Ativa as notificações acima
            para o teu dispositivo aparecer aqui.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {devices.map((device) => (
              <li
                key={device.id}
                className="flex items-center gap-2 text-sm text-secondary"
              >
                <Smartphone size={16} className="shrink-0" />
                <span className="font-bold text-primary">
                  {platformLabel(device.platform)}
                </span>
                <span className="truncate">
                  {device.user_agent || "Dispositivo registado"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
