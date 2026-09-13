// Wheelie League - synthesized audio (WebAudio, no external assets).
// Engine drone tied to throttle, SFX stingers, and a small step-sequencer
// music loop whose scale/timbre/bpm give each city its own night atmosphere.

export class AudioEngine {
  constructor(settings) {
    this.enabled = { music: settings.music, sfx: settings.sfx };
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.engine = null;
    this.music = null;
    this.unlocked = false;
  }

  // Must be called from a user gesture (autoplay policy).
  unlock() {
    if (this.unlocked) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.enabled.music ? 0.30 : 0;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.enabled.sfx ? 0.8 : 0;
    this.sfxGain.connect(this.master);
    this.unlocked = true;
  }

  applySettings(s) {
    this.enabled = { music: s.music, sfx: s.sfx };
    if (this.musicGain) this.musicGain.gain.value = s.music ? 0.30 : 0;
    if (this.sfxGain) this.sfxGain.gain.value = s.sfx ? 0.8 : 0;
  }

  // ---- Engine drone ---------------------------------------------------------

  startEngine() {
    if (!this.unlocked || this.engine) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 70;
    const sub = this.ctx.createOscillator();
    sub.type = 'square';
    sub.frequency.value = 46;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 320;
    filt.Q.value = 4;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    osc.connect(filt); sub.connect(filt); filt.connect(g); g.connect(this.sfxGain);
    osc.start(t); sub.start(t);
    this.engine = { osc, sub, filt, g };
  }

  stopEngine() {
    if (!this.engine) return;
    const t = this.ctx.currentTime;
    const e = this.engine;
    e.g.gain.setTargetAtTime(0, t, 0.08);
    setTimeout(() => { try { e.osc.stop(); e.sub.stop(); } catch (err) { /* already stopped */ } }, 400);
    this.engine = null;
  }

  updateEngine(speedFrac, throttle, braking) {
    if (!this.engine || !this.ctx) return;
    const t = this.ctx.currentTime;
    const target = 62 + speedFrac * 150 + (throttle ? 34 : 0) - (braking ? 14 : 0);
    this.engine.osc.frequency.setTargetAtTime(target, t, 0.06);
    this.engine.sub.frequency.setTargetAtTime(target * 0.5, t, 0.06);
    this.engine.filt.frequency.setTargetAtTime(280 + speedFrac * 900 + (throttle ? 300 : 0), t, 0.08);
    this.engine.g.gain.setTargetAtTime(0.05 + speedFrac * 0.05, t, 0.1);
  }

  // ---- SFX ------------------------------------------------------------------

  blip(freq, dur, type, gain, when) {
    if (!this.unlocked) return;
    const t = (when || this.ctx.currentTime);
    const o = this.ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain || 0.25, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  coin() {
    this.blip(1318, 0.09, 'sine', 0.22);
    this.blip(1975, 0.14, 'sine', 0.2, this.unlocked ? this.ctx.currentTime + 0.07 : 0);
  }

  bigCoin() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    [659, 830, 987, 1318].forEach((f, i) => this.blip(f, 0.16, 'triangle', 0.24, t + i * 0.07));
  }

  swoosh() {
    if (!this.unlocked) return;
    const t = this.ctx.currentTime;
    const buf = this.noiseBuf();
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1.6;
    f.frequency.setValueAtTime(500, t);
    f.frequency.exponentialRampToValueAtTime(3400, t + 0.22);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t); src.stop(t + 0.35);
  }

  trickLand(chain) {
    const base = 523 * Math.pow(1.0595, Math.min(chain, 12));
    this.blip(base, 0.12, 'square', 0.16);
    this.blip(base * 1.5, 0.16, 'square', 0.14, this.ctx ? this.ctx.currentTime + 0.08 : 0);
  }

  crash() {
    if (!this.unlocked) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1800, t);
    f.frequency.exponentialRampToValueAtTime(120, t + 0.5);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t); src.stop(t + 0.65);
    this.blip(72, 0.4, 'sine', 0.4);
  }

  paAnnounce() {
    // Arena-PA style brass stinger for milestones.
    const t = this.ctx ? this.ctx.currentTime : 0;
    const seq = [[392, 0], [392, 0.12], [523, 0.24], [659, 0.4], [784, 0.55]];
    for (const [f, d] of seq) this.blip(f, 0.22, 'square', 0.14, t + d);
  }

  cheer() {
    if (!this.unlocked) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf(1.4);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1100;
    f.Q.value = 0.6;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t); src.stop(t + 1.4);
  }

  click() {
    this.blip(880, 0.05, 'square', 0.08);
  }

  noiseBuf(seconds) {
    const dur = seconds || 0.6;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ---- Music sequencer ------------------------------------------------------
  // cfg: { bpm, root, mode:'major'|'minor'|'dorian'|'mixo', bass:[steps 0/1],
  //        chords:[[degree...]] per bar, lead:[degree or -1 per step], wave, swing }

  startMusic(cfg) {
    this.stopMusic();
    if (!this.unlocked) return;
    this.music = { cfg, step: 0, nextTime: this.ctx.currentTime + 0.1, timer: null };
    this.music.timer = setInterval(() => this.scheduleMusic(), 60);
  }

  stopMusic() {
    if (this.music && this.music.timer) clearInterval(this.music.timer);
    this.music = null;
  }

  scaleNote(cfg, degree) {
    const scales = {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      mixo: [0, 2, 4, 5, 7, 9, 10],
      penta: [0, 3, 5, 7, 10],
    };
    const sc = scales[cfg.mode] || scales.minor;
    const n = sc[((degree % sc.length) + sc.length) % sc.length];
    const oct = Math.floor(degree / sc.length);
    return cfg.root * Math.pow(2, (n + oct * 12) / 12);
  }

  scheduleMusic() {
    if (!this.music || !this.ctx) return;
    const { cfg } = this.music;
    const stepDur = (60 / cfg.bpm) / 4;   // 16th notes
    while (this.music.nextTime < this.ctx.currentTime + 0.18) {
      const s = this.music.step;
      const t = this.music.nextTime;
      this.musicStep(cfg, s, t, stepDur);
      this.music.step = (s + 1) % 32;
      this.music.nextTime += stepDur;
    }
  }

  musicStep(cfg, step, t, stepDur) {
    if (!this.musicGain) return;
    const m = (deg, d, type, gain, dest) => {
      const o = this.ctx.createOscillator();
      o.type = type;
      o.frequency.value = this.scaleNote(cfg, deg);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(dest);
      o.start(t); o.stop(t + d + 0.03);
    };
    // Bass every 8th, root-ish pattern
    if (step % 2 === 0) {
      const pat = cfg.bass;
      const deg = pat[(step / 2) % pat.length];
      if (deg >= 0) m(deg, stepDur * 1.7, cfg.bassWave || 'triangle', 0.5, this.musicGain);
    }
    // Chord pad on bar change
    if (step % 8 === 0) {
      const chord = cfg.chords[(step / 8) % cfg.chords.length];
      for (const deg of chord) m(deg + 7, stepDur * 7, cfg.padWave || 'sine', 0.10, this.musicGain);
    }
    // Lead pattern
    if (cfg.lead) {
      const deg = cfg.lead[step % cfg.lead.length];
      if (deg >= 0) m(deg + 7, stepDur * 1.4, cfg.leadWave || 'square', 0.09, this.musicGain);
    }
    // Drums: kick on quarters, hat on off-8ths
    if (cfg.drums) {
      if (step % 8 === 0) {
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(130, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.1);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        o.connect(g); g.connect(this.musicGain);
        o.start(t); o.stop(t + 0.16);
      }
      if (step % 4 === 2) {
        const len = Math.floor(this.ctx.sampleRate * 0.03);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.value = 0.12;
        src.connect(g); g.connect(this.musicGain);
        src.start(t);
      }
    }
  }
}
