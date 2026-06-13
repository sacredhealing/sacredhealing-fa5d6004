import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// SQI 2050 — Performance-optimised Vite config
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), "");

  const supabaseUrlForClient =
    (fileEnv.VITE_SUPABASE_URL || "").trim() ||
    (fileEnv.SUPABASE_URL || "").trim() ||
    (process.env.VITE_SUPABASE_URL || "").trim() ||
    (process.env.SUPABASE_URL || "").trim() ||
    "";

  const supabasePublishableForClient =
    (fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim() ||
    (fileEnv.VITE_SUPABASE_ANON_KEY || "").trim() ||
    (fileEnv.SUPABASE_ANON_KEY || "").trim() ||
    (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim() ||
    (process.env.VITE_SUPABASE_ANON_KEY || "").trim() ||
    (process.env.SUPABASE_ANON_KEY || "").trim() ||
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
    // Target modern browsers — smaller, faster output
    target: "es2020",
    // Enable minification with esbuild (faster than terser, still very small)
    minify: "esbuild",
    // Raise chunk warning threshold (many large spiritual pages are expected)
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/ethers/, /node_modules/],
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
      output: {
        // Granular vendor splitting for maximum long-term caching
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Core React — always tiny, loaded first
            if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/react-router")) {
              return "vendor-react";
            }
            // Query
            if (id.includes("@tanstack")) return "vendor-query";
            // Radix UI
            if (id.includes("@radix-ui")) return "vendor-radix";
            // Charts — heavy, rarely needed on first load
            if (id.includes("recharts") || id.includes("d3")) return "vendor-charts";
            // Animation
            if (id.includes("framer-motion")) return "vendor-motion";
            // Crypto libs — very heavy, split out
            if (id.includes("ethers") || id.includes("@solana") || id.includes("buffer")) return "vendor-crypto";
            // i18n
            if (id.includes("i18next")) return "vendor-i18n";
            // Stripe
            if (id.includes("stripe")) return "vendor-stripe";
            // Supabase
            if (id.includes("@supabase")) return "vendor-supabase";
            // Lucide icons — keep separate (large)
            if (id.includes("lucide")) return "vendor-icons";
          }
        },
      },
    },
  },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Siddha Quantum Nexus",
        short_name: "Siddha Nexus",
        description: "Guided meditations, healing courses, and spiritual growth.",
        theme_color: "#050505",
        background_color: "#050505",
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
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        clientsClaim: true,
        skipWaiting: true,
        globIgnores: ["**/index.html", "index.html", "assets/**"],
        globPatterns: ["**/{icon-192x192,icon-512x512,favicon}.{png,ico}", "manifest.webmanifest"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-shell",
              networkTimeoutSeconds: 2,
              expiration: { maxEntries: 8, maxAgeSeconds: 5 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ sameOrigin, url }) =>
              sameOrigin && url.pathname.startsWith("/assets/"),
            handler: "CacheFirst",
            method: "GET",
            options: {
              cacheName: "assets-immutable",
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          // Cache Supabase API responses for fast re-renders
          {
            urlPattern: ({ url }) => url.hostname.includes("supabase.co") && url.pathname.startsWith("/rest/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          // Cache Google Fonts
          {
            urlPattern: ({ url }) => url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
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
    ...(supabaseUrlForClient
      ? { "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrlForClient) }
      : {}),
    ...(supabasePublishableForClient
      ? {
          "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
            supabasePublishableForClient,
          ),
        }
      : {}),
  },
};
});
