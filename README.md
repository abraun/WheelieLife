# Wheelie League

A browser-based motorcycle wheelie-balance game: hold the wheelie, chain tricks,
bank coins, buy better bikes, level up, and unlock eight NHL-hockey-city-inspired
maps. Vanilla HTML5 Canvas + JavaScript ES modules, no engine, no build step.
All artwork, names, and color palettes are original homages - no licensed IP.

## Run it

Requires Node 18+. The start script serves the repo root on `0.0.0.0`, so the
printed LAN URL works from phones and other devices on the same network:

```
npm start            # serves on http://localhost:8080
PORT=3000 npm start  # custom port
```

Any other static file server from the repo root also works
(e.g. `python3 -m http.server 8080`).

## Controls

- Throttle: `D` or `->` (on-screen button on touch devices)
- Brake: `A` or `<-`
- Both together: fine-balance stabilization (stabilizes rotation, but bleeds
  speed - pulse the throttle to stay up)
- Tricks (while holding a wheelie): `Q` Knee Knocker, `W` Knee Drag,
  `E` Hand Drag, `R` Seat Stand, `T` No-Hander
- Pause: `Esc` or `P` - `Enter` on the results screen: ride again

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

- Bikes are fictional lookalikes of real electric dirt bikes (light-bee trail
  bikes, mid-size MX e-motos, fat-tire cruisers) with original names and paint.
- Balance guardrails (spec): better bikes widen the sweet spot a few degrees,
  damp twitch, and soften crash penalties - they never remove the core challenge.
  A gentle assist spring nudges you toward the sweet spot; past its edge,
  gravity still wins and loop-outs are real.
- Helmets and jerseys are buyable in the shop; decals are earned via pucks.
- Leveling is intentionally slow: XP is quadratic in level, so early levels
  come fast and the top maps are a real grind.
- Maps are level-gated; the Championship Circuit also requires visiting all
  seven other cities once.
- Each map hides 3 collectible pucks; all three unlock that city's cosmetic decal.
