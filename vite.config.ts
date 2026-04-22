import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  /** Lovable/CI often inject GEMINI_API_KEY; local dev uses VITE_GEMINI_API_KEY in .env */
  const geminiApiKey =
    (process.env.VITE_GEMINI_API_KEY || "").trim() ||
    (process.env.GEMINI_API_KEY || "").trim() ||
    (fileEnv.VITE_GEMINI_API_KEY || "").trim() ||
    (fileEnv.GEMINI_API_KEY || "").trim() ||
    "";

  return {
  server: {
    host: "127.0.0.1",
    port: 8080,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
  optimizeDeps: {
    include: ["ethers", "@solana/web3.js", "buffer"],
  },
  build: {
    commonjsOptions: {
      include: [/ethers/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
          ],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'vendor-crypto': ['ethers'],
          'vendor-i18n': ['i18next', 'react-i18next'],
        },
      },
    },
  },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      // prompt + manual register in main.tsx (no auto-inject): avoids reload loops on Lovable
      // and never full-page reloads when a new SW is waiting.
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Siddha Quantum Nexus",
        short_name: "Siddha Nexus",
        description: "Guided meditations, healing courses, and spiritual growth.",
        theme_color: "#8A2BE2",
        background_color: "#030303",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        // Do not take over mid-session (was causing constant reloads with autoUpdate + reg.update polling).
        clientsClaim: false,
        skipWaiting: false,
        // Do not precache HTML: stale index.html pins old hashed JS chunks (users never see QA updates).
        globIgnores: ["**/index.html", "index.html"],
        // SPA offline: still serve app shell when network fails (filled after first online visit).
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-shell",
              networkTimeoutSeconds: 2,
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 5 * 60, // 5 min — pick up new deploys quickly when online
              },
              cacheableResponse: { statuses: [200] },
            },
          },
          // Lazy chunks under /assets/: prefer network so new route bundles load after deploy
          {
            urlPattern: ({ sameOrigin, url }) =>
              sameOrigin && url.pathname.startsWith("/assets/"),
            handler: "NetworkFirst",
            method: "GET",
            options: {
              cacheName: "assets-network-first",
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: path.resolve(__dirname, "node_modules/buffer"),
    },
  },
  define: {
    "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(geminiApiKey),
  },
};
});