// Map 5: Windy Grid (Chicago) - Level 15.
// Elevated train overhead, grid gusts, giant wind sock, red-black bunting.

import { mulberry32, hashStr, tower, buntingLine } from './mapUtils.js';

export const map = {
  id: 'windy-grid',
  name: 'Windy Grid',
  subtitle: 'Chicago',
  unlockLevel: 15,
  blurb: 'Ride under the elevated tracks while the lake wind tries to loop you out.',
  eggName: 'A giant wind sock',
  body: { type: 'sun', color: '#e8e2d0' },
  groundStyle: 'asphalt',
  fansColors: ['#a02c2c', '#181a1c', '#e8e8e8'],
  buntingColors: ['#a02c2c', '#181a1c', '#a02c2c'],
  palette: {
    skyTop: '#6f7f8f', skyBottom: '#cfc4ae',
    far: '#57616e', mid: '#404a56', near: '#2e3742',
    ground: '#2c3136', groundLine: '#c8342c', sidewalk: '#8a8d90',
    accent: '#c8342c', accent2: '#181a1c', dark: '#0c0e10',
  },
  terrain: { amp: 12, amp2: 6, lam1: 860, lam2: 320, phase: 0.2 },
  hazards: [
    { type: 'gust', every: [520, 900], len: [160, 260], power: 15, startAt: 400 },  // grid gusts
    { type: 'vent', every: [1500, 2200], len: [80, 130], power: 40, startAt: 1300 }, // subway grate blast
  ],
  music: {
    bpm: 120, root: 73.4, mode: 'mixo',
    bass: [0, 0, 5, 0, 0, 3, 0, 4], bassWave: 'triangle',
    chords: [[0, 2, 4], [6, 8, 10], [0, 2, 4], [5, 7, 9]], padWave: 'sawtooth',
    lead: [7, 8, -1, 7, -1, 5, -1, 4, 5, -1, 7, -1, 8, 7, -1, 5, 7, 8, -1, 10, -1, 8, -1, 7, 5, -1, 4, -1, 2, -1, 4, -1],
    leadWave: 'square', drums: true,
  },
  drawSkyline(ctx, W, H, scroll, baseY, t) {
    const rng = mulberry32(hashStr('windy-far'));
    const TW = 2600;
    const off = ((scroll * 0.15) % TW + TW) % TW;
    // dense tower skyline
    for ( let i = 0; i < 11; i++) {
      const x = i * (TW / 11) - off;
      const w = 70 + rng() * 90;
      const h = 150 + rng() * 210;
      tower(ctx, x, w, h, baseY + 6, '#57616e', 'rgba(255,240,190,0.5)', 0.4, rng);
      if (i % 5 === 2) {
        // antenna spire
        ctx.strokeStyle = '#404a56';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, baseY - h);
        ctx.lineTo(x + w / 2, baseY - h - 46);
        ctx.stroke();
      }
    }
    // elevated train structure (mid layer): beams + periodic train pass
    const off2 = ((scroll * 0.42) % TW + TW) % TW;
    ctx.fillStyle = '#2e3742';
    const trackY = baseY - 168;
    ctx.fillRect(0, trackY, W, 12);
    for (let x = -((off2 % 90)); x < W; x += 90) ctx.fillRect(x, trackY + 12, 8, 168);
    for (let x = -((off2 % 90)); x < W; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, trackY + 12);
      ctx.lineTo(x + 14, trackY);
      ctx.lineTo(x + 22, trackY);
      ctx.lineTo(x + 8, trackY + 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#3c4753';
    ctx.fillRect(0, trackY - 8, W, 5);
    // train rolls through every ~14s
    const cyc = (t % 14) / 14;
    if (cyc < 0.34) {
      const tx = W + 260 - cyc * 5.2 * W;
      ctx.fillStyle = '#8a929c';
      ctx.fillRect(tx, trackY - 34, 200, 30);
      ctx.fillStyle = '#c8342c';
      ctx.fillRect(tx, trackY - 34, 200, 7);
      ctx.fillStyle = '#d8e2ea';
      for (let wnd = 0; wnd < 5; wnd++) ctx.fillRect(tx + 12 + wnd * 38, trackY - 26, 24, 14);
    }
    // wind sock on a pole (the map egg, always visible somewhere nearby)
    const sockX = ((1400 - off2) % (TW / 2) + TW / 2) % (TW / 2);
    if (sockX > -80 && sockX < W + 80) {
      ctx.strokeStyle = '#404a56';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sockX, baseY - 40);
      ctx.lineTo(sockX, baseY - 150);
      ctx.stroke();
      const fl = Math.sin(t * 3) * 6;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#e8e8e8' : '#c8342c';
        ctx.beginPath();
        ctx.moveTo(sockX + i * 22, baseY - 148 + i);
        ctx.lineTo(sockX + i * 22 + 22, baseY - 146 + i * 2 + (i % 2 ? fl : -fl));
        ctx.lineTo(sockX + i * 22 + 22, baseY - 132 + i * 2 + (i % 2 ? fl : -fl));
        ctx.lineTo(sockX + i * 22, baseY - 134 + i);
        ctx.closePath();
        ctx.fill();
      }
    }
  },
  drawEgg(ctx, x, baseY, t) {
    // Ground-level red-black bunting welcome banner for the L underpass.
    buntingLine(ctx, x - 90, x + 90, baseY - 176, this.buntingColors, 16);
  },
};
