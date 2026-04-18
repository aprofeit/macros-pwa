import sharp from 'sharp';
import { writeFileSync } from 'fs';

const SIZE = 512;

// Macro colors from the app
const BG = '#0d0d0d';
const LIME = '#c8e600';   // PRO/title color
const BLUE = '#4fc3f7';   // PRO bar
const ORANGE = '#ff8c42'; // FAT bar
const YELLOW = '#c8e600'; // CHO bar
const PURPLE = '#b06fd8'; // CAL bar

function makeSvg(size) {
  const r = size * 0.18; // corner radius
  const cx = size / 2;
  const cy = size / 2;

  // "M" letter metrics — drawn as a thick geometric M
  const mTop = size * 0.18;
  const mBot = size * 0.72;
  const mLeft = size * 0.14;
  const mRight = size * 1 - size * 0.14;
  const mMid = cx;
  const mPeak = size * 0.42;
  const stroke = size * 0.095;

  // 4 macro bar segments at bottom
  const barY = size * 0.80;
  const barH = size * 0.055;
  const barRadius = barH / 2;
  const barGap = size * 0.025;
  const totalBarsWidth = size * 0.62;
  const barW = (totalBarsWidth - barGap * 3) / 4;
  const barsX = (size - totalBarsWidth) / 2;

  const bars = [BLUE, ORANGE, YELLOW, PURPLE].map((color, i) => {
    const x = barsX + i * (barW + barGap);
    return `<rect x="${x}" y="${barY}" width="${barW}" height="${barH}" rx="${barRadius}" fill="${color}" opacity="0.9"/>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${r}" fill="${BG}"/>

  <!-- Bold M glyph -->
  <polyline
    points="${mLeft},${mBot} ${mLeft},${mTop} ${mMid},${mPeak} ${mRight},${mTop} ${mRight},${mBot}"
    fill="none"
    stroke="${LIME}"
    stroke-width="${stroke}"
    stroke-linejoin="miter"
    stroke-linecap="square"
  />

  <!-- Macro accent bars -->
  ${bars}
</svg>`;
}

async function writePng(svgStr, outPath, size) {
  const buf = Buffer.from(svgStr);
  await sharp(buf)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`wrote ${outPath}`);
}

const svg512 = makeSvg(512);
const svg192 = makeSvg(192);
const svg180 = makeSvg(180);

// Write SVG for inspection
writeFileSync('public/icons/icon.svg', svg512);

await writePng(svg512, 'public/icons/pwa-512.png', 512);
await writePng(svg192, 'public/icons/pwa-192.png', 192);
await writePng(svg180, 'public/icons/apple-touch-icon.png', 180);

// Favicon: 32x32 embedded in .ico via raw PNG
await writePng(makeSvg(32), '/tmp/favicon-32.png', 32);
// Copy as favicon (browsers accept PNG-in-ICO format for simple cases)
import { copyFileSync } from 'fs';
copyFileSync('/tmp/favicon-32.png', 'public/icons/favicon.ico');

console.log('Done.');
