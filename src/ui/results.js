// Wheelie League - results screen + level-up celebration overlay.

import { levelProgress } from '../../save/localStorageManager.js';
import { mapById } from '../maps/maps.js';
import { fmtCoins, qs, showScreen, el, renderMapPostcard } from './uiCommon.js';

export function initResults(game) {
  qs('#results-again').addEventListener('click', () => { game.audio.click(); game.startRun(game.currentMapId); });
  qs('#results-shop').addEventListener('click', () => { game.audio.click(); game.goTo('shop'); });
  qs('#results-map').addEventListener('click', () => { game.audio.click(); game.goTo('map'); });
  qs('#results-menu').addEventListener('click', () => { game.audio.click(); game.goTo('menu'); });
  qs('#levelup-continue').addEventListener('click', () => {
    game.audio.click();
    qs('#overlay-levelup').classList.remove('open');
    if (game.pendingResults) {
      showResults(game, game.pendingResults.run, game.pendingResults.summary);
      game.pendingResults = null;
    }
    showScreen('#screen-results');
  });
}

// Shown before the results screen when the run crossed a level threshold.
export function showLevelUp(game, oldLevel, newLevel, unlockedMaps) {
  const ov = qs('#overlay-levelup');
  qs('#levelup-title').textContent = `LEVEL ${newLevel}`;
  const sub = qs('#levelup-sub');
  if (unlockedMaps.length > 0) {
    sub.textContent = `New destination unlocked: ${unlockedMaps.map((m) => m.name).join(', ')}!`;
  } else if (newLevel > oldLevel) {
    sub.textContent = 'The league takes notice. Keep riding.';
  }
  const postcardWrap = qs('#levelup-postcards');
  postcardWrap.innerHTML = '';
  const postcards = unlockedMaps.length > 0
    ? unlockedMaps
    : [mapById(game.currentMapId)];
  for (const map of postcards) {
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 240;
    canvas.className = 'levelup-postcard reveal';
    postcardWrap.appendChild(canvas);
    renderMapPostcard(canvas, mapById(map.id));
    postcardWrap.appendChild(el('div', 'postcard-label',
      unlockedMaps.length > 0 ? `${map.name} - ${map.subtitle}` : 'A postcard from the road'));
  }
  game.audio.paAnnounce();
  ov.classList.add('open');
}

export function showResults(game, run, summary) {
  showScreen('#screen-results');
  const phys = run.physics;
  const map = game.mapById(game.currentMapId);

  qs('#results-map-name').textContent = map.name;
  qs('#results-stats').innerHTML = `
    <div class="rstat"><span class="rnum">${Math.round(phys.distance)}</span><span class="rlabel">meters</span></div>
    <div class="rstat"><span class="rnum">${phys.longestWheelie.toFixed(0)}</span><span class="rlabel">longest wheelie (m)</span></div>
    <div class="rstat"><span class="rnum">${run.tricks.tricksLanded}</span><span class="rlabel">tricks landed</span></div>
    <div class="rstat"><span class="rnum">x${run.tricks.multiplier().toFixed(1)}</span><span class="rlabel">final combo</span></div>
    <div class="rstat"><span class="rnum">${run.tricks.peakChain}</span><span class="rlabel">best chain</span></div>
    <div class="rstat"><span class="rnum">${phys.survivalTime.toFixed(0)}s</span><span class="rlabel">survived</span></div>
    <div class="rstat"><span class="rnum">${summary.newRecord ? 'YES' : 'no'}</span><span class="rlabel">new PB</span></div>
    <div class="rstat"><span class="rnum">${run.pucksFound}</span><span class="rlabel">pucks found</span></div>`;

  const bd = run.bank;
  const rows = [
    ['Wheelie distance', Math.round(bd.distanceCoins * bd.sessionMultiplier)],
    ['Tricks', Math.round(bd.trickCoins * bd.sessionMultiplier)],
    ['Milestones', Math.round(bd.milestoneCoins * bd.sessionMultiplier)],
    ['Perfect balance', Math.round(bd.perfectCoins * bd.sessionMultiplier)],
  ];
  if (bd.sessionMultiplier > 1) rows.push(['Daily first-run bonus (1.25x)', null]);
  if (bd.penalty > 0) rows.push(['Crash penalty', -bd.penalty]);
  qs('#results-coins').innerHTML = rows
    .map(([label, v]) => `<div class="coin-row ${v < 0 ? 'neg' : ''}"><span>${label}</span><span>${v === null ? 'applied above' : (v >= 0 ? '+' : '') + fmtCoins(v)}</span></div>`)
    .join('') + `<div class="coin-row total"><span>Coins earned</span><span>+${fmtCoins(bd.net())}</span></div>`;

  const lp = levelProgress(game.save.xp);
  qs('#results-xp').innerHTML = `
    <div class="coin-row"><span>XP earned</span><span>+${fmtCoins(summary.xp)}</span></div>
    <div class="coin-row total"><span>Level ${lp.level}</span><span>${fmtCoins(lp.cur)} / ${fmtCoins(lp.need)}</span></div>
    <div class="xpbar"><span style="width:${Math.round(lp.frac * 100)}%"></span></div>`;
}
