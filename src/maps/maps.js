// Map registry (spec 6). Order matters: it is the progression ladder.

import { map as sunriseStrip } from './sunrise-strip.js';
import { map as steelCityHills } from './steel-city-hills.js';
import { map as originalSixAve } from './original-six-ave.js';
import { map as motorCityLoop } from './motor-city-loop.js';
import { map as windyGrid } from './windy-grid.js';
import { map as frontierFlats } from './frontier-flats.js';
import { map as neonStrip } from './neon-strip.js';
import { map as championshipCircuit } from './championship-circuit.js';

export const MAPS = [
  sunriseStrip,
  steelCityHills,
  originalSixAve,
  motorCityLoop,
  windyGrid,
  frontierFlats,
  neonStrip,
  championshipCircuit,
];

export function mapById(id) {
  return MAPS.find((m) => m.id === id) || MAPS[0];
}

export function mapLocked(map) {
  // Returns 'level' | 'maps' | null.
  return map.allMapsRequired ? 'maps' : null;
}

export { sunriseStrip, steelCityHills, originalSixAve, motorCityLoop, windyGrid, frontierFlats, neonStrip, championshipCircuit };
