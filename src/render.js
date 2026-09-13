// Wheelie League - world and character rendering.
// Parallax sky/skyline/street layers per city, procedural bike + rider with
// trick poses, ragdoll crash, particles, and shared street furniture.

import { groundY, groundSlope, drawPuck, drawZamboni, drawJumbotron, drawFans, drawRefRider, milestoneGantry, checkpointFlag, mulberry32, hashStr } from './maps/mapUtils.js';
import { MILESTONES } from './economy.js';

const DESIGN_H = 800;      // render scale reference
const CAM_OFFSET = 0.30;   // bike sits 30% from the left edge
const WHEEL_R = 26;
const WHEELBASE = 80;
// Close-up camera like the reference wheelie games: the bike fills ~40% of
// the screen height. uiScale keeps DOM-anchored HUD sizes stable.
const ZOOM = 3;

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
    this.uiScale = (h * dpr) / DESIGN_H;
    this.s = this.uiScale * ZOOM;
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
        ctx.translate(x, this.baseGroundY - 150 * s);
        ctx.scale(s, s);
        drawJumbotron(ctx, 0, 0, 96, 46, Math.floor(this.t * 60) + k, map.palette.accent);
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
    drawBike(ctx, loadout, pose, spin, 0, phys.susp || 0);
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
    const rx = this.worldToScreenX(phys.x + 50 + t * 230);
    const ry = gy - Math.max(0, 150 * t * 3 - 0.5 * 900 * t * t) * s - 24 * s;
    ctx.save();
    ctx.translate(rx, Math.min(ry, gy - 18 * s));
    ctx.scale(s, s);
    ctx.rotate(t * 7.5);
    drawRider(ctx, loadout, 'ragdoll', t * 4);
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
// Origin: rear tire contact patch at (0,0). Rear wheel center (0,-WHEEL_R),
// front wheel center (WHEELBASE,-WHEEL_R). Art direction follows the reference
// wheelie games (SoFlo Wheelie Life): bold colored trellis frame as the star,
// dark bodywork, deep tires with colored rims, chunky spokes, thick inverted
// forks, and visible suspension that compresses on touchdown.

export function drawBike(ctx, loadout, pose, wheelSpin, wrecked, susp = 0) {
  const bike = loadout.bike;
  const P = bike.paint;
  const R = WHEEL_R;
  const drop = susp * 5;   // body sinks toward the wheels under compression
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  drawWheel(ctx, 0, -R, wheelSpin, bike.look, P, true);
  drawWheel(ctx, WHEELBASE, -R, wheelSpin, bike.look, P, false);

  // swingarm (thick) + chain run up to the pivot
  ctx.strokeStyle = '#23272e';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(32, -46 + drop);
  ctx.lineTo(2, -R + 1);
  ctx.stroke();
  ctx.strokeStyle = '#4a5058';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(4, -R - 5);
  ctx.lineTo(32, -50 + drop);
  ctx.moveTo(4, -R + 4);
  ctx.lineTo(31, -42 + drop);
  ctx.stroke();

  // bodywork drops with the suspension
  ctx.save();
  ctx.translate(0, drop);
  if (bike.look === 'fat') drawFatBody(ctx, bike, P);
  else if (bike.look === 'mx') drawMxBody(ctx, bike, P);
  else drawDirtBody(ctx, bike, P);
  ctx.restore();

  // inverted fork: fat dark upper tube fixed to the body (drops with it),
  // colored stanchion slides up inside on compression
  ctx.strokeStyle = '#1d2126';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(70, -62 + drop);
  ctx.lineTo(76, -44 + drop);
  ctx.stroke();
  ctx.strokeStyle = P.fork || '#c9a227';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(76, -44 + drop);
  ctx.lineTo(WHEELBASE, -R);
  ctx.stroke();
  // handlebar + crossbar
  ctx.strokeStyle = '#1d2126';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(70, -62 + drop);
  ctx.lineTo(61, -70 + drop);
  ctx.moveTo(67, -65 + drop);
  ctx.lineTo(72, -58 + drop);
  ctx.stroke();

  // rear shock: coil spring visibly bunches under compression
  drawShock(ctx, 30, -54 + drop, 13, -31, P.accent);

  // fender specials
  if (bike.fender === 'zamboni') {
    ctx.fillStyle = '#dfe8f5';
    rrFill(ctx, -16, -66, 40, 16, 7);
    ctx.fillStyle = '#8fb0d8';
    ctx.fillRect(-12, -56, 32, 4);
  } else if (bike.fender === 'chrome') {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    rrFill(ctx, -14, -62, 36, 14, 6);
    ctx.strokeStyle = 'rgba(120,130,145,0.8)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-10, -58, 28, 6);
  }

  // decal sticker on the battery/body
  if (loadout.decal) {
    ctx.fillStyle = loadout.decal.color;
    ctx.beginPath();
    ctx.arc(46, -52, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(46, -52, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // grip tape / league details near the pegs
  if (bike.gripTape === 'hockeystick') {
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(24 + i * 6, -52);
      ctx.lineTo(28 + i * 6, -44);
      ctx.stroke();
    }
  } else if (bike.gripTape === 'gold') {
    ctx.fillStyle = 'rgba(255,226,122,0.8)';
    ctx.fillRect(26, -50, 26, 2.4);
  }

  if (!wrecked) drawRider(ctx, loadout, pose, 0);
}

function drawWheel(ctx, cx, cy, spin, look, P, rear) {
  const fat = look === 'fat';
  const tireW = fat ? 15 : 11;         // deep black sidewall
  const rimR = WHEEL_R - tireW;
  // tire
  ctx.fillStyle = '#101216';
  ctx.beginPath();
  ctx.arc(cx, cy, WHEEL_R, 0, Math.PI * 2);
  ctx.arc(cx, cy, rimR, 0, Math.PI * 2, true);
  ctx.fill();
  // chunky knobs
  ctx.fillStyle = '#101216';
  for (let i = 0; i < 14; i++) {
    const a = spin + (i * Math.PI * 2) / 14;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * (WHEEL_R - 1), cy + Math.sin(a) * (WHEEL_R - 1));
    ctx.rotate(a);
    ctx.fillRect(-3, -2.6, 6, 5.2);
    ctx.restore();
  }
  // subtle sidewall highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, WHEEL_R - tireW / 2, 0, Math.PI * 2);
  ctx.stroke();
  // colored rim ring - the signature look
  ctx.strokeStyle = P.accent;
  ctx.lineWidth = fat ? 5.5 : 4.5;
  ctx.beginPath();
  ctx.arc(cx, cy, rimR - 2.5, 0, Math.PI * 2);
  ctx.stroke();
  // chunky mag spokes
  ctx.strokeStyle = '#23272e';
  ctx.lineWidth = fat ? 6 : 4.5;
  const spokes = fat ? 5 : 6;
  const spokeR = rimR - 5;
  for (let i = 0; i < spokes; i++) {
    const a = spin + (i * Math.PI * 2) / spokes;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * spokeR, cy + Math.sin(a) * spokeR);
    ctx.stroke();
  }
  // drilled brake disc
  const discX = cx + (rear ? 0 : 7);
  ctx.strokeStyle = '#9aa1aa';
  ctx.lineWidth = rear ? 1.6 : 2;
  ctx.beginPath();
  ctx.arc(discX, cy, rear ? 12 : 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#9aa1aa';
  for (let i = 0; i < 6; i++) {
    const a = spin * 0.5 + (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(discX + Math.cos(a) * 7.5, cy + Math.sin(a) * 7.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  // caliper
  ctx.fillStyle = P.accent;
  rrFill(ctx, cx + (rear ? 10 : 15), cy - 8, 7, 15, 3);
  // hub: bolted on the front, big hub motor on the rear (e-moto signature)
  if (rear) {
    ctx.fillStyle = '#1b1f24';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.accent;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#31363e';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#1b1f24';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a5058';
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 3.2, cy + Math.sin(a) * 3.2, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Coil-over shock drawn between two points; the coil zigzag naturally bunches
// as the endpoints squeeze together.
function drawShock(ctx, x1, y1, x2, y2, color) {
  ctx.strokeStyle = '#6a7078';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    const o = i % 2 ? 3.2 : -3.2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px + nx * o, py + ny * o);
  }
  ctx.stroke();
}

// Trail e-moto: bold trellis frame, dark battery box, long flat seat with a
// pointed tail, high fender, front number plate (the "light bee" silhouette).
function drawDirtBody(ctx, bike, P) {
  // bold trellis frame - the colored star of the bike
  ctx.strokeStyle = P.body;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(32, -46);
  ctx.lineTo(24, -66);
  ctx.lineTo(56, -62);
  ctx.closePath();
  ctx.moveTo(56, -62);
  ctx.lineTo(62, -48);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(32, -46);
  ctx.lineTo(46, -56);
  ctx.moveTo(46, -56);
  ctx.lineTo(41, -64);
  ctx.stroke();

  // controller box fills the lower trellis triangle
  ctx.fillStyle = P.frame;
  rrFill(ctx, 33, -56, 17, 9, 3);
  ctx.fillStyle = P.accent;
  ctx.beginPath();
  ctx.arc(46, -51.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // battery box (dark, sits inside the frame)
  ctx.fillStyle = P.frame;
  rrFill(ctx, 30, -66, 28, 12, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(32, -64, 24, 2);
  ctx.fillStyle = P.accent;
  ctx.fillRect(34, -57, 20, 2.2);

  // long flat seat with pointed tail
  ctx.fillStyle = P.seat;
  ctx.beginPath();
  ctx.moveTo(-4, -70);
  ctx.lineTo(36, -63);
  ctx.lineTo(33, -59);
  ctx.lineTo(2, -62);
  ctx.closePath();
  ctx.fill();

  // high front fender
  ctx.fillStyle = P.body;
  ctx.save();
  ctx.translate(80, -64);
  ctx.rotate(-0.14);
  rrFill(ctx, -12, 0, 30, 7, 3.5);
  ctx.restore();

  // front number plate
  ctx.fillStyle = '#e8e8e8';
  rrFill(ctx, 78, -60, 9, 20, 3);
  ctx.fillStyle = P.accent;
  ctx.fillRect(80, -52, 5, 2.4);
  void bike;
}

// Shrouded motocross e-moto: frame spine, radiator shroud wings, mid drive
// unit, long flat seat, low fender hugging the wheel.
function drawMxBody(ctx, bike, P) {
  // bold frame spine
  ctx.strokeStyle = P.body;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(30, -44);
  ctx.lineTo(42, -64);
  ctx.lineTo(62, -62);
  ctx.moveTo(62, -62);
  ctx.lineTo(74, -52);
  ctx.stroke();

  // mid drive unit
  ctx.fillStyle = '#1b1f24';
  rrFill(ctx, 32, -46, 20, 14, 5);
  ctx.fillStyle = '#31363e';
  ctx.fillRect(35, -42, 14, 3.5);

  // dark battery mass in the spine
  ctx.fillStyle = P.frame;
  rrFill(ctx, 30, -68, 36, 15, 6);

  // radiator shroud wings over the battery
  ctx.fillStyle = P.body;
  ctx.beginPath();
  ctx.moveTo(48, -70);
  ctx.lineTo(74, -60);
  ctx.lineTo(64, -48);
  ctx.lineTo(46, -54);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = P.accent;
  ctx.beginPath();
  ctx.moveTo(54, -67);
  ctx.lineTo(70, -60);
  ctx.lineTo(62, -52);
  ctx.lineTo(51, -56);
  ctx.closePath();
  ctx.fill();

  // long flat seat with pointed tail
  ctx.fillStyle = P.seat;
  ctx.beginPath();
  ctx.moveTo(-4, -69);
  ctx.lineTo(32, -64);
  ctx.lineTo(29, -60);
  ctx.lineTo(0, -62);
  ctx.closePath();
  ctx.fill();

  // low front fender hugging the wheel
  ctx.strokeStyle = P.body;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(WHEELBASE, -WHEEL_R, WHEEL_R + 7, -Math.PI * 0.78, -Math.PI * 0.18);
  ctx.stroke();

  // number plate
  ctx.fillStyle = '#e8e8e8';
  rrFill(ctx, 79, -58, 9, 19, 3);
  ctx.fillStyle = P.accent;
  ctx.fillRect(81, -50, 5, 2.4);
}

// Fat-tire street cruiser: bold frame loop, chunky battery tank box, long low
// bench, basher plate, stubby fender.
function drawFatBody(ctx, bike, P) {
  // bold frame loop
  ctx.strokeStyle = P.body;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(30, -44);
  ctx.lineTo(36, -66);
  ctx.lineTo(62, -66);
  ctx.moveTo(62, -66);
  ctx.lineTo(76, -52);
  ctx.stroke();

  // chunky battery tank box
  ctx.fillStyle = P.frame;
  rrFill(ctx, 34, -72, 30, 16, 6);
  ctx.fillStyle = P.accent;
  rrFill(ctx, 38, -68, 22, 5, 2.5);

  // long low bench seat
  ctx.fillStyle = P.seat;
  rrFill(ctx, 6, -68, 28, 9, 4.5);

  // basher plate under the motor
  ctx.fillStyle = '#23272e';
  rrFill(ctx, 28, -40, 30, 7, 3.5);

  // stubby fender
  ctx.strokeStyle = P.body;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(WHEELBASE, -WHEEL_R, WHEEL_R + 9, -Math.PI * 0.72, -Math.PI * 0.22);
  ctx.stroke();
  void bike;
}

function drawRider(ctx, loadout, pose, variant) {
  const J = (loadout && loadout.jersey) || { torso: '#8a9099', trim: '#d7dbe0' };
  const helmet = (loadout && loadout.helmet) || null;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const hips = { x: 20, y: -66 };
  const peg = { x: 30, y: -44 };
  const bar = { x: 64, y: -66 };

  if (pose === 'ragdoll') {
    const flail = Math.sin(variant * 9) * 8;
    // legs
    ctx.strokeStyle = '#1c1f24';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12 + flail, 16);
    ctx.moveTo(0, 0);
    ctx.lineTo(12 - flail, 14);
    ctx.stroke();
    // torso
    ctx.strokeStyle = J.torso;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(5, -18);
    ctx.stroke();
    // trim stripe
    ctx.strokeStyle = J.trim;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(1, -4);
    ctx.lineTo(6, -18);
    ctx.stroke();
    // arms flail
    ctx.strokeStyle = J.torso;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(4, -15);
    ctx.lineTo(18 + flail, -6);
    ctx.moveTo(4, -15);
    ctx.lineTo(-8 - flail, -24);
    ctx.stroke();
    drawHelmet(ctx, 7, -28, 8.5, helmet);
    return;
  }

  // legs (dark pants) to the pegs; trick poses move them
  ctx.strokeStyle = '#1c1f24';
  ctx.lineWidth = 7;
  if (pose === 'knee' || pose === 'knock') {
    // one leg on the peg, the other hangs out to the side
    ctx.beginPath();
    ctx.moveTo(hips.x, hips.y);
    ctx.lineTo(peg.x, peg.y);
    ctx.moveTo(hips.x, hips.y);
    if (pose === 'knock') {
      // knee punches forward toward the bar, foot back
      ctx.lineTo(52, -50);
      ctx.lineTo(58, -34);
    } else {
      // knee-out drag behind
      ctx.lineTo(-2, -44);
      ctx.lineTo(-6, -12);
    }
    ctx.stroke();
  } else if (pose === 'seat') {
    // standing tall on the pegs
    const stand = { x: 22, y: -74 };
    ctx.beginPath();
    ctx.moveTo(stand.x, stand.y);
    ctx.lineTo(peg.x - 4, peg.y);
    ctx.moveTo(stand.x, stand.y);
    ctx.lineTo(peg.x + 4, peg.y);
    ctx.stroke();
    hips.x = stand.x; hips.y = stand.y;
  } else {
    ctx.beginPath();
    ctx.moveTo(hips.x, hips.y);
    ctx.lineTo(peg.x - 3, peg.y);
    ctx.moveTo(hips.x, hips.y);
    ctx.lineTo(peg.x + 4, peg.y);
    ctx.stroke();
  }

  // torso leaning forward
  const shoulder = pose === 'seat' ? { x: hips.x + 4, y: hips.y - 30 } : { x: hips.x + 8, y: hips.y - 26 };
  ctx.strokeStyle = J.torso;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(hips.x, hips.y);
  ctx.lineTo(shoulder.x, shoulder.y);
  ctx.stroke();
  // trim stripe
  ctx.strokeStyle = J.trim;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(hips.x + 2, hips.y - 4);
  ctx.lineTo(shoulder.x + 2, shoulder.y - 4);
  ctx.stroke();

  // arms
  ctx.strokeStyle = J.torso;
  ctx.lineWidth = 6;
  if (pose === 'nohand') {
    // both arms thrown up
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(shoulder.x - 6, shoulder.y - 20);
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(shoulder.x + 12, shoulder.y - 18);
    ctx.stroke();
  } else if (pose === 'hand') {
    // one hand dragging on the ground, one on the bar
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(34, -6);
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(bar.x, bar.y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(bar.x, bar.y);
    ctx.stroke();
  }

  // helmet sits above the shoulders
  drawHelmet(ctx, shoulder.x + 7, shoulder.y - 12, 9.5, helmet);
}

function drawHelmet(ctx, x, y, r, helmet) {
  const H = helmet || { base: '#20242a', accent: '#20242a', visor: 'rgba(160,200,230,0.8)' };
  // shell
  ctx.fillStyle = H.base;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // finish effects
  if (H.finish === 'chrome') {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.3, y - r * 0.35, r * 0.38, r * 0.22, -0.7, 0, Math.PI * 2);
    ctx.fill();
  } else if (H.finish === 'gold') {
    ctx.fillStyle = 'rgba(255,240,180,0.5)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.3, y - r * 0.35, r * 0.36, r * 0.2, -0.7, 0, Math.PI * 2);
    ctx.fill();
  } else if (H.finish === 'mirror') {
    ctx.fillStyle = 'rgba(120,210,255,0.35)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // center stripe
  if (H.stripe) {
    ctx.strokeStyle = H.stripe;
    ctx.lineWidth = r * 0.34;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.15, y - r * 0.95);
    ctx.quadraticCurveTo(x + r * 0.25, y, x - r * 0.15, y + r * 0.95);
    ctx.stroke();
  }
  // accent trim
  ctx.strokeStyle = H.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r - 1, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  // visor opening
  ctx.fillStyle = H.visor;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.45, y - r * 0.1, r * 0.5, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20,24,30,0.55)';
  ctx.beginPath();
  ctx.ellipse(x + r * 0.55, y - r * 0.05, r * 0.32, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
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
