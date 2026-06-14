/**
 * Gera assets estáticos comitados em public/:
 *  - og-image.png (1200x630) — texto convertido em <path> via opentype.js
 *    (zero dependência de fontconfig na rasterização)
 *  - apple-touch-icon.png (180x180) + ícones PWA a partir do favicon.svg
 *
 * Uso: npm run assets
 * Requer rede só na primeira execução (baixa o TTF do Archivo Black do
 * repositório oficial google/fonts para tools/fonts/).
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import opentype from 'opentype.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontsDir = path.join(root, 'tools', 'fonts');
const fontFile = path.join(fontsDir, 'ArchivoBlack-Regular.ttf');
const FONT_URL =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/archivoblack/ArchivoBlack-Regular.ttf';

const COLORS = {
  blue: '#002776',
  blueDeep: '#001a52',
  ink: '#0b1220',
  yellow: '#ffc400',
  white: '#ffffff',
  muted: '#b9c3db',
};

async function ensureFont() {
  try {
    await access(fontFile);
  } catch {
    console.log('Baixando Archivo Black (google/fonts)…');
    const res = await fetch(FONT_URL);
    if (!res.ok) throw new Error(`Falha ao baixar fonte: HTTP ${res.status}`);
    await mkdir(fontsDir, { recursive: true });
    await writeFile(fontFile, Buffer.from(await res.arrayBuffer()));
  }
  const buffer = await readFile(fontFile);
  return opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  );
}

/**
 * Texto → path SVG, glyph a glyph com advance manual (sem kerning).
 * O getPath() de string inteira do opentype 2.x injeta NaN em certos pares
 * via GPOS e o rasterizador descarta o resto do path.
 */
function textPath(font, text, x, y, size, fill) {
  let cx = x;
  const parts = [];
  const scale = size / font.unitsPerEm;
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    const d = glyph.getPath(cx, y, size).toPathData(2);
    if (d && !d.includes('NaN')) parts.push(d);
    cx += glyph.advanceWidth * scale;
  }
  return `<path d="${parts.join(' ')}" fill="${fill}"/>`;
}

function width(font, text, size) {
  const scale = size / font.unitsPerEm;
  let total = 0;
  for (const ch of text) total += font.charToGlyph(ch).advanceWidth * scale;
  return total;
}

/** Variante vazada (ghost): contorno do glyph, sem preenchimento */
function textPathGhost(font, text, x, y, size, stroke, strokeWidth) {
  let cx = x;
  const parts = [];
  const scale = size / font.unitsPerEm;
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    const d = glyph.getPath(cx, y, size).toPathData(2);
    if (d && !d.includes('NaN')) parts.push(d);
    cx += glyph.advanceWidth * scale;
  }
  return `<path d="${parts.join(' ')}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

function buildOgSvg(font) {
  const W = 1200;
  const H = 630;

  // Logo: marca (losango + sinal de mais) + wordmark
  const markX = 64;
  const markY = 56;
  const markSize = 52;
  const wordY = markY + markSize * 0.72;
  const word1 = 'Supletivo ';
  const word2 = 'Brasil';
  const wordSize = 30;
  const word1W = width(font, word1, wordSize);

  // Headline: "Indique." vazado → "Receba." sólido amarelo com swoosh
  const hSize = 100;
  const line1 = 'Indique.';
  const line2 = 'Receba.';
  const line1Y = 300;
  const line2Y = 416;
  const line2W = width(font, line2, hSize);

  // Subtítulo + chip
  const sub = 'Indique matrículas e receba por Pix toda semana';
  const subSize = 25;
  const chipText = 'R$ 100 por matrícula paga · sem vender nada';
  const chipSize = 28;
  const chipPadX = 32;
  const chipW = width(font, chipText, chipSize) + chipPadX * 2;
  const chipH = 70;
  const chipY = 512;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${COLORS.blue}"/>
      <stop offset="0.55" stop-color="${COLORS.blueDeep}"/>
      <stop offset="1" stop-color="${COLORS.ink}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- losangos decorativos -->
  <g fill="none" stroke="${COLORS.white}" stroke-opacity="0.06" stroke-width="3">
    <path d="M1060 -40 1420 320 1060 680 700 320Z"/>
    <path d="M1060 60 1320 320 1060 580 800 320Z"/>
  </g>
  <path d="M1060 160 1220 320 1060 480 900 320Z" fill="none" stroke="${COLORS.yellow}" stroke-opacity="0.35" stroke-width="4"/>
  <path d="M1060 250v140M990 320h140" stroke="${COLORS.yellow}" stroke-opacity="0.5" stroke-width="11" stroke-linecap="round"/>

  <!-- logo -->
  <g transform="translate(${markX} ${markY})">
    <path d="M${markSize / 2} 2 L${markSize - 2} ${markSize / 2} L${markSize / 2} ${markSize - 2} L2 ${markSize / 2}Z"
      fill="none" stroke="${COLORS.yellow}" stroke-width="4.4" stroke-linejoin="round"/>
    <path d="M${markSize / 2} ${markSize * 0.3}V${markSize * 0.7}M${markSize * 0.3} ${markSize / 2}H${markSize * 0.7}"
      fill="none" stroke="${COLORS.white}" stroke-width="4.6" stroke-linecap="round"/>
  </g>
  ${textPath(font, word1, markX + markSize + 18, wordY, wordSize, COLORS.white)}
  ${textPath(font, word2, markX + markSize + 18 + word1W, wordY, wordSize, COLORS.yellow)}
  <rect x="${markX + markSize + 18 + width(font, word1 + word2, wordSize) + 14}" y="${markY + 8}" width="118" height="30" rx="15" fill="${COLORS.yellow}"/>
  ${textPath(font, 'PROMOTOR', markX + markSize + 18 + width(font, word1 + word2, wordSize) + 26, markY + 29, 15, COLORS.ink)}

  <!-- headline: ghost (gesto) → sólido (resultado) -->
  ${textPathGhost(font, line1, 64, line1Y, hSize, 'rgba(255,255,255,0.9)', 2.6)}
  ${textPath(font, line2, 64, line2Y, hSize, COLORS.yellow)}
  <path d="M66 ${line2Y + 24} C ${64 + line2W * 0.3} ${line2Y + 14}, ${64 + line2W * 0.7} ${line2Y + 12}, ${64 + line2W} ${line2Y + 18}"
    fill="none" stroke="${COLORS.yellow}" stroke-width="8" stroke-linecap="round"/>

  <!-- subtítulo -->
  ${textPath(font, sub, 64, 470, subSize, COLORS.muted)}

  <!-- chip -->
  <rect x="64" y="${chipY}" width="${chipW}" height="${chipH}" rx="${chipH / 2}" fill="${COLORS.yellow}"/>
  ${textPath(font, chipText, 64 + chipPadX, chipY + chipH / 2 + chipSize * 0.36, chipSize, COLORS.ink)}
</svg>`;
}

/** ICO container com um PNG 32x32 dentro (válido desde o Vista) */
function pngToIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: ícone
  header.writeUInt16LE(1, 4); // 1 imagem
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // largura
  entry.writeUInt8(32, 1); // altura
  entry.writeUInt8(0, 2); // paleta
  entry.writeUInt8(0, 3); // reservado
  entry.writeUInt16LE(1, 4); // planos
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12); // offset (6 + 16)
  return Buffer.concat([header, entry, pngBuffer]);
}

async function main() {
  const font = await ensureFont();
  const publicDir = path.join(root, 'public');
  await mkdir(publicDir, { recursive: true });

  // OG image
  const svg = buildOgSvg(font);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(publicDir, 'og-image.png'));
  console.log('✓ public/og-image.png (1200x630)');

  // Ícones a partir do favicon.svg
  const favicon = await readFile(path.join(publicDir, 'favicon.svg'));
  for (const [size, name] of [
    [180, 'apple-touch-icon.png'],
    [192, 'icon-192.png'],
    [512, 'icon-512.png'],
  ]) {
    await sharp(favicon, { density: 300 }).resize(size, size).png().toFile(path.join(publicDir, name));
    console.log(`✓ public/${name} (${size}x${size})`);
  }

  // favicon.ico (PNG 32x32 embrulhado em ICO)
  const png32 = await sharp(favicon, { density: 300 }).resize(32, 32).png().toBuffer();
  await writeFile(path.join(publicDir, 'favicon.ico'), pngToIco(png32));
  console.log('✓ public/favicon.ico (32x32)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
