import { supabase } from "../lib/supabase.js";
import { toUserMessage } from "../utils/errors.js";
import {
  DEFAULT_PUSH_PREFERENCES,
  PUSH_CATEGORIES,
  buildPushPayload,
} from "../utils/pushPayload.js";

export const PUSH_SUBSCRIBE_FUNCTION = "push-subscribe";
export const PUSH_SEND_FUNCTION = "push-send";
export const PENDING_PUSH_SUBSCRIPTION_KEY = "webstart:pending-push-subscription";
const PENDING_PUSH_SUBSCRIPTION_TTL_MS = 24 * 60 * 60 * 1000;

export function getVapidPublicKey() {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  return typeof key === "string" ? key.trim() : "";
}

export function isPushSupported() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission() {
  if (!isPushSupported()) return "unsupported";
  try {
    return Notification.permission;
  } catch {
    return "unsupported";
  }
}

export function detectPlatform() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Macintosh|MacIntel/i.test(ua) && "ontouchend" in document) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function isIosWithoutInstalledApp() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIos =
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh|MacIntel/i.test(ua) && "ontouchend" in document);
  if (!isIos) return false;
  const standalone =
    typeof window !== "undefined" &&
    (window.navigator.standalone === true ||
      window.matchMedia?.("(display-mode: standalone)")?.matches === true);
  return !standalone;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function getServiceWorkerRegistration() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("Este navegador não suporta notificações push.");
  }
  if (import.meta.env.DEV) {
    return navigator.serviceWorker.register("/dev-sw.js?dev-sw", {
      type: "module",
    });
  }
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

function markPendingPushSubscription() {
  try {
    localStorage.setItem(
      PENDING_PUSH_SUBSCRIPTION_KEY,
      String(Date.now()),
    );
  } catch {
    throw new Error(
      "Não foi possível guardar a ativação neste dispositivo. Verifica as definições de armazenamento do browser.",
    );
  }
}

function readPendingPushSubscription() {
  if (typeof localStorage === "undefined") return false;
  try {
    const requestedAt = Number(
      localStorage.getItem(PENDING_PUSH_SUBSCRIPTION_KEY),
    );
    if (!Number.isFinite(requestedAt) || requestedAt <= 0) return false;
    if (Date.now() - requestedAt > PENDING_PUSH_SUBSCRIPTION_TTL_MS) {
      localStorage.removeItem(PENDING_PUSH_SUBSCRIPTION_KEY);
      return false;
    }
    return true;
  } catch {
    throw new Error(
      "Não foi possível verificar a ativação pendente das notificações neste dispositivo.",
    );
  }
}

function clearPendingPushSubscription() {
  try {
    localStorage.removeItem(PENDING_PUSH_SUBSCRIPTION_KEY);
  } catch {
    console.warn("[push] não foi possível limpar a ativação pendente.");
  }
}

export async function prepareNotificationsBeforeSignIn() {
  if (!isPushSupported()) {
    throw new Error("Este navegador não suporta notificações push.");
  }
  if (isIosWithoutInstalledApp()) {
    throw new Error(
      "No iPhone e iPad, instala a WebStart no ecrã principal para receberes notificações.",
    );
  }

  const vapidKey = getVapidPublicKey();
  if (!vapidKey) {
    throw new Error(
      "As notificações push ainda não estão configuradas nesta instalação.",
    );
  }

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Permissão de notificações não concedida. Reativa as notificações nas permissões do site e tenta de novo."
        : "Permissão de notificações não concedida.",
    );
  }

  const registration = await getServiceWorkerRegistration();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  markPendingPushSubscription();
  return { endpoint: subscription.endpoint };
}

export async function completePendingPushSubscription() {
  if (!readPendingPushSubscription()) return null;

  if (!isPushSupported() || Notification.permission !== "granted") {
    throw new Error(
      "A ativação pendente das notificações já não está disponível neste dispositivo. Ativa novamente nas definições.",
    );
  }

  const vapidKey = getVapidPublicKey();
  if (!vapidKey) {
    throw new Error(
      "As notificações push ainda não estão configuradas nesta instalação.",
    );
  }

  const registration = await getServiceWorkerRegistration();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  await invoke(PUSH_SUBSCRIBE_FUNCTION, {
    action: "subscribe",
    subscription: subscription.toJSON(),
    platform: detectPlatform(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  });
  await savePreferences({ push_enabled: true });
  clearPendingPushSubscription();

  return { platform: detectPlatform(), endpoint: subscription.endpoint };
}

async function functionErrorMessage(error, fallback) {
  const context = error?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = await context.json();
      if (body?.message) return body.message;
      if (body?.error) return body.error;
    } catch {
      /* ignore */
    }
  }
  return toUserMessage(error, fallback);
}

export async function getPreferences() {
  const { data, error } = await supabase.rpc("get_push_preferences");
  if (error) throw error;
  return { ...DEFAULT_PUSH_PREFERENCES, ...(data || {}) };
}

export async function savePreferences(patch) {
  const { data, error } = await supabase.rpc("upsert_push_preferences", {
    p_patch: patch,
  });
  if (error) throw error;
  return { ...DEFAULT_PUSH_PREFERENCES, ...(data || {}) };
}

export async function listDevices() {
  const { data, error } = await supabase.rpc("list_push_devices");
  if (error) throw error;
  return data || [];
}

async function invoke(functionName, body) {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) {
    throw new Error(
      await functionErrorMessage(
        error,
        "Não foi possível falar com o servidor de notificações.",
      ),
    );
  }
  return data;
}

export async function enableNotifications() {
  if (!isPushSupported()) {
    throw new Error("Este navegador não suporta notificações push.");
  }
  if (isIosWithoutInstalledApp()) {
    throw new Error(
      "No iPhone e iPad, instala a WebStart no ecrã principal para receberes notificações.",
    );
  }

  const vapidKey = getVapidPublicKey();
  if (!vapidKey) {
    throw new Error(
      "As notificações push ainda não estão configuradas nesta instalação.",
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Permissão de notificações não concedida. Reativa as notificações nas permissões do site e tenta de novo."
        : "Permissão de notificações não concedida.",
    );
  }

  const registration = await getServiceWorkerRegistration();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  await invoke(PUSH_SUBSCRIBE_FUNCTION, {
    action: "subscribe",
    subscription: subscription.toJSON(),
    platform: detectPlatform(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  });

  await savePreferences({ push_enabled: true });

  return { platform: detectPlatform(), endpoint: subscription.endpoint };
}

export async function disableNotifications() {
  if (isPushSupported()) {
    try {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await invoke(PUSH_SUBSCRIBE_FUNCTION, {
          action: "unsubscribe",
          endpoint,
        });
        await subscription.unsubscribe();
      }
    } catch (error) {
      console.warn("[push] unsubscribe local falhou:", error);
    }
  }

  await savePreferences({ push_enabled: false });
}

export async function sendTestNotification({
  title = "Teste de notificação",
  body = "Se recebeste isto, as notificações push estão a funcionar.",
  url = "/perfil",
  category = "learning",
} = {}) {
  if (!PUSH_CATEGORIES.includes(category)) {
    throw new Error("Categoria de notificação inválida.");
  }
  return invoke(PUSH_SEND_FUNCTION, buildPushPayload({ title, body, url, category }));
}

export async function resubscribeNotifications() {
  if (!isPushSupported()) return null;
  const vapidKey = getVapidPublicKey();
  if (!vapidKey) return null;

  const registration = await getServiceWorkerRegistration();
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe();
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  await invoke(PUSH_SUBSCRIBE_FUNCTION, {
    action: "subscribe",
    subscription: subscription.toJSON(),
    platform: detectPlatform(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  });

  return { endpoint: subscription.endpoint };
}

export function onSubscriptionChanged(handler) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }
  const listener = (event) => {
    if (event?.data?.type === "PUSH_SUBSCRIPTION_CHANGED") {
      handler();
    }
  };
  navigator.serviceWorker.addEventListener("message", listener);
  return () => navigator.serviceWorker.removeEventListener("message", listener);
}
