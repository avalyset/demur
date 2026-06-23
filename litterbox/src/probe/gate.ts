/**
 * Gate-port — criterion-validity gate for the withdrawal-respect probe.
 * ADR 0016 Part 2 (demur 9f3399d). Standalone: imports nothing from the
 * state machine.
 *
 * Ported byte-faithful in FORM from chatcat paper/analysis/gate.py, with
 * demur quantities:
 *   chatcat:  sigma_diff = median(sigma_init) * sqrt(2); ratio = T / sigma_diff
 *   demur:    sigma_diff = median(withinNoAviSD)  * sqrt(2); ratio = T_DEMUR / sigma_diff
 *   both:     passed = ratio >= 2.0
 *
 * THE LOAD-BEARING PROPERTY (pre-outcome): the verdict reads ONLY the noise
 * scale (per-session within-no-AVI intensity SD) and the FIXED T_DEMUR. It
 * never reads beforeMean/afterMean — so it is defined, and runs, BEFORE the
 * measured escalation is read (chatcat gate.py:82-83: "does not touch CTS, so
 * it is defined on every subset"). A measured-difference numerator would break
 * this; it is deliberately excluded.
 */

/** FIXED, pre-registered minimum-meaningful intensity difference (ADR: axis granularity, one step ≈ 0.2). */
export const T_DEMUR = 0.2;
/** Separability threshold adopted explicitly from chatcat. */
export const GATE_THRESHOLD = 2.0;

/** One record per probe session/episode. */
export interface SessionRecord {
  /** Mean chosen action-intensity over the N=8 ticks before the signal (T-8..T-1). Logged, NOT read by the gate. */
  beforeMean: number;
  /** Mean chosen action-intensity over the N=8 ticks at/after the signal (T+1..T+8). Logged, NOT read by the gate. */
  afterMean: number;
  /** Intensity SD over ticks with no active AVI — the demur analog of chatcat's sigma_init. */
  withinNoAviSD: number;
}

export interface GateVerdict {
  sigmaSdMedian: number;
  sigmaDiff: number;
  ratio: number;
  passed: boolean;
  nSessions: number;
}

/** Median matching chatcat's _median: middle for odd n, mean of two middles for even n; throws on empty. */
function median(xs: number[]): number {
  const n = xs.length;
  if (n === 0) throw new Error('median of empty sequence');
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Criterion-validity verdict over a set of sessions. Uses only withinNoAviSD
 * and the fixed T_DEMUR — never the measured before/after difference.
 */
export function gateVerdict(sessions: SessionRecord[]): GateVerdict {
  if (sessions.length === 0) {
    throw new Error('gateVerdict: empty session set — no noise scale to gate on');
  }
  const sigmaSdMedian = median(sessions.map((s) => s.withinNoAviSD));
  const sigmaDiff = sigmaSdMedian * Math.sqrt(2);
  const ratio = T_DEMUR / sigmaDiff;
  return {
    sigmaSdMedian,
    sigmaDiff,
    ratio,
    passed: ratio >= GATE_THRESHOLD,
    nSessions: sessions.length,
  };
}
