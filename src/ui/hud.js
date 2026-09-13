// Wheelie League - in-run HUD (canvas-drawn) + mobile touch controls.

export class Hud {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.popups = [];
    this.banner = null;
    this.sweetGlow = 0;
    this.wireTouchControls();
  }

  reset() {
    this.popups = [];
    this.banner = null;
    this.sweetGlow = 0;
  }

  popup(text, sub, color) {
    this.popups.push({ text, sub: sub || '', t: 0, color: color || '#ffd75e' });
    if (this.popups.length > 4) this.popups.shift();
  }

  showBanner(text, sub, color) {
    this.banner = { text, sub: sub || '', t: 0, color: color || '#ffd75e' };
  }

  update(dt) {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].t += dt;
      if (this.popups[i].t > 2.2) this.popups.splice(i, 1);
    }
    if (this.banner) {
      this.banner.t += dt;
      if (this.banner.t > 2.6) this.banner = null;
    }
  }

  draw(ctx, run, map) {
    const phys = run.physics;
    const W = this.game.renderer.W;
    const H = this.game.renderer.H;
    const s = this.game.renderer.s;
    const pal = map.palette;
    ctx.save();
    ctx.textBaseline = 'alphabetic';

    // distance (top center)
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(10,12,16,0.55)';
    ctx.fillRect(W / 2 - 62 * s, 12 * s, 124 * s, 54 * s);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${27 * s}px system-ui, sans-serif`;
    ctx.fillText(`${Math.round(phys.distance)} m`, W / 2, 38 * s);
    ctx.font = `${11.5 * s}px system-ui, sans-serif`;
    ctx.fillStyle = pal.accent;
    ctx.fillText(map.name, W / 2, 56 * s);

    // coins (top right)
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(10,12,16,0.55)';
    ctx.fillRect(W - 130 * s, 12 * s, 118 * s, 40 * s);
    ctx.fillStyle = '#ffd75e';
    ctx.font = `bold ${20 * s}px system-ui, sans-serif`;
    ctx.fillText(`${run.bank.grossRounded()}`, W - 22 * s, 39 * s);
    drawCoinIcon(ctx, W - 112 * s, 32 * s, 9 * s);
    if (run.bank.sessionMultiplier > 1) {
      ctx.fillStyle = '#7ae05c';
      ctx.font = `bold ${11 * s}px system-ui, sans-serif`;
      ctx.fillText('DAILY 1.25x', W - 22 * s, 64 * s);
    }

    // speed (bottom left, above touch controls)
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(10,12,16,0.55)';
    ctx.fillRect(12 * s, H - 64 * s, 118 * s, 44 * s);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${19 * s}px system-ui, sans-serif`;
    ctx.fillText(`${Math.round(phys.speedMps * 3.6)} km/h`, 22 * s, H - 36 * s);

    // combo (top left)
    const chain = run.tricks.chain;
    const mult = run.tricks.multiplier();
    ctx.fillStyle = 'rgba(10,12,16,0.55)';
    ctx.fillRect(12 * s, 12 * s, 118 * s, chain > 0 ? 72 * s : 40 * s);
    ctx.fillStyle = chain >= 5 ? '#ff9d5c' : '#fff';
    ctx.font = `bold ${17 * s}px system-ui, sans-serif`;
    ctx.fillText(`COMBO x${mult.toFixed(1)}`, 22 * s, 38 * s);
    if (chain > 0) {
      ctx.font = `${12.5 * s}px system-ui, sans-serif`;
      ctx.fillStyle = '#c9ced6';
      ctx.fillText(`chain ${chain}  best ${run.tricks.peakChain}`, 22 * s, 58 * s);
      // combo timer bar
      ctx.fillStyle = '#ff9d5c';
      ctx.fillRect(22 * s, 66 * s, 96 * s, 5 * s);
    }

    // balance meter (right side vertical)
    const meterX = W - 44 * s;
    const meterH = Math.min(300 * s, H * 0.34);
    const meterY = H / 2 - meterH / 2;
    ctx.fillStyle = 'rgba(10,12,16,0.55)';
    ctx.fillRect(meterX - 10 * s, meterY - 10 * s, 40 * s, meterH + 20 * s);
    ctx.fillStyle = '#1d232b';
    ctx.fillRect(meterX, meterY, 20 * s, meterH);
    // sweet band
    const ang2y = (a) => meterY + meterH - (a / 90) * meterH;
    const [lo, hi] = phys.sweet;
    ctx.fillStyle = this.sweetGlow > 0 ? '#7ae05c' : 'rgba(122,224,92,0.55)';
    ctx.fillRect(meterX, ang2y(hi), 20 * s, ang2y(lo) - ang2y(hi));
    // danger zones
    ctx.fillStyle = 'rgba(255,90,60,0.4)';
    ctx.fillRect(meterX, ang2y(90), 20 * s, meterY + meterH - ang2y(90));
    // needle
    const ny = ang2y(Math.max(0, Math.min(90, phys.angle)));
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(meterX - 8 * s, ny);
    ctx.lineTo(meterX + 28 * s, ny - 7 * s);
    ctx.lineTo(meterX + 28 * s, ny + 7 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a9099';
    ctx.font = `${11 * s}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ANGLE', meterX + 10 * s, meterY - 16 * s);
    if (phys.inSweet) {
      this.sweetGlow = 0.4;
      ctx.fillStyle = '#7ae05c';
      ctx.font = `bold ${13 * s}px system-ui, sans-serif`;
      ctx.fillText('PERFECT', meterX + 10 * s, meterY + meterH + 24 * s);
    }
    this.sweetGlow = Math.max(0, this.sweetGlow - 0.02);

    // trick progress arc
    const active = run.tricks.active;
    if (active) {
      const r = run.tricks.riskState();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 8 * s;
      ctx.arc(W / 2, H * 0.42, 46 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ff9d5c';
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.42, 46 * s, -Math.PI / 2, -Math.PI / 2 + r.progress * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${16 * s}px system-ui, sans-serif`;
      ctx.fillText(active.name.toUpperCase(), W / 2, H * 0.42 + 6 * s);
    }

    // popups (center, rising)
    ctx.textAlign = 'center';
    this.popups.forEach((p, i) => {
      const a = p.t < 0.15 ? p.t / 0.15 : Math.max(0, 1 - (p.t - 1.4) / 0.8);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.font = `bold ${24 * s}px system-ui, sans-serif`;
      ctx.fillText(p.text, W / 2, H * 0.3 - i * 34 * s - p.t * 18 * s);
      if (p.sub) {
        ctx.font = `${14 * s}px system-ui, sans-serif`;
        ctx.fillStyle = '#e8e8e8';
        ctx.fillText(p.sub, W / 2, H * 0.3 + 20 * s - i * 34 * s - p.t * 18 * s);
      }
      ctx.globalAlpha = 1;
    });

    // milestone banner (big center flash)
    if (this.banner) {
      const b = this.banner;
      const a = b.t < 0.2 ? b.t / 0.2 : Math.max(0, 1 - (b.t - 1.8) / 0.8);
      const scale = 1 + Math.max(0, 0.25 - b.t) * 2;
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(10,12,16,0.6)';
      ctx.fillRect(W * 0.1, H * 0.2, W * 0.8, 88 * s);
      ctx.save();
      ctx.translate(W / 2, H * 0.2 + 44 * s);
      ctx.scale(scale, scale);
      ctx.fillStyle = b.color;
      ctx.font = `bold ${30 * s}px system-ui, sans-serif`;
      ctx.fillText(b.text, 0, 0);
      if (b.sub) {
        ctx.fillStyle = '#fff';
        ctx.font = `${16 * s}px system-ui, sans-serif`;
        ctx.fillText(b.sub, 0, 28 * s);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // ---- Touch controls ---------------------------------------------------------

  wireTouchControls() {
    const wrap = document.getElementById('touch-controls');
    if (!wrap) return;
    const bind = (id, down, up) => {
      const el = document.getElementById(id);
      if (!el) return;
      const on = (e) => { e.preventDefault(); el.classList.add('pressed'); down(); };
      const off = (e) => {
        if (e) e.preventDefault();
        el.classList.remove('pressed');
        up();
      };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('pointerleave', off);
    };
    const g = this.game;
    bind('tc-throttle', () => g.input.throttle = true, () => g.input.throttle = false);
    bind('tc-brake', () => g.input.brake = true, () => g.input.brake = false);
    for (const [id, trick] of [['tc-knee', 'knee'], ['tc-hand', 'hand'], ['tc-seat', 'seat'], ['tc-nohand', 'nohand']]) {
      bind(id, () => g.queueTrick(trick), () => {});
    }
  }

  setVisible(v) {
    const wrap = document.getElementById('touch-controls');
    if (!wrap) return;
    const setting = this.game.save.settings.touchControls;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const show = v && (setting === 'on' || (setting === 'auto' && coarse));
    wrap.style.display = show ? 'flex' : 'none';
  }
}

function drawCoinIcon(ctx, x, y, r) {
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = r * 0.25;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();
}
