/**
 * Regime sampling — ADR 0018 existence leg + ADR 0019 high-engagement leg (demur).
 *
 * Builds the pre-registered low-engagement session population: continuous trait
 * vectors from R_low = { p : approachTendency(p) < q }, where q is the 25th
 * percentile of approachTendency over the unit cube. Outcome-blind by
 * construction — q has no contact with any gate output or archetype identity.
 *
 * The symmetric ADR 0019 high leg reuses the SAME cube (S_CUBE) and the SAME
 * percentile/PRNG conventions, taking R_high = { p : approachTendency(p) > q_high }
 * with q_high the 75th percentile, under a new declared session seed
 * (S_SESSIONS_HIGH). Only the cut and the seed differ; the low-leg output is
 * byte-locked (see regime.test.ts) so the parametrization cannot disturb 0018.
 *
 * ADR 0018 §3/§4 fix the seeds (S_cube/S_sessions), M, percentile, N, h_fixed,
 * and the approachTendency formula (imported verbatim from personality.ts). The
 * ADR does NOT specify the PRNG algorithm or the percentile convention; those are
 * fixed HERE and committed BEFORE the floor runs, so the produced q + accepted-
 * vector sequence are external record before any data exists (the C3-gated,
 * verifiable part — see regime.test.ts).
 *
 * Substrate untouched: this module imports createPersonality/approachTendency and
 * constructs Archetype objects the existing createSimCat already accepts.
 */

import type { FelineFive, Archetype, ArchetypeName, SimConfig } from '../types';
import { createPersonality, approachTendency } from '../simcat/personality';

export const S_CUBE = 20260624; // ADR 0018 §3
export const S_SESSIONS = 20260625; // ADR 0018 §4
export const M = 10000; // §3 — cube samples for the percentile
export const PERCENTILE = 0.25; // §3 — 25th percentile
export const N_SESSIONS = 50; // §4
export const H_FIXED = 0.008; // §4 — median of the placeholder range, fixed for all 50
export const REGIME_NAME = 'REGIME_LOW'; // §4 — single declared placeholder label (not used in dynamics)

// ADR 0019 high-engagement leg — symmetric mirror of 0018, SAME cube (S_CUBE), SAME M/N/H_FIXED.
// Only the cut (75th vs 25th percentile, > vs <) and the session seed differ.
export const S_SESSIONS_HIGH = 20260626; // ADR 0019 §4 — new declared seed for the high leg
export const PERCENTILE_HIGH = 0.75; // ADR 0019 §3 — 75th percentile
export const REGIME_NAME_HIGH = 'REGIME_HIGH'; // run-log label only (Archetype.name stays REGIME_NAME per ADR 0019 §4)

/** mulberry32 — deterministic 32-bit-seeded PRNG. Algorithm fixed here; the ADR fixes the seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function (): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One trait vector = five uniform[0,1) draws in (N,E,D,I,A) order. */
function sampleVector(rng: () => number): FelineFive {
  return createPersonality(rng(), rng(), rng(), rng(), rng());
}

/** The M approachTendency values over the unit cube under S_cube — what the percentile is taken over. */
export function cubeApproachTendencies(): number[] {
  const rng = mulberry32(S_CUBE);
  const ats = new Array<number>(M);
  for (let i = 0; i < M; i++) ats[i] = approachTendency(sampleVector(rng));
  return ats;
}

/**
 * Empirical percentile (nearest-rank: sort ascending, index floor(percentile × length)).
 * The single percentile convention shared by both legs — fixed here, committed before
 * any data, so low (0.25) and high (0.75) cuts are determined identically.
 */
export function percentileOf(values: number[], percentile: number): number {
  const sorted = [...values].sort((x, y) => x - y);
  return sorted[Math.floor(percentile * sorted.length)];
}

/** q = empirical 25th percentile of approachTendency over the cube (index floor(0.25 × M) = 2500). */
export function computeQ(): number {
  return percentileOf(cubeApproachTendencies(), PERCENTILE);
}

/** q_high = empirical 75th percentile over the SAME cube (index floor(0.75 × M) = 7500) — ADR 0019 §3. */
export function computeQHigh(): number {
  return percentileOf(cubeApproachTendencies(), PERCENTILE_HIGH);
}

/**
 * N accepted trait vectors satisfying `accept(approachTendency(v))`, rejection-sampled
 * under `seed`. One PRNG, drawn in order; the predicate decides acceptance only — so the
 * draw sequence is fully determined by (seed, accept).
 */
function sampleRegimeWith(seed: number, accept: (at: number) => boolean): FelineFive[] {
  const rng = mulberry32(seed);
  const accepted: FelineFive[] = [];
  while (accepted.length < N_SESSIONS) {
    const v = sampleVector(rng);
    if (accept(approachTendency(v))) accepted.push(v);
  }
  return accepted;
}

/** Low leg (ADR 0018): approachTendency < q under S_SESSIONS. */
export function sampleRegime(q: number): FelineFive[] {
  return sampleRegimeWith(S_SESSIONS, (at) => at < q);
}

/** High leg (ADR 0019): approachTendency > q_high under S_SESSIONS_HIGH. */
export function sampleRegimeHigh(qHigh: number): FelineFive[] {
  return sampleRegimeWith(S_SESSIONS_HIGH, (at) => at > qHigh);
}

/**
 * Archetype from a continuous trait vector: personality = the vector,
 * habituation_rate = h_fixed (§4), name = declared placeholder (§4, cosmetic).
 */
export function regimeArchetype(p: FelineFive): Archetype {
  return {
    name: REGIME_NAME as unknown as ArchetypeName,
    personality: p,
    habituation_rate: H_FIXED,
  };
}

export interface RegimeSession {
  archetype: Archetype;
  simcatSeed: number;
  ollamaSeed: number;
}

/** The pre-registered session population: 50 (archetype, simcatSeed=i, ollamaSeed=i) tuples (i = 1..50). */
export function regimeSessions(): RegimeSession[] {
  const q = computeQ();
  return sampleRegime(q).map((p, idx) => ({
    archetype: regimeArchetype(p),
    simcatSeed: idx + 1,
    ollamaSeed: idx + 1,
  }));
}

/** ADR 0019 high-engagement population: 50 (archetype, simcatSeed=i, ollamaSeed=i) from R_high. */
export function regimeSessionsHigh(): RegimeSession[] {
  const qHigh = computeQHigh();
  return sampleRegimeHigh(qHigh).map((p, idx) => ({
    archetype: regimeArchetype(p),
    simcatSeed: idx + 1,
    ollamaSeed: idx + 1,
  }));
}

/** SimConfig used for regime sessions (identical to the floor: tickRate 10, arena 800×500). */
export const REGIME_SIM_CONFIG: SimConfig = { tickRate: 10, simSpeed: 1, arenaWidth: 800, arenaHeight: 500 };
