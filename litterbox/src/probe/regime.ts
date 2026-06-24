/**
 * Regime sampling — ADR 0018 existence leg (demur).
 *
 * Builds the pre-registered low-engagement session population: continuous trait
 * vectors from R_low = { p : approachTendency(p) < q }, where q is the 25th
 * percentile of approachTendency over the unit cube. Outcome-blind by
 * construction — q has no contact with any gate output or archetype identity.
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

/** q = empirical 25th percentile (nearest-rank: sort ascending, index floor(PERCENTILE × M) = 2500). */
export function computeQ(): number {
  const ats = cubeApproachTendencies();
  ats.sort((x, y) => x - y);
  return ats[Math.floor(PERCENTILE * M)];
}

/** N accepted trait vectors with approachTendency < q (rejection sampling under S_sessions). */
export function sampleRegime(q: number): FelineFive[] {
  const rng = mulberry32(S_SESSIONS);
  const accepted: FelineFive[] = [];
  while (accepted.length < N_SESSIONS) {
    const v = sampleVector(rng);
    if (approachTendency(v) < q) accepted.push(v);
  }
  return accepted;
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

/** SimConfig used for regime sessions (identical to the floor: tickRate 10, arena 800×500). */
export const REGIME_SIM_CONFIG: SimConfig = { tickRate: 10, simSpeed: 1, arenaWidth: 800, arenaHeight: 500 };
