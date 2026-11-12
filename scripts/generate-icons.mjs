// Génère les icônes et l'écran de démarrage de Vybe à partir des logos de assets/brand/.
// Usage : npm run icons
//
// - icon.png                    icône iOS / principale (1024 px, fond noir, sans transparence)
// - android-icon-foreground.png premier plan de l'icône adaptative Android (logo dans la zone sûre)
// - android-icon-monochrome.png version monochrome (icônes à thème d'Android 13+)
// - splash-icon.png             mot « VYBE » pour l'écran de démarrage (fond transparent)
// - favicon.png                 version web (48 px)

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = (file) => readFileSync(join(root, 'assets/brand', file), 'utf8');
const output = (file) => join(root, 'assets/images', file);

// Couleur de fond de la charte (src/theme/tokens.ts : colors.background).
const BACKGROUND = '#0A0A0A';
// Zone sûre Android : le système n'affiche que le centre du premier plan, et seul un cercle
// de 66/108 de la largeur est garanti visible quel que soit le masque (rond, carré, goutte),
// soit un rayon de 313 px sur 1024. Le point du V le plus éloigné du centre est à 424 px :
// échelle maximale 313 / 424 ≈ 0,74. On prend 0,70 pour garder une petite marge.
const ANDROID_SCALE = 0.7;

const fontFiles = [
  join(root, 'node_modules/@expo-google-fonts/anton/400Regular/Anton_400Regular.ttf'),
];

// Dessine un SVG à la largeur voulue (avec la police Anton).
function rasterize(svg, width) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Anton' },
  }).render();
}

// PNG avec transparence (premiers plans Android, écran de démarrage, favicon).
function render(svg, width) {
  return rasterize(svg, width).asPng();
}

// PNG en RGB, sans canal de transparence : Apple refuse une icône d'App Store qui en contient un.
function renderOpaque(svg, width) {
  const { width: w, height: h, pixels } = rasterize(svg, width); // pixels : RGBA, 4 octets par pixel

  // Chaque ligne commence par un octet de filtre (0 = aucun), puis les pixels en RGB.
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const rowStart = y * (1 + w * 3);
    for (let x = 0; x < w; x++) {
      const from = (y * w + x) * 4;
      const to = rowStart + 1 + x * 3;
      raw[to] = pixels[from];
      raw[to + 1] = pixels[from + 1];
      raw[to + 2] = pixels[from + 2];
    }
  }

  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData));
    return Buffer.concat([length, typeAndData, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w, 0);
  header.writeUInt32BE(h, 4);
  header[8] = 8; // 8 bits par canal
  header[9] = 2; // type de couleur 2 = RGB (pas d'alpha)

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // signature PNG
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const mark = brand('logo-mark.svg');
// Contenu du logo sans la balise <svg> englobante, pour le recomposer.
const markInner = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const square = (content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${content}</svg>`;
const scaled = (content, scale) =>
  `<g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${content}</g>`;

// Icône principale : fond noir plein.
const icon = square(`<rect width="1024" height="1024" fill="${BACKGROUND}"/>${markInner}`);
writeFileSync(output('icon.png'), renderOpaque(icon, 1024));
writeFileSync(output('favicon.png'), render(icon, 48));

// Android : premier plan transparent (le fond est une couleur dans app.json).
writeFileSync(output('android-icon-foreground.png'), render(square(scaled(markInner, ANDROID_SCALE)), 1024));

// Android monochrome : même forme en blanc (seule la transparence compte).
const monochrome = markInner.replace('fill="#C6FF3D"', 'fill="#FFFFFF"');
writeFileSync(output('android-icon-monochrome.png'), render(square(scaled(monochrome, ANDROID_SCALE)), 1024));

// Écran de démarrage : mot « VYBE ».
writeFileSync(output('splash-icon.png'), render(brand('wordmark.svg'), 1200));

console.log('Icônes générées dans assets/images/.');
