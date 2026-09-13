// Wheelie League - trick inputs and combo system (spec 2).
// A trick is only attemptable while holding a wheelie. While active it narrows
// the effective safe window (balance risk) and noise-torques the bike; landing
// one pays score/coins scaled by the current combo multiplier and extends it.

export const TRICKS = [
  { id: 'knee', name: 'Knee Drag', short: 'KNEE', key: 'w', dur: 0.9, risk: 0.35, score: 120, coins: 14, pose: 'knee' },
  { id: 'hand', name: 'Hand Drag', short: 'HAND', key: 's', dur: 1.1, risk: 0.5, score: 200, coins: 22, pose: 'hand' },
  { id: 'seat', name: 'Seat Stand', short: 'SEAT', key: 'e', dur: 1.4, risk: 0.65, score: 320, coins: 34, pose: 'seat' },
  { id: 'nohand', name: 'No-Hander', short: 'NO-HAND', key: 'r', dur: 1.8, risk: 0.8, score: 500, coins: 50, pose: 'nohand' },
];

export function trickById(id) {
  return TRICKS.find((t) => t.id === id) || null;
}

export class TrickSystem {
  constructor() {
    this.active = null;      // trick def currently being held
    this.t = 0;              // elapsed in current trick
    this.cooldown = 0;
    this.chain = 0;          // tricks landed since wheelie chain began
    this.peakChain = 0;
    this.tricksLanded = 0;
    this.score = 0;
    this.coinsEarned = 0;    // trick-sourced coins only
    this.landedThisRun = new Set();
    this.events = [];
  }

  reset() {
    this.active = null;
    this.t = 0;
    this.cooldown = 0;
    this.chain = 0;
    this.peakChain = 0;
    this.tricksLanded = 0;
    this.score = 0;
    this.coinsEarned = 0;
    this.landedThisRun = new Set();
    this.events = [];
  }

  // Combo multiplier: 1 + 0.5 per chained trick, capped at 10x.
  multiplier() {
    return Math.min(1 + 0.5 * this.chain, 10);
  }

  press(id) {
    if (this.active || this.cooldown > 0) return false;
    const def = trickById(id);
    if (!def) return false;
    this.active = def;
    this.t = 0;
    return true;
  }

  // Called every physics frame while the front wheel is up.
  update(dt, rng) {
    const ev = [];
    if (this.cooldown > 0) this.cooldown -= dt;
    if (!this.active) return ev;
    this.t += dt;
    if (this.t >= this.active.dur) {
      // Landed.
      this.chain += 1;
      this.peakChain = Math.max(this.peakChain, this.chain);
      this.tricksLanded += 1;
      const mult = this.multiplier();
      const gainedScore = Math.round(this.active.score * mult);
      const firstBonus = this.landedThisRun.has(this.active.id) ? 0 : Math.round(this.active.coins * 0.5);
      this.landedThisRun.add(this.active.id);
      const gainedCoins = Math.round((this.active.coins + firstBonus) * mult);
      this.score += gainedScore;
      this.coinsEarned += gainedCoins;
      ev.push({ type: 'trickLanded', trick: this.active, score: gainedScore, coins: gainedCoins, chain: this.chain, mult });
      this.active = null;
      this.cooldown = 0.35;
    }
    return ev;
  }

  // Wheel touched down or crash: the chain dies.
  breakChain() {
    const had = this.chain > 0 || !!this.active;
    if (this.active) this.active = null;
    this.chain = 0;
    return had;
  }

  // Risk feedback for physics: extra noise torque and narrowed safe band.
  riskState() {
    if (!this.active) return { noise: 0, bandNarrow: 0, progress: 0 };
    const p = this.t / this.active.dur;
    // Risk ramps in mid-trick where the pose is most exposed.
    const ramp = Math.sin(Math.min(1, p) * Math.PI);
    return {
      noise: this.active.risk * ramp,
      bandNarrow: this.active.risk * ramp,
      progress: p,
    };
  }
}
