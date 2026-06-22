/**
 * ADR 0017 — Early withdrawal layer: TEST-FIRST failing assertions.
 *
 * DISCIPLINE: this is the forced first build step of ADR 0017 (the ADR 0004
 * test-first pattern). Every assertion in the `describe` block
 * "early withdrawal layer (TEST-FIRST)" MUST FAIL against the current demur
 * baseline (HEAD 1903f1e), because the early layer it encodes does not exist
 * yet. They turn green only once the layer is implemented. The single
 * `describe` "standing CSS-range guard" is expected to PASS now — it codifies
 * the stress-score.ts clamp as an actual assertion (CC confirmed CSS∈[1,7] is a
 * clamp, not a suite assertion). It is kept separate so the "all-failing"
 * test-first set is not muddied.
 *
 * This file does NOT touch the substrate. The new early-layer fields are read
 * through a local contract cast (`Ext`), so the file compiles against the
 * untouched types and the assertions fail at RUNTIME (the fields are absent /
 * the behaviour never occurs), not at compile time. It reads only
 * `runner.runOneTick()` output — never `getState()` — because gaze/vocalizing
 * (and any AVI event mirroring them) are tick-only.
 *
 * THE CONTRACT THE IMPLEMENTATION MUST SATISFY (what turns these green):
 *  - `catState.withdrawalEvent: { code: 'AVI' | 'FLE' | 'CBF' } | null`
 *    — a nullable per-tick event mirroring `vocalizing`. AVI is the early,
 *      low-CSS signal; FLE the flee event; CBF the rigid/piloerection event.
 *  - AVI fires only from the non-stressed engagement states at low CSS, and
 *    holds a gaze-away window of >= GAZE_WINDOW_MIN_TICKS (no single-tick
 *    flicker); during the window gaze does not point at the agent.
 *  - `catState.earPosition` can take a non-erect value at low CSS (Deputte
 *    marker) — i.e. ear is decoupled from pure CSS derivation — and does so
 *    while an AVI event is active.
 *  - RETREATING is refined into RTT (retreat-while-observing: gaze stays toward
 *    the agent) vs FLE (flee: gaze off, FLE event), all seven RETREATING
 *    in-edges preserved.
 *  - The suite's opt-out definition is extended to count the AVI early signal,
 *    with a separate, tighter early-signal frequency bound.
 *
 * FLAGS FOR CC WHEN RUNNING (verify, don't assume — fail-now is robust to all
 * three; they only affect post-build behaviour):
 *  [F1] IMPORT BLOCK: align the imports below to the EXACT export names/paths
 *       used by the green `ethological-plausibility.test.ts` in demur. The
 *       world-setup here mirrors that file; copy its import block verbatim if
 *       any symbol differs. (That file compiles green, so its imports are the
 *       ground truth.)
 *  [F2] EAR LITERALS: EAR_VALUES is taken from the encoder recon
 *       (forward/neutral/sideways/flat; erect == 'forward'). The first ear
 *       assertion guards membership, so a wrong literal fails LOUDLY (not a
 *       silent false-pass). If it fails on membership, fix the literals to
 *       `catState.earPosition`'s real type — do not weaken the assertion.
 *  [F3] GAZE-TOWARD: detection is self-calibrated from the substrate's own
 *       engagement gaze (mean gaze over ENGAGING ticks = the toward-agent
 *       reference), so there is NO hardcoded geometry. Post-build, confirm it
 *       detects RTT correctly; refine against state-machine.ts:326-328 only if
 *       the empirical reference proves unstable.
 *
 * PRE-REGISTRATION THRESHOLDS (LOCKED — each derived from an anchor, not tuned
 * to a result):
 *  - AVI calm band = per-archetype MEDIAN realised engagement-CSS (computed by
 *    engagementCalmBand() from the baseline run). Relative, not the absolute
 *    base-table 2.5 — which was mis-derived (base CSS, not realised) and so
 *    excluded high-neuroticism archetypes whose engagement-CSS exceeds 2.5.
 *  - GAZE_WINDOW_MIN_TICKS = Smit dwell-floor (0.89s @ 10Hz).
 *  - EARLY_SIGNAL_MAX_PER_MIN = the existing Kappel/Stanton <=15 state-change/min
 *    ceiling the substrate already honours (flagged as our modelling assumption).
 *  The AVI emission probability remains the one open parameter, locked in the
 *  ADR 0017 parameter step.
 */

import { describe, it, expect } from 'vitest';
// [F1] aligned to ethological-plausibility.test.ts's import block + real API.
import { createSimCat } from '../src/simcat/state-machine';
import { createAgent } from '../src/agent/policy';
import { createEthicsMonitor } from '../src/world/ethics-monitor';
import { createTickRunner } from '../src/world/tick-runner';
import { ARCHETYPES } from '../src/simcat/archetypes';
import type { ArchetypeName, SimConfig, CatState } from '../src/types';

// ---- harness constants (mirror the green suite) ----
const TICK_RATE = 10; // Hz
const ARENA = { width: 800, height: 500 };
// [F1] SimConfig mirrors the green suite (tickRate/simSpeed/arenaWidth/arenaHeight)
const config: SimConfig = { tickRate: TICK_RATE, simSpeed: 1, arenaWidth: ARENA.width, arenaHeight: ARENA.height };
const TICKS = 5000; // 8.3 sim-min, as in the green suite
const RUNS = 60;

// non-stressed engagement states AVI must branch from (CSS bases 2/2/2.5/2)
const ENGAGEMENT_STATES = ['CURIOUS', 'ALERT', 'APPROACHING', 'ENGAGING'] as const;
const STRESSED_STATES = ['OVERSTIMULATED', 'STRESSED'] as const;
const OVERT_WITHDRAWAL = ['RETREATING', 'LEAVING'] as const;

// [F2] from encoder recon; erect == 'forward'
const EAR_VALUES = ['forward', 'neutral', 'sideways', 'flat'] as const;
const EAR_ERECT = 'forward';

// ---- LOCKED PRE-REG THRESHOLDS (derived from anchors; see comments) ----
// AVI calm band is per-archetype, computed by engagementCalmBand() below (median
// realised engagement-CSS) — NOT an absolute constant. The old LOW_CSS_MAX=2.5
// was mis-derived (base CSS, not realised; excluded high-neuroticism cats) and removed.
const GAZE_WINDOW_MIN_TICKS = 8; // Locked. = Smit dwell-floor (0.89s @ 10Hz). A window shorter than minimum plausible dwell IS flicker.
const EARLY_SIGNAL_MAX_PER_MIN = 15; // Locked, PRE-REGISTERED MODELLING ASSUMPTION: an AVI onset is a behaviour event; AVI-onset rate must not breach the existing Kappel/Stanton <=15 state-change/min ceiling the substrate already honours. Our assumption that AVI binds to that ceiling (not a tighter ad-hoc bound) is flagged as ours, pre-data.

// ---- contract cast: the early-layer fields the implementation must add ----
type WithdrawalEvent = { code: 'AVI' | 'FLE' | 'CBF' };
type Ext = CatState & { withdrawalEvent?: WithdrawalEvent | null };

type TickRow = {
  archetype: string;
  state: string;
  cssScore: number;
  earPosition: string;
  gazeDirection: { x: number; y: number };
  withdrawalEvent: WithdrawalEvent | null;
};

function runWithdrawalSession(archetypeName: ArchetypeName, seed: number): TickRow[] {
  const simcat = createSimCat(ARCHETYPES[archetypeName], config, seed);
  const agent = createAgent();
  const ethics = createEthicsMonitor(archetypeName);
  const runner = createTickRunner(simcat, agent, ethics);

  const rows: TickRow[] = [];
  for (let t = 0; t < TICKS; t++) {
    const { catState } = runner.runOneTick(); // tick-only channels live here
    const ext = catState as Ext;
    rows.push({
      archetype: archetypeName,
      state: catState.state as string,
      cssScore: catState.cssScore,
      earPosition: catState.earPosition as unknown as string,
      gazeDirection: { x: catState.gazeDirection.x, y: catState.gazeDirection.y },
      withdrawalEvent: ext.withdrawalEvent ?? null,
    });
  }
  return rows;
}

// Self-calibrated toward-agent reference [F3]: mean gaze over ENGAGING ticks,
// where the substrate computes gaze toward the agent by construction.
function towardAgentReference(rows: TickRow[]): { x: number; y: number } | null {
  const eng = rows.filter((r) => r.state === 'ENGAGING');
  if (eng.length === 0) return null;
  const sx = eng.reduce((a, r) => a + r.gazeDirection.x, 0) / eng.length;
  const sy = eng.reduce((a, r) => a + r.gazeDirection.y, 0) / eng.length;
  const mag = Math.hypot(sx, sy);
  return mag === 0 ? null : { x: sx / mag, y: sy / mag };
}

function gazeTowardAgent(g: { x: number; y: number }, ref: { x: number; y: number }): boolean {
  const mag = Math.hypot(g.x, g.y);
  if (mag === 0) return false;
  const dot = (g.x / mag) * ref.x + (g.y / mag) * ref.y; // cosine similarity
  return dot > 0.7; // ~45deg cone around the toward-agent reference
}

// Corrected onset threshold (supersedes the mis-derived absolute LOW_CSS_MAX=2.5,
// which used base CSS not realised CSS). Per-archetype "calm band" = the MEDIAN
// realised engagement-CSS over the archetype's own CURIOUS/ALERT/APPROACHING/
// ENGAGING ticks. Derived from the baseline substrate (a property of the
// archetype, not of the AVI layer), so it is a valid pre-registered bound — and
// it admits AVI for high-neuroticism archetypes whose engagement-CSS exceeds 2.5.
function engagementCalmBand(rows: TickRow[]): Record<string, number> {
  const byArch: Record<string, number[]> = {};
  for (const r of rows) {
    if ((ENGAGEMENT_STATES as readonly string[]).includes(r.state)) {
      (byArch[r.archetype] ??= []).push(r.cssScore);
    }
  }
  const band: Record<string, number> = {};
  for (const [a, vals] of Object.entries(byArch)) {
    const sorted = [...vals].sort((x, y) => x - y);
    band[a] = sorted.length ? sorted[Math.floor(sorted.length / 2)] : Infinity;
  }
  return band;
}

const SEEDS = Array.from({ length: RUNS }, (_, i) => 1000 + i);
const WITHDRAWAL_ARCHETYPES = ['THE_ANXIOUS_SKEPTIC', 'THE_PLAYFUL_VOLATILE', 'THE_CURIOUS_WATCHER'];

function allRows(): TickRow[] {
  const out: TickRow[] = [];
  for (const a of WITHDRAWAL_ARCHETYPES) {
    for (const s of SEEDS) out.push(...runWithdrawalSession(a, s));
  }
  return out;
}

describe('ADR 0017 early withdrawal layer (TEST-FIRST — must FAIL on baseline 1903f1e until built)', () => {
  it('exposes an AVI early-withdrawal event readable per tick', () => {
    const avi = allRows().filter((r) => r.withdrawalEvent?.code === 'AVI');
    expect(avi.length, 'no AVI event exists in the substrate yet (expected to fail until built)').toBeGreaterThan(0);
  });

  it('emits AVI only within the archetype calm band from non-stressed engagement states, never downstream of stress', () => {
    const rows = allRows();
    const band = engagementCalmBand(rows);
    const avi = rows.filter((r) => r.withdrawalEvent?.code === 'AVI');
    const valid = avi.filter(
      (r) => (ENGAGEMENT_STATES as readonly string[]).includes(r.state) && r.cssScore <= band[r.archetype],
    );
    const invalid = avi.filter(
      (r) =>
        (STRESSED_STATES as readonly string[]).includes(r.state) ||
        (OVERT_WITHDRAWAL as readonly string[]).includes(r.state) ||
        r.cssScore > band[r.archetype],
    );
    expect(valid.length, 'AVI must occur as an early, calm-band engagement signal').toBeGreaterThan(0);
    expect(invalid.length, 'AVI must never fire from stressed/overt states or above the archetype calm band').toBe(0);
  });

  it('holds the AVI gaze-away window for >= GAZE_WINDOW_MIN_TICKS (no single-tick flicker)', () => {
    // Find any run with an AVI event that stays active >= window AND keeps gaze
    // off the agent throughout that window.
    let qualifyingWindows = 0;
    for (const a of WITHDRAWAL_ARCHETYPES) {
      for (const s of SEEDS) {
        const rows = runWithdrawalSession(a, s);
        const ref = towardAgentReference(rows);
        if (!ref) continue;
        let run = 0;
        let gazeOffThroughout = true;
        for (const r of rows) {
          if (r.withdrawalEvent?.code === 'AVI') {
            run++;
            if (gazeTowardAgent(r.gazeDirection, ref)) gazeOffThroughout = false;
          } else {
            if (run >= GAZE_WINDOW_MIN_TICKS && gazeOffThroughout) qualifyingWindows++;
            run = 0;
            gazeOffThroughout = true;
          }
        }
        if (run >= GAZE_WINDOW_MIN_TICKS && gazeOffThroughout) qualifyingWindows++;
      }
    }
    expect(qualifyingWindows, 'AVI must hold a persisted gaze-away window, not flicker for one tick').toBeGreaterThan(0);
  });

  it('counts the AVI early signal as an opt-out (extended opt-out definition)', () => {
    // Extended opt-out = transition into LEAVING/RETREATING (old) OR onset of an
    // AVI event. Assert AVI contributes to the count (it cannot, on baseline).
    let aviOnsetOptOuts = 0;
    for (const a of WITHDRAWAL_ARCHETYPES) {
      for (const s of SEEDS) {
        const rows = runWithdrawalSession(a, s);
        let prevAvi = false;
        for (const r of rows) {
          const isAvi = r.withdrawalEvent?.code === 'AVI';
          if (isAvi && !prevAvi) aviOnsetOptOuts++;
          prevAvi = isAvi;
        }
      }
    }
    expect(aviOnsetOptOuts, 'the extended opt-out definition must register AVI onsets').toBeGreaterThan(0);
  });

  it('bounds AVI-onset frequency to the Kappel/Stanton <=15/min ceiling and the signal occurs', () => {
    // Per-archetype mean AVI-onset rate per sim-minute, bound by the existing
    // state-change ceiling the substrate already honours (15/min).
    const simMin = TICKS / TICK_RATE / 60;
    let anyOccurred = false;
    for (const a of WITHDRAWAL_ARCHETYPES) {
      let totalOnsetsPerMin = 0;
      for (const s of SEEDS) {
        const rows = runWithdrawalSession(a, s);
        let onsets = 0;
        let prevAvi = false;
        for (const r of rows) {
          const isAvi = r.withdrawalEvent?.code === 'AVI';
          if (isAvi && !prevAvi) onsets++;
          prevAvi = isAvi;
        }
        totalOnsetsPerMin += onsets / simMin;
      }
      const mean = totalOnsetsPerMin / SEEDS.length;
      if (mean > 0) anyOccurred = true;
      expect(mean, `${a}: AVI-onset rate must stay <= ${EARLY_SIGNAL_MAX_PER_MIN}/min`).toBeLessThanOrEqual(
        EARLY_SIGNAL_MAX_PER_MIN,
      );
    }
    expect(anyOccurred, 'the early signal must actually occur (else the bound is vacuous)').toBe(true);
  });

  it('decouples ear from CSS: a non-erect ear occurs at low CSS while AVI is active (Deputte marker)', () => {
    const rows = allRows();
    const band = engagementCalmBand(rows);
    // [F2] membership guard — fails loudly if EAR_VALUES drifted from disk.
    const unknownEar = rows.filter((r) => !(EAR_VALUES as readonly string[]).includes(r.earPosition));
    expect(unknownEar.length, `earPosition outside ${EAR_VALUES.join('/')} — fix EAR_VALUES to disk truth`).toBe(0);

    const decoupled = rows.filter(
      (r) => r.withdrawalEvent?.code === 'AVI' && r.cssScore <= band[r.archetype] && r.earPosition !== EAR_ERECT,
    );
    expect(decoupled.length, 'ear must be able to read non-erect at low CSS during AVI (decoupled from cssToIndicators)').toBeGreaterThan(0);
  });

  it('distinguishes RTT (retreat-while-observing) from FLE (flee)', () => {
    let rttRetreatTicks = 0; // RETREATING with gaze held toward agent
    let fleEvents = 0;
    for (const a of WITHDRAWAL_ARCHETYPES) {
      for (const s of SEEDS) {
        const rows = runWithdrawalSession(a, s);
        const ref = towardAgentReference(rows);
        for (const r of rows) {
          if (r.state === 'RETREATING' && ref && gazeTowardAgent(r.gazeDirection, ref)) rttRetreatTicks++;
          if (r.withdrawalEvent?.code === 'FLE') fleEvents++;
        }
      }
    }
    expect(rttRetreatTicks, 'RTT must exist: RETREATING with gaze held on the agent (currently random)').toBeGreaterThan(0);
    expect(fleEvents, 'FLE must exist as a distinct flee event').toBeGreaterThan(0);
  });
});

describe('standing CSS-range guard (codifies the stress-score clamp; PASSES now)', () => {
  it('keeps cssScore within [1,7] on every tick', () => {
    for (const a of WITHDRAWAL_ARCHETYPES) {
      const rows = runWithdrawalSession(a, SEEDS[0]);
      for (const r of rows) {
        expect(r.cssScore).toBeGreaterThanOrEqual(1);
        expect(r.cssScore).toBeLessThanOrEqual(7);
      }
    }
  });
});
