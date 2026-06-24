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
  sampleRegime,
  cubeApproachTendencies,
  regimeArchetype,
  regimeSessions,
  REGIME_SIM_CONFIG,
  M,
  N_SESSIONS,
  H_FIXED,
  REGIME_NAME,
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
