// Wheelie League - shared map utilities: seeded RNG, terrain, hazard zones,
// puck placement, and small canvas primitives reused by every city map.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---- Terrain ----------------------------------------------------------------

export function groundY(map, x) {
  const t = map.terrain;
  if (!t) return 0;
  return (
    t.amp * Math.sin(x / t.lam1 + t.phase) +
    t.amp2 * Math.sin(x / t.lam2 + t.phase * 2.7)
  );
}

export function groundSlope(map, x) {
  const e = 6;
  return Math.atan2(groundY(map, x + e) - groundY(map, x - e), e * 2);
}

// ---- Hazard zones -----------------------------------------------------------
// types: 'gust' (oscillating torque), 'slick' (low damping), 'vent' (lift pulse)

export function generateZones(map, worldLen) {
  const rng = mulberry32(hashStr(map.id) ^ 0x9e3779b9);
  const zones = [];
  for (const h of map.hazards) {
    let x = h.startAt || 600;
    while (x < worldLen) {
      const len = h.len[0] + rng() * (h.len[1] - h.len[0]);
      zones.push({ x0: x, x1: x + len, type: h.type, power: h.power });
      x += len + (h.every[0] + rng() * (h.every[1] - h.every[0]));
    }
  }
  zones.sort((a, b) => a.x0 - b.x0);
  return zones;
}

export function zonesAt(zones, x) {
  const out = [];
  for (const z of zones) {
    if (z.x0 <= x && x <= z.x1) out.push(z);
    if (z.x0 > x + 50) break;
  }
  return out;
}

// ---- Pucks (3 hidden collectibles per map, deterministic) -------------------

export function generatePucks(map) {
  const rng = mulberry32(hashStr(map.id) ^ 0x51ed270b);
  return [0, 1, 2].map((i) => ({
    idx: i,
    x: 450 + i * (700 + Math.floor(rng() * 900)) + Math.floor(rng() * 400),
    h: 55 + Math.floor(rng() * 85),   // height above ground; higher ones want a wheelie
  }));
}

// ---- Canvas primitives -------------------------------------------------------

export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
  ctx.fill();
}

export function tower(ctx, x, w, h, baseY, color, winColor, litFrac, rng) {
  ctx.fillStyle = color;
  rr(ctx, x, baseY - h, w, h, 3);
  if (winColor) {
    ctx.fillStyle = winColor;
    const cols = Math.max(1, Math.floor(w / 18));
    const rows = Math.max(1, Math.floor(h / 22));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rng() < litFrac) {
          ctx.fillRect(x + 6 + c * (w - 8) / cols, baseY - h + 8 + r * (h - 10) / rows, 7, 9);
        }
      }
    }
  }
}

export function palmTree(ctx, x, baseY, s, trunk, frond) {
  ctx.strokeStyle = trunk;
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + 6 * s, baseY - 30 * s, x + 2 * s, baseY - 52 * s);
  ctx.stroke();
  ctx.strokeStyle = frond;
  ctx.lineWidth = 4 * s;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI + (i / 5) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x + 2 * s, baseY - 52 * s);
    ctx.quadraticCurveTo(
      x + 2 * s + Math.cos(a) * 20 * s, baseY - 52 * s + Math.sin(a) * 12 * s - 6,
      x + 2 * s + Math.cos(a) * 32 * s, baseY - 52 * s + Math.sin(a) * 20 * s + 4);
    ctx.stroke();
  }
}

export function buntingLine(ctx, x0, x1, y, colors, sag = 10) {
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.quadraticCurveTo((x0 + x1) / 2, y + sag, x1, y);
  ctx.stroke();
  const n = Math.max(3, Math.floor((x1 - x0) / 26));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x0 + (x1 - x0) * t;
    const py = y + Math.sin(Math.PI * t) * sag;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(px - 5, py);
    ctx.lineTo(px + 5, py);
    ctx.lineTo(px, py + 9);
    ctx.closePath();
    ctx.fill();
  }
}

export function lampPost(ctx, x, baseY, h, color, glow) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - h);
  ctx.quadraticCurveTo(x, baseY - h - 14, x + 16, baseY - h - 14);
  ctx.stroke();
  if (glow) {
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(x + 18, baseY - h - 10, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    const gr = ctx.createRadialGradient(x + 18, baseY - h - 10, 2, x + 18, baseY - h - 10, 34);
    gr.addColorStop(0, glow);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x + 18, baseY - h - 10, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export function stars(ctx, camX, W, H, n, rng, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const sx = ((rng() * W * 3 - camX * 0.06) % (W * 1.2) + W * 1.2) % (W * 1.2);
    const sy = rng() * H * 0.5;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(i * 1.7 + performance.now() / 900));
    ctx.globalAlpha = tw * 0.8;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
}

// Big roadside distance gantry used for milestone landmarks.
export function milestoneGantry(ctx, x, baseY, label, accent, dark) {
  ctx.fillStyle = dark;
  ctx.fillRect(x - 4, baseY - 130, 8, 130);
  ctx.fillRect(x - 4, baseY - 130, 8, 130);
  ctx.fillStyle = accent;
  rr(ctx, x - 52, baseY - 156, 104, 34, 6);
  ctx.fillStyle = dark;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, baseY - 138);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export function checkpointFlag(ctx, x, baseY, color) {
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - 46);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, baseY - 46);
  ctx.lineTo(x + 26, baseY - 39);
  ctx.lineTo(x, baseY - 32);
  ctx.closePath();
  ctx.fill();
}

export function drawPuck(ctx, x, y, t) {
  const bob = Math.sin(t * 3 + x * 0.01) * 4;
  ctx.save();
  ctx.translate(x, y + bob);
  const gr = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
  gr.addColorStop(0, 'rgba(255,235,140,0.9)');
  gr.addColorStop(1, 'rgba(255,235,140,0)');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#15171b';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a4048';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, -1, 8, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Background Zamboni crossing a back street (spec 6 easter egg).
export function drawZamboni(ctx, x, y, dir, body, accent) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = body;
  rr(ctx, -34, -26, 68, 20, 4);
  ctx.fillStyle = accent;
  rr(ctx, -30, -40, 34, 16, 4);
  ctx.fillStyle = '#20242a';
  ctx.beginPath();
  ctx.arc(-20, -4, 6, 0, Math.PI * 2);
  ctx.arc(20, -4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(230,245,255,0.85)';
  ctx.fillRect(4, -24, 30, 5);
  ctx.restore();
}

// Arena-PA style jumbotron in the skyline, flashing HOME TEAM WINS.
export function drawJumbotron(ctx, x, y, w, h, frame, accent) {
  ctx.fillStyle = '#101317';
  rr(ctx, x - w / 2 - 4, y - 4, w + 8, h + 8, 4);
  ctx.fillStyle = '#1b2027';
  ctx.fillRect(x - w / 2, y, w, h);
  const flash = Math.floor(frame / 180) % 3 === 0;
  if (flash) {
    ctx.fillStyle = accent;
    ctx.fillRect(x - w / 2, y, w, h);
    ctx.fillStyle = '#101317';
    ctx.font = `bold ${Math.floor(h * 0.28)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HOME TEAM', x, y + h * 0.34);
    ctx.fillText('WINS', x, y + h * 0.68);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  } else {
    ctx.fillStyle = '#242c36';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
      ctx.fillRect(x - w / 2 + 4 + c * (w - 8) / 8, y + 4 + r * (h - 8) / 3, (w - 8) / 8 - 2, (h - 8) / 3 - 2);
    }
  }
  ctx.strokeStyle = '#101317';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 10, y + h + 4);
  ctx.lineTo(x - 16, y + h + 26);
  ctx.moveTo(x + 10, y + h + 4);
  ctx.lineTo(x + 16, y + h + 26);
  ctx.stroke();
}

// Sideline fans in unbranded team-color jerseys (bounce when cheering).
export function drawFans(ctx, x, baseY, colors, cheer, t) {
  for (let i = 0; i < 4; i++) {
    const fx = x + i * 17;
    const hop = cheer ? Math.abs(Math.sin(t * 8 + i)) * 7 : Math.sin(t * 2 + i) * 1.2;
    ctx.fillStyle = colors[i % colors.length];
    rr(ctx, fx, baseY - 26 - hop, 11, 17, 4);
    ctx.fillStyle = '#3a2e26';
    ctx.beginPath();
    ctx.arc(fx + 5.5, baseY - 31 - hop, 5.5, 0, Math.PI * 2);
    ctx.fill();
    if (cheer) {
      ctx.strokeStyle = colors[(i + 1) % colors.length];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fx + 10, baseY - 22 - hop);
      ctx.lineTo(fx + 16, baseY - 34 - hop);
      ctx.stroke();
    }
  }
}

// Rival street rider in referee-striped jacket, waving you on.
export function drawRefRider(ctx, x, baseY, t) {
  ctx.save();
  ctx.translate(x, baseY);
  // bike leaning on kickstand
  ctx.strokeStyle = '#22262b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-2, -14); ctx.lineTo(16, -14); ctx.moveTo(0, -14); ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.fillStyle = '#22262b';
  ctx.beginPath(); ctx.arc(-8, -1, 6, 0, Math.PI * 2); ctx.arc(16, -1, 6, 0, Math.PI * 2); ctx.fill();
  // striped jacket
  ctx.fillStyle = '#e8e8e8';
  rr(ctx, 14, -42, 13, 22, 4);
  ctx.fillStyle = '#15171b';
  for (let i = 0; i < 3; i++) ctx.fillRect(14, -40 + i * 7, 13, 3);
  ctx.fillStyle = '#3a2e26';
  ctx.beginPath(); ctx.arc(20, -47, 6, 0, Math.PI * 2); ctx.fill();
  const wave = Math.sin(t * 5) * 6;
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(26, -38);
  ctx.lineTo(33, -50 + wave);
  ctx.stroke();
  ctx.restore();
}

// Generic arena facade silhouette for skylines (no signage).
export function arenaFacade(ctx, x, baseY, w, h, color, roofColor) {
  ctx.fillStyle = color;
  rr(ctx, x, baseY - h, w, h, w * 0.18);
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, baseY - h, w * 0.34, h * 0.16, 0, Math.PI, 0);
  ctx.fill();
}
