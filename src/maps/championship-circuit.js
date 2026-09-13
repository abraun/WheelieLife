// Map 8: Championship Circuit - Level 22, requires visiting all seven cities.
// Arena-tunnel gauntlet that remixes hazards and props from every city.

import { mulberry32, hashStr, tower, buntingLine, arenaFacade } from './mapUtils.js';

export const map = {
  id: 'championship-circuit',
  name: 'Championship Circuit',
  subtitle: 'The Final Gauntlet',
  unlockLevel: 22,
  allMapsRequired: true,
  blurb: 'Seven cities of hazards in one tunnel of banners. The crowd never sits down.',
  eggName: 'Every city, one tunnel',
  body: null,
  night: true,
  groundStyle: 'arena',
  fansColors: ['#e8e8e8', '#c9a227', '#8a9099'],
  buntingColors: ['#c9a227', '#e8e8e8', '#8a9099'],
  palette: {
    skyTop: '#0d1016', skyBottom: '#1d2430',
    far: '#232c3a', mid: '#1a212c', near: '#131922',
    ground: '#20242b', groundLine: '#c9a227', sidewalk: '#333a45',
    accent: '#c9a227', accent2: '#e8e8e8', dark: '#07090c',
  },
  terrain: { amp: 12, amp2: 8, lam1: 700, lam2: 260, phase: 0.5 },
  hazards: [
    { type: 'gust', every: [500, 800], len: [140, 220], power: 14, startAt: 350 },   // grid gusts
    { type: 'slick', every: [800, 1300], len: [130, 210], power: 0.6, startAt: 700 }, // fountain spray
    { type: 'vent', every: [900, 1400], len: [90, 150], power: 44, startAt: 1000 },   // steam vents
  ],
  music: {
    bpm: 132, root: 65.4, mode: 'major',
    bass: [0, 0, 7, 0, 5, 5, 7, 7], bassWave: 'sawtooth',
    chords: [[0, 2, 4], [4, 6, 8], [5, 7, 9], [7, 9, 11]], padWave: 'square',
    lead: [7, 7, -1, 7, -1, 9, -1, -1, 11, -1, 9, -1, 7, -1, 4, -1, 5, 5, -1, 7, -1, 9, -1, -1, 11, -1, 12, -1, 11, 9, 7, -1],
    leadWave: 'square', drums: true,
  },
  drawSkyline(ctx, W, H, scroll, baseY, t) {
    const rng = mulberry32(hashStr('champ-far'));
    // Tunnel walls: arena interior, banner rings overhead.
    ctx.fillStyle = '#131922';
    ctx.fillRect(0, 0, W, baseY - 210);
    const TW = 2000;
    const off = ((scroll * 0.3) % TW + TW) % TW;
    // banner rings referencing each city's accent colors (no logos)
    const cityColors = ['#ffb347', '#f2c33d', '#a63131', '#e05c2a', '#c8342c', '#e2761f', '#f4d35e'];
    for (let i = -1; i < W / 250 + 2; i++) {
      const x = i * 250 - (off % 250);
      const ci = Math.abs(Math.floor((i + Math.floor(off / 250))) % cityColors.length);
      ctx.fillStyle = cityColors[ci];
      ctx.fillRect(x, baseY - 250, 18, 70);
      ctx.fillStyle = '#232c3a';
      ctx.fillRect(x + 3, baseY - 244, 12, 58);
    }
    // overhead gantry beams
    ctx.fillStyle = '#1a212c';
    for (let x = -((off % 500)); x < W; x += 500) ctx.fillRect(x, baseY - 196, W * 0 + 500, 10);
    // upper bowl: stacked crowd dots in the dark + suite glass
    for (let i = 0; i < 14; i++) {
      const x = i * (TW / 14) - ((scroll * 0.3) % TW);
      tower(ctx, x, 100 + rng() * 60, 60 + rng() * 50, baseY - 200, '#1a212c', 'rgba(200,170,90,0.25)', 0.3, rng);
    }
    // arena bowl silhouette far
    arenaFacade(ctx, 600 - ((scroll * 0.12) % 4000), baseY - 120, 420, 90, '#10151c', '#181f29');
    // repeated crowd wall (near-mid): heads + phone flashes
    const off2 = ((scroll * 0.5) % 60 + 60) % 60;
    for (let row = 0; row < 2; row++) {
      const yy = baseY - 60 + row * 26;
      for (let i = -1; i < W / 30 + 1; i++) {
        const x = i * 30 - off2;
        const ph = Math.sin(i * 3.1 + t * 6 + row) * 2;
        ctx.fillStyle = row ? '#3a414d' : '#31363f';
        ctx.beginPath();
        ctx.arc(x + 8, yy + ph, 7, 0, Math.PI * 2);
        ctx.fill();
        if ((i * 7 + row * 3) % 11 === 0) {
          ctx.fillStyle = 'rgba(255,255,220,0.8)';
          ctx.fillRect(x + 6, yy - 14 + ph, 2, 4);
          ctx.fillStyle = row ? '#3a414d' : '#31363f';
        }
      }
    }
    // glass barrier in front of crowd
    ctx.fillStyle = 'rgba(160,190,220,0.07)';
    ctx.fillRect(0, baseY - 40, W, 40);
    ctx.strokeStyle = 'rgba(160,190,220,0.16)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, baseY - 40, W, 40);
    if (scroll > 400) buntingLine(ctx, 100, 420, baseY - 132, this.buntingColors, 12);
  },
  drawEgg(ctx, x, baseY, t) {
    // Stanley-cup-shaped trophy silhouette on a pedestal (generic cup, unbranded).
    ctx.save();
    ctx.translate(x, baseY);
    ctx.fillStyle = '#232c3a';
    ctx.fillRect(-30, -18, 60, 18);
    const gleam = 0.6 + 0.4 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(201,162,39,${gleam})`;
    ctx.beginPath();
    ctx.moveTo(-16, -18);
    ctx.bezierCurveTo(-20, -44, -8, -50, -2, -54);
    ctx.lineTo(2, -54);
    ctx.bezierCurveTo(8, -50, 20, -44, 16, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-24, -22, 48, 5);
    ctx.restore();
  },
};
