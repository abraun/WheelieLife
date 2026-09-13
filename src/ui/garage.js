// Wheelie League - garage/loadout: equip owned bike, jersey, helmet, decal.

import { BIKES, JERSEYS, HELMETS, DECALS, sweetSpot } from '../bikes.js';
import { equip } from '../economy.js';
import { loadSave } from '../../save/localStorageManager.js';
import { drawBike } from '../render.js';
import { fmtCoins, qs, qsa, showScreen, el, statBar } from './uiCommon.js';

let garageRAF = null;

export function initGarage(game) {
  qs('#garage-back').addEventListener('click', () => game.goTo('menu'));
}

export function onGarageShow(game) {
  showScreen('#screen-garage');
  renderGarage(game);
}

function renderGarage(game) {
  const save = loadSave();
  qs('#garage-coins').textContent = fmtCoins(save.coins);

  const bikeCol = qs('#garage-bikes');
  bikeCol.innerHTML = '<h3>Bikes</h3>';
  for (const bike of BIKES) {
    if (!save.ownedBikes.includes(bike.id)) continue;
    const row = el('div', `loadout-row ${save.equipped.bike === bike.id ? 'equipped' : ''}`);
    row.innerHTML = `<div><div class="row-title">${bike.name}</div>
      ${statBar('Stability', bike.stability, '#7ae05c')}</div>
      <button class="btn small ${save.equipped.bike === bike.id ? 'disabled' : 'primary'}">${save.equipped.bike === bike.id ? 'Riding' : 'Equip'}</button>`;
    row.querySelector('button').addEventListener('click', () => {
      equip('bike', bike.id);
      game.audio.click();
      renderGarage(game);
    });
    bikeCol.appendChild(row);
  }
  if (bikeCol.children.length === 1) {
    bikeCol.appendChild(el('p', 'muted', 'Only the Starter Dirt Bike yet. The shop has more.'));
  }

  const gearCol = qs('#garage-gear');
  gearCol.innerHTML = '<h3>Jerseys</h3>';
  const jerseyList = [{ id: null, name: 'No jersey (plain gear)', colors: null }].concat(JERSEYS.filter((j) => save.ownedGear.includes(j.id)));
  for (const j of jerseyList) {
    const row = el('div', `loadout-row ${save.equipped.jersey === j.id ? 'equipped' : ''}`);
    const sw = j.colors
      ? `<span class="mini-swatch"><span style="background:${j.colors.torso}"></span><span style="background:${j.colors.trim}"></span></span>`
      : '<span class="mini-swatch"><span style="background:#666"></span></span>';
    row.innerHTML = `<div class="row-title">${sw} ${j.name}</div>
      <button class="btn small ${save.equipped.jersey === j.id ? 'disabled' : 'primary'}">${save.equipped.jersey === j.id ? 'Worn' : 'Wear'}</button>`;
    row.querySelector('button').addEventListener('click', () => {
      equip('jersey', j.id);
      game.audio.click();
      renderGarage(game);
    });
    gearCol.appendChild(row);
  }

  const helHeader = el('h3', null, 'Helmets');
  helHeader.style.marginTop = '16px';
  gearCol.appendChild(helHeader);
  for (const h of HELMETS.filter((x) => save.ownedGear.includes(x.id))) {
    const row = el('div', `loadout-row ${save.equipped.helmet === h.id ? 'equipped' : ''}`);
    row.innerHTML = `<div class="row-title"><span class="mini-swatch"><span style="background:${h.base}"></span><span style="background:${h.visor}"></span></span> ${h.name}</div>
      <button class="btn small ${save.equipped.helmet === h.id ? 'disabled' : 'primary'}">${save.equipped.helmet === h.id ? 'Worn' : 'Wear'}</button>`;
    row.querySelector('button').addEventListener('click', () => {
      equip('helmet', h.id);
      game.audio.click();
      renderGarage(game);
    });
    gearCol.appendChild(row);
  }

  const decalCol = qs('#garage-decals');
  decalCol.innerHTML = '<h3>Decals</h3>';
  const decalList = [{ id: null, name: 'No decal' }].concat(DECALS.filter((d) => save.unlockedDecals.includes(d.id)));
  for (const d of decalList) {
    const row = el('div', `loadout-row ${save.equipped.decal === d.id ? 'equipped' : ''}`);
    row.innerHTML = `<div class="row-title">${d.name}</div>
      <button class="btn small ${save.equipped.decal === d.id ? 'disabled' : 'primary'}">${save.equipped.decal === d.id ? 'On the bike' : 'Stick it on'}</button>`;
    row.querySelector('button').addEventListener('click', () => {
      equip('decal', d.id);
      game.audio.click();
      renderGarage(game);
    });
    decalCol.appendChild(row);
  }
  if (decalCol.children.length === 1) {
    decalCol.appendChild(el('p', 'muted', 'Collect all 3 pucks in a city to earn its decal.'));
  }

  startGaragePreview(game, save);
}

function startGaragePreview(game, save) {
  stopGaragePreview();
  const canvas = qs('#garage-preview');
  const ctx = canvas.getContext('2d');
  const loadout = {
    bike: game.bikeById(save.equipped.bike),
    jersey: JERSEYS.find((j) => j.id === save.equipped.jersey) || null,
    helmet: HELMETS.find((h) => h.id === save.equipped.helmet) || null,
    decal: DECALS.find((d) => d.id === save.equipped.decal) || null,
  };
  const [lo, hi] = sweetSpot(loadout.bike);
  let t = 0;
  let angle = 44, angVel = 0;
  const tick = () => {
    if (!qs('#screen-garage').classList.contains('active')) { stopGaragePreview(); return; }
    t += 1 / 60;
    // light sway so the rider looks alive
    const target = (lo + hi) / 2 + Math.sin(t * 0.9) * 5;
    const torque = (target - angle) * 6 - angVel * 2.4;
    angVel += torque / 60;
    angle += angVel / 60;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#141922';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width * 0.38, canvas.height * 0.86);
    const sc = canvas.height / 190;
    ctx.scale(sc, sc);
    ctx.rotate(-angle * Math.PI / 180);
    drawBike(ctx, loadout, null, t * 6, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    garageRAF = requestAnimationFrame(tick);
  };
  garageRAF = requestAnimationFrame(tick);
}

function stopGaragePreview() {
  if (garageRAF) cancelAnimationFrame(garageRAF);
  garageRAF = null;
}
