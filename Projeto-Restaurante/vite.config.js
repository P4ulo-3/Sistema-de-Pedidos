import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      filename: "sw.js",
      devOptions: { enabled: true },
      workbox: {
        // add a runtime caching fetch handler to satisfy installability checks
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "runtime-cache",
            },
          },
        ],
        // ensure the SW takes control immediately and add runtime caching
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: "Pizzaria | Sistema de Gestão",
        short_name: "Pizzaria",
        description: "Sistema de gestão de pedidos - PWA",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#ef4444",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/icons/screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "/icons/screenshot-portrait.png",
            sizes: "720x1280",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
