import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
  },
  optimizeDeps: {
    include: ["ethers"],
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
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));