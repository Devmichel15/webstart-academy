import { useEffect } from "react";
import { useAuthContext } from "../../contexts/AuthContext.jsx";
import { useInstall } from "../../contexts/InstallContext.jsx";
import {
  platformLabel,
  syncAppInstalled,
} from "../../services/appInstallService.js";

/**
 * Ponte entre o estado local de instalação (InstallContext) e a conta
 * autenticada. Não desenha nada: só garante que o painel admin sabe quem já
 * tem a app instalada.
 *
 * `installed` fica verdadeiro quando a app arranca em standalone ou quando o
 * evento `appinstalled` dispara. Em qualquer um dos casos, se houver sessão,
 * a conta é marcada uma única vez por dispositivo.
 */
export function AppInstallTracker() {
  const { user } = useAuthContext();
  const { installed, device } = useInstall();

  useEffect(() => {
    if (!user?.id || !installed) return;

    let cancelled = false;
    syncAppInstalled(user.id, platformLabel(device)).catch((error) => {
      if (!cancelled) {
        console.warn(
          "[AppInstallTracker] não foi possível registar a instalação:",
          error?.message || error,
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, installed, device]);

  return null;
}
