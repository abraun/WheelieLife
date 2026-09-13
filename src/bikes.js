// Wheelie League - bike roster and cosmetic catalog.
// Bikes are fictional machines that strongly evoke real electric dirt bikes
// (light-bee class off-road e-motos, mid-size MX e-motos, fat-tire e-cruisers)
// without using any real brand names. Guardrail (spec 9): better bikes widen
// the sweet spot slightly, damp twitch, and soften crash penalties -- they
// never remove the core balance challenge.
//
// `look` picks a body style for the vector art: 'dirt' (trellis-frame trail
// e-moto), 'mx' (shrouded motocross e-moto), 'fat' (fat-tire street cruiser).

export const BIKES = [
  {
    id: 'starter', name: 'Trail Pup 80', cost: 0, unlockLevel: 1, look: 'dirt',
    stability: 0.15, trickMult: 1.0, speedCap: 400, accel: 150, brake: 340,
    lift: 40, brakeTorque: 66, twitch: 0.55, balancePoint: 47, crashPenalty: 0.35,
    sweetExtend: 0,
    flavor: 'Rust-bucket pit bike with a tired hub motor. Honest handling, zero forgiveness.',
    paint: { body: '#b3542e', frame: '#3b3b3b', seat: '#26201d', accent: '#d8c9a3', fork: '#5a5e66' },
    gripTape: 'plain', fender: 'plain',
  },
  {
    id: 'street250', name: 'LumenBee X', cost: 800, unlockLevel: 3, look: 'dirt',
    stability: 0.35, trickMult: 1.12, speedCap: 460, accel: 175, brake: 360,
    lift: 44, brakeTorque: 70, twitch: 0.7, balancePoint: 47, crashPenalty: 0.28,
    sweetExtend: 1,
    flavor: 'The light electric everyone copies: silver trellis frame, battery spine, silent pull.',
    paint: { body: '#c8ccd2', frame: '#22262b', seat: '#1b1e22', accent: '#7ae05c', fork: '#8d939c' },
    gripTape: 'plain', fender: 'plain',
  },
  {
    id: 'sting', name: 'Talon Sting R', cost: 2000, unlockLevel: 5, look: 'mx',
    stability: 0.48, trickMult: 1.22, speedCap: 500, accel: 190, brake: 370,
    lift: 47, brakeTorque: 72, twitch: 0.8, balancePoint: 48, crashPenalty: 0.22,
    sweetExtend: 2,
    flavor: 'Mid-size MX e-moto with emerald shrouds. Stings off the line, drags knees for fun.',
    paint: { body: '#101318', frame: '#2a2f36', seat: '#0d1013', accent: '#2ecf7f', fork: '#c9a227' },
    gripTape: 'plain', fender: 'plain',
  },
  {
    id: 'seventy3', name: 'Seventy-3 Scrap', cost: 3400, unlockLevel: 7, look: 'fat',
    stability: 0.55, trickMult: 1.15, speedCap: 470, accel: 180, brake: 395,
    lift: 50, brakeTorque: 76, twitch: 0.5, balancePoint: 48, crashPenalty: 0.2,
    sweetExtend: 3,
    flavor: 'Fat-tire board-tracker in mustard and teal. Rolls over curbs and bad decisions.',
    paint: { body: '#d9a92e', frame: '#1f6f6a', seat: '#4a3421', accent: '#3fc1c9', fork: '#3a3f47' },
    gripTape: 'sunset', fender: 'plain',
  },
  {
    id: 'soflo', name: 'Zume Urban Ultra', cost: 5500, unlockLevel: 9, look: 'mx',
    stability: 0.62, trickMult: 1.3, speedCap: 540, accel: 205, brake: 380,
    lift: 50, brakeTorque: 74, twitch: 0.9, balancePoint: 48, crashPenalty: 0.18,
    sweetExtend: 3,
    flavor: 'Supermoto race rep in white and red. The city is the track; the track is the city.',
    paint: { body: '#f0f2f5', frame: '#c0392b', seat: '#1b1e22', accent: '#c0392b', fork: '#c9a227' },
    gripTape: 'sunset', fender: 'plain',
  },
  {
    id: 'icebreaker', name: 'Frostline FX', cost: 8500, unlockLevel: 12, look: 'mx',
    stability: 0.72, trickMult: 1.45, speedCap: 580, accel: 220, brake: 400,
    lift: 53, brakeTorque: 77, twitch: 0.95, balancePoint: 49, crashPenalty: 0.12,
    sweetExtend: 4,
    flavor: 'Dual-sport e-moto built for cold mornings. Hockey-stick grip tape hides under the boots.',
    paint: { body: '#9fd8e8', frame: '#1d2b33', seat: '#16303c', accent: '#ffffff', fork: '#5a5e66' },
    gripTape: 'hockeystick', fender: 'plain',
  },
  {
    id: 'zamboni', name: 'IceDeck Deluxe', cost: 13500, unlockLevel: 15, look: 'fat',
    stability: 0.85, trickMult: 1.55, speedCap: 545, accel: 205, brake: 410,
    lift: 56, brakeTorque: 79, twitch: 0.7, balancePoint: 49, crashPenalty: 0.08,
    sweetExtend: 4,
    flavor: 'Rink-blue cruiser with a Zamboni-brush fender. Smooths the ice, and your wheelies.',
    paint: { body: '#4f7fd0', frame: '#2a2f36', seat: '#22262c', accent: '#dfe8f5', fork: '#8d939c' },
    gripTape: 'ice', fender: 'zamboni',
  },
  {
    id: 'championship', name: 'Cup Edition Prototype', cost: 25000, unlockLevel: 18,
    requiresAllMaps: true, look: 'mx',
    stability: 0.78, trickMult: 2.0, speedCap: 640, accel: 245, brake: 425,
    lift: 58, brakeTorque: 82, twitch: 1.4, balancePoint: 49, crashPenalty: 0.0,
    sweetExtend: 5,
    flavor: 'Chrome-leaf factory prototype, one made per city trophy. Max payout, razor twitch. Respect it or loop out.',
    paint: { body: '#cfd6de', frame: '#8d97a3', seat: '#101418', accent: '#ffe27a', fork: '#c9a227' },
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

// ---- Helmets (buyable) ------------------------------------------------------

export const HELMETS = [
  { id: 'helmet-plain', name: 'Blank Bucket', cost: 0, base: '#20242a', accent: '#20242a', visor: 'rgba(160,200,230,0.8)', flavor: 'League-issued. Does the job, wins nothing.' },
  { id: 'helmet-stripe', name: 'Rally Stripe', cost: 120, base: '#f0f2f5', accent: '#c0392b', visor: 'rgba(160,200,230,0.8)', stripe: '#c0392b', flavor: 'White shell, center red stripe. Classic club-race look.' },
  { id: 'helmet-mirror', name: 'Mirror Visor', cost: 260, base: '#15171b', accent: '#3a3f47', visor: 'rgba(140,220,255,0.9)', finish: 'mirror', flavor: 'Iridium visor. They can see you, you see yourself.' },
  { id: 'helmet-sunset', name: 'Sunset Fade', cost: 420, base: '#f2a03d', accent: '#e86a5c', visor: 'rgba(255,210,160,0.85)', flavor: 'Orange-to-coral fade straight off the Sunrise Strip postcards.' },
  { id: 'helmet-ice', name: 'Cold Snap', cost: 600, base: '#9fd8e8', accent: '#1d2b33', visor: 'rgba(200,235,250,0.9)', flavor: 'Ice-blue shell for cold-arena wheelie nights.' },
  { id: 'helmet-emerald', name: 'Emerald Flash', cost: 900, base: '#0f7a4d', accent: '#2ecf7f', visor: 'rgba(160,255,210,0.85)', flavor: 'Deep green with a flash decal. Matches the Sting R.' },
  { id: 'helmet-goldwing', name: 'Gold Wing', cost: 1500, base: '#c9a227', accent: '#7a5f10', visor: 'rgba(255,235,170,0.9)', finish: 'gold', flavor: 'Full-gold shell. For riders who bank coins, not excuses.' },
  { id: 'helmet-champ', name: 'Cup Chrome', cost: 2500, base: '#dfe4ea', accent: '#c9a227', visor: 'rgba(180,220,255,0.95)', finish: 'chrome', stripe: '#c9a227', flavor: 'Chrome leaf, gold pinstripe. Trophy-day only.' },
];

export function helmetById(id) {
  return HELMETS.find((h) => h.id === id) || HELMETS[0];
}

// ---- Cosmetics (jerseys buyable, decals earned via pucks) ------------------

export const JERSEYS = [
  { id: 'jersey-neutral', name: 'Practice Grey', cost: 0, colors: { torso: '#8a9099', trim: '#d7dbe0' }, flavor: 'Warm-ups. Nobody fears the practice squad.' },
  { id: 'jersey-sunrise', name: 'Sunrise Gold', cost: 150, colors: { torso: '#c8863c', trim: '#ffffff' }, flavor: 'South Florida rink-night gold and navy.' },
  { id: 'jersey-steel', name: 'Steel City Black', cost: 180, colors: { torso: '#1d1d1f', trim: '#f2c33d' }, flavor: 'Black and gold bunting colors, no logos needed.' },
  { id: 'jersey-oldtown', name: 'Original Six Rouge', cost: 200, colors: { torso: '#a63131', trim: '#e8e0c8' }, flavor: 'Old-town red, cream laces, blue bucket.' },
  { id: 'jersey-motor', name: 'Motor City Red', cost: 220, colors: { torso: '#c0392b', trim: '#ffffff' }, flavor: 'Hockeytown garage red.' },
  { id: 'jersey-windy', name: 'Windy Grid Red-Black', cost: 240, colors: { torso: '#a02c2c', trim: '#181a1c' }, flavor: 'Lamppost bunting red with black trim.' },
  { id: 'jersey-frontier', name: 'Frontier Oil Blue', cost: 260, colors: { torso: '#e2761f', trim: '#1c3f6e' }, flavor: 'Derrick orange over oil-blue. Aurora tested.' },
  { id: 'jersey-neon', name: 'Neon Strip Steel', cost: 300, colors: { torso: '#5c6470', trim: '#f4d35e' }, flavor: 'Vegas steel grey with marquee-gold trim.' },
  { id: 'jersey-champ', name: 'Championship White', cost: 400, colors: { torso: '#f0f2f5', trim: '#c9a227' }, flavor: 'For trophy-day wheelies only.' },
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
