// Wheelie League - persistence layer.
// Persists coins, XP/level, owned bikes & cosmetics, loadout, visited maps,
// per-map puck collectibles, per-map bests, and settings via localStorage.

const KEY = 'wheelie-league-save-v1';

export function defaultSave() {
  return {
    version: 1,
    coins: 0,
    xp: 0,
    ownedBikes: ['starter'],
    ownedGear: [],
    unlockedDecals: [],
    equipped: { bike: 'starter', jersey: null, decal: null },
    visitedMaps: ['sunrise-strip'],
    pucks: {},            // mapId -> [puckIndex, ...]
    best: {},             // mapId -> { distance, combo, wheelie }
    totals: { runs: 0, distance: 0, tricks: 0, crashes: 0 },
    daily: { date: '', firstRunDone: false },
    settings: { music: true, sfx: true, touchControls: 'auto' },
  };
}

function deepMerge(base, patch) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const k of Object.keys(patch || {})) {
    const pv = patch[k];
    const bv = base ? base[k] : undefined;
    if (pv && typeof pv === 'object' && !Array.isArray(pv) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      out[k] = deepMerge(bv, pv);
    } else if (pv !== undefined) {
      out[k] = pv;
    }
  }
  return out;
}

let cache = null;

export function loadSave() {
  if (cache) return cache;
  let data = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) {
    data = null;
  }
  cache = deepMerge(defaultSave(), data && typeof data === 'object' ? data : {});
  return cache;
}

export function persist() {
  if (!cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch (e) {
    // Storage may be unavailable (private mode); game still playable this session.
  }
}

export function resetSave() {
  cache = defaultSave();
  persist();
  return cache;
}

// ---- Derived progression helpers -------------------------------------------

// Cumulative XP required to reach level L (level 1 starts at 0).
export function xpForLevel(L) {
  if (L <= 1) return 0;
  return Math.round(60 * Math.pow(L - 1, 1.85));
}

export function levelFromXp(xp) {
  let L = 1;
  while (xpForLevel(L + 1) <= xp && L < 99) L++;
  return L;
}

export function levelProgress(xp) {
  const L = levelFromXp(xp);
  const lo = xpForLevel(L);
  const hi = xpForLevel(L + 1);
  return { level: L, cur: xp - lo, need: hi - lo, frac: hi > lo ? (xp - lo) / (hi - lo) : 1 };
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// First run of each day earns a 1.25x bonus multiplier (spec section 3).
export function claimDailyMultiplier() {
  const s = loadSave();
  const t = todayKey();
  if (s.daily.date !== t) {
    s.daily.date = t;
    s.daily.firstRunDone = false;
  }
  if (!s.daily.firstRunDone) {
    s.daily.firstRunDone = true;
    persist();
    return 1.25;
  }
  return 1;
}

export function peekDailyMultiplier() {
  const s = loadSave();
  if (s.daily.date !== todayKey()) return 1.25;
  return s.daily.firstRunDone ? 1 : 1.25;
}

// ---- Best-score bookkeeping ------------------------------------------------

export function recordRunBest(mapId, run) {
  const s = loadSave();
  const prev = s.best[mapId] || { distance: 0, combo: 0, wheelie: 0 };
  const next = {
    distance: Math.max(prev.distance, Math.round(run.distance)),
    combo: Math.max(prev.combo, run.comboPeak),
    wheelie: Math.max(prev.wheelie, Math.round(run.longestWheelie)),
  };
  const newRecord = next.distance > prev.distance;
  s.best[mapId] = next;
  return newRecord;
}
