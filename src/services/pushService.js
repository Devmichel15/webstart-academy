import { supabase } from "../lib/supabase.js";
import { toUserMessage } from "../utils/errors.js";
import {
  DEFAULT_PUSH_PREFERENCES,
  PUSH_CATEGORIES,
  buildPushPayload,
} from "../utils/pushPayload.js";

export const PUSH_SUBSCRIBE_FUNCTION = "push-subscribe";
export const PUSH_SEND_FUNCTION = "push-send";

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
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
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
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

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
