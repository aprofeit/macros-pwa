import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.FDC_API_KEY || env.VITE_FDC_API_KEY;

  return {
    server: {
      proxy: apiKey ? {
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
      } : undefined,
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
