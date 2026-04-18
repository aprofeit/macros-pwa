import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.FDC_API_KEY || env.VITE_FDC_API_KEY;

  /** Open Food Facts — always proxied in dev (browser cannot call OFF directly; CORS). */
  const offProxy = {
    "/api/off/search": {
      target: "https://world.openfoodfacts.org",
      changeOrigin: true,
      secure: true,
      rewrite: (path) => {
        const q = path.indexOf("?");
        const search = q >= 0 ? path.slice(q + 1) : "";
        const params = new URLSearchParams(search);
        const out = new URL("https://world.openfoodfacts.org/cgi/search.pl");
        out.searchParams.set("search_terms", params.get("q") ?? "");
        out.searchParams.set("json", "1");
        out.searchParams.set("page_size", params.get("pageSize") ?? "10");
        out.searchParams.set("fields", "product_name,nutriments,code,brands");
        return out.pathname + out.search;
      },
    },
  };

  const fdcProxy = apiKey
    ? {
        "/api/fdc/search": {
          target: "https://api.nal.usda.gov",
          changeOrigin: true,
          secure: true,
          rewrite: (p) => `/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`,
        },
        "/api/fdc/food": {
          target: "https://api.nal.usda.gov",
          changeOrigin: true,
          secure: true,
          rewrite: (p) => {
            const rest = p.replace(/^\/api\/fdc\/food/, "");
            return `/fdc/v1/food${rest}?api_key=${encodeURIComponent(apiKey)}`;
          },
        },
      }
    : {};

  return {
    define: {
      __FDC_PROXY_ACTIVE__: JSON.stringify(Boolean(apiKey)),
    },
    server: {
      host: true,
      allowedHosts: ["markv.local"],
      proxy: { ...offProxy, ...fdcProxy },
    },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/favicon.ico", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Macros",
        short_name: "Macros",
        description: "Fast macro tracker",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "icons/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Cache all static assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Runtime caching for Google Fonts (used in the app)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  };
});
