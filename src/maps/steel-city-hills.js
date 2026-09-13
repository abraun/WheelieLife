// Map 2: Steel City Hills (Pittsburgh) - Level 3.
// Bridges, steep inclines, river confluence, black-and-gold bunting (no logos).

import { mulberry32, hashStr, tower, buntingLine } from './mapUtils.js';

function suspensionBridge(ctx, x, baseY, w, color, gold) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x, baseY - 90); ctx.lineTo(x + w * 0.5, baseY - 150); ctx.lineTo(x + w, baseY - 90);
  ctx.stroke();
  ctx.lineWidth = 4;
  for (let i = 1; i < 8; i++) {
    const px = x + (w * i) / 8;
    const py = baseY - 90 - Math.sin((i / 8) * Math.PI) * 60;
    ctx.beginPath();
    ctx.moveTo(px, py); ctx.lineTo(px, baseY - 60);
    ctx.stroke();
  }
  ctx.fillStyle = gold;
  ctx.beginPath();
    ctx.arc(x + w * 0.5, baseY - 152, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(x - 8, baseY - 92, 10, 92);
  ctx.fillRect(x + w - 2, baseY - 92, 10, 92);
}

export const map = {
  id: 'steel-city-hills',
  name: 'Steel City Hills',
  subtitle: 'Pittsburgh',
  unlockLevel: 3,
  blurb: 'Three rivers, suspension bridges, and inclines that punish lazy throttle.',
  eggName: 'River-confluence backdrop',
  body: { type: 'sun', color: '#f2e8c9' },
  groundStyle: 'asphalt',
  fansColors: ['#1d1d1f', '#f2c33d', '#e8e8e8'],
  buntingColors: ['#1d1d1f', '#f2c33d', '#1d1d1f'],
  palette: {
    skyTop: '#8a99a8', skyBottom: '#d9c9a8',
    far: '#6a7683', mid: '#4d5762', near: '#39424c',
    ground: '#33383e', groundLine: '#f2c33d', sidewalk: '#9aa0a6',
    accent: '#f2c33d', accent2: '#1d1d1f', dark: '#0e1114',
  },
  terrain: { amp: 30, amp2: 12, lam1: 760, lam2: 300, phase: 1.2 },
  hazards: [
    { type: 'vent', every: [800, 1300], len: [90, 150], power: 46, startAt: 600 },   // steam vents
    { type: 'gust', every: [1600, 2400], len: [110, 180], power: 9, startAt: 1800 }, // river wind
  ],
  music: {
    bpm: 96, root: 82.4, mode: 'minor',
    bass: [0, -1, 0, 2, 0, -1, 4, 3], bassWave: 'sawtooth',
    chords: [[0, 2, 4], [5, 7, 9], [3, 5, 7], [4, 6, 8]], padWave: 'square',
    lead: [-1, -1, 7, -1, -1, 9, -1, 7, -1, -1, 5, -1, 4, -1, -1, -1, -1, -1, 7, -1, -1, 10, -1, 9, -1, -1, 7, -1, 5, -1, 4, -1],
    leadWave: 'sawtooth', drums: true,
  },
  drawSkyline(ctx, W, H, scroll, baseY, t) {
    const rng = mulberry32(hashStr('steel-far'));
    const TW = 2800;
    const off = ((scroll * 0.15) % TW + TW) % TW;
    for (let i = 0; i < 8; i++) {
      const x = i * (TW / 8) - off;
      const w = 80 + rng() * 110;
      const h = 110 + rng() * 170;
      tower(ctx, x, w, h, baseY + 6, '#6a7683', null, 0, rng);
      if (i % 3 === 1) {
        // smokestack with slow smoke
        ctx.fillStyle = '#57616c';
        ctx.fillRect(x + w + 14, baseY - h - 60, 18, h + 60);
        const rise = (t * 22 + i * 40) % 90;
        ctx.fillStyle = 'rgba(220,220,220,0.25)';
        ctx.beginPath();
        ctx.arc(x + w + 23, baseY - h - 66 - rise, 8 + rise * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // river confluence wedge
    ctx.fillStyle = '#41607a';
    ctx.beginPath();
    ctx.moveTo(0, baseY + 4);
    ctx.lineTo(W * 0.35, baseY + 4);
    ctx.lineTo(W * 0.5, baseY + 20);
    ctx.lineTo(0, baseY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W * 0.4, baseY + 4);
    ctx.lineTo(W, baseY + 4);
    ctx.lineTo(W, baseY + 20);
    ctx.lineTo(W * 0.55, baseY + 20);
    ctx.closePath();
    ctx.fill();
    // bridges over the rivers (mid layer)
    const off2 = ((scroll * 0.42) % TW + TW) % TW;
    for (let i = -1; i < 3; i++) {
      const bx = i * (TW / 2) - off2 + 200;
      suspensionBridge(ctx, bx, baseY + 22, 460, '#2f3a44', '#f2c33d');
    }
  },
  drawEgg(ctx, x, baseY, t) {
    // Incline funicular car crawling the hillside, black-and-gold.
    ctx.fillStyle = '#39424c';
    ctx.beginPath();
    ctx.moveTo(x - 60, baseY);
    ctx.lineTo(x + 120, baseY - 70);
    ctx.lineTo(x + 120, baseY);
    ctx.closePath();
    ctx.fill();
    const cyc = (t * 0.25) % 1;
    const cy = -8 - cyc * 52;
    const cx = x + 20 + cyc * 80;
    ctx.fillStyle = '#f2c33d';
    ctx.save();
    ctx.translate(cx, baseY + cy);
    ctx.rotate(-0.34);
    ctx.fillRect(-14, -16, 28, 16);
    ctx.fillStyle = '#1d1d1f';
    ctx.fillRect(-14, -16, 28, 5);
    ctx.restore();
  },
};
