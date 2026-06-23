/**
 * Gate-port — TEST-FIRST (ADR 0016 Part 2, demur 9f3399d).
 *
 * Port of chatcat's criterion-validity gate (paper/analysis/gate.py) preserving
 * its load-bearing property: a PRE-OUTCOME sensitivity check whose verdict
 * depends ONLY on the noise scale, never on the measured effect.
 *
 * chatcat form (verbatim):
 *   sigma_diff = median(per-seed sigma_init) * sqrt(2)
 *   ratio      = T / sigma_diff
 *   passed     = ratio >= GATE_THRESHOLD (2.0)
 *
 * demur quantities (ADR 0016 Part 2 gate-port section):
 *   T_demur       = 0.2  (FIXED, pre-registered min-meaningful intensity diff)
 *   sigma_diff    = median(per-session withinNoAviSD) * sqrt(2)
 *   ratio         = T_demur / sigma_diff
 *   passed        = ratio >= 2.0
 *
 * These tests are written BEFORE src/probe/gate.ts exists — they MUST fail on
 * collection (unresolved import) until the module is implemented to green.
 */

import { describe, it, expect } from 'vitest';
import {
  T_DEMUR,
  GATE_THRESHOLD,
  gateVerdict,
  type SessionRecord,
} from './gate';

const SQRT2 = Math.sqrt(2);

// Per ADR: before = mean intensity T-8..T-1, after = mean intensity T+1..T+8,
// withinNoAviSD = intensity SD over ticks with no active AVI.
function session(beforeMean: number, afterMean: number, withinNoAviSD: number): SessionRecord {
  return { beforeMean, afterMean, withinNoAviSD };
}

describe('gate-port: pre-registered constants (ADR 0016 Part 2)', () => {
  it('T_demur is the fixed 0.2 anchor, not derived', () => {
    expect(T_DEMUR).toBe(0.2);
  });
  it('threshold is 2.0, adopted explicitly from chatcat', () => {
    expect(GATE_THRESHOLD).toBe(2.0);
  });
});

describe('gate-port: sigma_diff = median(withinNoAviSD) * sqrt(2)', () => {
  it('odd count — median is the middle value', () => {
    // withinNoAviSD = [0.02, 0.04, 0.03] → sorted [0.02,0.03,0.04] → median 0.03
    const sessions = [
      session(0.3, 0.5, 0.02),
      session(0.3, 0.5, 0.04),
      session(0.3, 0.5, 0.03),
    ];
    const v = gateVerdict(sessions);
    expect(v.sigmaSdMedian).toBeCloseTo(0.03, 12);
    expect(v.sigmaDiff).toBeCloseTo(0.03 * SQRT2, 12);
    expect(v.nSessions).toBe(3);
  });

  it('even count — median is the mean of the two middle values', () => {
    // [0.02, 0.04] → median (0.02+0.04)/2 = 0.03
    const sessions = [session(0.3, 0.5, 0.02), session(0.3, 0.5, 0.04)];
    const v = gateVerdict(sessions);
    expect(v.sigmaSdMedian).toBeCloseTo(0.03, 12);
    expect(v.sigmaDiff).toBeCloseTo(0.03 * SQRT2, 12);
  });
});

describe('gate-port: ratio = T_demur / sigma_diff, passed = ratio >= 2.0', () => {
  it('PASS — low noise, fixed effect resolvable', () => {
    // median SD 0.03 → sigma_diff 0.0424264 → ratio 0.2/0.0424264 = 4.71405 >= 2.0
    const sessions = [
      session(0.3, 0.5, 0.02),
      session(0.3, 0.5, 0.04),
      session(0.3, 0.5, 0.03),
    ];
    const v = gateVerdict(sessions);
    expect(v.ratio).toBeCloseTo(0.2 / (0.03 * SQRT2), 10);
    expect(v.passed).toBe(true);
  });

  it('FAIL — noise too high, fixed effect not separable (the gate refuses)', () => {
    // median SD 0.12 → sigma_diff 0.169705 → ratio 0.2/0.169705 = 1.17855 < 2.0
    const sessions = [
      session(0.3, 0.5, 0.10),
      session(0.3, 0.5, 0.15),
      session(0.3, 0.5, 0.12),
    ];
    const v = gateVerdict(sessions);
    expect(v.ratio).toBeCloseTo(0.2 / (0.12 * SQRT2), 10);
    expect(v.passed).toBe(false);
  });

  it('boundary — ratio exactly 2.0 PASSES (>= is inclusive)', () => {
    // sigma_diff = 0.1 ⇒ ratio = 2.0. median SD = 0.1/sqrt(2).
    const sd = 0.1 / SQRT2;
    const v = gateVerdict([session(0.3, 0.5, sd)]);
    expect(v.ratio).toBeCloseTo(2.0, 10);
    expect(v.passed).toBe(true);
  });
});

describe('gate-port: PRE-OUTCOME property (the heart of the port)', () => {
  it('identical withinNoAviSD, opposite before/after differences → IDENTICAL verdict', () => {
    // Dataset A: escalation (after > before). Dataset B: de-escalation (after < before).
    // Same noise scale in both. The verdict must NOT depend on the measured
    // difference — that is exactly what makes the gate valid PRE-OUTCOME
    // (chatcat gate.py:82-83: "does not touch CTS, defined on every subset").
    const escalation = [
      session(0.3, 0.7, 0.03),
      session(0.3, 0.8, 0.03),
      session(0.2, 0.9, 0.03),
    ];
    const deEscalation = [
      session(0.7, 0.3, 0.03),
      session(0.8, 0.3, 0.03),
      session(0.9, 0.2, 0.03),
    ];
    const a = gateVerdict(escalation);
    const b = gateVerdict(deEscalation);

    expect(a.sigmaDiff).toBe(b.sigmaDiff);
    expect(a.ratio).toBe(b.ratio);
    expect(a.passed).toBe(b.passed);
  });

  it('scrambling before/after to extremes does not move the verdict', () => {
    const base = [session(0.4, 0.5, 0.05), session(0.4, 0.5, 0.05), session(0.4, 0.5, 0.05)];
    const extreme = [session(0.0, 1.0, 0.05), session(1.0, 0.0, 0.05), session(0.5, 0.5, 0.05)];
    expect(gateVerdict(extreme).ratio).toBe(gateVerdict(base).ratio);
    expect(gateVerdict(extreme).passed).toBe(gateVerdict(base).passed);
  });
});

describe('gate-port: empty input is refused (matches chatcat _median on empty)', () => {
  it('throws on zero sessions rather than returning a verdict', () => {
    expect(() => gateVerdict([])).toThrow();
  });
});
