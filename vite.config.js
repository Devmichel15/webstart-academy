import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  server: {
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/landing" || req.url?.startsWith("/landing?")) {
          res.statusCode = 301;
          res.setHeader("Location", "/landing/");
          res.end();
          return;
        }
        next();
      });
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      "/api/hf": {
        target: "https://router.huggingface.co",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hf/, ""),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["offline.html", "icons/*.png"],
      manifest: {
        name: "Webstart",
        short_name: "Webstart",
        start_url: "/",
        display: "standalone",
        background_color: "#f8fffb",
        theme_color: "#10B981",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: "/offline.html",
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.includes("supabase.co") &&
              url.pathname.startsWith("/auth/v1/"),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ request }) =>
              request.method !== "GET" && request.method !== "HEAD",
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              (url.pathname.startsWith("/api/") ||
                (url.hostname.includes("supabase.co") &&
                  (url.pathname.startsWith("/rest/v1/") ||
                    url.pathname.startsWith("/functions/v1/")))),
            handler: "NetworkFirst",
            options: {
              cacheName: "webstart-api-cache",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: ({ request }) =>
              ["script", "style", "image", "font"].includes(
                request.destination,
              ),
            handler: "CacheFirst",
            options: { cacheName: "webstart-static-assets" },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        landing: fileURLToPath(
          new URL("./landing/index.html", import.meta.url),
        ),
      },
    },
  },
});
