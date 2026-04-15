#!/usr/bin/env node
// Generates minimal placeholder PNG icons so the PWA manifest doesn't 404.
// Replace with real icons before sharing with anyone.
//
// Usage: node scripts/gen-placeholder-icons.js
// Requires: npm install canvas (optional — only needed to regenerate)

import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

function makeIcon(size, outPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#c8f542";
  ctx.font = `bold ${Math.floor(size * 0.45)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M", size / 2, size / 2);
  writeFileSync(outPath, canvas.toBuffer("image/png"));
  console.log(`✓ ${outPath}`);
}

makeIcon(192, join(outDir, "pwa-192.png"));
makeIcon(512, join(outDir, "pwa-512.png"));
makeIcon(180, join(outDir, "apple-touch-icon.png"));
