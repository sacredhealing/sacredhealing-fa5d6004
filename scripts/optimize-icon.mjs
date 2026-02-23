#!/usr/bin/env node
/**
 * Generate icon-master-512.webp from icon-master.png (512x512, WebP) for in-app usage.
 * Keeps icon-master.png as-is for PWA. Run: npm run optimize-icon
 * Requires: sharp (devDependency)
 */
import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const inputPath = path.join(publicDir, 'icon-master.png');
const webpPath = path.join(publicDir, 'icon-master-512.webp');

if (!existsSync(inputPath)) {
  console.error('icon-master.png not found in public/');
  process.exit(1);
}

async function main() {
  const originalSize = readFileSync(inputPath).length;
  console.log('Source icon-master.png:', (originalSize / 1024).toFixed(1), 'KB');

  await sharp(inputPath)
    .resize(512, 512)
    .webp({ quality: 85 })
    .toFile(webpPath);

  const webpSize = readFileSync(webpPath).length;
  console.log('Created icon-master-512.webp (512x512):', (webpSize / 1024).toFixed(1), 'KB');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
