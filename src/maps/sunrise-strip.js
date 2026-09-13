// Map 1: Sunrise Strip (Florida) - starting map, Level 1.
// Palm-lined streets, canals, arena silhouette, alligator-crossing joke signs.

import { mulberry32, hashStr, tower, palmTree, buntingLine, arenaFacade } from './mapUtils.js';

export const map = {
  id: 'sunrise-strip',
  name: 'Sunrise Strip',
  subtitle: 'South Florida',
  unlockLevel: 1,
  blurb: 'Palm-lined boulevards, canal spray, and one arena-shaped silhouette on the horizon.',
  eggName: 'Alligator crossing signs',
  body: { type: 'sun', color: '#ffd98a' },
  groundStyle: 'asphalt',
  fansColors: ['#c8863c', '#1f3a5c', '#e8e8e8'],
  buntingColors: ['#c8863c', '#1f3a5c', '#ffffff'],
  palette: {
    skyTop: '#2e7fb8', skyBottom: '#ffd9a0',
    far: '#7fb2c9', mid: '#5c93ad', near: '#3f7288',
    ground: '#3a3f45', groundLine: '#e8d94f', sidewalk: '#c9bfa8',
    accent: '#ffb347', accent2: '#1f5c8b', dark: '#10151a',
  },
  terrain: { amp: 10, amp2: 5, lam1: 900, lam2: 340, phase: 0.4 },
  hazards: [
    { type: 'slick', every: [900, 1500], len: [120, 220], power: 0.55, startAt: 700 }, // canal spray
    { type: 'gust', every: [1400, 2200], len: [90, 160], power: 7, startAt: 1500 },    // sea breeze
  ],
  music: {
    bpm: 112, root: 110, mode: 'mixo',
    bass: [0, 0, 4, 0, 5, 4, 0, -1], bassWave: 'triangle',
    chords: [[0, 2, 4], [3, 5, 7]], padWave: 'sine',
    lead: [7, -1, 9, -1, 7, -1, 4, -1, 5, -1, 4, -1, 2, -1, -1, -1, 7, -1, 9, 11, 9, -1, 7, -1, 4, -1, 5, -1, 4, -1, 2, -1],
    leadWave: 'square', drums: true,
  },
  drawSkyline(ctx, W, H, scroll, baseY, t) {
    const rng = mulberry32(hashStr('sunrise-far'));
    const TW = 2600;
    const off = ((scroll * 0.15) % TW + TW) % TW;
    // Arena silhouette on the horizon (unbranded dome bowl).
    arenaFacade(ctx, ((1800 - off) % TW + TW) % TW, baseY + 4, 340, 110, '#6a9cb4', '#89b7cb');
    arenaFacade(ctx, ((1800 - off) % TW + TW) % TW - TW, baseY + 4, 340, 110, '#6a9cb4', '#89b7cb');
    for (let i = 0; i < 9; i++) {
      const x = i * (TW / 9) - off;
      const w = 90 + rng() * 130;
      const h = 60 + rng() * 130;
      tower(ctx, x, w, h, baseY + 6, '#7fb2c9', null, 0, rng);
      // art-deco stepped top
      ctx.fillStyle = '#8fc0d6';
      ctx.fillRect(x + w * 0.3, baseY - h - 14, w * 0.4, 14);
    }
    // canal strip behind the street
    ctx.fillStyle = '#3f88a8';
    ctx.fillRect(0, baseY + 8, W, 16);
    const off2 = ((scroll * 0.42) % TW + TW) % TW;
    for (let i = 0; i < 10; i++) {
      const x = i * (TW / 10) - off2;
      palmTree(ctx, x + 40, baseY + 26, 1.05, '#7a5a38', '#3f9b58');
      if (i % 3 === 0) palmTree(ctx, x + 150, baseY + 26, 0.8, '#7a5a38', '#3f9b58');
    }
    if (scroll > 300) buntingLine(ctx, 60, 250, baseY - 120, this.buntingColors);
  },
  drawEgg(ctx, x, baseY, t) {
    // Alligator crossing joke sign; a gator silhouette wades in the canal.
    ctx.fillStyle = '#f2d21f';
    const s = 1;
    ctx.save();
    ctx.translate(x, baseY);
    ctx.beginPath();
    ctx.moveTo(-26 * s, 0); ctx.lineTo(26 * s, 0); ctx.lineTo(0, -46 * s); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#10151a';
    ctx.save();
    ctx.translate(0, -22 * s);
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2d21f';
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j += 2) ctx.fillRect(i * 5 * s - 1.5, j * 3.5 * s - 1.5, 3, 3);
    }
    ctx.restore();
    // tail bump (the gator itself, cruising the canal)
    ctx.fillStyle = '#3c5a3a';
    ctx.beginPath();
    ctx.ellipse(90, 14, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(108, 15, 6, 3.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
};
