import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthContext } from "./AuthContext.jsx";
import {
  disableNotifications,
  enableNotifications,
  completePendingPushSubscription,
  getNotificationPermission,
  getPreferences,
  isPushSupported,
  listDevices,
  onSubscriptionChanged,
  prepareNotificationsBeforeSignIn,
  resubscribeNotifications,
  savePreferences,
  sendTestNotification,
} from "../services/pushService.js";
import { DEFAULT_PUSH_PREFERENCES } from "../utils/pushPayload.js";
import { toUserMessage } from "../utils/errors.js";

const NotificationContext = createContext(null);

/**
 * Estado das notificações push da conta.
 *
 * A permissão só é pedida nos métodos chamados por um clique explícito:
 * `enable()` na plataforma ou `enableBeforeSignIn()` no onboarding público.
 */
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuthContext();
  const [supported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [preferences, setPreferences] = useState(DEFAULT_PUSH_PREFERENCES);
  const [devices, setDevices] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const [prefs, list] = await Promise.all([getPreferences(), listDevices()]);
    setPreferences(prefs);
    setDevices(list);
    setPermission(getNotificationPermission());
    return { preferences: prefs, devices: list };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }
    let active = true;

    async function load() {
      try {
        const [prefs, list] = await Promise.all([
          getPreferences(),
          listDevices(),
        ]);
        if (!active) return;
        setPreferences(prefs);
        setDevices(list);
        setPermission(getNotificationPermission());

        const pendingSubscription = await completePendingPushSubscription();
        if (!active || !pendingSubscription) return;

        const [updatedPreferences, updatedDevices] = await Promise.all([
          getPreferences(),
          listDevices(),
        ]);
        if (!active) return;
        setPreferences(updatedPreferences);
        setDevices(updatedDevices);
        setPermission(getNotificationPermission());
        setNotice("Notificações ativadas neste dispositivo.");
      } catch (err) {
        if (!active) return;
        setError(
          toUserMessage(
            err,
            "Não foi possível carregar as preferências de notificações.",
          ),
        );
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // O Service Worker avisa quando a subscrição fica inválida (chaves VAPID
  // novas, expiração): Volta a subscrever e a registar o dispositivo.
  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }
    return onSubscriptionChanged(async () => {
      try {
        const prefs = await getPreferences();
        if (!prefs?.push_enabled) return;
        await resubscribeNotifications();
      } catch (err) {
        console.warn("[notifications] resubscribe falhou:", err);
      }
    });
  }, [isAuthenticated]);

  const run = useCallback(async (action, successMessage) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      try {
        await refresh();
      } catch (refreshError) {
        console.warn("[notifications] refresh falhou:", refreshError);
      }
      if (successMessage) setNotice(successMessage);
      return result;
    } catch (err) {
      setError(
        toUserMessage(err, "Não foi possível completar a operação."),
      );
      return null;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const enable = useCallback(
    () =>
      run(
        () => enableNotifications(),
        "Notificações ativadas neste dispositivo.",
      ),
    [run],
  );

  const enableBeforeSignIn = useCallback(async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await prepareNotificationsBeforeSignIn();
      setPermission(getNotificationPermission());
      setNotice(
        "Permissão guardada. Vamos associar as notificações à tua conta quando entrares.",
      );
      return result;
    } catch (err) {
      setError(
        toUserMessage(err, "Não foi possível ativar as notificações."),
      );
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(
    () =>
      run(
        () => disableNotifications(),
        "Notificações desativadas neste dispositivo.",
      ),
    [run],
  );

  const sendTest = useCallback(
    () =>
      run(
        () =>
          sendTestNotification({
            title: "Teste de notificação · WebStart",
            body: "Se recebeste isto, as notificações push estão a funcionar.",
            url: "/perfil",
            category: "learning",
          }),
        "Notificação de teste enviada. Vê-la no teu dispositivo.",
      ),
    [run],
  );

  const updatePreferences = useCallback(
    async (patch) => {
      setError("");
      try {
        const saved = await savePreferences(patch);
        setPreferences(saved);
        return saved;
      } catch (err) {
        setError(
          toUserMessage(err, "Não foi possível guardar as preferências."),
        );
        return null;
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      supported,
      permission,
      preferences,
      devices,
      busy,
      error,
      notice,
      enable,
      enableBeforeSignIn,
      disable,
      sendTest,
      updatePreferences,
      refresh,
    }),
    [
      supported,
      permission,
      preferences,
      devices,
      busy,
      error,
      notice,
      enable,
      enableBeforeSignIn,
      disable,
      sendTest,
      updatePreferences,
      refresh,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider",
    );
  }
  return context;
}
