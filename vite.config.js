import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "");

  if (
    command === "build" &&
    (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY)
  ) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Configure both variables in the deployment environment.",
    );
  }

  return {
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
        strategies: "injectManifest",
        srcDir: "public",
        filename: "sw.js",
        includeAssets: ["offline.html", "icons/*.png"],
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
          globIgnores: ["**/*.map", "workbox-*.js"],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        },
        workbox: {
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        },
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
  };
});
