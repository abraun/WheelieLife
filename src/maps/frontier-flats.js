// Map 6: Frontier Flats (Edmonton / Western Canada) - Level 21.
// Prairie-wide streets, oil derricks, northern-lights night sky.

import { mulberry32, hashStr, tower } from './mapUtils.js';

function derrick(ctx, x, baseY, h, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 26, baseY); ctx.lineTo(x - 4, baseY - h);
  ctx.moveTo(x + 26, baseY); ctx.lineTo(x + 4, baseY - h);
  for (let i = 1; i < 5; i++) {
    const yy = baseY - (h * i) / 5;
    const ww = 26 - (22 * i) / 5;
    ctx.moveTo(x - ww, yy); ctx.lineTo(x + ww, yy);
  }
  ctx.moveTo(x - 4, baseY - h); ctx.lineTo(x + 4, baseY - h);
  ctx.stroke();
  const pump = Math.sin(x * 0.01 + performance.now() / 1400) * 0.5;
  ctx.save();
  ctx.translate(x, baseY - h * 0.45);
  ctx.rotate(pump * 0.3);
  ctx.fillRect(-34, -4, 68, 7);
  ctx.restore();
}

function aurora(ctx, W, H, t) {
  for (let band = 0; band < 3; band++) {
    const g = ctx.createLinearGradient(0, H * 0.05, 0, H * 0.55);
    const hue = [150, 170, 120][band];
    g.addColorStop(0, `hsla(${hue},70%,55%,0)`);
    g.addColorStop(0.5, `hsla(${hue},70%,55%,${0.10 + 0.05 * Math.sin(t * 0.6 + band * 2)})`);
    g.addColorStop(1, 'hsla(160,70%,55%,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= W; x += 40) {
      const y = H * (0.16 + band * 0.07) + Math.sin(x / 130 + t * 0.5 + band * 1.7) * 26;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, 0);
    ctx.closePath();
    ctx.fill();
  }
}

export const map = {
  id: 'frontier-flats',
  name: 'Frontier Flats',
  subtitle: 'Western Canada',
  unlockLevel: 21,
  blurb: 'Wide-open prairie streets under a northern-lights sky, derricks nodding on the horizon.',
  eggName: 'Nodding oil derricks',
  body: { type: 'moon', color: '#dfe8f5' },
  night: true,
  groundStyle: 'prairie',
  fansColors: ['#e2761f', '#1c3f6e', '#e8e8e8'],
  buntingColors: ['#e2761f', '#1c3f6e', '#ffffff'],
  palette: {
    skyTop: '#0a1428', skyBottom: '#17335a',
    far: '#1c3350', mid: '#152840', near: '#101e30',
    ground: '#232a30', groundLine: '#e2761f', sidewalk: '#3a4249',
    accent: '#e2761f', accent2: '#5ad8a8', dark: '#060a12',
  },
  terrain: { amp: 8, amp2: 4, lam1: 1100, lam2: 420, phase: 1.7 },
  hazards: [
    { type: 'vent', every: [900, 1500], len: [110, 180], power: 42, startAt: 600 },   // prairie updraft
    { type: 'gust', every: [1400, 2100], len: [150, 240], power: 12, startAt: 1600 }, // chinook wind
  ],
  music: {
    bpm: 92, root: 110, mode: 'penta',
    bass: [0, -1, -1, -1, 3, -1, -1, -1], bassWave: 'sine',
    chords: [[0, 2, 4], [2, 4, 6], [0, 2, 4], [3, 5, 7]], padWave: 'sine',
    lead: [7, -1, -1, -1, 9, -1, -1, 7, -1, -1, 5, -1, -1, -1, 7, -1, 10, -1, -1, -1, 9, -1, -1, 7, -1, -1, 5, -1, 4, -1, -1, -1],
    leadWave: 'sine', drums: false,
  },
  drawSkyline(ctx, W, H, scroll, baseY, t) {
    aurora(ctx, W, H, t);
    const rng = mulberry32(hashStr('frontier-far'));
    // mountain ridge
    ctx.fillStyle = '#152840';
    ctx.beginPath();
    ctx.moveTo(0, baseY + 6);
    const TW = 3000;
    const off = ((scroll * 0.1) % TW + TW) % TW;
    for (let x = -off; x <= W + 100; x += 100) {
      ctx.lineTo(x, baseY - 60 - Math.abs(Math.sin(x / 260)) * 110);
    }
    ctx.lineTo(W, baseY + 6);
    ctx.closePath();
    ctx.fill();
    // grain silos + pines
    const off2 = ((scroll * 0.28) % TW + TW) % TW;
    for (let i = 0; i < 6; i++) {
      const x = i * (TW / 6) - off2;
      if (i % 2 === 0) {
        for (let s = 0; s < 3; s++) tower(ctx, x + s * 30, 26, 70 + (s % 2) * 14, baseY + 6, '#1c3350', null, 0, rng);
        ctx.fillStyle = '#152840';
        ctx.beginPath();
        ctx.moveTo(x - 4, baseY - 72); ctx.lineTo(x + 48, baseY - 72);
        ctx.lineTo(x + 22, baseY - 96); ctx.closePath(); ctx.fill();
      } else {
        derrick(ctx, x + 60, baseY + 6, 130, '#101e30');
      }
    }
    // prairie grass tufts (near layer)
    const off3 = ((scroll * 0.55) % TW + TW) % TW;
    ctx.strokeStyle = '#2b3a2f';
    ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
      const x = i * 120 - off3;
      ctx.beginPath();
      ctx.moveTo(x, baseY + 18);
      ctx.quadraticCurveTo(x + 4, baseY + 8, x + 2 + Math.sin(t * 2 + i) * 3, baseY + 4);
      ctx.stroke();
    }
  },
  drawEgg(ctx, x, baseY, t) {
    // Tumbleweed rolling across the shoulder.
    const roll = (t * 90) % 700;
    ctx.save();
    ctx.translate(x + roll, baseY - 10 - Math.abs(Math.sin(t * 4)) * 8);
    ctx.rotate(t * 3);
    ctx.strokeStyle = '#7a6a3f';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 14, (i * Math.PI) / 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  },
};
