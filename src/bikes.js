// Wheelie League - bike roster and cosmetic catalog.
// Guardrail (spec 9): better bikes widen the sweet spot slightly, damp twitch,
// and soften crash penalties -- they never remove the core balance challenge.

export const BIKES = [
  {
    id: 'starter', name: 'Starter Dirt Bike', cost: 0, unlockLevel: 1,
    stability: 0.15, trickMult: 1.0, speedCap: 400, accel: 150, brake: 340,
    lift: 40, brakeTorque: 66, twitch: 0.55, balancePoint: 47, crashPenalty: 0.35,
    sweetExtend: 0,
    flavor: 'Default bike. Worn decals, honest handling, zero forgiveness.',
    paint: { body: '#b3542e', frame: '#3b3b3b', seat: '#26201d', accent: '#d8c9a3' },
    gripTape: 'plain', fender: 'plain',
  },
  {
    id: 'street250', name: 'Street 250', cost: 500, unlockLevel: 2,
    stability: 0.35, trickMult: 1.1, speedCap: 460, accel: 170, brake: 360,
    lift: 44, brakeTorque: 70, twitch: 0.7, balancePoint: 47, crashPenalty: 0.28,
    sweetExtend: 1,
    flavor: 'City commuter with a chip on its shoulder. Unlocked at Level 2.',
    paint: { body: '#2e6fb3', frame: '#22262b', seat: '#1b1e22', accent: '#e8e8e8' },
    gripTape: 'plain', fender: 'plain',
  },
  {
    id: 'soflo', name: 'SoFlo Special', cost: 1500, unlockLevel: 5,
    stability: 0.5, trickMult: 1.25, speedCap: 490, accel: 185, brake: 370,
    lift: 47, brakeTorque: 72, twitch: 0.8, balancePoint: 48, crashPenalty: 0.22,
    sweetExtend: 2,
    flavor: 'A nod to the original wheelie-life home turf. Sunshine stripe paint.',
    paint: { body: '#f2a03d', frame: '#2b2b2b', seat: '#7a4b1f', accent: '#ffd98a' },
    gripTape: 'sunset', fender: 'plain',
  },
  {
    id: 'icebreaker', name: 'Ice Breaker 450', cost: 4000, unlockLevel: 8,
    stability: 0.68, trickMult: 1.4, speedCap: 540, accel: 205, brake: 390,
    lift: 50, brakeTorque: 75, twitch: 0.9, balancePoint: 48, crashPenalty: 0.15,
    sweetExtend: 3,
    flavor: 'Hockey-stick-pattern grip tape hides under these boots. Cold, quick, sure.',
    paint: { body: '#9fd8e8', frame: '#1d2b33', seat: '#16303c', accent: '#ffffff' },
    gripTape: 'hockeystick', fender: 'plain',
  },
  {
    id: 'zamboni', name: 'Zamboni-Edition Cruiser', cost: 10000, unlockLevel: 12,
    stability: 0.85, trickMult: 1.6, speedCap: 505, accel: 190, brake: 400,
    lift: 54, brakeTorque: 78, twitch: 0.85, balancePoint: 49, crashPenalty: 0.08,
    sweetExtend: 4,
    flavor: 'Cosmetic Zamboni-brush fender. Smooths the ice, and your wheelies. Not fast.',
    paint: { body: '#4f7fd0', frame: '#2a2f36', seat: '#22262c', accent: '#dfe8f5' },
    gripTape: 'ice', fender: 'zamboni',
  },
  {
    id: 'championship', name: 'Championship Chrome', cost: 25000, unlockLevel: 20,
    requiresAllMaps: true,
    stability: 0.75, trickMult: 2.0, speedCap: 620, accel: 240, brake: 420,
    lift: 56, brakeTorque: 80, twitch: 1.45, balancePoint: 49, crashPenalty: 0.0,
    sweetExtend: 5,
    flavor: 'Max trick payout, razor twitch, chrome everything. Only after every city has seen you ride. Respect it or loop out.',
    paint: { body: '#cfd6de', frame: '#8d97a3', seat: '#101418', accent: '#ffe27a' },
    gripTape: 'gold', fender: 'chrome',
  },
];

// Sweet-spot band in degrees. Base ideal zone is ~35-55 (spec 2); better bikes
// extend it slightly via sweetExtend, never more than +/-5 degrees.
export function sweetSpot(bike) {
  return [36 - bike.sweetExtend, 54 + bike.sweetExtend];
}

export function bikeById(id) {
  return BIKES.find((b) => b.id === id) || BIKES[0];
}

// ---- Cosmetics (jerseys buyable, decals earned via pucks) ------------------

export const JERSEYS = [
  { id: 'jersey-neutral', name: 'Practice Grey', cost: 0, colors: { torso: '#8a9099', trim: '#d7dbe0', helmet: '#20242a' }, flavor: 'Warm-ups. Nobody fears the practice squad.' },
  { id: 'jersey-sunrise', name: 'Sunrise Gold', cost: 150, colors: { torso: '#c8863c', trim: '#ffffff', helmet: '#1f3a5c' }, flavor: 'South Florida rink-night gold and navy.' },
  { id: 'jersey-steel', name: 'Steel City Black', cost: 180, colors: { torso: '#1d1d1f', trim: '#f2c33d', helmet: '#f2c33d' }, flavor: 'Black and gold bunting colors, no logos needed.' },
  { id: 'jersey-oldtown', name: 'Original Six Rouge', cost: 200, colors: { torso: '#a63131', trim: '#e8e0c8', helmet: '#20304a' }, flavor: 'Old-town red, cream laces, blue bucket.' },
  { id: 'jersey-motor', name: 'Motor City Red', cost: 220, colors: { torso: '#c0392b', trim: '#ffffff', helmet: '#c0392b' }, flavor: 'Hockeytown garage red.' },
  { id: 'jersey-windy', name: 'Windy Grid Red-Black', cost: 240, colors: { torso: '#a02c2c', trim: '#181a1c', helmet: '#181a1c' }, flavor: 'Lamppost bunting red with black trim.' },
  { id: 'jersey-frontier', name: 'Frontier Oil Blue', cost: 260, colors: { torso: '#e2761f', trim: '#1c3f6e', helmet: '#1c3f6e' }, flavor: 'Derrick orange over oil-blue. Aurora tested.' },
  { id: 'jersey-neon', name: 'Neon Strip Steel', cost: 300, colors: { torso: '#5c6470', trim: '#f4d35e', helmet: '#2a2e35' }, flavor: 'Vegas steel grey with marquee-gold trim.' },
  { id: 'jersey-champ', name: 'Championship White', cost: 400, colors: { torso: '#f0f2f5', trim: '#c9a227', helmet: '#c9a227' }, flavor: 'For trophy-day wheelies only.' },
];

export function jerseyById(id) {
  return JERSEYS.find((j) => j.id === id) || null;
}

// Decals: one per map, unlocked by collecting all 3 pucks in that map.
export const DECALS = [
  { id: 'decal-sunrise', name: 'Palm Puck Decal', mapId: 'sunrise-strip' },
  { id: 'decal-steel', name: 'Bridge Puck Decal', mapId: 'steel-city-hills' },
  { id: 'decal-oldtown', name: 'Duck Boat Decal', mapId: 'original-six-ave' },
  { id: 'decal-motor', name: 'Octopus Decal', mapId: 'motor-city-loop' },
  { id: 'decal-windy', name: 'El-Track Decal', mapId: 'windy-grid' },
  { id: 'decal-frontier', name: 'Aurora Puck Decal', mapId: 'frontier-flats' },
  { id: 'decal-neon', name: 'Marquee Decal', mapId: 'neon-strip' },
  { id: 'decal-champ', name: 'Banner Decal', mapId: 'championship-circuit' },
];

export function decalById(id) {
  return DECALS.find((d) => d.id === id) || null;
}
