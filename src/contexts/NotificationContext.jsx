import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthContext } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";
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
import {
  getNotificationInbox,
  markAllInboxNotificationsRead,
  markInboxNotificationRead,
} from "../services/notificationInboxService.js";
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
  const { isAuthenticated, user } = useAuthContext();
  const userId = user?.id;
  const { showSuccess } = useToast();
  const [supported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [preferences, setPreferences] = useState(DEFAULT_PUSH_PREFERENCES);
  const [devices, setDevices] = useState([]);
  const [inboxData, setInboxData] = useState({
    userId: null,
    notifications: [],
    unreadCount: 0,
  });
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState("");
  const inboxRequest = useRef(0);
  const inbox = useMemo(
    () => (inboxData.userId === userId ? inboxData.notifications : []),
    [inboxData.notifications, inboxData.userId, userId],
  );
  const unreadCount = inboxData.userId === userId ? inboxData.unreadCount : 0;
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

  const refreshInbox = useCallback(async () => {
    if (!isAuthenticated || !userId) return;
    const requestId = ++inboxRequest.current;
    setInboxLoading(true);
    setInboxError("");
    try {
      const { notifications, unreadCount: unread } =
        await getNotificationInbox();
      if (inboxRequest.current !== requestId) return;
      setInboxData({ userId, notifications, unreadCount: unread });
    } catch (err) {
      if (inboxRequest.current !== requestId) return;
      setInboxError(
        toUserMessage(err, "Não foi possível carregar as notificações."),
      );
    } finally {
      if (inboxRequest.current === requestId) setInboxLoading(false);
    }
  }, [isAuthenticated, userId]);

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
        const message = "Notificações associadas à tua conta com sucesso.";
        setNotice(message);
        showSuccess(message);
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
  }, [isAuthenticated, showSuccess]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return undefined;

    const initialRefresh = window.setTimeout(() => {
      void refreshInbox();
    }, 0);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshInbox();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const intervalId = window.setInterval(refreshWhenVisible, 60_000);

    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.clearInterval(intervalId);
      window.clearTimeout(initialRefresh);
    };
  }, [isAuthenticated, userId, refreshInbox]);

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

  const markNotificationRead = useCallback(async (notificationId) => {
    setInboxError("");
    try {
      await markInboxNotificationRead(notificationId);
      setInboxData((current) => {
        if (current.userId !== userId) return current;
        const wasUnread = current.notifications.some(
          (notification) =>
            notification.id === notificationId && !notification.is_read,
        );
        return {
          ...current,
          notifications: current.notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification,
          ),
          unreadCount: Math.max(0, current.unreadCount - (wasUnread ? 1 : 0)),
        };
      });
      return true;
    } catch (err) {
      setInboxError(
        toUserMessage(err, "Não foi possível marcar a notificação como lida."),
      );
      return false;
    }
  }, [userId]);

  const markAllNotificationsRead = useCallback(async () => {
    setInboxError("");
    try {
      await markAllInboxNotificationsRead();
      setInboxData((current) =>
        current.userId === userId
          ? {
              ...current,
              notifications: current.notifications.map((notification) => ({
                ...notification,
                is_read: true,
              })),
              unreadCount: 0,
            }
          : current,
      );
      return true;
    } catch (err) {
      setInboxError(
        toUserMessage(err, "Não foi possível marcar as notificações como lidas."),
      );
      return false;
    }
  }, [userId]);

  const value = useMemo(
    () => ({
      supported,
      permission,
      preferences,
      devices,
      inbox,
      unreadCount,
      inboxLoading,
      inboxError,
      busy,
      error,
      notice,
      enable,
      enableBeforeSignIn,
      disable,
      sendTest,
      updatePreferences,
      refresh,
      refreshInbox,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      supported,
      permission,
      preferences,
      devices,
      inbox,
      unreadCount,
      inboxLoading,
      inboxError,
      busy,
      error,
      notice,
      enable,
      enableBeforeSignIn,
      disable,
      sendTest,
      updatePreferences,
      refresh,
      refreshInbox,
      markNotificationRead,
      markAllNotificationsRead,
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
