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