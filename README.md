# Wheelie League

A browser-based motorcycle wheelie-balance game: hold the wheelie, chain tricks,
bank coins, buy better bikes, level up, and unlock eight NHL-hockey-city-inspired
maps. Vanilla HTML5 Canvas + JavaScript ES modules, no engine, no build step.
All artwork, names, and color palettes are original homages - no licensed IP.

## Run it

Any static file server from the repo root works:

```
python3 -m http.server 8080
# open http://localhost:8080
```

## Controls

- Throttle: `D` or `->` (on-screen button on touch devices)
- Brake: `A` or `<-`
- Both together: fine-balance stabilization
- Tricks (while holding a wheelie): `W` Knee Drag, `S` Hand Drag, `E` Seat Stand, `R` No-Hander
- Pause: `Esc` or `P`

## Structure

```
index.html              entry point
src/main.js             game loop + state machine (MENU/RUN/PAUSED/RESULTS/...)
src/physics.js          wheelie angle, throttle/brake torque model, crash rules
src/tricks.js           trick inputs, risk windows, combo chain
src/economy.js          coins, milestones, XP, shop purchase logic
src/bikes.js            bike roster + jerseys/decals
src/audio.js            synthesized WebAudio engine/SFX + per-map music loops
src/render.js           parallax world, bike/rider, ragdoll, particles
src/ui/                 menu, HUD + touch controls, shop, map select, garage, results
src/maps/               map registry + one module per city (palettes, hazards, eggs)
save/localStorageManager.js   persistence: coins, XP, bikes, cosmetics, pucks, bests
```

## Design notes

- Balance guardrails (spec): better bikes widen the sweet spot a few degrees,
  damp twitch, and soften crash penalties - they never remove the core challenge.
- Maps are level-gated; the Championship Circuit also requires visiting all
  seven other cities once.
- Each map hides 3 collectible pucks; all three unlock that city's cosmetic decal.
