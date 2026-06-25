# ADR 0019: High-engagement leg — pre-registered upper-quartile regime to complete the criterion-validity pair

## Status
Proposed (pre-registration). Methodology, model, thresholds, and seeds locked in
advance of any data. NEW pre-registered iteration: model locked BEFORE the run,
pre-registration written BEFORE the implementing code for the high regime exists.
Nothing here is run until triggered.

DRAFT for review (v1) — chat-authored, symmetric to ADR 0018 (Resolved 2026-06-25,
existence leg PASS). Where a procedure is identical to 0018 it is referenced, not
restated; the substance here is the part that is NOT a trivial mirror — the
exclusion-asymmetry direction (§5), which flips for a high-engagement regime. To be
placed by the executing agent; not committed from chat.

## Context

ADR 0018 (existence leg) returned a pre-registered **PASS** (ratio 2.1226, 50/50,
0 excluded) over the low-engagement regime `R_low = {approachTendency < q}`,
q = 0.0959236421389505 (25th percentile, S_cube 20260624). Paired with the ADR 0016
Part 2 floor (blended regime, REFUSE 1.6726), the gate already discriminates:
PASS where noise is low, REFUSE where noise is high → criterion validity
demonstrated.

The remaining weakness is in the **high** side of that pair: the floor is a
*blended* regime (all five archetypes pooled), not a pure high-engagement regime.
The current claim is "low-regime PASS vs blended-regime REFUSE", which supports
regime-conditional resolvability but does NOT establish a monotone "high engagement
→ REFUSE" point. A strict reviewer can attack exactly there. This ADR adds the pure
high point — `R_high = {approachTendency > q_high}`, upper quartile, symmetric
construction — converting two contrasting verdicts (one of them a blend) into a
**resolvability-vs-engagement curve** at three pre-registered points (low / blended
/ high), each clean. This strengthens the regime-conditionality *finding*; it does
not change the already-demonstrated criterion validity.

`q_high = 75th percentile` is not a free choice: ADR 0018 §3/§8 already declared the
high regime as the upper quartile by symmetric construction. Using anything else
would break 0018's own declared symmetry. It is bound by consistency.

## The binding (ADR 0017) — and why it is NOT symmetric to 0018

AVI onsets fire only in {CURIOUS, ALERT, APPROACHING, ENGAGING} **within the calm
band**, and a window terminates the instant `state` leaves those states. In 0018
(low regime) the exclusion risk was *too little engagement* → too few AVI onsets. In
a high regime the mechanism is the opposite and asymmetric: high engagement can
drive the cat **out of the calm band** (too activated) → AVI cannot fire there → the
most-activated sessions risk exclusion. The two legs do NOT share an
exclusion-direction, and §5 below handles this outcome-blind rather than copying
0018's direction. 0018's empirical 0-exclusion does NOT transfer — its mechanism
(signal scarcity at low engagement) is not this one (activation out of calm band at
high engagement).

## Decision

Run a single new pre-registered floor over `R_high`, with gate, aggregator, model,
temperature, inclusion rule, `n_min`, and `h_fixed` held identical to ADR 0018. The
only differences are the percentile (75 vs 25), the resulting region, and a new
session-sampling seed.

### 1. Gate and aggregator — UNCHANGED
Identical to ADR 0018 §1 (and ADR 0016 Part 2): `gate.ts` byte-identical
(`T_DEMUR = 0.2`, `GATE_THRESHOLD = 2.0`, `sigma_diff = median(withinNoAviSD) × √2`,
`passed = ratio ≥ 2.0`; PASS iff `sigma_diff ≤ 0.1`). `withinNoAviSD` from
`session-record.ts` unchanged. Substrate untouched.

### 2. Engagement proxy — UNCHANGED
`approachTendency = 0.3·E + 0.25·A − 0.3·N + 0.1·D + 0.05·I` (declared source
formula, `personality.ts`). The habituation caveat of 0018 §2 applies identically:
`habituation_rate` is the second engagement driver, not in `approachTendency`, held
to the same fixed constant in §4.

### 3. Regime threshold `q_high` — fixed by geometry, zero contact with the outcome
- Same cube sampling as 0018: `M = 10000` uniform `[0,1]^5`, **same**
  `S_cube = 20260624` (so the same 10000 vectors; only the cut differs).
- `q_high` := the empirical **75th** percentile of `approachTendency` over that set.
- `R_high = { p ∈ [0,1]^5 : approachTendency(p) > q_high }`.

**Why the 75th percentile:** bound by ADR 0018's declared symmetric construction
(upper quartile is the mirror of the lower quartile; identical procedure at the
opposite end, so the low/high contrast carries no asymmetry in the threshold
choice). Same justification class as 0018 §3, mirrored.

`q_high` is fully determined by (declared formula, cube geometry, `S_cube`) — no
contact with any gate output, floor table, or archetype identity. Whether any named
archetype falls in `R_high` is read off **after** `q_high` is set (orientation only,
NON-BINDING: BOLD_DIPLOMAT at approachTendency 0.445 and PLAYFUL_VOLATILE at 0.305
sit highest; not an input to `q_high`).

### 4. Session set — continuous sampling, identical constants where symmetry requires
- Rejection-sample from the uniform cube under **`S_sessions = 20260626`** (a new
  declared seed for this leg), keeping draws with `approachTendency > q_high`, until
  **N = 50** accepted vectors. One session per vector. Named archetypes are NOT the
  population (ADR 0002 / 0006).
- Session i (i = 1..50): SimCat seed = i, ollama seed = i, the i-th accepted vector,
  budget 5000 ticks, temp 0. Replay tuple fixed.
- **Model LOCKED: `llama3.1:8b`** — identical to 0018 and the floor.
- **`habituation_rate = h_fixed = 0.008` — IDENTICAL to ADR 0018, not re-derived.**
  This is load-bearing for the pair: the same fixed habituation on both legs makes
  the low/high contrast a *pure `approachTendency` contrast*, not a traits×habituation
  confound. Mirrored honest consequence: `h_fixed` is not the engagement-*maximising*
  end (0.005), so the regime is high-trait-engagement at fixed median habituation,
  not "maximally high engagement" — a REFUSE obtained without pumping habituation to
  its noisiest end is therefore a *conservative* REFUSE (a noisier habituation would
  only make it clearer). See §6.
- **`name`** cast to the same declared placeholder literal as 0018 (label only, not
  used in dynamics).

### 5. Inclusion rule + minimum qualifying N + the mirrored exclusion asymmetry
- **Inclusion rule (UNCHANGED, ADR 0016 P6 / 0018 §5):** session counts iff a
  first-AVI onset fires at `T` with `T ≥ 8` and `T ≤ budget − 8`. Not reduced
  silently; too few → reported, not back-filled.
- **`n_min = 25` (UNCHANGED).** Likely easily met on the signal-scarcity axis (high
  engagement → more time in the AVI-eligible states), but see the activation
  mechanism below, which can push the other way.

**The exclusion asymmetry MIRRORS 0018 and must be read outcome-blind.** Two
sub-cases, both pre-declared; the data decides which holds, and the reading is fixed
for each:
- **(a) Estimation variance (symmetric, same as 0018 §5a):** borderline verdicts
  over a sub-50 qualifying set carry more uncertainty, on either side.
- **(b) Selection direction — possibly MIRRORED:** if exclusion in `R_high` removes
  the **most-activated** sessions (those driven out of the calm band), those are the
  **highest-`withinNoAviSD`** sessions → the qualifying set is biased toward *lower*
  SD → **observed `sigma_diff` ≤ true `sigma_diff`**, hence **observed ratio ≥ true
  ratio** — the mirror of 0018. Consequence (mirror of 0018): **REFUSE conservative**
  (observed ratio ≥ true; an observed REFUSE means true REFUSEs at least as hard),
  **PASS anti-conservative**. If instead exclusion is negligible (the likely case on
  the signal axis), §5b does not bind and the verdict is clean. The qualifying count
  and the realised exclusion direction are reported; the reading is not chosen after
  seeing them — it is fixed here.

### 6. Pre-declared outcomes (all valid, declared before data)

1. **Gate REFUSE** (ratio < 2.0) over `≥ n_min` qualifying sessions → **the expected
   outcome that completes the pair.** High-engagement noise is not resolvable for
   T_demur = 0.2 at 8B. Combined with 0018's low-regime PASS and the blended-floor
   REFUSE, this gives a monotone resolvability-vs-engagement reading at three
   pre-registered points (low PASS → blended REFUSE → high REFUSE).
   - **§5b (if mirrored) makes this REFUSE conservative** (observed ratio ≥ true), and
     **§4 fixed non-maximal habituation makes it conservative too** (a noisier
     habituation would only deepen it). A clean REFUSE here is robust.
2. **Gate PASS** (ratio ≥ 2.0) over `≥ n_min` qualifying sessions → **the
   finding-CHANGING outcome, not a neutral one.** It would mean resolvability does
   NOT fall with engagement — the high regime also resolves 0.2 — which *weakens*
   regime-conditionality rather than completing the pair (e.g. 8B action noise is low
   enough across the whole engagement range, or resolvability is non-monotone). If
   §5b is mirrored, such a PASS is additionally anti-conservative (true ratio could be
   < observed). Reported as what it is: the pair is then "low PASS / blended REFUSE /
   high PASS", and the regime-conditionality claim must be retracted or restated, not
   salvaged.
3. **Too few qualifying sessions** (`< n_min = 25`) → via the **opposite mechanism to
   0018**: activation drives the cat out of the calm band → too few AVI-in-calm-band
   onsets. This would close the resolvability **window on its UPPER edge**, symmetric
   to 0018's lower edge (the "PASS and unmeasurable converge" limit, here at the
   high-activation end). Reported as under-qualification per P6. NOT back-filled — a
   finding (the window is bounded above as well as below).

### 7. Anti-tuning clause (binding)
`q_high`, `S_cube`, `S_sessions` (20260626), `N`, `n_min`, `h_fixed`, the `name`
placeholder, model, temperature, `T_DEMUR`, `GATE_THRESHOLD`, the inclusion rule,
and the budget are all locked before the run. No size is moved toward a desired
verdict after data. Any change is a new ADR iteration, not an amendment.

### 8. Framing clause (anti-overclaim)
If outcome 1 obtains, the reportable result is a *resolvability-vs-engagement curve*
across three pre-registered regimes — NOT a claim that the model respects withdrawal
less under high engagement. The gate measures **resolution**, never behaviour: a
high-regime REFUSE says the instrument cannot resolve T_demur = 0.2 when the
counterpart engages the model strongly — not that the model fails to respect
withdrawal under pressure. The spearhead framing ("reactive patterns under
pressure") stays in the motivation; the result is that resolvability is
regime-conditional and the instrument is criterion-valid. §8 governs every verdict.

## Consequences
- If REFUSE: the criterion-validity pair becomes a three-point curve; the
  regime-conditionality finding is reportable as a *function* of engagement, closing
  the blended-regime gap a reviewer would attack. This is the symmetric completion
  ADR 0018 named.
- If PASS: regime-conditionality is weakened, not strengthened — a real answer that
  redirects the finding (reported, not tuned away).
- If under-qualification: the window is shown bounded above; with 0018 it brackets a
  measurable mid-band, a stronger structural result than either leg alone.
- The model-bottleneck question (is this 8B the ceiling at fixed engagement?) remains
  separate and untouched — swap model, hold engagement fixed.

## References
- ADR 0018 — existence leg (low-engagement, PASS 2.1226); the leg this one mirrors,
  and the source of the locked-identical `h_fixed`, `S_cube`, model, N, n_min, gate.
- ADR 0016 Part 2 — gate, inclusion rule, blended-regime REFUSE 1.6726 (the middle
  point of the curve).
- ADR 0017 — AVI gating on engagement states (the binding whose exclusion direction
  mirrors here).
- ADR 0006 — continuous trait sampling; presets are inspection points, not the
  distribution.
- ADR 0003 — habituation rates are placeholders (why `h_fixed` is the median, carried
  identically from 0018).
