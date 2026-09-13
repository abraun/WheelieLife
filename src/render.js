// Wheelie League - world and character rendering.
// Parallax sky/skyline/street layers per city, procedural bike + rider with
// trick poses, ragdoll crash, particles, and shared street furniture.

import { groundY, groundSlope, drawPuck, drawZamboni, drawJumbotron, drawFans, drawRefRider, milestoneGantry, checkpointFlag, mulberry32, hashStr } from './maps/mapUtils.js';
import { MILESTONES } from './economy.js';

const DESIGN_H = 800;      // render scale reference
const CAM_OFFSET = 0.30;   // bike sits 30% from the left edge
const WHEEL_R = 16;
const WHEELBASE = 48;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.zam = null;          // background zamboni event state
    this.nextZam = 12 + Math.random() * 20;
    this.t = 0;
    this.camX = 0;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
    }
    this.s = (h * dpr) / DESIGN_H;
    this.W = w * dpr;
    this.H = h * dpr;
    this.baseGroundY = this.H * 0.78;
  }

  // ---- World helpers --------------------------------------------------------

  worldToScreenX(worldX) {
    return (worldX - this.camX) * this.s + this.W * CAM_OFFSET;
  }

  groundScreenY(worldX) {
    return this.baseGroundY - groundY(this.map, worldX) * this.s;
  }

  // ---- Public entries ---------------------------------------------------------

  drawRun(run, map, loadout, dt) {
    const ctx = this.ctx;
    this.map = map;
    this.t += dt;
    const phys = run.physics;
    this.camX = phys.x;
    this.resize();
    this.drawSky(map);
    ctx.save();
    ctx.scale(this.s, this.s);
    map.drawSkyline(ctx, this.W / this.s, this.H / this.s, this.camX, this.baseGroundY / this.s, this.t);
    ctx.restore();
    this.drawStreetLayer(map, run, dt);
    this.drawZones(run, map);
    this.drawGround(map);
    this.drawWorldObjects(run, map);
    if (phys.crashed) this.drawCrash(phys, run, loadout, dt);
    else this.drawBikeRider(phys, loadout, run.tricks.active ? run.tricks.active.pose : null, map);
    this.updateParticles(run, dt);
    this.drawParticles(run);
  }

  drawMenuBG(map, dt) {
    const ctx = this.ctx;
    this.map = map;
    this.t += dt;
    this.camX += 55 * dt;
    this.resize();
    this.drawSky(map);
    ctx.save();
    ctx.scale(this.s, this.s);
    map.drawSkyline(ctx, this.W / this.s, this.H / this.s, this.camX, this.baseGroundY / this.s, this.t);
    ctx.restore();
    this.drawStreetLayer(map, null, dt);
    this.drawGround(map);
  }

  // ---- Sky -------------------------------------------------------------------

  drawSky(map) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.baseGroundY);
    g.addColorStop(0, map.palette.skyTop);
    g.addColorStop(1, map.palette.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.baseGroundY + 4);
    if (map.body) {
      const bx = this.W * 0.72 - (this.camX * 0.02 * this.s) % (this.W * 1.6);
      const by = this.H * 0.16;
      ctx.fillStyle = map.body.color;
      ctx.beginPath();
      if (map.body.type === 'moon') {
        ctx.arc(bx, by, 34 * this.s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = map.palette.skyTop;
        ctx.beginPath();
        ctx.arc(bx + 14 * this.s, by - 8 * this.s, 28 * this.s, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.arc(bx, by, 40 * this.s, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(bx, by, 58 * this.s, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    if (map.night) {
      const rng = mulberry32(hashStr(map.id + '-stars'));
      ctx.fillStyle = '#dfe8f5';
      for (let i = 0; i < 60; i++) {
        const sx = ((rng() * this.W * 1.4 - this.camX * 0.02 * this.s) % (this.W * 1.4) + this.W * 1.4) % (this.W * 1.4);
        const sy = rng() * this.baseGroundY * 0.55;
        ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(i * 2.3 + this.t * 1.4));
        ctx.fillRect(sx, sy, 2 * this.s, 2 * this.s);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ---- Street furniture shared by all maps ------------------------------------

  drawStreetLayer(map, run, dt) {
    const ctx = this.ctx;
    const s = this.s;
    const camX = this.camX;
    const left = camX - (this.W * CAM_OFFSET) / s - 200;
    const right = camX + (this.W * (1 - CAM_OFFSET)) / s + 200;

    // lampposts with bunting every 340 units
    const lampStep = 340;
    for (let k = Math.floor(left / lampStep); k <= Math.ceil(right / lampStep); k++) {
      const x = this.worldToScreenX(k * lampStep);
      const gy = this.groundScreenY(k * lampStep);
      ctx.save();
      ctx.translate(x, gy);
      ctx.scale(s, s);
      lampPostLocal(ctx, map, this.t, k);
      ctx.restore();
      if (k % 3 === 0) {
        ctx.strokeStyle = map.palette.sidewalk;
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.moveTo(x, gy - 128 * s);
        ctx.lineTo(x + lampStep * s, gy - 128 * s);
        ctx.stroke();
        const cols = map.buntingColors;
        const n = 12;
        for (let i = 0; i <= n; i++) {
          const px = x + (lampStep * s * i) / n;
          const gy2 = this.groundScreenY(k * lampStep + (lampStep * i) / n);
          ctx.fillStyle = cols[i % cols.length];
          ctx.beginPath();
          ctx.moveTo(px - 5 * s, gy2 - 128 * s);
          ctx.lineTo(px + 5 * s, gy2 - 128 * s);
          ctx.lineTo(px, gy2 - 119 * s);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // milestone gantries (1 m = 10 units)
    for (const ms of MILESTONES) {
      const x = this.worldToScreenX(ms.at * 10);
      if (x < -100 || x > this.W + 100) continue;
      const gy = this.groundScreenY(ms.at * 10);
      ctx.save();
      ctx.translate(x, gy);
      ctx.scale(s, s);
      milestoneGantry(ctx, 0, 0, `${ms.at}m`, map.palette.accent, map.palette.dark);
      ctx.restore();
    }

    // checkpoint pennant flags every 250 m
    if (run) {
      for (let m = 250; m * 10 < right; m += 250) {
        if (m * 10 < left) continue;
        const x = this.worldToScreenX(m * 10);
        if (x < -40 || x > this.W + 40) continue;
        const gy = this.groundScreenY(m * 10);
        ctx.save();
        ctx.translate(x, gy);
        ctx.scale(s, s);
        checkpointFlag(ctx, 0, 0, map.palette.accent2);
        ctx.restore();
      }
    }

    // rival ref-striped riders every 600 m
    if (run) {
      for (let m = 300; m * 10 < right; m += 600) {
        if (m * 10 < left) continue;
        const x = this.worldToScreenX(m * 10 + 60);
        const gy = this.groundScreenY(m * 10 + 60);
        ctx.save();
        ctx.translate(x, gy);
        ctx.scale(s, s);
        drawRefRider(ctx, 0, -6, this.t);
        ctx.restore();
      }
    }

    // cheering fans appear while a big combo is live
    if (run && run.tricks.chain >= 5) {
      const step = 800;
      for (let k = Math.floor(left / step); k <= Math.ceil(right / step); k++) {
        const x = this.worldToScreenX(k * step + 140);
        if (x < -80 || x > this.W + 80) continue;
        const gy = this.groundScreenY(k * step + 140);
        ctx.save();
        ctx.translate(x, gy);
        ctx.scale(s, s);
        drawFans(ctx, 0, -8, map.fansColors, true, this.t + k);
        ctx.restore();
      }
    }

    // map-specific Easter egg props sprinkled every ~4100 units
    for (let k = Math.floor(left / 4100); k <= Math.ceil(right / 4100); k++) {
      const wx = k * 4100 + 2100;
      const x = this.worldToScreenX(wx);
      if (x < -140 || x > this.W + 140) continue;
      const gy = this.groundScreenY(wx);
      ctx.save();
      ctx.translate(x, gy);
      ctx.scale(s, s);
      map.drawEgg(ctx, 0, 0, this.t);
      ctx.restore();
    }

    // background jumbotron flashing HOME TEAM WINS
    if (map.id !== 'championship-circuit') {
      const step = 3200;
      for (let k = Math.floor(left / step); k <= Math.ceil(right / step); k++) {
        const wx = k * step + 900;
        const x = this.worldToScreenX(wx);
        if (x < -120 || x > this.W + 120) continue;
        ctx.save();
        ctx.translate(x, this.baseGroundY - 236 * s);
        ctx.scale(s, s);
        drawJumbotron(ctx, 0, 0, 130, 62, Math.floor(this.t * 60) + k, map.palette.accent);
        ctx.restore();
      }
    }

    // background Zamboni crossing a back street at random intervals
    this.updateZamboni(dt, map, run);
  }

  updateZamboni(dt, map, run) {
    if (!dt) return;
    if (this.zam) {
      this.zam.x += this.zam.v * dt;
      if (this.zam.x < this.camX - 900 || this.zam.x > this.camX + 2400) this.zam = null;
    } else {
      this.nextZam -= dt;
      if (this.nextZam <= 0) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        this.zam = { x: dir > 0 ? this.camX - 500 : this.camX + 1800, v: dir * 46, dir };
        this.nextZam = 45 + Math.random() * 45;
      }
    }
    if (this.zam && run) {
      const ctx = this.ctx;
      const x = this.worldToScreenX(this.zam.x);
      const y = this.baseGroundY - 118 * this.s;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(this.s, this.s);
      drawZamboni(ctx, 0, 0, this.zam.dir, map.palette.mid, map.palette.accent);
      ctx.restore();
    }
  }

  // ---- Hazard zone visuals -----------------------------------------------------

  drawZones(run, map) {
    const ctx = this.ctx;
    for (const z of run.zones) {
      if (z.x1 < this.camX - 500 || z.x0 > this.camX + 1400) continue;
      const x0 = this.worldToScreenX(z.x0);
      const x1 = this.worldToScreenX(z.x1);
      if (z.type === 'slick') {
        ctx.fillStyle = 'rgba(120,180,230,0.16)';
        ctx.beginPath();
        ctx.ellipse((x0 + x1) / 2, this.baseGroundY, (x1 - x0) / 2, 10 * this.s, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (z.type === 'vent') {
        ctx.fillStyle = map.palette.dark;
        for (let x = x0; x < x1; x += 22 * this.s) ctx.fillRect(x, this.baseGroundY - 4 * this.s, 12 * this.s, 6 * this.s);
        const ph = (this.t * 1.7) % 1;
        ctx.fillStyle = `rgba(220,225,235,${0.3 * (1 - ph)})`;
        ctx.beginPath();
        ctx.ellipse((x0 + x1) / 2, this.baseGroundY - 20 * this.s - ph * 60 * this.s, 26 * this.s + ph * 30 * this.s, 14 * this.s + ph * 18 * this.s, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (z.type === 'gust') {
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 2 * this.s;
        for (let i = 0; i < 3; i++) {
          const yy = this.baseGroundY - (50 + i * 34) * this.s;
          const ph = (this.t * 2.2 + i * 0.4) % 1;
          ctx.beginPath();
          ctx.moveTo(x0 + ph * (x1 - x0), yy);
          ctx.quadraticCurveTo(x0 + ph * (x1 - x0) + 30 * this.s, yy - 8 * this.s, x0 + ph * (x1 - x0) + 60 * this.s, yy);
          ctx.stroke();
        }
      }
    }
  }

  // ---- Ground -------------------------------------------------------------------

  drawGround(map) {
    const ctx = this.ctx;
    const s = this.s;
    const step = 14 / 1; // world units per segment
    const left = this.camX - (this.W * CAM_OFFSET) / s - 60;
    const right = this.camX + (this.W * (1 - CAM_OFFSET)) / s + 60;
    ctx.fillStyle = map.palette.ground;
    ctx.beginPath();
    ctx.moveTo(0, this.H);
    let first = true;
    for (let x = left; x <= right; x += step) {
      const sx = this.worldToScreenX(x);
      const sy = this.groundScreenY(x);
      if (first) { ctx.moveTo(sx, sy); first = false; } else ctx.lineTo(sx, sy);
    }
    ctx.lineTo(this.W, this.H);
    ctx.closePath();
    ctx.fill();
    // top edge line
    ctx.strokeStyle = map.palette.groundLine;
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    first = true;
    for (let x = left; x <= right; x += step) {
      const sx = this.worldToScreenX(x);
      const sy = this.groundScreenY(x);
      if (first) { ctx.moveTo(sx, sy); first = false; } else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    // surface style detail
    if (map.groundStyle === 'cobble') {
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1.4 * s;
      const off = left % 26;
      for (let x = left - off; x < right; x += 26) {
        const sx = this.worldToScreenX(x);
        const sy = this.groundScreenY(x);
        ctx.beginPath();
        ctx.moveTo(sx, sy + 4 * s);
        ctx.lineTo(sx + 9 * s, sy + 16 * s);
        ctx.stroke();
      }
    } else if (map.groundStyle === 'arena') {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let x = left - (left % 40); x < right; x += 40) {
        ctx.fillRect(this.worldToScreenX(x), this.groundScreenY(x) + 8 * s, 18 * s, 5 * s);
      }
    } else if (map.groundStyle === 'prairie') {
      ctx.strokeStyle = 'rgba(190,200,140,0.14)';
      ctx.lineWidth = 2 * s;
      for (let x = left - (left % 60); x < right; x += 60) {
        const sx = this.worldToScreenX(x);
        const sy = this.groundScreenY(x);
        ctx.beginPath();
        ctx.moveTo(sx, sy + 6 * s);
        ctx.lineTo(sx + 5 * s, sy + 18 * s);
        ctx.stroke();
      }
    } else {
      // asphalt: dashed centerline
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      for (let x = left - (left % 90); x < right; x += 90) {
        ctx.fillRect(this.worldToScreenX(x), this.groundScreenY(x) + 20 * s, 34 * s, 4 * s);
      }
    }
  }

  // ---- World objects: pucks ------------------------------------------------------

  drawWorldObjects(run, map) {
    void map;
    for (const p of run.pucks) {
      if (p.collected) continue;
      const x = this.worldToScreenX(p.x);
      if (x < -40 || x > this.W + 40) continue;
      const gy = this.groundScreenY(p.x);
      drawPuck(this.ctx, x, gy - p.h * this.s, this.t);
    }
  }

  // ---- Bike + rider ----------------------------------------------------------------

  drawBikeRider(phys, loadout, pose, map) {
    const ctx = this.ctx;
    const s = this.s;
    const x = this.worldToScreenX(phys.x);
    const gy = this.groundScreenY(phys.x);
    const slopeDeg = groundSlope(this.map, phys.x) * 180 / Math.PI;
    const spin = phys.x / WHEEL_R;
    ctx.save();
    ctx.translate(x, gy);
    ctx.scale(s, s);
    // rotate about the rear contact patch; screen-y is down so negate angles
    ctx.rotate(-(phys.angle + slopeDeg) * Math.PI / 180);
    drawBike(ctx, loadout, pose, spin, 0);
    ctx.restore();
    void map;
  }

  drawCrash(phys, run, loadout, dt) {
    void dt;
    const ctx = this.ctx;
    const s = this.s;
    const t = run.crashT;
    // bike: tipped over, sliding
    const bx = this.worldToScreenX(phys.x + Math.min(t * 140, 90));
    const gy = this.groundScreenY(phys.x);
    ctx.save();
    ctx.translate(bx, gy);
    ctx.scale(s, s);
    ctx.rotate(-Math.min(1.45, t * 3.4));
    drawBike(ctx, loadout, null, phys.x / WHEEL_R + t * 4, 1);
    ctx.restore();
    // rider: tumbling ragdoll
    const rx = this.worldToScreenX(phys.x + 40 + t * 190);
    const ry = gy - Math.max(0, 120 * t * 3 - 0.5 * 900 * t * t) * s - 20 * s;
    ctx.save();
    ctx.translate(rx, Math.min(ry, gy - 14 * s));
    ctx.scale(s, s);
    ctx.rotate(t * 7.5);
    drawRider(ctx, loadout.jersey, 'ragdoll', 0);
    ctx.restore();
    // dust particles
    if (Math.random() < 0.5) {
      run.particles.push({
        x: phys.x + 20 + Math.random() * 60,
        y: -4,
        vx: -60 - Math.random() * 80,
        vy: -60 - Math.random() * 90,
        life: 0.7,
        size: 3 + Math.random() * 4,
        color: 'rgba(180,175,165,0.6)',
      });
    }
  }

  // ---- Particles -------------------------------------------------------------------

  updateParticles(run, dt) {
    for (let i = run.particles.length - 1; i >= 0; i--) {
      const p = run.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      if (p.life <= 0) run.particles.splice(i, 1);
    }
  }

  drawParticles(run) {
    const ctx = this.ctx;
    for (const p of run.particles) {
      const x = this.worldToScreenX(p.x);
      const y = this.groundScreenY(p.x) + p.y * this.s;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, p.size * this.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// ---- Local street furniture (design units, origin at ground line) ---------------

function lampPostLocal(ctx, map, t, k) {
  ctx.strokeStyle = map.palette.dark;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -132);
  ctx.quadraticCurveTo(0, -146, 18, -146);
  ctx.stroke();
  const glowColor = map.night ? map.palette.accent : 'rgba(255,240,190,0.9)';
  const on = map.night || Math.sin(k * 1.3) > 0.2;
  if (on) {
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.ellipse(20, -142, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    const gr = ctx.createRadialGradient(20, -140, 2, 20, -140, 44);
    gr.addColorStop(0, glowColor);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = map.night ? 0.4 : 0.16;
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(20, -140, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  void t;
}

// ---- Bike + rider vector art (design units) ---------------------------------------

export function drawBike(ctx, loadout, pose, wheelSpin, wrecked) {
  const bike = loadout.bike;
  const P = bike.paint;
  ctx.lineCap = 'round';

  // wheels
  for (const wx of [0, WHEELBASE]) {
    ctx.fillStyle = '#15171b';
    ctx.beginPath();
    ctx.arc(wx, -WHEEL_R, WHEEL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c3037';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wx, -WHEEL_R, WHEEL_R - 3.5, 0, Math.PI * 2);
    ctx.stroke();
    // spokes
    ctx.strokeStyle = '#4a5058';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const a = wheelSpin + (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(wx - Math.cos(a) * (WHEEL_R - 4), -WHEEL_R - Math.sin(a) * (WHEEL_R - 4));
      ctx.lineTo(wx + Math.cos(a) * (WHEEL_R - 4), -WHEEL_R + Math.sin(a) * (WHEEL_R - 4));
      ctx.stroke();
    }
  }

  // frame
  ctx.strokeStyle = P.frame;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -WHEEL_R);
  ctx.lineTo(16, -22);
  ctx.lineTo(30, -24);
  ctx.moveTo(16, -22);
  ctx.lineTo(10, -34);
  ctx.moveTo(30, -24);
  ctx.lineTo(WHEELBASE, -WHEEL_R);
  ctx.stroke();
  // fork + handlebar
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(WHEELBASE, -WHEEL_R);
  ctx.lineTo(WHEELBASE - 8, -34);
  ctx.lineTo(WHEELBASE - 2, -38);
  ctx.stroke();
  // swingarm
  ctx.beginPath();
  ctx.moveTo(0, -WHEEL_R);
  ctx.lineTo(14, -24);
  ctx.stroke();

  // seat + tank
  ctx.fillStyle = P.seat;
  rrFill(ctx, 4, -38, 16, 6, 3);
  ctx.fillStyle = P.body;
  rrFill(ctx, 18, -34, 20, 9, 4);
  ctx.fillStyle = P.accent;
  ctx.fillRect(20, -32, 16, 2);

  // fender: zamboni-brush special
  if (bike.fender === 'zamboni') {
    ctx.fillStyle = '#dfe8f5';
    rrFill(ctx, -8, -34, 22, 12, 6);
    ctx.fillStyle = '#8fb0d8';
    ctx.fillRect(-6, -26, 18, 3);
  } else if (bike.fender === 'chrome') {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    rrFill(ctx, -6, -32, 18, 9, 4);
  } else {
    ctx.fillStyle = P.frame;
    rrFill(ctx, -6, -30, 16, 7, 3);
  }

  // decal sticker
  if (loadout.decal) {
    ctx.fillStyle = loadout.decal.color;
    ctx.beginPath();
    ctx.arc(24, -30, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(24, -30, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // grip tape pattern on the deck (easter egg detail)
  if (bike.gripTape === 'hockeystick') {
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(6 + i * 5, -37);
      ctx.lineTo(9 + i * 5, -32);
      ctx.stroke();
    }
  } else if (bike.gripTape === 'gold') {
    ctx.fillStyle = 'rgba(255,226,122,0.7)';
    ctx.fillRect(5, -36, 14, 1.6);
  }

  if (!wrecked) drawRider(ctx, loadout.jersey, pose, 0);
}

function drawRider(ctx, jersey, pose, variant) {
  const J = jersey || { torso: '#8a9099', trim: '#d7dbe0', helmet: '#20242a' };
  ctx.lineCap = 'round';
  // legs (dark pants)
  ctx.strokeStyle = '#1c1f24';
  ctx.lineWidth = 5.5;
  const hips = { x: 10, y: -40 };
  if (pose === 'ragdoll') {
    const flail = Math.sin(variant * 9) * 6;
    ctx.beginPath();
    ctx.moveTo(hips.x, hips.y);
    ctx.lineTo(hips.x - 8 + flail, hips.y + 14);
    ctx.moveTo(hips.x, hips.y);
    ctx.lineTo(hips.x + 10 - flail, hips.y + 12);
    ctx.stroke();
    // torso
    ctx.strokeStyle = J.torso;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(hips.x, hips.y);
    ctx.lineTo(hips.x + 4, hips.y - 13);
    ctx.stroke();
    // arms flail
    ctx.strokeStyle = J.torso;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(hips.x + 3, hips.y - 11);
    ctx.lineTo(hips.x + 14 + flail, hips.y - 4);
    ctx.moveTo(hips.x + 3, hips.y - 11);
    ctx.lineTo(hips.x - 6 - flail, hips.y - 18);
    ctx.stroke();
    ctx.fillStyle = J.helmet;
    ctx.beginPath();
    ctx.arc(hips.x + 5, hips.y - 20, 5.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (pose === 'seat') {
    // standing on the pegs
    ctx.beginPath();
    ctx.moveTo(hips.x, hips.y + 4);
    ctx.lineTo(14, -26);
    ctx.moveTo(hips.x, hips.y + 4);
    ctx.lineTo(20, -26);
    ctx.stroke();
  } else if (pose === 'knee') {
    ctx.beginPath();
    ctx.moveTo(hips.x, hips.y);
    ctx.lineTo(20, -26);
    ctx.moveTo(hips.x, hips.y);
    ctx.lineTo(0, -14);   // knee out dragging
    ctx.lineTo(-2, -6);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(hips.x, hips.y);
    ctx.lineTo(14, -26);
    ctx.moveTo(hips.x, hips.y);
    ctx.lineTo(18, -26);
    ctx.stroke();
  }
  // torso leaning forward
  const shoulder = pose === 'seat' ? { x: 12, y: -62 } : { x: 18, y: -54 };
  ctx.strokeStyle = J.torso;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(hips.x, hips.y);
  ctx.lineTo(shoulder.x, shoulder.y);
  ctx.stroke();
  // trim stripe
  ctx.strokeStyle = J.trim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hips.x + 1, hips.y - 3);
  ctx.lineTo(shoulder.x + 1, shoulder.y - 3);
  ctx.stroke();
  // arms
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = J.torso;
  if (pose === 'nohand') {
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(shoulder.x - 4, shoulder.y - 14);
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(shoulder.x + 8, shoulder.y - 12);
    ctx.stroke();
  } else if (pose === 'hand') {
    // one hand dragging low, one on the bar
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(6, -8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(WHEELBASE - 2, -38);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(WHEELBASE - 2, -38);
    ctx.stroke();
  }
  // helmet + visor
  ctx.fillStyle = J.helmet;
  ctx.beginPath();
  ctx.arc(shoulder.x + 4, shoulder.y - 8, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(160,200,230,0.8)';
  ctx.fillRect(shoulder.x + 4, shoulder.y - 10, 7, 3);
}

function rrFill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  const rad = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
  ctx.fill();
}
