#!/usr/bin/env node
/**
 * Post-processes the Expo web export (dist/) for GitHub Pages + iOS PWA:
 *  - injects the web-app manifest and the Apple "add to Home Screen" meta
 *    tags into index.html (Expo's Metro export has no template hook);
 *  - adds a 404.html fallback so hard-refreshes on Pages don't 404.
 *
 * Run after: npx expo export --platform web --output-dir dist
 */
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const indexPath = path.join(dist, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found — run "npx expo export --platform web --output-dir dist" first.');
  process.exit(1);
}

const BASE = '/lingue';
const inject = [
  `<title>Lingue</title>`,
  `<link rel="manifest" href="${BASE}/manifest.json">`,
  `<meta name="theme-color" content="#2563EB">`,
  `<meta name="apple-mobile-web-app-capable" content="yes">`,
  `<meta name="mobile-web-app-capable" content="yes">`,
  `<meta name="apple-mobile-web-app-status-bar-style" content="default">`,
  `<meta name="apple-mobile-web-app-title" content="Lingue">`,
  `<link rel="apple-touch-icon" href="${BASE}/icons/apple-touch-icon.png">`,
  `<meta name="description" content="Impara le lingue parlando con avatar AI 3D — lezioni progressive, conversazioni vocali e feedback dettagliato.">`,
].join('\n    ');

let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<title>.*?<\/title>/s, ''); // replace Expo's default title
html = html.replace('</head>', `    ${inject}\n  </head>`);
fs.writeFileSync(indexPath, html);

// SPA fallback for GitHub Pages.
fs.writeFileSync(path.join(dist, '404.html'), html);

console.log('PWA tags injected into dist/index.html (+404.html fallback).');
