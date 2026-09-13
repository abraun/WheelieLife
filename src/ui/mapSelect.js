// Wheelie League - map select: city grid with locks, PBs, puck counts.

import { MAPS } from '../maps/maps.js';
import { allMapsVisited } from '../economy.js';
import { loadSave, levelFromXp } from '../../save/localStorageManager.js';
import { fmtCoins, qs, showScreen, el, renderMapPostcard } from './uiCommon.js';

export function initMapSelect(game) {
  qs('#map-back').addEventListener('click', () => game.goTo('menu'));
}

export function onMapSelectShow(game) {
  showScreen('#screen-map');
  const save = loadSave();
  const lvl = levelFromXp(save.xp);
  const grid = qs('#map-grid');
  grid.innerHTML = '';
  qs('#map-coins').textContent = fmtCoins(save.coins);
  for (const map of MAPS) {
    const levelOk = lvl >= map.unlockLevel;
    const mapsOk = !map.allMapsRequired || allMapsVisited();
    const unlocked = levelOk && mapsOk && (save.visitedMaps.includes(map.id) || levelOk);
    const best = save.best[map.id];
    const pucks = (save.pucks[map.id] || []).length;
    const card = el('div', `map-card ${unlocked ? '' : 'locked'}`);
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 200;
    canvas.className = 'map-postcard';
    card.appendChild(canvas);
    renderMapPostcard(canvas, map);
    const info = el('div', 'map-info');
    let statusHtml;
    if (!levelOk) statusHtml = `<span class="badge lock">Requires level ${map.unlockLevel}</span>`;
    else if (!mapsOk) statusHtml = `<span class="badge lock">Visit all 7 cities first (${save.visitedMaps.filter(m => m !== 'championship-circuit').length}/7)</span>`;
    else if (!save.visitedMaps.includes(map.id)) statusHtml = '<span class="badge new">NEW CITY</span>';
    else statusHtml = '<span class="badge open">OPEN</span>';
    info.innerHTML = `
      <div class="map-name">${map.name} <span class="map-city">${map.subtitle}</span></div>
      <div class="map-blurb">${map.blurb}</div>
      <div class="map-meta">
        ${statusHtml}
        <span class="badge puck">Pucks ${pucks}/3</span>
        ${best && best.distance > 0 ? `<span class="badge ${best.trophy ? '' : 'pb'}">${'&#127942;'} ${best.distance} m</span>` : '<span class="badge">No runs yet</span>'}
        ${best && best.combo > 0 ? `<span class="badge">Best combo x${(1 + 0.5 * best.combo).toFixed(1)}</span>` : ''}
      </div>`;
    card.appendChild(info);
    if (unlocked) {
      card.addEventListener('click', () => {
        game.audio.unlock();
        game.audio.click();
        game.selectedMapId = map.id;
        game.startRun(map.id);
      });
      card.classList.add('clickable');
    }
    grid.appendChild(card);
  }
}
