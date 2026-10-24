import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const assets = path.join(root, 'assets');
const store = path.join(root, 'store');
await fs.mkdir(assets, { recursive: true });
await fs.mkdir(store, { recursive: true });

const cPath = 'M706 334 C660 276 599 246 529 246 C388 246 300 352 300 512 C300 672 388 778 529 778 C599 778 660 748 706 690';

const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
<rect width="1024" height="1024" fill="#111318"/>
<path d="${cPath}" fill="none" stroke="#ffffff" stroke-width="112" stroke-linecap="round"/>
</svg>`;

const adaptiveSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
<rect x="196" y="196" width="632" height="632" rx="164" fill="#111318"/>
<path d="${cPath}" fill="none" stroke="#ffffff" stroke-width="112" stroke-linecap="round"/>
</svg>`;

const monoSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
<path d="${cPath}" fill="none" stroke="#ffffff" stroke-width="112" stroke-linecap="round"/>
</svg>`;

const featureSvg = `<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
<rect width="1024" height="500" fill="#ffffff"/>
<rect x="60" y="58" width="190" height="190" rx="48" fill="#111318"/>
<path d="M199 113 C181 91 157 80 130 80 C75 80 40 122 40 185 C40 248 75 290 130 290 C157 290 181 279 199 257" transform="translate(41 -30) scale(.75)" fill="none" stroke="#ffffff" stroke-width="48" stroke-linecap="round"/>
<text x="60" y="338" font-family="Arial, Helvetica, sans-serif" font-size="74" font-weight="700" fill="#171925">CIA Campo</text>
<text x="60" y="405" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#707487">Execução em campo conectada ao CIA</text>
<rect x="720" y="62" width="244" height="376" rx="72" fill="#EEF0FF"/>
<rect x="766" y="108" width="152" height="284" rx="50" fill="#5965D8"/>
<circle cx="842" cy="180" r="32" fill="#ffffff" opacity=".96"/>
<rect x="800" y="240" width="84" height="12" rx="6" fill="#ffffff" opacity=".8"/>
<rect x="800" y="270" width="62" height="12" rx="6" fill="#ffffff" opacity=".55"/>
<rect x="800" y="326" width="84" height="28" rx="14" fill="#ffffff" opacity=".9"/>
</svg>`;

await Promise.all([
  sharp(Buffer.from(iconSvg)).png().toFile(path.join(assets, 'icon.png')),
  sharp(Buffer.from(adaptiveSvg)).png().toFile(path.join(assets, 'adaptive-icon.png')),
  sharp(Buffer.from(monoSvg)).png().toFile(path.join(assets, 'monochrome-icon.png')),
  sharp(Buffer.from(iconSvg)).resize(512, 512).png().toFile(path.join(store, 'play-icon-512.png')),
  sharp(Buffer.from(featureSvg)).png().toFile(path.join(store, 'feature-graphic-1024x500.png'))
]);

console.log('CIA Campo assets generated.');
