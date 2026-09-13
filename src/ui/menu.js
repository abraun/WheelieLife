// Wheelie League - main menu + settings modal.

import { loadSave, persist, resetSave, levelProgress } from '../../save/localStorageManager.js';
import { fmtCoins, qs, qsa, showScreen } from './uiCommon.js';

export function initMenu(game) {
  qsa('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      game.audio.unlock();
      game.audio.click();
      const dest = btn.dataset.go;
      if (dest === 'run') {
        game.startRun(game.selectedMapId);
      } else {
        game.goTo(dest);
      }
    });
  });

  // settings
  qs('#btn-settings').addEventListener('click', () => {
    qs('#settings-modal').classList.add('open');
    syncSettings(game);
  });
  qs('#settings-close').addEventListener('click', () => {
    qs('#settings-modal').classList.remove('open');
  });
  const toggles = [['set-music', 'music'], ['set-sfx', 'sfx']];
  for (const [id, key] of toggles) {
    qs('#' + id).addEventListener('change', (e) => {
      game.save.settings[key] = e.target.checked;
      persist();
      game.audio.applySettings(game.save.settings);
    });
  }
  qs('#set-touch').addEventListener('change', (e) => {
    game.save.settings.touchControls = e.target.value;
    persist();
    game.hud.setVisible(game.state === 'run');
  });
  qs('#btn-reset').addEventListener('click', () => {
    const c = qs('#btn-reset');
    if (c.dataset.armed) {
      resetSave();
      game.save = loadSave();
      c.dataset.armed = '';
      c.textContent = 'Reset all progress';
      qs('#settings-modal').classList.remove('open');
      game.goTo('menu');
    } else {
      c.dataset.armed = '1';
      c.textContent = 'Tap again to confirm reset';
      setTimeout(() => {
        c.dataset.armed = '';
        c.textContent = 'Reset all progress';
      }, 3500);
    }
  });
}

export function refreshMenu(game) {
  const s = game.save;
  qs('#menu-coins').textContent = fmtCoins(s.coins);
  const lp = levelProgress(s.xp);
  qs('#menu-level').textContent = `Lv ${lp.level}`;
  const bests = Object.values(s.best);
  const totalDist = bests.reduce((a, b) => a + (b.distance || 0), 0);
  qs('#menu-sub').textContent = s.totals.runs === 0
    ? 'Hold a wheelie. Chain tricks. Own every city.'
    : `${s.totals.runs} runs - ${totalDist.toLocaleString('en-US')} m logged across the league`;
  qs('#menu-map-note').textContent = `Next ride: ${game.mapById(game.selectedMapId).name}`;
}

function syncSettings(game) {
  const s = game.save.settings;
  qs('#set-music').checked = s.music;
  qs('#set-sfx').checked = s.sfx;
  qs('#set-touch').value = s.touchControls;
}
