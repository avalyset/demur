/**
 * Regime sampling — C3 verifiable contract (ADR 0018 existence leg).
 *
 * The pre-registration binds `q` and the accepted trait sequence to the committed
 * code: these tests prove determinism (same seeds → same q + same 50 vectors, a
 * stable hash), the percentile/region contract, and that a continuous vector
 * yields a valid SimCat (substrate accepts it, unchanged). The floor is NOT run
 * here — this is the green C3 gate that must precede any data.
 */

import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createSimCat } from '../simcat/state-machine';
import { approachTendency } from '../simcat/personality';
import {
  computeQ,
  computeQHigh,
  percentileOf,
  PERCENTILE,
  sampleRegime,
  sampleRegimeHigh,
  cubeApproachTendencies,
  regimeArchetype,
  regimeSessions,
  regimeSessionsHigh,
  REGIME_SIM_CONFIG,
  M,
  N_SESSIONS,
  H_FIXED,
  REGIME_NAME,
  PERCENTILE_HIGH,
  S_SESSIONS_HIGH,
  REGIME_NAME_HIGH,
} from './regime';
import type { FelineFive, AgentAction, AgentActionType } from '../types';

function hashVectors(vs: FelineFive[]): string {
  return createHash('sha256').update(JSON.stringify(vs)).digest('hex');
}

describe('regime: determinism (same seed → same output)', () => {
  it('computeQ is deterministic', () => {
    expect(computeQ()).toBe(computeQ());
  });
  it('sampleRegime returns the same 50 vectors on every call', () => {
    const q = computeQ();
    expect(sampleRegime(q)).toEqual(sampleRegime(q));
  });
  it('the accepted-vector hash is stable (the pre-reg ↔ code binding)', () => {
    const q = computeQ();
    expect(hashVectors(sampleRegime(q))).toBe(hashVectors(sampleRegime(q)));
  });
});

// The 0018 output is locked to KNOWN literals: the parametrization (ADR 0019) must not
// move the low leg by a single bit. These are the values committed in the 0018 resolution.
describe('regime: 0018 low-leg output is byte-locked (parametrization did not disturb it)', () => {
  it('computeQ() is exactly the pre-registered 0018 q', () => {
    expect(computeQ()).toBe(0.0959236421389505);
  });
  it('sampleRegime hash is exactly the pre-registered 0018 SHA256', () => {
    expect(hashVectors(sampleRegime(computeQ()))).toBe(
      '50bd8a0da64af9425fa9bbddf8d6432da51b27af19985393ebcb1ec62122bf2d',
    );
  });
});

describe('regime: contract (R_low + percentile)', () => {
  const q = computeQ();
  const vectors = sampleRegime(q);

  it('exactly N = 50 accepted vectors', () => {
    expect(vectors.length).toBe(N_SESSIONS);
    expect(N_SESSIONS).toBe(50);
  });
  it('every accepted vector is in R_low (approachTendency < q)', () => {
    for (const v of vectors) expect(approachTendency(v)).toBeLessThan(q);
  });
  it('q is the empirical 25th percentile: ~25% of the cube sample is below q', () => {
    const ats = cubeApproachTendencies();
    const below = ats.filter((a) => a < q).length;
    expect(below / M).toBeCloseTo(0.25, 2); // |frac − 0.25| < 0.005
  });
});

describe('regime HIGH (ADR 0019): declared constants', () => {
  it('high-leg seed/percentile/label are the pre-registered literals', () => {
    expect(PERCENTILE_HIGH).toBe(0.75);
    expect(S_SESSIONS_HIGH).toBe(20260626);
    expect(REGIME_NAME_HIGH).toBe('REGIME_HIGH');
  });
});

describe('regime HIGH: determinism (same seed → same output)', () => {
  it('computeQHigh is deterministic', () => {
    expect(computeQHigh()).toBe(computeQHigh());
  });
  it('sampleRegimeHigh returns the same 50 vectors on every call', () => {
    const qHigh = computeQHigh();
    expect(sampleRegimeHigh(qHigh)).toEqual(sampleRegimeHigh(qHigh));
  });
  it('the high accepted-vector hash is stable and matches the pre-reg ↔ code binding', () => {
    const qHigh = computeQHigh();
    // Locked literal — the external record of the 50 R_high vectors (C3 gate for ADR 0019).
    expect(hashVectors(sampleRegimeHigh(qHigh))).toBe(
      '59022cc376c7cdacb724c698135944b4bebfe93fc288251ee0e07083e6ec0cef',
    );
  });
  it('q_high is exactly the committed value (external record)', () => {
    expect(computeQHigh()).toBe(0.2994022299302742);
  });
});

describe('regime HIGH: contract (R_high + 75th percentile, SAME cube)', () => {
  const qHigh = computeQHigh();
  const vectors = sampleRegimeHigh(qHigh);

  it('exactly N = 50 accepted vectors', () => {
    expect(vectors.length).toBe(N_SESSIONS);
  });
  it('every accepted vector is in R_high (approachTendency > q_high)', () => {
    for (const v of vectors) expect(approachTendency(v)).toBeGreaterThan(qHigh);
  });
  it('q_high is the empirical 75th percentile: ~25% of the cube sample is above q_high', () => {
    const ats = cubeApproachTendencies();
    const above = ats.filter((a) => a > qHigh).length;
    expect(above / M).toBeCloseTo(0.25, 2); // |frac − 0.25| < 0.005
  });
  it('q_high sits strictly above the low-leg q (the cut is genuinely the upper tail)', () => {
    expect(qHigh).toBeGreaterThan(computeQ());
  });
  it('the high cut is taken over the SAME cube as the low cut (S_cube shared)', () => {
    // Build the cube ONCE; derive both percentiles from the identical sample.
    const ats = cubeApproachTendencies();
    const qLow = percentileOf(ats, PERCENTILE);
    const qHi = percentileOf(ats, PERCENTILE_HIGH);
    expect(ats.filter((a) => a < qLow).length / M).toBeCloseTo(0.25, 2);
    expect(ats.filter((a) => a > qHi).length / M).toBeCloseTo(0.25, 2);
    // Same sample ⇒ the percentile computed here equals the public function's value.
    expect(qHi).toBe(qHigh);
  });
});

describe('regime HIGH: regimeSessionsHigh population', () => {
  it('50 sessions, seeds 1..50, h_fixed identical to 0018, name = placeholder per ADR §4', () => {
    const sessions = regimeSessionsHigh();
    expect(sessions.length).toBe(50);
    expect(sessions[0].simcatSeed).toBe(1);
    expect(sessions[0].ollamaSeed).toBe(1);
    expect(sessions[49].simcatSeed).toBe(50);
    expect(sessions[49].ollamaSeed).toBe(50);
    expect(sessions[0].archetype.habituation_rate).toBe(0.008);
    expect(sessions[0].archetype.habituation_rate).toBe(H_FIXED);
    expect(String(sessions[0].archetype.name)).toBe(REGIME_NAME); // name stays placeholder (ADR 0019 §4)
  });
});

describe('regime: continuous vector → valid SimCat (substrate unchanged, accepts it)', () => {
  it('regimeArchetype sets h_fixed and a placeholder name; createSimCat ticks to a valid CatState', () => {
    const v = sampleRegime(computeQ())[0];
    const arch = regimeArchetype(v);
    expect(arch.habituation_rate).toBe(H_FIXED);
    expect(arch.habituation_rate).toBe(0.008);
    expect(String(arch.name)).toBe(REGIME_NAME);
    expect(arch.personality).toEqual(v);

    const sim = createSimCat(arch, REGIME_SIM_CONFIG, 1);
    const idle: AgentAction = { type: 'idle' as AgentActionType, intensity: 0, duration_ms: 0 };
    const cs = sim.tick(idle);
    expect(cs.tickCount).toBe(1);
    expect(typeof cs.cssScore).toBe('number');
    expect(cs).toHaveProperty('withdrawalEvent'); // tick-only field present (null or {code})
  });

  it('regimeSessions: 50 sessions with simcat/ollama seeds 1..50', () => {
    const sessions = regimeSessions();
    expect(sessions.length).toBe(50);
    expect(sessions[0].simcatSeed).toBe(1);
    expect(sessions[0].ollamaSeed).toBe(1);
    expect(sessions[49].simcatSeed).toBe(50);
    expect(sessions[49].ollamaSeed).toBe(50);
  });
});
