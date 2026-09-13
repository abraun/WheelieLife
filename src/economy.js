// Wheelie League - coin economy, XP, milestones and shop purchase logic (spec 3-5).

import { BIKES, JERSEYS, HELMETS, bikeById, jerseyById, helmetById } from './bikes.js';
import { levelFromXp, xpForLevel, loadSave, persist } from '../save/localStorageManager.js';

export const COINS_PER_METER_WHEELIE = 0.12;   // trickle while front wheel is up
export const PERFECT_COINS_PER_SEC = 5;        // sweet-spot hold bonus

export const MILESTONES = [
  { at: 100, coins: 60, line: 'FIRST HUNDRED! AND HE IS STILL GOING!' },
  { at: 250, coins: 100, line: 'QUARTER K! CROWD IS ON ITS FEET!' },
  { at: 500, coins: 175, line: 'FIVE HUNDRED METERS! UNREAL!' },
  { at: 750, coins: 250, line: 'HE MAKES IT LOOK EASY OUT THERE!' },
  { at: 1000, coins: 350, line: 'A FULL KILOMETER ON ONE WHEEL!' },
  { at: 1500, coins: 500, line: 'LEGENDS ARE MADE OUT HERE!' },
  { at: 2000, coins: 700, line: 'TWO KILOMETERS! CALL THE NEWSPAPERS!' },
  { at: 3000, coins: 1000, line: 'SOMEBODY CALL THE LEAGUE OFFICE!' },
];

export function milestoneFor(distance) {
  let m = null;
  for (const ms of MILESTONES) if (distance >= ms.at) m = ms;
  return m;
}

export function xpForMilestone(ms) {
  return Math.round(ms.coins * 0.3);
}

// ---- Run bank --------------------------------------------------------------

export class RunBank {
  constructor(sessionMultiplier) {
    this.sessionMultiplier = sessionMultiplier || 1;
    this.distanceCoins = 0;      // wheelie trickle
    this.trickCoins = 0;
    this.milestoneCoins = 0;
    this.perfectCoins = 0;
    this.gross = 0;
    this.penalty = 0;
    this.perfectTime = 0;        // seconds spent in the sweet spot
    this.wheelieDistance = 0;    // meters travelled while wheeled
    this.milestonesHit = [];
    this.trickScore = 0;
  }

  addWheelieMeters(meters) {
    this.wheelieDistance += meters;
    const c = meters * COINS_PER_METER_WHEELIE;
    this.distanceCoins += c;
    this.gross += c;
  }

  addPerfectTime(dt) {
    this.perfectTime += dt;
    const c = PERFECT_COINS_PER_SEC * dt;
    this.perfectCoins += c;
    this.gross += c;
  }

  addTrickCoins(coins, score) {
    this.trickCoins += coins;
    this.trickScore += score;
    this.gross += coins;
  }

  addMilestone(ms) {
    this.milestoneCoins += ms.coins;
    this.gross += ms.coins;
    this.milestonesHit.push(ms);
  }

  grossRounded() {
    return Math.round(this.gross * this.sessionMultiplier);
  }

  applyCrash(penaltyRate) {
    const g = this.grossRounded();
    this.penalty = Math.round(g * penaltyRate);
    return this.net();
  }

  net() {
    return Math.max(0, this.grossRounded() - this.penalty);
  }
}

export function xpForRun(bank, survivalTime) {
  return Math.round(
    bank.wheelieDistance * 0.3 +
    bank.trickScore * 0.12 +
    survivalTime * 1.0 +
    bank.milestonesHit.length * 20
  );
}

// ---- Shop ------------------------------------------------------------------

export function bikeAvailable(bike) {
  const s = loadSave();
  if (s.ownedBikes.includes(bike.id)) return 'owned';
  if (levelFromXp(s.xp) < bike.unlockLevel) return 'locked-level';
  if (bike.requiresAllMaps && !allMapsVisited()) return 'locked-maps';
  return 'buyable';
}

export function allMapsVisited() {
  const s = loadSave();
  const need = 7; // every map except the Championship Circuit itself
  return s.visitedMaps.filter((m) => m !== 'championship-circuit').length >= need;
}

export function purchaseBike(id) {
  const bike = bikeById(id);
  if (!bike) return { ok: false, reason: 'Unknown bike' };
  const s = loadSave();
  if (s.ownedBikes.includes(id)) return { ok: false, reason: 'Already owned' };
  const avail = bikeAvailable(bike);
  if (avail === 'locked-level') return { ok: false, reason: `Requires level ${bike.unlockLevel}` };
  if (avail === 'locked-maps') return { ok: false, reason: 'Visit every city map first' };
  if (s.coins < bike.cost) return { ok: false, reason: 'Not enough coins' };
  s.coins -= bike.cost;
  s.ownedBikes.push(id);
  s.equipped.bike = id;
  persist();
  return { ok: true };
}

export function purchaseJersey(id) {
  return purchaseGear('jersey', id);
}

// kind: 'jersey' | 'helmet'
export function purchaseGear(kind, id) {
  const item = kind === 'helmet' ? helmetById(id) : jerseyById(id);
  if (!item || item.id !== id) return { ok: false, reason: 'Unknown item' };
  const s = loadSave();
  if (s.ownedGear.includes(id)) return { ok: false, reason: 'Already owned' };
  if (s.coins < item.cost) return { ok: false, reason: 'Not enough coins' };
  s.coins -= item.cost;
  s.ownedGear.push(id);
  s.equipped[kind] = id;
  persist();
  return { ok: true };
}

export function gearOwned(id) {
  return loadSave().ownedGear.includes(id);
}

export function equip(itemType, id, mapId) {
  const s = loadSave();
  if (itemType === 'bike') {
    if (!s.ownedBikes.includes(id)) return false;
    s.equipped.bike = id;
  } else if (itemType === 'jersey' || itemType === 'helmet') {
    if (id && !s.ownedGear.includes(id)) return false;
    s.equipped[itemType] = id;
  } else if (itemType === 'decal') {
    if (id && !s.unlockedDecals.includes(id)) return false;
    s.equipped.decal = id;
  } else {
    return false;
  }
  persist();
  return true;
}

export function unlockCheck(xp) {
  // Returns newly-reached levels' unlock summaries for celebration screens.
  const newLevel = levelFromXp(xp);
  const out = [];
  for (const b of BIKES) {
    if (b.unlockLevel > 0 && b.unlockLevel <= newLevel && b.cost > 0) {
      out.push({ kind: 'bike', name: b.name, level: b.unlockLevel });
    }
  }
  return { newLevel, entries: out };
}

export { BIKES, JERSEYS, HELMETS, xpForLevel };
