// Map 4: Motor City Loop (Detroit) - Level 8.
// Warehouses, an assembly conveyor, oil slicks, octopus dumpster street art.

import { mulberry32, hashStr, tower } from './mapUtils.js';

export const map = {
  id: 'motor-city-loop',
  name: 'Motor City Loop',
  subtitle: 'Detroit',
  unlockLevel: 8,
  blurb: 'Warehouse rows, a humming conveyor line, and oil slicks where the trucks drip.',
  eggName: 'Octopus dumpster street art',
  body: { type: 'sun', color: '#e8ddc8' },
  groundStyle: 'asphalt',
  fansColors: ['#c0392b', '#ffffff', '#1d3557'],
  buntingColors: ['#c0392b', '#ffffff', '#c0392b'],
  palette: {
    skyTop: '#7d8894', skyBottom: '#d9c2a0',
    far: '#5d666e', mid: '#474f57', near: '#343b42',
    ground: '#2f3338', groundLine: '#e05c2a', sidewalk: '#7d7f80',
    accent: '#e05c2a', accent2: '#c0392b', dark: '#0d0f11',
  },
  terrain: { amp: 16, amp2: 7, lam1: 820, lam2: 300, phase: 0.8 },
  hazards: [
    { type: 'slick', every: [700, 1200], len: [140, 240], power: 0.6, startAt: 500 },  // oil slicks
    { type: 'gust', every: [1300, 2000], len: [100, 160], power: 10, startAt: 1400 }, // truck draft
  ],
  music: {
    bpm: 126, root: 98, mode: 'dorian',
    bass: [0, 0, -1, 0, 3, -1, 0, 5], bassWave: 'sawtooth',
    chords: [[0, 2, 4], [3, 5, 7]], padWave: 'sawtooth',
    lead: [7, -1, -1, 7, 9, -1, 7, -1, -1, 5, -1, 4, -1, -1, 7, -1, 10, -1, -1, 9, 7, -1, 5, -1, 4, -1, 5, -1, 7, -1, -1, -1],
    leadWave: 'square', drums: true,
  },
  drawSkyline(ctx, W, H, scroll, baseY, t) {
    const rng = mulberry32(hashStr('motor-far'));
    const TW = 2400;
    const off = ((scroll * 0.15) % TW + TW) % TW;
    for (let i = 0; i < 8; i++) {
      const x = i * (TW / 8) - off;
      const w = 150 + rng() * 140;
      const h = 90 + rng() * 110;
      tower(ctx, x, w, h, baseY + 6, '#5d666e', null, 0, rng);
      // sawtooth factory roof
      ctx.fillStyle = '#4a525a';
      for (let s = 0; s < 4; s++) {
        ctx.beginPath();
        ctx.moveTo(x + s * (w / 4), baseY - h);
        ctx.lineTo(x + (s + 0.5) * (w / 4), baseY - h - 16);
        ctx.lineTo(x + (s + 1) * (w / 4), baseY - h);
        ctx.closePath();
        ctx.fill();
      }
      if (i % 4 === 2) {
        ctx.fillStyle = '#41484f';
        ctx.fillRect(x + w + 20, baseY - h - 90, 22, h + 90);
        ctx.fillStyle = '#e05c2a';
        ctx.fillRect(x + w + 20, baseY - h - 90, 22, 10);
      }
    }
    // assembly conveyor (mid layer): rollers carrying panels
    const off2 = ((scroll * 0.42) % TW + TW) % TW;
    for (let i = -1; i < 4; i++) {
      const x = i * (TW / 2) - off2 + 120;
      ctx.strokeStyle = '#343b42';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x, baseY - 78);
      ctx.lineTo(x + 420, baseY - 78);
      ctx.stroke();
      ctx.fillStyle = '#474f57';
      for (let r = 0; r < 10; r++) {
        ctx.beginPath();
        ctx.arc(x + 20 + r * 42, baseY - 74, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      const panelX = x + ((t * 60) % 400);
      ctx.fillStyle = '#9aa4ad';
      ctx.fillRect(panelX, baseY - 96, 60, 14);
      ctx.strokeStyle = '#343b42';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 30, baseY - 74); ctx.lineTo(x + 30, baseY);
      ctx.moveTo(x + 390, baseY - 74); ctx.lineTo(x + 390, baseY);
      ctx.stroke();
    }
  },
  drawEgg(ctx, x, baseY, t) {
    // Dumpster with a spray-painted octopus (playoff wink, street art not logo).
    ctx.save();
    ctx.translate(x, baseY);
    ctx.fillStyle = '#2e5e46';
    ctx.fillRect(-56, -44, 112, 44);
    ctx.fillStyle = '#234a37';
    ctx.fillRect(-56, -44, 112, 8);
    ctx.strokeStyle = '#d8402a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const wig = Math.sin(t * 2) * 2;
    ctx.beginPath();
    ctx.ellipse(0, -22, 10, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = -0.4 - i * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.quadraticCurveTo(
        Math.cos(a) * 16, -20 + Math.sin(a) * 14 + wig,
        Math.cos(a) * 26, -20 + Math.sin(a) * 22 - wig);
      ctx.stroke();
    }
    ctx.fillStyle = '#f2c33d';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('CTY WASTE', -30, -8);
    ctx.restore();
  },
};
