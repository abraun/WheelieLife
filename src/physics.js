// Wheelie League - wheelie balance physics (spec 2).
// Single rear-axle pivot model: gravity torque is restoring below the balance
// point and loop-out above it; throttle lifts, brake drops; holding both gives
// a damped fine-balance mode. Speed increases throttle twitchiness.

import { sweetSpot } from './bikes.js';

export const LOOP_OUT_ANGLE = 86;     // deg, bike tips backward -> crash
export const MIN_PULL_SPEED = 90;     // px/s needed to lift the front wheel
export const HOLD_SPEED = 60;         // px/s below which the front falls fast
export const SLAP_SPEED_FRAC = 0.30;  // touchdown above this speed fraction = crash
export const SLAP_ANGVEL = 150;       // deg/s downward slam also crashes

export class BikePhysics {
  constructor(bike, seed) {
    this.bike = bike;
    this.sweet = sweetSpot(bike);
    this.reset(seed || 12345);
  }

  reset(seed) {
    this.x = 0;                 // world px
    this.speed = 0;             // px/s
    this.angle = 0;             // wheelie angle, deg (0 = flat)
    this.angVel = 0;            // deg/s
    this.onGround = true;
    this.wheelied = false;      // front wheel currently up
    this.inSweet = false;
    this.crashed = false;
    this.crashReason = null;
    this.distance = 0;          // meters (10 px = 1 m)
    this.longestWheelie = 0;    // meters
    this.currentWheelie = 0;    // meters
    this.survivalTime = 0;
    this.noiseSeed = seed;
    this.noiseT = 0;
    this.zoneTorque = 0;        // external torque from hazards (gusts/vents)
    this.zoneDampMul = 1;       // slick zones reduce damping
    this.terrainAngle = 0;      // slope under the wheels, deg
    this.shake = 0;             // screen shake impulse
    this.throttleHeld = 0;      // smoothed throttle input, 0..1
    this.brakeHeld = 0;         // smoothed brake input, 0..1
    this.susp = 0;              // suspension compression impulse, 0..1
  }

  get speedFrac() {
    return Math.min(1, this.speed / this.bike.speedCap);
  }

  // meters-per-second equivalent, for HUD
  get speedMps() {
    return this.speed / 10;
  }

  applyZone(zone) {
    // zone: {torque, dampMul}
    if (zone.torque) this.zoneTorque += zone.torque;
    if (zone.dampMul) this.zoneDampMul = Math.min(this.zoneDampMul, zone.dampMul);
  }

  step(dt, input, risk, onEvent) {
    if (this.crashed) return;
    const b = this.bike;
    this.survivalTime += dt;
    this.noiseT += dt;

    // --- Inputs ramp in over ~1/8 s: twitchy on/off snapping becomes deliberate ---
    const ramp = (held, pressed) => {
      const target = pressed ? 1 : 0;
      const d = target - held;
      const stepAmt = Math.min(Math.abs(d), dt * 8);
      return held + Math.sign(d) * stepAmt;
    };
    this.throttleHeld = ramp(this.throttleHeld, input.throttle);
    this.brakeHeld = ramp(this.brakeHeld, input.brake);

    // --- Longitudinal ---
    const bothHeld = input.throttle && input.brake;
    if (this.throttleHeld > 0) this.speed += b.accel * this.throttleHeld * dt;
    if (this.brakeHeld > 0) {
      // Fine-balance mode: the brake mostly pitches the bike, not slows it,
      // so holding both keys sustains the wheelie instead of stalling it.
      this.speed -= b.brake * (bothHeld ? 0.22 : 1) * this.brakeHeld * dt;
    }
    // rolling drag + slope assist
    this.speed -= this.speed * 0.045 * dt;
    this.speed += -Math.sin(this.terrainAngle * Math.PI / 180) * 260 * dt;
    this.speed = Math.max(0, Math.min(b.speedCap, this.speed));
    this.x += this.speed * dt;
    const meters = (this.speed * dt) / 10;
    this.distance += meters;
    if (this.wheelied) {
      this.currentWheelie += meters;
      this.longestWheelie = Math.max(this.longestWheelie, this.currentWheelie);
    }

    // --- Angular ---
    const ang = this.angle;
    const g = 44 * Math.sin((ang - b.balancePoint) * Math.PI / 180);
    let torque = g;
    if (this.throttleHeld > 0) {
      // More speed => twitchier lift (start-slow mastery curve).
      torque += b.lift * (1 + b.twitch * this.speedFrac * 1.1) * this.throttleHeld;
    }
    if (this.brakeHeld > 0) torque -= b.brakeTorque * this.brakeHeld;
    // Gentle balance assist: a soft spring toward the sweet-spot center that
    // only acts inside (and just outside) the band. Helps you hold a wheelie,
    // never fights a real loop-out: past the band edge gravity wins.
    const [alo, ahi] = this.sweet;
    const center = (alo + ahi) / 2;
    const nearBand = this.wheelied && ang > alo - 12 && ang < ahi + 12;
    if (nearBand) {
      torque -= (ang - center) * (0.3 + b.stability * 0.45);
    }
    // Both-pedal fine balance: a real self-balance mode. Inside the band the
    // bike actively centers itself (spring + velocity damping), so holding
    // D+A rides the sweet spot - the SoFlo feel - while speed slowly bleeds.
    if (nearBand && bothHeld) {
      torque -= (ang - center) * 2.4;
      torque -= this.angVel * 1.2;
    }
    // Low-speed front fall: not rolling fast enough to hold it up.
    if (this.speed < HOLD_SPEED && ang > 0) torque -= 20 * (1 - this.speed / HOLD_SPEED);
    // Trick risk noise (deterministic-ish wobble, amplified mid-pose).
    if (risk && risk.noise > 0) {
      const n = Math.sin(this.noiseT * 9.3 + this.noiseSeed) * 0.6 +
                Math.sin(this.noiseT * 23.7 + this.noiseSeed * 2.1) * 0.4;
      torque += n * 30 * risk.noise;
    }
    // Hazard zone torque (gusts / vents) set per-frame by the run loop.
    torque += this.zoneTorque;
    this.zoneTorque = 0;

    let damp = 1.05 + b.stability * 1.25;
    if (bothHeld) damp *= 2.6;   // both-pedal fine balance
    damp *= this.zoneDampMul;
    this.zoneDampMul = 1;

    this.angVel += torque * dt;
    this.angVel *= Math.exp(-damp * dt);
    this.angle += this.angVel * dt;

    // --- Ground contact / crash resolution ---
    if (this.angle <= 0) {
      if (this.wheelied) {
        const slam = this.speed > b.speedCap * SLAP_SPEED_FRAC || this.angVel < -SLAP_ANGVEL;
        this.wheelied = false;
        this.angle = 0;
        if (slam) {
          this.crash('slam');
          return;
        }
        // Controlled slap-down: chain dies, small speed bleed, shake,
        // and the suspension takes the hit (visible compression).
        this.angVel = 0;
        this.speed *= 0.92;
        this.shake = Math.min(1, this.shake + 0.5);
        this.susp = 1;
        if (onEvent) onEvent({ type: 'touchdown' });
      } else {
        this.angle = 0;
        this.angVel = Math.max(0, this.angVel);
      }
    }

    if (this.angle > 0 && !this.wheelied) {
      if (this.speed >= MIN_PULL_SPEED) {
        this.wheelied = true;
        this.currentWheelie = 0;
        if (onEvent) onEvent({ type: 'wheelieStart' });
      } else {
        // Not enough momentum to lift; keep it pinned.
        this.angle = Math.min(this.angle, 2);
        this.angVel = Math.max(this.angVel, 0);
        this.angle = 0;
      }
    }

    if (this.angle >= LOOP_OUT_ANGLE) {
      this.crash('loopout');
      return;
    }

    // Sweet-spot tracking (36-54 +/- bike extension).
    const [lo, hi] = this.sweet;
    const wasIn = this.inSweet;
    this.inSweet = this.wheelied && this.angle >= lo && this.angle <= hi;
    if (this.inSweet && !wasIn && onEvent) onEvent({ type: 'sweetEnter' });

    this.shake = Math.max(0, this.shake - dt * 2.2);
    this.susp = Math.max(0, this.susp - dt * 2.5);
  }

  crash(reason) {
    this.crashed = true;
    this.crashReason = reason;
    this.angle = Math.min(this.angle, LOOP_OUT_ANGLE);
    this.shake = 1;
  }

  // For shop preview bot: PD controller toward a target angle.
  botInput(target) {
    const err = target - this.angle;
    const throttle = err > 1 || this.speed < this.bike.speedCap * 0.35;
    const brake = err < -1;
    return { throttle, brake };
  }
}
