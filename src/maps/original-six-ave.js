// Map 3: Original Six Ave (Boston/Montreal hybrid Old Town) - Level 6.
// Cobblestone rattles, brick row-houses, church steeples, hidden duck boat.

import { mulberry32, hashStr, tower, buntingLine } from './mapUtils.js';

function steeple(ctx, x, baseY, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 14, baseY - h, 28, h);
  ctx.beginPath();
  ctx.moveTo(x - 18, baseY - h);
  ctx.lineTo(x, baseY - h - 42);
  ctx.lineTo(x + 18, baseY - h);
  ctx.closePath();
  ctx.fill();
}

export const map = {
  id: 'original-six-ave',
  name: 'Original Six Ave',
  subtitle: 'Old Town',
  unlockLevel: 6,
  blurb: 'Cobblestone side-streets, brick row-houses, and organ music drifting from the rink.',
  eggName: 'A duck-boat tour prop',
  body: { type: 'sun', color: '#f2ddba' },
  groundStyle: 'cobble',
  fansColors: ['#a63131', '#20304a', '#e8e0c8'],
  buntingColors: ['#a63131', '#20304a', '#e8e0c8'],
  palette: {
    skyTop: '#a8b8c5', skyBottom: '#e8d8b8',
    far: '#8a8296', mid: '#6e6275', near: '#544a5c',
    ground: '#4a4440', groundLine: '#c8bfa8', sidewalk: '#a89f8d',
    accent: '#a63131', accent2: '#20304a', dark: '#14100f',
  },
  terrain: { amp: 14, amp2: 9, lam1: 620, lam2: 240, phase: 2.1 },
  hazards: [
    { type: 'gust', every: [420, 700], len: [260, 420], power: 8, startAt: 300 }, // cobblestone rattle
    { type: 'slick', every: [1500, 2300], len: [100, 160], power: 0.5, startAt: 1200 }, // wet cobble
  ],
  music: {
    bpm: 84, root: 130.8, mode: 'major',
    bass: [0, -1, -1, -1, 4, -1, -1, -1], bassWave: 'triangle',
    chords: [[0, 2, 4], [4, 6, 8], [5, 7, 9], [0, 2, 4]], padWave: 'square',
    lead: [7, -1, -1, 9, -1, -1, 7, -1, 4, -1, -1, 2, -1, -1, 4, -1, 5, -1, -1, 7, -1, -1, 9, -1, 7, -1, 4, -1, 2, -1, 0, -1],
    leadWave: 'sine', drums: false,
  },
  drawSkyline(ctx, W, H, scroll, baseY, t) {
    const rng = mulberry32(hashStr('oldtown-far'));
    const TW = 2200;
    const off = ((scroll * 0.15) % TW + TW) % TW;
    for (let i = 0; i < 7; i++) {
      const x = i * (TW / 7) - off;
      if (i % 4 === 2) { steeple(ctx, x + 60, baseY + 6, 150 + rng() * 60, '#8a8296'); continue; }
      tower(ctx, x, 70 + rng() * 90, 70 + rng() * 100, baseY + 6, '#8a8296', null, 0, rng);
    }
    // rink barn with barrel roof (generic arena facade)
    const barnX = 1400 - off;
    ctx.fillStyle = '#7a7286';
    ctx.fillRect(barnX, baseY - 74, 300, 80);
    ctx.fillStyle = '#948ca0';
    ctx.beginPath();
    ctx.ellipse(barnX + 150, baseY - 74, 150, 26, 0, Math.PI, 0);
    ctx.fill();
    // row-houses (mid layer, brick)
    const off2 = ((scroll * 0.42) % TW + TW) % TW;
    for (let i = 0; i < 11; i++) {
      const x = i * (TW / 11) - off2;
      const h = 90 + (i % 3) * 26;
      ctx.fillStyle = i % 2 ? '#8a4a3a' : '#7a4034';
      ctx.fillRect(x, baseY - h, 92, h);
      ctx.fillStyle = '#5c3228';
      ctx.beginPath();
      ctx.moveTo(x - 4, baseY - h);
      ctx.lineTo(x + 46, baseY - h - 22);
      ctx.lineTo(x + 96, baseY - h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e8d8b8';
      for (let wx = 0; wx < 2; wx++) ctx.fillRect(x + 16 + wx * 40, baseY - h + 20, 20, 26);
    }
    if (scroll > 200) buntingLine(ctx, 320, 560, baseY - 128, this.buntingColors, 14);
  },
  drawEgg(ctx, x, baseY, t) {
    // Duck-boat tour prop parked on a side road.
    ctx.save();
    ctx.translate(x, baseY);
    ctx.fillStyle = '#8a7f4a';
    ctx.fillRect(-60, -34, 120, 26);
    ctx.fillStyle = '#3f4a3a';
    ctx.beginPath();
    ctx.moveTo(-40, -34); ctx.lineTo(-30, -54); ctx.lineTo(40, -54); ctx.lineTo(50, -34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d8e8f0';
    ctx.fillRect(-24, -50, 56, 12);
    ctx.fillStyle = '#20242a';
    ctx.beginPath(); ctx.arc(-38, -6, 8, 0, Math.PI * 2); ctx.arc(38, -6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a7f4a';
    ctx.fillRect(-52, -10, 104, 6);
    ctx.restore();
  },
};
