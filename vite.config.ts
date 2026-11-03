import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Tirtha",
        short_name: "Tirtha",
        description: "Light a lamp at every temple you visit across the Jyotirlingas, Shakti Peethas, Char Dham and Divya Desams.",
        lang: "en",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#0F0C0A",
        theme_color: "#0F0C0A",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // woff2 only: every browser that can install the app reads it, so the woff fallbacks need not be cached
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,json}"],
        // temple photos are cached as they are viewed rather than all at install
        globIgnores: ["photos/**"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/photos/"),
            handler: "CacheFirst",
            options: { cacheName: "temple-photos", expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 180 } },
          },
          {
            // map tiles the viewer has already looked at stay available offline
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\//,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
