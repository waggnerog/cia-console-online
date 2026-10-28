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


function screenshotSvg(title, subtitle, body) {
  return `<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1920" fill="#F7F8FC"/>
  <rect width="1080" height="160" fill="#FFFFFF"/>
  <rect x="64" y="52" width="72" height="72" rx="22" fill="#111318"/>
  <path d="M116 72 C109 63 100 59 89 59 C68 59 55 75 55 99 C55 123 68 139 89 139 C100 139 109 135 116 126" transform="translate(10 -10)" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>
  <text x="160" y="88" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="700" fill="#171925">CIA Campo</text>
  <text x="160" y="120" font-family="Arial,Helvetica,sans-serif" font-size="18" fill="#707487">Execução em campo</text>
  <text x="64" y="270" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" letter-spacing="2" fill="#5965D8">CIA CAMPO</text>
  <text x="64" y="365" font-family="Arial,Helvetica,sans-serif" font-size="64" font-weight="700" fill="#171925">${title}</text>
  <text x="64" y="430" font-family="Arial,Helvetica,sans-serif" font-size="28" fill="#707487">${subtitle}</text>
  ${body}
  </svg>`;
}

const shot1 = screenshotSvg(
  'Sua agenda na mão.',
  'Visitas, progresso e prioridades do dia.',
  `<rect x="64" y="520" width="952" height="250" rx="36" fill="#FFFFFF" stroke="#E5E7EF"/>
   <text x="105" y="580" font-family="Arial" font-size="17" font-weight="700" fill="#5965D8">SUPERMERCADOS NOVA · EM ANDAMENTO</text>
   <text x="105" y="635" font-family="Arial" font-size="35" font-weight="700" fill="#171925">Loja Ipiranga</text>
   <text x="105" y="676" font-family="Arial" font-size="23" fill="#707487">Execução de ponto extra</text>
   <rect x="105" y="715" width="830" height="12" rx="6" fill="#F1F3F8"/><rect x="105" y="715" width="540" height="12" rx="6" fill="#5965D8"/>
   <rect x="64" y="806" width="952" height="250" rx="36" fill="#FFFFFF" stroke="#E5E7EF"/>
   <text x="105" y="866" font-family="Arial" font-size="17" font-weight="700" fill="#5965D8">MERCADO DO POVO · PLANEJADA</text>
   <text x="105" y="921" font-family="Arial" font-size="35" font-weight="700" fill="#171925">Loja Centro</text>
   <text x="105" y="962" font-family="Arial" font-size="23" fill="#707487">Auditoria de exposição</text>
   <rect x="64" y="1130" width="290" height="170" rx="30" fill="#FFFFFF" stroke="#E5E7EF"/><text x="105" y="1190" font-family="Arial" font-size="18" fill="#707487">VISITAS</text><text x="105" y="1260" font-family="Arial" font-size="54" font-weight="700" fill="#171925">5</text>
   <rect x="395" y="1130" width="290" height="170" rx="30" fill="#FFFFFF" stroke="#E5E7EF"/><text x="436" y="1190" font-family="Arial" font-size="18" fill="#707487">CONCLUÍDAS</text><text x="436" y="1260" font-family="Arial" font-size="54" font-weight="700" fill="#171925">2</text>
   <rect x="726" y="1130" width="290" height="170" rx="30" fill="#FFFFFF" stroke="#E5E7EF"/><text x="767" y="1190" font-family="Arial" font-size="18" fill="#707487">FOTOS</text><text x="767" y="1260" font-family="Arial" font-size="54" font-weight="700" fill="#171925">18</text>
   <text x="64" y="1760" font-family="Arial" font-size="24" fill="#707487">Mais clareza para executar. Mais controle para gerir.</text>`
);

const shot2 = screenshotSvg(
  'Execute sem dúvida.',
  'Cada visita mostra exatamente o que precisa ser feito.',
  `<rect x="64" y="520" width="952" height="170" rx="34" fill="#FFFFFF" stroke="#E5E7EF"/>
   <text x="105" y="580" font-family="Arial" font-size="18" font-weight="700" fill="#171925">Check-in</text>
   <text x="105" y="622" font-family="Arial" font-size="22" fill="#707487">Registre sua chegada antes de fotografar.</text>
   <rect x="720" y="565" width="240" height="72" rx="22" fill="#303A9E"/><text x="775" y="611" font-family="Arial" font-size="20" font-weight="700" fill="#FFFFFF">Fazer check-in</text>
   <text x="64" y="770" font-family="Arial" font-size="20" font-weight="700" fill="#5965D8">TAREFAS</text>
   <rect x="64" y="815" width="952" height="190" rx="34" fill="#FFFFFF" stroke="#E5E7EF"/><circle cx="125" cy="885" r="30" fill="#EEF0FF"/><text x="116" y="896" font-family="Arial" font-size="24" font-weight="700" fill="#303A9E">1</text><text x="180" y="870" font-family="Arial" font-size="28" font-weight="700" fill="#171925">Exposição de produtos</text><text x="180" y="915" font-family="Arial" font-size="21" fill="#707487">0/4 fotos · obrigatória</text><rect x="805" y="862" width="150" height="64" rx="20" fill="#EEF0FF"/><text x="842" y="903" font-family="Arial" font-size="19" font-weight="700" fill="#303A9E">Câmera</text>
   <rect x="64" y="1035" width="952" height="190" rx="34" fill="#FBFFFC" stroke="#CCE8D8"/><circle cx="125" cy="1105" r="30" fill="#EAF7F0"/><text x="114" y="1117" font-family="Arial" font-size="24" font-weight="700" fill="#198754">✓</text><text x="180" y="1090" font-family="Arial" font-size="28" font-weight="700" fill="#171925">Material promocional</text><text x="180" y="1135" font-family="Arial" font-size="21" fill="#707487">2/2 fotos · concluída</text>
   <rect x="64" y="1320" width="952" height="88" rx="26" fill="#111318"/><text x="318" y="1375" font-family="Arial" font-size="24" font-weight="700" fill="#FFFFFF">Finalizar visita · Check-out</text>`
);

const shot3 = screenshotSvg(
  'Sinal ruim não para a operação.',
  'O trabalho fica salvo e sincroniza quando a conexão volta.',
  `<rect x="64" y="540" width="952" height="150" rx="32" fill="#FFF6E5"/>
   <text x="105" y="600" font-family="Arial" font-size="25" font-weight="700" fill="#A66200">3 itens aguardando envio</text><text x="105" y="645" font-family="Arial" font-size="22" fill="#707487">Fotos e movimentações protegidas no aparelho.</text>
   <rect x="64" y="760" width="952" height="390" rx="38" fill="#FFFFFF" stroke="#E5E7EF"/>
   <circle cx="540" cy="880" r="78" fill="#EEF0FF"/><text x="508" y="903" font-family="Arial" font-size="62" font-weight="700" fill="#5965D8">↻</text>
   <text x="315" y="1010" font-family="Arial" font-size="31" font-weight="700" fill="#171925">Fila offline persistente</text><text x="230" y="1065" font-family="Arial" font-size="22" fill="#707487">Check-in → fotos → check-out, sempre na ordem correta.</text>
   <rect x="64" y="1230" width="952" height="130" rx="32" fill="#EAF7F0"/><text x="105" y="1290" font-family="Arial" font-size="24" font-weight="700" fill="#198754">Sem duplicar evidências no retry.</text><text x="105" y="1330" font-family="Arial" font-size="21" fill="#707487">Sincronização idempotente protege a operação.</text>`
);

const shot4 = screenshotSvg(
  'Do campo para análise.',
  'A evidência chega ao CIA pronta para decisão.',
  `<rect x="64" y="540" width="430" height="650" rx="42" fill="#FFFFFF" stroke="#E5E7EF"/>
   <rect x="105" y="600" width="348" height="300" rx="30" fill="#EEF0FF"/><rect x="145" y="650" width="268" height="38" rx="12" fill="#5965D8"/><rect x="145" y="715" width="210" height="22" rx="11" fill="#C8CDFC"/><rect x="145" y="760" width="240" height="22" rx="11" fill="#C8CDFC"/><circle cx="380" cy="845" r="36" fill="#198754"/><text x="366" y="858" font-family="Arial" font-size="30" font-weight="700" fill="#fff">✓</text>
   <text x="105" y="970" font-family="Arial" font-size="27" font-weight="700" fill="#171925">CIA Campo</text><text x="105" y="1015" font-family="Arial" font-size="20" fill="#707487">Captura e contexto</text>
   <path d="M520 855 L625 855" stroke="#8B7BE8" stroke-width="12" stroke-linecap="round"/><path d="M610 835 L640 855 L610 875" fill="none" stroke="#8B7BE8" stroke-width="12" stroke-linecap="round"/>
   <rect x="650" y="540" width="366" height="650" rx="42" fill="#FFFFFF" stroke="#E5E7EF"/><text x="700" y="620" font-family="Arial" font-size="27" font-weight="700" fill="#171925">CIA BKO</text><rect x="700" y="675" width="266" height="240" rx="26" fill="#F1F3F8"/><rect x="700" y="955" width="266" height="62" rx="18" fill="#EAF7F0"/><text x="780" y="995" font-family="Arial" font-size="21" font-weight="700" fill="#198754">Aprovar</text><rect x="700" y="1035" width="266" height="62" rx="18" fill="#EEF0FF"/><text x="748" y="1075" font-family="Arial" font-size="21" font-weight="700" fill="#303A9E">Solicitar ajuste</text>
   <text x="64" y="1330" font-family="Arial" font-size="33" font-weight="700" fill="#171925">Menos intervalo entre problema e correção.</text><text x="64" y="1385" font-family="Arial" font-size="23" fill="#707487">O campo continua acontecendo enquanto o gestor acompanha.</text>`
);

await Promise.all([
  sharp(Buffer.from(iconSvg)).png().toFile(path.join(assets, 'icon.png')),
  sharp(Buffer.from(adaptiveSvg)).png().toFile(path.join(assets, 'adaptive-icon.png')),
  sharp(Buffer.from(monoSvg)).png().toFile(path.join(assets, 'monochrome-icon.png')),
  sharp(Buffer.from(iconSvg)).resize(512, 512).png().toFile(path.join(store, 'play-icon-512.png')),
  sharp(Buffer.from(featureSvg)).png().toFile(path.join(store, 'feature-graphic-1024x500.png')),
  sharp(Buffer.from(shot1)).png().toFile(path.join(store, 'screenshot-01-agenda.png')),
  sharp(Buffer.from(shot2)).png().toFile(path.join(store, 'screenshot-02-tarefas.png')),
  sharp(Buffer.from(shot3)).png().toFile(path.join(store, 'screenshot-03-offline.png')),
  sharp(Buffer.from(shot4)).png().toFile(path.join(store, 'screenshot-04-analise.png'))
]);

console.log('CIA Campo assets generated.');
