// Wheelie League - shared UI helpers.

export const qs = (sel) => document.querySelector(sel);
export const qsa = (sel) => Array.from(document.querySelectorAll(sel));

export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

export function fmtCoins(n) {
  return Math.round(n).toLocaleString('en-US');
}

export function showScreen(id) {
  qsa('.screen').forEach((s) => s.classList.remove('active'));
  const target = qs(id);
  if (target) target.classList.add('active');
}

export function statBar(label, frac, color) {
  const f = Math.max(0, Math.min(1, frac));
  return `<div class="stat-row"><span class="stat-label">${label}</span>
    <span class="stat-bar"><span class="stat-fill" style="width:${Math.round(f * 100)}%;background:${color || '#ffd75e'}"></span></span></div>`;
}

// Draws a map's skyline into a small canvas (postcards, map cards).
export function renderMapPostcard(canvas, map) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pal = map.palette;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.skyTop);
  g.addColorStop(1, pal.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const baseY = H * 0.86;
  ctx.save();
  ctx.scale(H / 220, H / 220); // design height 220
  map.drawSkyline(ctx, W / (H / 220), 220, 400, baseY / (H / 220), 2.5);
  ctx.restore();
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, baseY, W, H - baseY);
  ctx.fillStyle = pal.groundLine;
  ctx.fillRect(0, baseY, W, 2);
}
