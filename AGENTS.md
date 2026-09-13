# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Wheelie League

- No build step: `npm start` runs `server.js` (zero-dependency Node static server, binds 0.0.0.0 so LAN devices can test; `PORT` env to change). Any static server from the repo root works too. ES modules will not run from `file://`.
- Everything hangs off the game object created in `src/main.js` (`window.__WL.game` is exposed as a debug/test hook); the state machine is MENU/RUN/PAUSED/RESULTS plus DOM screens for shop/map/garage driven from `src/ui/`.
- Game rules and tuning live in data modules, not screens: bikes/jerseys/decals in `src/bikes.js`, maps in `src/maps/`, coins/XP/milestones in `src/economy.js`, persistence in `save/localStorageManager.js` (localStorage key `wheelie-league-save-v1`).
- Hard IP constraint: no real NHL team names, logos, or wordmarks anywhere - city names, generic arena silhouettes, and color-palette homages only.
- Balance guardrail: upgrades widen the sweet spot (`sweetExtend` in `src/bikes.js`) and soften crash penalties but must not trivialize the balance challenge; the physics core is `src/physics.js`.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
