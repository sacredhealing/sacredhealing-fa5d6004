import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";

function pwaIconGenerator(): Plugin {
  let ran = false;

  const generate = async () => {
    if (ran) return;
    ran = true;

    const publicDir = path.resolve(__dirname, "public");
    const sourceCandidates = [
      path.join(publicDir, "icon-master.png"),
      path.join(publicDir, "icon-512x512.png"),
      path.join(publicDir, "icon-192x192.png"),
    ];

    const sourcePath = sourceCandidates.find((p) => existsSync(p));
    if (!sourcePath) return;

    const jimpMod: any = await import("jimp");
    const Jimp = jimpMod?.default ?? jimpMod?.Jimp;
    if (!Jimp?.read) return;

    const img = await Jimp.read(sourcePath);

    // Ensure perfect square by center-cropping before resizing
    const width = img.bitmap?.width ?? 0;
    const height = img.bitmap?.height ?? 0;
    const size = Math.max(1, Math.min(width, height));
    const x = Math.floor((width - size) / 2);
    const y = Math.floor((height - size) / 2);

    // Jimp supports crop(x, y, w, h)
    const square = img.clone().crop(x, y, size, size);

    const icon192 = square.clone().resize(192, 192);
    const icon512 = square.clone().resize(512, 512);

    const buf192 = await icon192.getBufferAsync("image/png");
    const buf512 = await icon512.getBufferAsync("image/png");

    await fs.writeFile(path.join(publicDir, "icon-192x192.png"), buf192);
    await fs.writeFile(path.join(publicDir, "icon-512x512.png"), buf512);
  };

  return {
    name: "pwa-icon-generator",
    configureServer() {
      // Best-effort: keep preview icons correct too.
      void generate();
    },
    async buildStart() {
      await generate();
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    tailwindcss(),
    pwaIconGenerator(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
