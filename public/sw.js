/// <reference types="vite/client" />
import {
  cleanupOutdatedCaches,
  matchPrecache,
  precacheAndRoute,
} from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, NetworkOnly } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim } from "workbox-core";

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const API_CACHE = "webstart-api-cache";
const STATIC_CACHE = "webstart-static-assets";
const NAV_TIMEOUT = 10_000;

const NON_SPA_NAVIGATION =
  /^\/(?:api|auth)(?:\/|$)/;
const AUTH_PAGE_NAVIGATION =
  /^\/(?:login|registro|recuperar-senha|onboarding|email-preferences)(?:\/|$)/;

registerRoute(
  ({ request }) => request.method !== "GET" && request.method !== "HEAD",
  new NetworkOnly(),
);

registerRoute(
  ({ url, request }) =>
    request.method === "GET" &&
    url.hostname.includes("supabase.co") &&
    url.pathname.startsWith("/auth/v1/"),
  new NetworkOnly(),
);

registerRoute(
  ({ url, request }) =>
    request.method === "GET" &&
    (url.pathname.startsWith("/api/") ||
      (url.hostname.includes("supabase.co") &&
        (url.pathname.startsWith("/rest/v1/") ||
          url.pathname.startsWith("/functions/v1/")))),
  new NetworkFirst({
    cacheName: API_CACHE,
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24,
      }),
    ],
  }),
);

registerRoute(
  ({ request }) =>
    ["script", "style", "image", "font"].includes(request.destination),
  new CacheFirst({ cacheName: STATIC_CACHE }),
);

async function handleNavigation({ request, url }) {
  if (NON_SPA_NAVIGATION.test(url.pathname)) {
    return fetch(request);
  }
  if (AUTH_PAGE_NAVIGATION.test(url.pathname)) {
    return fetch(request);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NAV_TIMEOUT);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response && (response.ok || response.status === 0)) {
      const contentType = response.headers.get("content-type") || "";
      if (response.status === 0 || contentType.includes("text/html")) {
        return response;
      }
    }
  } catch (error) {
    clearTimeout(timer);
    const timedOut = error && error.name === "AbortError";
    const fallback = timedOut
      ? await matchPrecache("/index.html")
      : await matchPrecache("/offline.html");
    if (fallback) return fallback;
  }

  return (await matchPrecache("/index.html")) || Response.error();
}

registerRoute(
  ({ request }) => request.mode === "navigate" && request.method === "GET",
  handleNavigation,
);

// ─── Notificações push ────────────────────────────────────────────────────
// A payload é JSON com { title, body, url, category, tag } (ver
// src/utils/pushPayload.js e supabase/functions/_shared/push.ts).
//
// O destino só pode ser um caminho interno: uma notificação não pode levar
// o utilizador para fora da aplicação.

const PUSH_ICON = "/icons/icon-192.png";

function isInternalPushPath(value) {
  if (typeof value !== "string") return false;
  const path = value.trim();
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/\\")) return false;
  if (path.includes("\\")) return false;
  for (const char of path) {
    const code = char.charCodeAt(0);
    if (code < 32 || code === 127) return false;
  }
  return true;
}

function pushTargetUrl(value) {
  return isInternalPushPath(value) ? value.trim() : "/";
}

self.addEventListener("push", (event) => {
  let payload;
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    try {
      payload = event.data ? { body: event.data.text() } : {};
    } catch {
      payload = {};
    }
  }
  if (!payload || typeof payload !== "object") payload = {};

  const title =
    typeof payload.title === "string" && payload.title.trim()
      ? payload.title.trim()
      : "WebStart Academy";
  const body = typeof payload.body === "string" ? payload.body : "";
  const url = pushTargetUrl(payload.url);
  const tag =
    typeof payload.tag === "string" && payload.tag.trim()
      ? payload.tag.trim()
      : "webstart";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: PUSH_ICON,
      badge: PUSH_ICON,
      tag,
      renotify: true,
      data: {
        url,
        category:
          typeof payload.category === "string" ? payload.category : "learning",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = pushTargetUrl(event.notification.data && event.notification.data.url);

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const existing = clientList.find((client) => {
        try {
          return new URL(client.url).pathname === url;
        } catch {
          return false;
        }
      });

      if (existing) {
        if (typeof existing.focus === "function") {
          await existing.focus();
        }
        if (typeof existing.navigate === "function") {
          try {
            await existing.navigate(url);
          } catch {
            /* o cliente pode não estar controlado: fica focado na mesma */
          }
        }
        return;
      }

      await self.clients.openWindow(url);
    })(),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        client.postMessage({ type: "PUSH_SUBSCRIPTION_CHANGED" });
      }
    })(),
  );
});