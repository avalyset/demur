/**
 * Shared session-record reconstruction (ADR 0016 Part 2, demur).
 *
 * The SINGLE source of truth for the P6 inclusion rule + P2 windows: given a
 * session's per-tick intensity series and AVI-flag series, produce the gate's
 * SessionRecord (or an exclusion + reason). Both the live driver (src/cli/probe.ts)
 * and the offline aggregator (src/probe/aggregate.ts) call this — neither keeps a
 * private copy — so a resumed/offline run is provably equivalent to the live run.
 *
 * Feeds the UNMODIFIED gateVerdict (src/probe/gate.ts, a749900). Reads only the
 * intensity/AVI series; the gate then reads only withinNoAviSD + fixed T_demur
 * (pre-outcome property preserved upstream and downstream).
 */

import type { SessionRecord } from './gate';

/** N=8 (AVI_WINDOW_LEN, ADR 0017); P2 measurement window length. */
export const WINDOW = 8;

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function sampleSD(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

export interface Reconstruction {
  qualified: boolean;
  reason: string;
  firstAviTick: number | null;
  record: SessionRecord | null;
}

/**
 * P6 inclusion + P2 windows. First-AVI T (0-indexed firstAviIdx) qualifies iff
 * firstAviIdx >= WINDOW (full T-8..T-1) AND firstAviIdx <= budget-1-WINDOW (full
 * T+1..T+8). before = T-8..T-1, after = T+1..T+8 (causal, H2). withinNoAviSD =
 * SD of intensity over ticks with no active AVI. First-AVI-per-session only.
 */
export function reconstructSession(
  intensities: number[],
  aviFlags: boolean[],
  budget: number,
): Reconstruction {
  const firstAviIdx = aviFlags.findIndex((f) => f);
  if (firstAviIdx === -1) {
    return { qualified: false, reason: 'no AVI fired', firstAviTick: null, record: null };
  }
  if (firstAviIdx < WINDOW) {
    return { qualified: false, reason: `first AVI too early (idx ${firstAviIdx} < ${WINDOW})`, firstAviTick: firstAviIdx + 1, record: null };
  }
  if (firstAviIdx > budget - 1 - WINDOW) {
    return { qualified: false, reason: `first AVI too late (idx ${firstAviIdx} > ${budget - 1 - WINDOW})`, firstAviTick: firstAviIdx + 1, record: null };
  }
  const before = intensities.slice(firstAviIdx - WINDOW, firstAviIdx);       // T-8..T-1
  const after = intensities.slice(firstAviIdx + 1, firstAviIdx + 1 + WINDOW); // T+1..T+8
  const noAvi = intensities.filter((_, i) => !aviFlags[i]);
  const record: SessionRecord = {
    beforeMean: mean(before),
    afterMean: mean(after),
    withinNoAviSD: sampleSD(noAvi),
  };
  return { qualified: true, reason: 'qualified', firstAviTick: firstAviIdx + 1, record };
}
