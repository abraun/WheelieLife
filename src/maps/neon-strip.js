// Map 7: Neon Strip (Las Vegas) - Level 18.
// Casino marquees, fountain spray slicks, knight-helmet parade balloon (homage).

import { mulberry32, hashStr, tower } from './mapUtils.js';

function marquee(ctx, x, baseY, w, h, t, accent, frame, seedI) {
  ctx.fillStyle = '#241f33';
  ctx.fillRect(x, baseY - h, w, h);
  // bulb border chasing
  const n = Math.floor((w + h) / 16);
  for (let i = 0; i < n; i++) {
    const on = (i + Math.floor(t * 6 + seedI)) % 3 !== 0;
    ctx.fillStyle = on ? '#ffe27a' : '#5a5347';
    let bx, by;
    if (i < w / 16) { bx = x + i * 16 + 4; by = baseY - h - 4; }
    else if (i < w / 16 + h / 16) { bx = x + w + 4; by = baseY - h + (i - w / 16) * 16 + 4; }
    else if (i < 2 * w / 16 + h / 16) { bx = x + w - (i - w / 16 - h / 16) * 16 - 12; by = baseY + 4; }
    else { bx = x - 4; by = baseY - (i - 2 * w / 16 - h / 16) * 16 - 12; }
    ctx.beginPath();
    ctx.arc(bx, by, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // flashing sign panel
  const flash = Math.sin(t * 4 + seedI * 2) > 0;
  ctx.fillStyle = flash ? accent : '#3a3350';
  ctx.fillRect(x + 10, baseY - h + 12, w - 20, 30);
  ctx.fillStyle = '#0d0a14';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(flash ? 'ROLL' : 'BIG', x + w / 2, baseY - h + 33);
  ctx.textAlign = 'left';
  // lit windows
  const rng = mulberry32(hashStr('neon' + seedI));
  ctx.fillStyle = 'rgba(255,230,150,0.5)';
  const cols = Math.floor(w / 20), rows = Math.floor((h - 46) / 24);
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    if (rng() < 0.5) ctx.fillRect(x + 10 + c * 20, baseY - h + 52 + r * 24, 10, 14);
  }
  void frame;
}

export const map = {
  id: 'neon-strip',
  name: 'Neon Strip',
  subtitle: 'Las Vegas',
  unlockLevel: 18,
  blurb: 'Marquee lights, fountain spray on the asphalt, and a parade balloon shaped like a knight helmet.',
  eggName: 'Knight-helmet parade balloon',
  body: { type: 'moon', color: '#e8e2f5' },
  night: true,
  groundStyle: 'asphalt',
  fansColors: ['#5c6470', '#f4d35e', '#2a2e35'],
  buntingColors: ['#f4d35e', '#e05ca0', '#5cd8e0'],
  palette: {
    skyTop: '#120b24', skyBottom: '#3a1c4e',
    far: '#2c1f47', mid: '#221733', near: '#181026',
    ground: '#241d2c', groundLine: '#f4d35e', sidewalk: '#3d3348',
    accent: '#f4d35e', accent2: '#e05ca0', dark: '#0b0714',
  },
  terrain: { amp: 9, amp2: 5, lam1: 940, lam2: 360, phase: 0.9 },
  hazards: [
    { type: 'slick', every: [700, 1100], len: [130, 220], power: 0.62, startAt: 500 }, // fountain spray
    { type: 'gust', every: [1200, 1900], len: [130, 200], power: 13, startAt: 1300 }, // desert gust
  ],
  music: {
    bpm: 128, root: 87.3, mode: 'minor',
    bass: [0, 0, 0, 0, 5, 5, 3, 3], bassWave: 'sawtooth',
    chords: [[0, 2, 4], [5, 7, 9], [3, 5, 7], [4, 6, 8]], padWave: 'sawtooth',
    lead: [7, -1, 7, 9, -1, 7, -1, -1, 10, -1, 9, -1, 7, -1, 5, -1, 7, -1, 7, 9, -1, 12, -1, 10, -1, 9, -1, 7, -1, 5, -1, -1],
    leadWave: 'sawtooth', drums: true,
  },
  drawSkyline(ctx, W, H, scroll, baseY, t) {
    const TW = 2500;
    const off = ((scroll * 0.15) % TW + TW) % TW;
    const rng = mulberry32(hashStr('neon-far'));
    for (let i = 0; i < 7; i++) {
      const x = i * (TW / 7) - off;
      tower(ctx, x, 90 + rng() * 110, 130 + rng() * 190, baseY + 6, '#221733', 'rgba(255,220,150,0.4)', 0.35, rng);
    }
    // a pyramide tower (homage to the glass pyramid resort, unbranded)
    const pyrX = 900 - off;
    ctx.fillStyle = '#2c1f47';
    ctx.beginPath();
    ctx.moveTo(pyrX, baseY + 6);
    ctx.lineTo(pyrX + 90, baseY - 240);
    ctx.lineTo(pyrX + 180, baseY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,220,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pyrX + 45, baseY - 120); ctx.lineTo(pyrX + 135, baseY - 120);
    ctx.moveTo(pyrX + 62, baseY - 180); ctx.lineTo(pyrX + 118, baseY - 180);
    ctx.stroke();
    // marquees (mid layer)
    const off2 = ((scroll * 0.42) % TW + TW) % TW;
    for (let i = 0; i < 5; i++) {
      const x = i * (TW / 5) - off2;
      const colors = ['#e05ca0', '#5cd8e0', '#f4d35e', '#7ae05c', '#c07ae0'];
      marquee(ctx, x, baseY - 60, 150, 130, t, colors[i % colors.length], 0, i);
    }
    // fountain in the mid ground: spray + lit pool
    const fX = 1900 - off2;
    if (fX > -100 && fX < W + 100) {
      ctx.fillStyle = '#1c4470';
      ctx.fillRect(fX - 70, baseY - 6, 140, 14);
      ctx.strokeStyle = 'rgba(140,210,255,0.8)';
      ctx.lineWidth = 2;
      for (let j = 0; j < 5; j++) {
        const ph = (t * 1.4 + j * 0.2) % 1;
        ctx.beginPath();
        ctx.moveTo(fX, baseY - 8);
        ctx.quadraticCurveTo(fX + (j - 2) * 14, baseY - 8 - ph * 70, fX + (j - 2) * 30, baseY - 8 - ph * 70 + ph * ph * 80);
        ctx.stroke();
      }
    }
  },
  drawEgg(ctx, x, baseY, t) {
    // Giant knight-helmet parade balloon bobbing on a float (homage, no logo).
    ctx.save();
    ctx.translate(x, baseY);
    const bob = Math.sin(t * 1.6) * 6;
    // parade float bed
    ctx.fillStyle = '#3a2a5e';
    ctx.fillRect(-70, -26, 140, 18);
    ctx.fillStyle = '#2a1e44';
    ctx.fillRect(-76, -14, 152, 10);
    // balloon: rounded helmet with visor slit and plume
    ctx.save();
    ctx.translate(0, -78 + bob);
    ctx.fillStyle = '#8d97a8';
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 44, 0, Math.PI, 0);
    ctx.lineTo(40, 26);
    ctx.lineTo(-40, 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5c6470';
    ctx.fillRect(-40, 18, 80, 10);
    ctx.fillStyle = '#1a1e26';
    ctx.fillRect(-30, 2, 60, 10);
    ctx.strokeStyle = '#f4d35e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-30, 7); ctx.lineTo(30, 7);
    ctx.stroke();
    ctx.strokeStyle = '#e05ca0';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -44);
    ctx.quadraticCurveTo(14, -66, 4, -84 + bob);
    ctx.stroke();
    // tether ropes
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-30, 26 + bob); ctx.lineTo(-46, -24);
    ctx.moveTo(30, 26 + bob); ctx.lineTo(46, -24);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  },
};
