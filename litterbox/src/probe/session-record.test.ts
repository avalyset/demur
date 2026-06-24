/**
 * Shared reconstruction + aggregator-equivalence (ADR 0016 Part 2, demur).
 *
 * The load-bearing test: the offline aggregator's parse→reconstruct path produces
 * a record IDENTICAL to the driver's path (both call reconstructSession), so the
 * resumed/offline floor is provably equivalent to a single live run.
 */

import { describe, it, expect } from 'vitest';
import { reconstructSession, sampleSD, mean, WINDOW } from './session-record';
import { parseSessionLog } from './aggregate';

/** Serialise series into the exact per-tick jsonl shape the driver writes. */
function jsonlOf(intensities: number[], aviFlags: boolean[]): string {
  return intensities
    .map((v, i) =>
      JSON.stringify({
        tick: i + 1,
        action: 'maintain_engagement',
        intensity: v,
        parseFailure: false,
        state: 'CURIOUS',
        cssScore: 2,
        withdrawalCode: aviFlags[i] ? 'AVI' : null,
        optimalAction: null,
        raw: 'x',
      }),
    )
    .join('\n') + '\n';
}

describe('session-record: math', () => {
  it('mean and sample SD', () => {
    expect(mean([0, 0, 1, 1])).toBe(0.5);
    expect(sampleSD([0, 0, 1, 1])).toBeCloseTo(Math.sqrt(1 / 3), 6);
    expect(sampleSD([5])).toBeNaN(); // <2 points
  });
  it('WINDOW is N=8', () => {
    expect(WINDOW).toBe(8);
  });
});

describe('session-record: reconstructSession — P6 inclusion + P2 windows', () => {
  const N = 20;
  it('qualifies; before = T-8..T-1, after = T+1..T+8 (causal)', () => {
    const intensities = Array(N).fill(0);
    const aviFlags = Array(N).fill(false);
    aviFlags[10] = true; // first AVI at idx 10 (T=11)
    for (let i = 2; i < 10; i++) intensities[i] = 0.7; // before window (idx 2..9)
    for (let i = 11; i < 19; i++) intensities[i] = 0.1; // after window (idx 11..18)
    const r = reconstructSession(intensities, aviFlags, N);
    expect(r.qualified).toBe(true);
    expect(r.firstAviTick).toBe(11);
    expect(r.record!.beforeMean).toBeCloseTo(0.7, 10);
    expect(r.record!.afterMean).toBeCloseTo(0.1, 10);
  });
  it('excludes: no AVI fired', () => {
    const r = reconstructSession(Array(N).fill(0.5), Array(N).fill(false), N);
    expect(r.qualified).toBe(false);
    expect(r.reason).toMatch(/no AVI/);
  });
  it('excludes: first AVI too early (idx < 8)', () => {
    const avi = Array(N).fill(false); avi[3] = true;
    const r = reconstructSession(Array(N).fill(0.5), avi, N);
    expect(r.qualified).toBe(false);
    expect(r.reason).toMatch(/too early/);
  });
  it('excludes: first AVI too late (idx > budget-1-8)', () => {
    const avi = Array(N).fill(false); avi[N - 3] = true; // idx 17 > 11
    const r = reconstructSession(Array(N).fill(0.5), avi, N);
    expect(r.qualified).toBe(false);
    expect(r.reason).toMatch(/too late/);
  });
  it('only the FIRST AVI starts the window (later onsets ignored)', () => {
    const avi = Array(N).fill(false); avi[10] = true; avi[15] = true;
    const r = reconstructSession(Array(N).fill(0.3), avi, N);
    expect(r.firstAviTick).toBe(11); // first, not 16
    expect(r.qualified).toBe(true);
  });
});

describe('session-record: aggregator path === driver path (provable equivalence)', () => {
  it('parseSessionLog(jsonl) → reconstruct is IDENTICAL to reconstruct on the original series', () => {
    const N = 40;
    const intensities = Array.from({ length: N }, (_, i) => [0, 0.1, 0.3, 0.5, 0.7, 0.9][i % 6]);
    const aviFlags = Array(N).fill(false);
    aviFlags[20] = true; // first AVI at idx 20

    const direct = reconstructSession(intensities, aviFlags, N); // the driver's path
    const parsed = parseSessionLog(jsonlOf(intensities, aviFlags)); // the aggregator's path
    const viaAggregator = reconstructSession(parsed.intensities, parsed.aviFlags, parsed.nTicks);

    expect(parsed.intensities).toEqual(intensities);
    expect(parsed.aviFlags).toEqual(aviFlags);
    expect(parsed.nTicks).toBe(N);
    expect(viaAggregator).toEqual(direct); // identical record + gate input
  });
});
