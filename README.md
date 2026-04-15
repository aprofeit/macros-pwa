# macros-pwa

Fast personal macro tracker. PWA — installs to your iPhone home screen.

## Stack

- **Vite** — build tool
- **React 18** — UI
- **vite-plugin-pwa** — service worker + manifest generation
- **localStorage** — persistence, keyed by date (`macros:log:YYYY-MM-DD`)

## Local dev

```bash
npm install
npm run dev
```

## Deploy to Vercel

### Option A — CLI (fastest)

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel auto-detects Vite. Done.

### Option B — Git integration

1. Push to GitHub
2. Go to vercel.com → New Project → import your repo
3. Framework preset: **Vite** (auto-detected)
4. Deploy

No environment variables needed.

## Install on iPhone

1. Open your Vercel URL in **Safari** (must be Safari)
2. Tap the **Share** button
3. Tap **"Add to Home Screen"**
4. Tap **Add**

It installs as a standalone app — no browser chrome, full screen.

## Icons

Replace the placeholder files in `public/icons/` with real PNGs:

| File | Size | Used for |
|---|---|---|
| `pwa-192.png` | 192×192 | Android PWA |
| `pwa-512.png` | 512×512 | Android PWA splash / maskable |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `favicon.ico` | 32×32 | Browser tab |

Quick way to generate all sizes: [realfavicongenerator.net](https://realfavicongenerator.net)

## Data

All data lives in `localStorage`:

| Key | Contents |
|---|---|
| `macros:foods` | Your food DB (JSON array) |
| `macros:targets` | Daily macro targets |
| `macros:log:YYYY-MM-DD` | Log entries per day |

To export/back up: open the browser console and run:
```js
JSON.stringify({
  foods:   JSON.parse(localStorage.getItem('macros:foods')),
  targets: JSON.parse(localStorage.getItem('macros:targets')),
})
```
