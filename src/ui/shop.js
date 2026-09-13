// Wheelie League - shop screen: bike tiers + cosmetics with live preview.

import { BIKES, JERSEYS, DECALS, bikeById, jerseyById, decalById, sweetSpot } from '../bikes.js';
import { purchaseBike, purchaseJersey, equip, bikeAvailable } from '../economy.js';
import { loadSave, levelFromXp, persist } from '../../save/localStorageManager.js';
import { BikePhysics } from '../physics.js';
import { drawBike } from '../render.js';
import { fmtCoins, qs, qsa, showScreen, statBar, el } from './uiCommon.js';

export function initShop(game) {
  qs('#shop-back').addEventListener('click', () => game.goTo(game.shopReturnTo || 'menu'));
  qsa('#shop-tabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      qsa('#shop-tabs .tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderShop(game);
    });
  });
}

export function renderShop(game) {
  const save = loadSave();
  const tab = qs('#shop-tabs .tab.active').dataset.tab;
  const grid = qs('#shop-grid');
  grid.innerHTML = '';
  qs('#shop-coins').textContent = fmtCoins(save.coins);

  if (tab === 'bikes') {
    let selected = shopState.selectedBike && bikeById(shopState.selectedBike) ? shopState.selectedBike : save.equipped.bike;
    for (const bike of BIKES) {
      const avail = bikeAvailable(bike);
      const card = el('div', `card bike-card ${avail !== 'buyable' && avail !== 'owned' ? 'locked' : ''} ${selected === bike.id ? 'selected' : ''}`);
      card.innerHTML = `
        <div class="card-title">${bike.name}</div>
        <div class="card-flavor">${bike.flavor}</div>
        <div class="card-stats">
          ${statBar('Stability', bike.stability, '#7ae05c')}
          ${statBar('Trick payout', (bike.trickMult - 0.8) / 1.3, '#ff9d5c')}
          ${statBar('Top speed', (bike.speedCap - 360) / 280, '#5cb8ff')}
          ${statBar('Crash mercy', 1 - bike.crashPenalty, '#c9a227')}
        </div>
        <div class="card-foot">
          <span class="price">${avail === 'owned' ? (save.equipped.bike === bike.id ? 'EQUIPPED' : 'OWNED') : bike.cost === 0 ? 'FREE' : fmtCoins(bike.cost) + ' coins'}</span>
          ${availBadge(avail, bike)}
        </div>`;
      card.addEventListener('click', () => {
        shopState.selectedBike = bike.id;
        renderShop(game);
      });
      grid.appendChild(card);
    }
    const bike = bikeById(selected);
    const avail = bikeAvailable(bike);
    const foot = qs('#shop-action');
    foot.innerHTML = '';
    if (save.ownedBikes.includes(bike.id)) {
      if (save.equipped.bike === bike.id) {
        foot.appendChild(el('button', 'btn primary disabled', 'Equipped'));
      } else {
        const b = el('button', 'btn primary', 'Equip');
        b.addEventListener('click', () => { equip('bike', bike.id); game.audio.click(); renderShop(game); });
        foot.appendChild(b);
      }
    } else if (avail === 'buyable') {
      const b = el('button', 'btn primary buy', `Buy - ${fmtCoins(bike.cost)}`);
      b.addEventListener('click', () => {
        const r = purchaseBike(bike.id);
        shopToast(game, r);
        if (r.ok) game.audio.bigCoin();
        renderShop(game);
      });
      foot.appendChild(b);
    } else {
      foot.appendChild(el('button', 'btn disabled', avail === 'locked-level' ? `Reach level ${bike.unlockLevel}` : 'Visit every city first'));
    }
    startPreview(game, bike);
  } else {
    // cosmetics tab
    let selected = shopState.selectedJersey && jerseyById(shopState.selectedJersey) ? shopState.selectedJersey : (save.equipped.jersey || 'jersey-neutral');
    for (const j of JERSEYS) {
      const owned = save.ownedGear.includes(j.id);
      const card = el('div', `card jersey-card ${owned ? '' : 'locked'} ${selected === j.id ? 'selected' : ''}`);
      card.innerHTML = `
        <div class="jersey-swatch"><span style="background:${j.colors.torso}"></span><span style="background:${j.colors.trim}"></span><span style="background:${j.colors.helmet}"></span></div>
        <div class="card-title">${j.name}</div>
        <div class="card-flavor">${j.flavor}</div>
        <div class="card-foot"><span class="price">${owned ? (save.equipped.jersey === j.id ? 'EQUIPPED' : 'OWNED') : fmtCoins(j.cost) + ' coins'}</span></div>`;
      card.addEventListener('click', () => {
        shopState.selectedJersey = j.id;
        renderShop(game);
      });
      grid.appendChild(card);
    }
    // puck-earned decals
    const decalHeader = el('div', 'section-note', 'Decals are not bought - collect all 3 hidden pucks in a city to earn its decal.');
    grid.appendChild(decalHeader);
    for (const d of DECALS) {
      const unlocked = save.unlockedDecals.includes(d.id);
      const card = el('div', `card decal-card ${unlocked ? '' : 'locked'} ${save.equipped.decal === d.id ? 'selected' : ''}`);
      const got = (save.pucks[d.mapId] || []).length;
      card.innerHTML = `
        <div class="card-title">${unlocked ? d.name : '??? Decal'}</div>
        <div class="card-flavor">${unlocked ? 'Earned. Equip it in the Garage.' : `Find all 3 pucks (${got}/3).`}</div>
        <div class="card-foot"><span class="price">${unlocked ? (save.equipped.decal === d.id ? 'EQUIPPED' : 'OWNED') : 'PUCK LOCKED'}</span></div>`;
      card.addEventListener('click', () => {
        if (unlocked) { equip('decal', d.id); game.audio.click(); renderShop(game); }
      });
      grid.appendChild(card);
    }
    const j = jerseyById(selected);
    const foot = qs('#shop-action');
    foot.innerHTML = '';
    if (j) {
      if (save.ownedGear.includes(j.id)) {
        if (save.equipped.jersey === j.id) {
          foot.appendChild(el('button', 'btn primary disabled', 'Equipped'));
        } else {
          const b = el('button', 'btn primary', 'Equip');
          b.addEventListener('click', () => { equip('jersey', j.id); game.audio.click(); renderShop(game); });
          foot.appendChild(b);
        }
      } else {
        const b = el('button', 'btn primary buy', `Buy - ${fmtCoins(j.cost)}`);
        b.addEventListener('click', () => {
          const r = purchaseJersey(j.id);
          shopToast(game, r);
          if (r.ok) game.audio.bigCoin();
          renderShop(game);
        });
        foot.appendChild(b);
      }
      startPreview(game, game.bikeById(save.equipped.bike), j);
    } else {
      startPreview(game, game.bikeById(save.equipped.bike), null);
    }
  }
}

function availBadge(avail, bike) {
  if (avail === 'owned') return '';
  if (avail === 'locked-level') return `<span class="badge lock">Lv ${bike.unlockLevel}</span>`;
  if (avail === 'locked-maps') return '<span class="badge lock">All cities</span>';
  return '<span class="badge buyable">For sale</span>';
}

function shopToast(game, result) {
  const toast = qs('#shop-toast');
  toast.textContent = result.ok ? 'Purchase complete - enjoy the new ride.' : result.reason;
  toast.className = result.ok ? 'toast ok show' : 'toast err show';
  clearTimeout(shopToast.timer);
  shopToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

// ---- Live preview: a real physics sim with an auto-balance bot ---------------

const shopState = { selectedBike: null, selectedJersey: null };
let previewRAF = null;

function startPreview(game, bike, jersey) {
  stopPreview();
  const canvas = qs('#shop-preview');
  const ctx = canvas.getContext('2d');
  const sim = new BikePhysics(bike, 777);
  sim.speed = bike.speedCap * 0.45;
  sim.angle = 40;
  sim.wheelied = true;
  const loadout = {
    bike,
    jersey: jersey || null,
    decal: null,
  };
  const [lo, hi] = sweetSpot(bike);
  let t = 0;
  const tick = () => {
    if (!qs('#screen-shop').classList.contains('active')) { stopPreview(); return; }
    t += 1 / 60;
    // bot aims for the middle of the sweet spot; PD-ish control
    const target = (lo + hi) / 2 + Math.sin(t * 0.7) * 4;
    const err = target - sim.angle;
    const input = { throttle: err > 0.5, brake: err < -0.5 };
    sim.step(1 / 60, input, null, null);
    if (sim.angle <= 2) { sim.angle = 40; sim.angVel = 0; sim.speed = bike.speedCap * 0.45; sim.wheelied = true; }
    if (sim.angle >= 80) { sim.angle = 60; sim.angVel = -30; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#141922';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
    const sc = canvas.height / 110;
    ctx.translate(canvas.width * 0.42, canvas.height * 0.82);
    ctx.scale(sc, sc);
    ctx.rotate(-sim.angle * Math.PI / 180);
    drawBike(ctx, loadout, null, t * 6, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // stat caption
    const cap = qs('#shop-preview-caption');
    const lvl = levelFromXp(loadSave().xp);
    cap.textContent = `${bike.name} - trick x${bike.trickMult.toFixed(2)} - sweet spot ${lo}-${hi} - crash mercy ${Math.round((1 - bike.crashPenalty) * 100)}%` + (bike.unlockLevel > lvl ? ` - requires level ${bike.unlockLevel}` : '');
    previewRAF = requestAnimationFrame(tick);
  };
  previewRAF = requestAnimationFrame(tick);
}

function stopPreview() {
  if (previewRAF) cancelAnimationFrame(previewRAF);
  previewRAF = null;
}

export function onShopShow(game) {
  showScreen('#screen-shop');
  renderShop(game);
}
