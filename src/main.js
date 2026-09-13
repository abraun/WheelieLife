// Wheelie League - game loop and finite state machine:
// MENU -> RUN -> (CRASH) -> RESULTS -> (SHOP | MAP_SELECT | RUN again).

import { loadSave, persist, claimDailyMultiplier, recordRunBest, levelFromXp } from '../save/localStorageManager.js';
import { AudioEngine } from './audio.js';
import { Renderer } from './render.js';
import { Hud } from './ui/hud.js';
import { BikePhysics } from './physics.js';
import { TrickSystem } from './tricks.js';
import { RunBank, xpForRun, milestoneFor, xpForMilestone, MILESTONES } from './economy.js';
import { bikeById, jerseyById, helmetById, DECALS } from './bikes.js';
import { MAPS, mapById } from './maps/maps.js';
import { generateZones, zonesAt, generatePucks } from './maps/mapUtils.js';
import { initMenu, refreshMenu } from './ui/menu.js';
import { initShop, onShopShow } from './ui/shop.js';
import { initMapSelect, onMapSelectShow } from './ui/mapSelect.js';
import { initGarage, onGarageShow } from './ui/garage.js';
import { initResults, showResults, showLevelUp } from './ui/results.js';

const game = {
  state: 'menu',
  save: null,
  audio: null,
  renderer: null,
  hud: null,
  input: { throttle: false, brake: false },
  run: null,
  selectedMapId: 'sunrise-strip',
  currentMapId: 'sunrise-strip',
  mapById,
  bikeById,
};

// ---- Run lifecycle -----------------------------------------------------------

function startRun(mapId) {
  const save = game.save;
  const map = mapById(mapId);
  game.currentMapId = mapId;
  game.selectedMapId = mapId;

  const bike = bikeById(save.equipped.bike);
  const jersey = jerseyById(save.equipped.jersey);
  const helmet = helmetById(save.equipped.helmet);
  const decal = DECALS.find((d) => d.id === save.equipped.decal) || null;

  const mult = claimDailyMultiplier();
  const run = {
    map,
    physics: new BikePhysics(bike, 1234 + mapId.length),
    tricks: new TrickSystem(),
    bank: new RunBank(mult),
    bike,
    loadout: { bike, jersey, helmet, decal },
    zones: generateZones(map, 400000),
    pucks: generatePucks(map),
    pucksFound: 0,
    particles: [],
    crashT: 0,
    crashHandled: false,
    ended: false,
    lastMilestone: 0,
    input: game.input,
  };
  const collected = save.pucks[mapId] || [];
  run.pucks.forEach((p) => { if (collected.includes(p.idx)) p.collected = true; });

  // Visiting a map counts from the moment you drop in (championship gate).
  if (!save.visitedMaps.includes(mapId)) {
    save.visitedMaps.push(mapId);
    persist();
  }

  game.run = run;
  game.state = 'run';
  clearInputs();
  game.pendingResults = null;
  // Any overlay left open (level-up, pause, settings) must not sit on top of a live run.
  document.querySelectorAll('.overlay').forEach((o) => o.classList.remove('open'));
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
  document.body.classList.add('in-run');
  hideScreens();
  game.hud.reset();
  game.hud.setVisible(true);
  game.audio.unlock();
  game.audio.startEngine();
  game.audio.startMusic(map.music);
}

function hideScreens() {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
}

game.goTo = function (where) {
  game.state = where === 'menu' ? 'menu' : where;
  clearInputs();
  game.audio.stopEngine();
  document.body.classList.remove('in-run');
  if (game.run && !game.run.ended) game.run = null;
  const musicMap = mapById(game.selectedMapId);
  game.audio.startMusic(musicMap.music);
  game.hud.setVisible(false);
  if (where === 'menu') {
    refreshMenu(game);
    showMenuScreen();
  } else if (where === 'shop') {
    game.shopReturnTo = 'menu';
    onShopShow(game);
  } else if (where === 'map') {
    onMapSelectShow(game);
  } else if (where === 'garage') {
    onGarageShow(game);
  }
};

function showMenuScreen() {
  hideScreens();
  document.querySelector('#screen-menu').classList.add('active');
}

function showResultsScreen() {
  document.querySelector('#screen-results').classList.add('active');
}

function queueTrick(id) {
  if (game.state !== 'run' || game.run.physics.crashed) return;
  const ts = game.run.tricks;
  if (ts.press(id)) {
    game.audio.swoosh();
  }
}
game.queueTrick = queueTrick;

// ---- Per-frame run simulation ---------------------------------------------------

function stepRun(dt) {
  const run = game.run;
  const phys = run.physics;
  const ts = run.tricks;
  const map = run.map;

  if (phys.crashed) {
    run.crashT += dt;
    if (run.crashT > 1.6 && !run.ended) {
      run.ended = true;
      finishRun();
    }
    return;
  }

  const sub = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / sub;
  for (let i = 0; i < sub; i++) {
    // hazard zones feed external torque / damping into physics
    for (const z of zonesAt(run.zones, phys.x)) {
      if (z.type === 'gust') {
        phys.applyZone({ torque: Math.sin(game.time * 3 + phys.x * 0.008) * z.power });
      } else if (z.type === 'vent') {
        phys.applyZone({ torque: z.power * (0.7 + 0.3 * Math.sin(game.time * 7)) });
      } else if (z.type === 'slick') {
        phys.applyZone({ dampMul: 1 - z.power });
      }
    }
    phys.step(h, game.input, ts.riskState(), onPhysicsEvent);
    const tEvents = ts.update(h, Math.random);
    for (const ev of tEvents) {
      run.bank.addTrickCoins(ev.coins, ev.score);
      game.hud.popup(`${ev.trick.name.toUpperCase()} +${ev.score}`, `x${ev.mult.toFixed(1)} combo  +${ev.coins} coins`, '#ff9d5c');
      game.audio.trickLand(ev.chain);
      if (ev.chain === 5) {
        game.hud.showBanner('CROWD IS UP!', 'Chain 5 - the fans are on their feet', '#ff9d5c');
        game.audio.cheer();
      }
    }
  }

  // Trick dropped out of the safe window: no reward, small cooldown.
  if (ts.active && (phys.angle < 12 || phys.angle > 80)) {
    ts.active = null;
    ts.cooldown = 0.6;
    game.hud.popup('TRICK DROPPED', 'keep the wheelie steadier', '#ff7a5c');
  }

  // Coins from wheeling and perfect balance.
  if (phys.wheelied) run.bank.addWheelieMeters((phys.speed * dt) / 10);
  if (phys.inSweet) run.bank.addPerfectTime(dt);

  // Milestones.
  const ms = milestoneFor(phys.distance);
  if (ms) {
    const idx = MILESTONES.indexOf(ms);
    if (idx > run.lastMilestone) {
      run.lastMilestone = idx;
      run.bank.addMilestone(ms);
      game.hud.showBanner(`${ms.at}m`, `${ms.line}  +${ms.coins} coins`, '#ffd75e');
      game.audio.paAnnounce();
      game.audio.bigCoin();
    }
  }

  // Puck collectibles (high ones want a wheelie).
  for (const p of run.pucks) {
    if (p.collected) continue;
    if (Math.abs(phys.x - p.x) < 46 && (p.h <= 70 || (phys.wheelied && phys.angle > 18))) {
      p.collected = true;
      run.pucksFound++;
      const save = game.save;
      save.pucks[map.id] = save.pucks[map.id] || [];
      save.pucks[map.id].push(p.idx);
      game.hud.popup('PUCK FOUND', `${run.pucksFound}/3 in ${map.name}`, '#dff1ff');
      game.audio.coin();
      if (save.pucks[map.id].length >= 3) {
        const decal = DECALS.find((d) => d.mapId === map.id);
        if (decal && !save.unlockedDecals.includes(decal.id)) {
          save.unlockedDecals.push(decal.id);
          game.hud.showBanner('DECAL UNLOCKED', `${decal.name} - equip it in the Garage`, '#7ae05c');
        }
      }
      persist();
    }
  }

  // Engine audio follows the throttle.
  game.audio.updateEngine(phys.speedFrac, game.input.throttle, game.input.brake);

  // Coin sparkle particles occasionally.
  if (phys.wheelied && Math.random() < dt * 6) {
    run.particles.push({
      x: phys.x + 20 + Math.random() * 30,
      y: -40 - Math.random() * 30,
      vx: 40 + Math.random() * 60,
      vy: -30 - Math.random() * 40,
      life: 0.6,
      size: 2.5,
      color: '#ffd75e',
    });
  }
}

function onPhysicsEvent(ev) {
  if (ev.type === 'touchdown') {
    const had = game.run.tricks.breakChain();
    if (had) game.hud.popup('TOUCHDOWN', 'combo lost - roll back up', '#ff7a5c');
  } else if (ev.type === 'wheelieStart') {
    game.hud.popup('WHEELIE!', null, '#ffffff');
  }
}

function onCrashDetected() {
  const run = game.run;
  run.crashHandled = true;
  clearInputs();
  const ts = run.tricks;
  ts.breakChain();
  run.bank.applyCrash(run.bike.crashPenalty);
  game.audio.crash();
  game.audio.stopEngine();
  game.hud.showBanner('CRASHED', run.physics.crashReason === 'loopout' ? 'Looped out - too far back' : 'Front wheel slammed at speed', '#ff5c5c');
}

function finishRun() {
  const run = game.run;
  const save = game.save;
  const xp = xpForRun(run.bank, run.physics.survivalTime);
  const oldLevel = levelFromXp(save.xp);
  save.coins += run.bank.net();
  save.xp += xp;
  save.totals.runs++;
  save.totals.distance += Math.round(run.physics.distance);
  save.totals.tricks += run.tricks.tricksLanded;
  if (run.physics.crashed) save.totals.crashes++;
  const newRecord = recordRunBest(game.currentMapId, {
    distance: run.physics.distance,
    comboPeak: run.tricks.peakChain,
    longestWheelie: run.physics.longestWheelie,
  });
  persist();
  game.audio.stopEngine();
  document.body.classList.remove('in-run');

  const newLevel = levelFromXp(save.xp);
  const unlockedMaps = MAPS.filter((m) => m.unlockLevel > oldLevel && m.unlockLevel <= newLevel);
  const summary = { xp, newRecord };
  game.pendingResults = { run, summary };

  game.hud.setVisible(false);
  if (newLevel > oldLevel) {
    game.state = 'levelup';
    showLevelUp(game, oldLevel, newLevel, unlockedMaps);
  } else {
    game.state = 'results';
    showResults(game, run, summary);
    showResultsScreen();
  }
}
game.finishRunForTest = finishRun;

// ---- Pause ---------------------------------------------------------------------

function pauseGame() {
  if (game.state !== 'run') return;
  game.state = 'paused';
  clearInputs();
  document.querySelector('#overlay-pause').classList.add('open');
  game.audio.stopEngine();
}

function resumeGame() {
  if (game.state !== 'paused') return;
  game.state = 'run';
  document.querySelector('#overlay-pause').classList.remove('open');
  game.audio.startEngine();
}

function quitRun() {
  document.querySelector('#overlay-pause').classList.remove('open');
  game.goTo('menu');
}

// ---- Input ---------------------------------------------------------------------
// Input hardening: throttle/brake are latched flags that only a matching keyup
// should clear, so any state transition (crash, results, pause, tab switch,
// window blur) clears them. A key released while the window is unfocused never
// delivers its keyup, which is how stale throttle used to leak into the next run.

const heldKeys = new Set();
const MOVE_KEYS = new Set(['arrowright', 'd', 'arrowleft', 'a']);
const TRICK_KEYS = new Set(['q', 'w', 'e', 'r', 't']);

function clearInputs() {
  heldKeys.clear();
  game.input.throttle = false;
  game.input.brake = false;
}

function confirmOverlays() {
  // Enter on the post-run screens: keyboard players are never stranded.
  if (game.state === 'levelup' && document.querySelector('#overlay-levelup').classList.contains('open')) {
    document.querySelector('#levelup-continue').click();
    return true;
  }
  if (game.state === 'results') {
    document.querySelector('#results-again').click();
    return true;
  }
  return false;
}

function setupInput() {
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (MOVE_KEYS.has(k) || TRICK_KEYS.has(k)) e.preventDefault();
    if (e.repeat) return;
    heldKeys.add(k);
    if (k === 'arrowright' || k === 'd') game.input.throttle = true;
    else if (k === 'arrowleft' || k === 'a') game.input.brake = true;
    else if (k === 'enter') confirmOverlays();
    else if (TRICK_KEYS.has(k)) {
      const id = { q: 'knock', w: 'knee', e: 'hand', r: 'seat', t: 'nohand' }[k];
      queueTrick(id);
    } else if (k === 'escape' || k === 'p') {
      if (game.state === 'run') pauseGame();
      else if (game.state === 'paused') resumeGame();
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    heldKeys.delete(k);
    if (k === 'arrowright' || k === 'd') game.input.throttle = false;
    else if (k === 'arrowleft' || k === 'a') game.input.brake = false;
  });
  // Keys held while unfocused never see their keyup.
  window.addEventListener('blur', clearInputs);
  document.querySelector('#btn-pause').addEventListener('click', pauseGame);
  document.querySelector('#pause-resume').addEventListener('click', resumeGame);
  document.querySelector('#pause-restart').addEventListener('click', () => {
    document.querySelector('#overlay-pause').classList.remove('open');
    startRun(game.currentMapId);
  });
  document.querySelector('#pause-quit').addEventListener('click', quitRun);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInputs();
      pauseGame();
    }
  });
  window.addEventListener('pointerdown', () => game.audio.unlock(), { once: false });
}

// ---- Boot ------------------------------------------------------------------------

function boot() {
  game.save = loadSave();
  game.audio = new AudioEngine(game.save.settings);
  const canvas = document.querySelector('#game');
  game.renderer = new Renderer(canvas);
  game.hud = new Hud(canvas, game);

  if (game.save.settings.touchControls === 'off') {
    game.save.settings.touchControls = 'off';
  }

  initMenu(game);
  initShop(game);
  initMapSelect(game);
  initGarage(game);
  initResults(game);
  setupInput();
  refreshMenu(game);

  game.audio.applySettings(game.save.settings);
  game.goTo('menu');

  let last = performance.now();
  const frame = (now) => {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    game.time = now / 1000;

    if (game.state === 'run' && game.run) {
      if (!game.run.physics.crashed) stepRun(dt);
      else {
        if (!game.run.crashHandled) onCrashDetected();
        runCrashUpdate(dt);
      }
      game.renderer.drawRun(game.run, game.run.map, game.run.loadout, dt);
      game.hud.update(dt);
      game.hud.draw(game.renderer.ctx, game.run, game.run.map);
    } else if (game.state === 'paused' && game.run) {
      game.renderer.drawRun(game.run, game.run.map, game.run.loadout, 0);
      game.hud.draw(game.renderer.ctx, game.run, game.run.map);
    } else {
      const map = mapById(game.selectedMapId);
      game.renderer.drawMenuBG(map, dt);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // Debug/test hook (also used by automated smoke checks).
  game.startRun = startRun;
  window.__WL = {
    game,
    startRun,
    finishRun: finishRun,
    MILESTONES,
  };
}

function runCrashUpdate(dt) {
  const run = game.run;
  run.crashT += dt;
  if (run.crashT > 1.6 && !run.ended) {
    run.ended = true;
    finishRun();
  }
}

boot();
