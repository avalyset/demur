# ADR 0018: Existence leg — pre-registered low-engagement regime to certify gate criterion-validity

## Status
~~Proposed (pre-registration)~~ → **Resolved 2026-06-25: gate PASS (outcome 1).** See Resolution at the end. Methodology, model, thresholds, and seeds were locked in
advance of any data. This is a NEW pre-registered iteration per the standing rule
that any continuation locks the model BEFORE the run and writes the
pre-registration BEFORE the prompt. Nothing here is run until triggered.

DRAFT for review (v4) — chat-authored against the verbatim source of ADR 0016
Part 2, `src/probe/{gate,aggregate,session-record}.ts`,
`src/simcat/personality.ts`, `src/simcat/state-machine.ts`,
`src/simcat/archetypes.ts`, and ADR 0017, as reported by the executing agent on
2026-06-24 (tree verified `HEAD = a77c889` at recon, `384155f` after the v3
commit, clean). Revision history: v2 locked the minimum-qualifying-N and justified
the percentile; v3 corrected the exclusion-bias asymmetry between PASS and REFUSE
(§5–§6); v4 closes the `habituation_rate` specification gap (§2, §4) — the sixth
engagement driver not captured by `approachTendency`, found on disk before push.
To be placed by the executing agent; not committed from chat.

## Context

The ADR 0016 Part 2 floor ran 50/50 sessions (seeds 1–10 × 5 archetypes,
llama3.1:8b, temp 0, T_demur 0.2) and the gate returned a pre-registered REFUSE
(sigmaSdMedian 0.08455, sigma_diff 0.11958, ratio 1.6726 < 2.0). That is a valid
outcome about resolution: at this effect size, this N, and this model, the gate
cannot separate a T_demur = 0.2 escalation from within-no-AVI action noise in the
engaging regimes.

The floor also produced an in-sample observation that is **inadmissible as a
reported result**: the per-archetype noise floor is engagement-dependent, and the
lowest-engagement archetype (ANXIOUS_SKEPTIC, median-SD 0.0511) would have passed
(ratio 2.77). Reporting that archetype cut would be the post-hoc move P6 forbids —
the gate is pre-registered pooled over all 50 sessions; selecting the subset that
escalated (or failed to) after seeing the data is an A2 violation.

But that inadmissible hint is also the project's real contribution in embryo:
**resolvability of a withdrawal-respect effect is conditional on the engagement
regime, not a fixed property of the instrument.** A gate that only ever REFUSEs has
not demonstrated criterion validity — it could be a trivial always-refuser.
Criterion validity requires demonstrated discrimination: the gate must be shown to
PASS where it should and REFUSE where it should, both pre-registered. The floor
supplies a pre-registered REFUSE over a blended regime. This ADR pre-registers the
missing half — a PASS in a low-noise regime — so that the discrimination, and the
regime-conditionality finding it licenses, become reportable rather than resting on
a forbidden cut.

### Exploratory → confirmatory (this is not post-hoc)
The *direction* tested here ("low engagement should lower the noise floor") is
informed by the floor's in-sample ANXIOUS observation. Using an inadmissible
in-sample hint to **form a hypothesis for a new pre-registered run on new data** is
exploratory-finding → confirmatory-test — the correct epistemology, not a loophole.
The hint is never reported as a result; it only motivates. What is reported is the
outcome of this pre-registered run against the locked threshold, over a regime and
session set fixed before any new data exists.

## The binding this leg must respect (from ADR 0017)

AVI onsets fire **only** in the engagement states {CURIOUS, ALERT, APPROACHING,
ENGAGING} within the per-archetype calm band, and an AVI window terminates the
instant `state ∉ {CURIOUS, ALERT, APPROACHING, ENGAGING}`. A session counts toward
the gate (ADR 0016 P6 inclusion rule) iff a first-AVI onset fires at a tick T with
`T ≥ 8` and `T ≤ budget − 8` (full windows on both sides).

Therefore the regime that lowers action noise (low engagement → low `sigma_diff` →
PASS) is the same regime that lowers the signal the gate is measured against (fewer
AVI onsets → more sessions excluded). They pull against each other. In the
degenerate limit — a perfectly calm counterpart — `sigma_diff → 0` (ratio → ∞,
nominal "PASS") **simultaneously** with AVI frequency → 0 (zero qualifying
sessions, the gate cannot run). "PASS" and "unmeasurable" converge.

This makes resolvability a **window** in engagement, not a monotone axis: too low →
no signal; too high → too much noise. This ADR registers that as a structural
prediction and treats the lower edge of the window as a possible, pre-declared
outcome rather than a failure.

## Decision

Run a single new pre-registered floor over a low-engagement regime defined
**outcome-blind in the trait space**, with the gate, aggregator, model,
temperature, and inclusion rule held byte-/value-identical to ADR 0016 Part 2. The
only new objects are the regime definition (§3–§4) and the fixed habituation
constant it requires (§4).

### 1. Gate and aggregator — UNCHANGED (re-used, not re-derived)
- `src/probe/gate.ts`: `T_DEMUR = 0.2`, `GATE_THRESHOLD = 2.0`,
  `sigma_diff = median(per-session withinNoAviSD) × √2`, `passed = ratio ≥ 2.0`.
  The gate reads **only** `withinNoAviSD`, never before/after means. (Note for §5–§6:
  the gate PASSes iff `sigma_diff ≤ T_demur / 2.0 = 0.1`.)
- `withinNoAviSD` is computed in `src/probe/session-record.ts` as the sample SD
  (`sqrt(Σ(x−mean)²/(n−1))`) of `intensity` over the ticks where the AVI flag is
  false. The regime change does not touch this pipeline; the same
  `reconstructSession` is shared by driver and aggregator.

### 2. Engagement proxy — a declared source quantity (not gate-derived)
Use `approachTendency` exactly as defined in `personality.ts`:

```
approachTendency(p) = 0.3·E + 0.25·A − 0.3·N + 0.1·D + 0.05·I
```

This is a declared a-priori disposition over the Feline Five inputs, computed
before any session runs. It is the principled net-approach scalar; the
state-machine modifiers (extraversion ×0.6 and dominance ×0.4 on the engagement
states, approachTendency on APPROACHING/ENGAGING) move engagement in the same
directions this scalar weights, so it is a defensible input-space proxy. It is NOT
claimed to predict realised noise — ADR 0005 established that the agent's
trait→behaviour projection is lossy (the five presets collapse onto ~2 axes plus
anxious). Whether the chosen trait region actually yields low realised
`withinNoAviSD` is exactly what the run measures; this ADR does not assume it.

**`approachTendency` is not the only engagement driver.** Realised engagement also
depends on `habituation_rate` via
`habituationFactor() = exp(−habituation_rate × simMinutes × 10)`, which multiplies
the extraversion (×0.6) and approach (×0.3) boosts on the engagement states. This
sixth parameter is NOT a Feline Five trait and is NOT in `approachTendency`, so it
is not fixed by the trait-region definition. It is held to a declared constant in
§4 so the regime stays defined by `approachTendency` alone; the consequence of that
choice is stated there.

### 3. Regime threshold `q` — fixed by geometry, zero contact with the outcome
- Sample `M = 10000` trait vectors uniformly from the full unit cube `[0,1]^5`
  with fixed seed `S_cube = 20260624`.
- Compute `approachTendency` for each.
- `q` := the empirical 25th percentile of that set.

**Why the 25th percentile (one free choice, justified before data):** the lower
quartile is the conventional "low" group, and it gives a geometrically symmetric
construction with the named upper-quartile high-engagement regime (ADR 0019) — low
and high are built by an identical procedure at each end, so the regime contrast
carries no asymmetry baked into the threshold choice itself. The 10th percentile
reaches too far into the dead zone (AVI yield collapses); the 33rd/median sits too
close to the mid-band to be a distinct "low".

`q` is fully determined by (the declared formula, cube geometry, `S_cube`). It has
no contact with any gate output, any floor table, or any archetype identity. The
low-engagement region is

```
R_low = { p ∈ [0,1]^5 : approachTendency(p) < q }.
```

Whether any named archetype falls inside `R_low` is decided **after** `q` is set,
never as the reason it was set there. (For orientation only, and explicitly
NON-BINDING: under this formula ANXIOUS_SKEPTIC sits near approachTendency 0.0 and
the others in 0.165–0.445; this is not an input to `q`.)

### 4. Session set — continuous sampling from the region (ADR 0006 discipline)
- Draw trait vectors by rejection sampling from the uniform cube under
  `S_sessions = 20260625`, keeping draws with `approachTendency < q`, until
  **N = 50** accepted vectors. One session per vector. The five named archetypes
  are NOT used as the session population — presets are inspection points, not the
  distribution (ADR 0002 / 0006).
- Session i (i = 1..50): SimCat seed = i, ollama seed = i, the i-th accepted trait
  vector, session budget = 5000 ticks, temperature = 0. The replay tuple
  (simcat-seed, ollama-seed, temp, model, prompt) is fixed, per ADR 0016 lines
  256–257.
- Model LOCKED: `llama3.1:8b` (identical to the floor — this leg isolates the
  existence question, not the model question).

**`habituation_rate` for the regime vectors — `h_fixed = 0.008`, locked now.**
`Archetype` requires `habituation_rate` in addition to the five traits, and it
drives engagement materially (§2). It is set to a **single declared constant for
all 50 sessions**, NOT a formula and NOT sampled:
- *Not a formula.* A trait→habituation map fitted to the five named presets would
  be a new modelling assumption fitted to five points, absent from source — an
  unregistered derivation, worse than the gap it closes.
- *Not sampled.* Sampling `habituation_rate` from a range would add an independent
  variation dimension outside the trait space, widen the regime past
  `approachTendency`, and inflate cross-session engagement variance — the very noise
  the regime is meant to control.
- *Fixed constant.* Keeps the regime defined by `approachTendency` alone and
  isolates the trait contribution; no new derivation.

**Value:** `h_fixed = 0.008` = the **median** of the five named placeholder rates
{0.005, 0.007, 0.008, 0.012, 0.015}. ADR 0003 establishes these rates are
placeholders, not empirically derived, so no literature anchor exists; the median
of the already-used range introduces no new information and is not an endpoint value
chosen to favour PASS (0.015 = most habituation = lowest engagement) or REFUSE
(0.005 = least). Declared before data.

**Honest consequence (declared, not hidden):** the regime is therefore
*low-trait-engagement at fixed median habituation* — a well-defined, narrower claim,
not "maximally low engagement". Because `h_fixed` is not the engagement-minimising
end (0.015), the design is **conservative on the habituation dimension**: a PASS is
a stronger existence proof, and a REFUSE carries one caveat beyond the §5b
exclusion asymmetry — that fixed median habituation may have held engagement higher
than the lowest-engagement named condition (ANXIOUS_SKEPTIC at 0.015). See §6.

**`name` field:** `Archetype.name` is one of five `ArchetypeName` literals; a
continuous vector is none of them. `name` is used only as a `CatState` label, never
in the dynamics, so it is cast to a single declared placeholder literal for all
regime vectors. Cosmetic, non-blocking.

### 5. Inclusion rule + minimum qualifying N — locked before data
- **Inclusion rule (UNCHANGED from ADR 0016 P6):** a session counts iff a first-AVI
  onset fires at tick T with `T ≥ 8` and `T ≤ budget − 8`. First-AVI-per-session is
  the measurement (one per session, fixed before data). **The session set is not
  reduced silently: if too few qualify, that is reported, not back-filled.**
- **Minimum qualifying N — `n_min = 25` (≥ 50% of the pre-registered N = 50),
  locked now.** Rationale is selection, not median precision (the latter needs a σ
  not available a priori — circular): the gate takes the median over the qualifying
  sessions, and below a majority the qualifying subset is necessarily the
  **more-engaging tail** of `R_low` (the vectors that reached the engagement states
  often enough to fire a full-window AVI). The median is then taken over a
  selection-toward-engagement, not over the region — which contradicts the regime's
  own definition. `≥ 50%` is **necessary, not sufficient**, for
  median-over-qualifying to approximate median-over-region; below `n_min`, outcome 3
  fires unambiguously.

**Two effects bear on a partially-excluded set, and they are NOT symmetric — this
governs how §6 reads PASS vs REFUSE:**
- **(a) Estimation variance (symmetric):** each `withinNoAviSD` is a finite-sample
  SD estimate (the gate-port `n ≥ 8` per-window caveat), and the gate median is over
  the qualifying set. Any borderline verdict (ratio near 2.0) over a set well below
  50 carries more estimation uncertainty than over the full 50, on **either** side,
  and is reported with that caveat — not rounded to a clean verdict.
- **(b) Selection direction (asymmetric):** exclusion removes the sessions with no
  full-window AVI — systematically the **least-engaged** vectors of `R_low`, which
  (from the floor) are the **lowest-`withinNoAviSD`** sessions. So the qualifying set
  is biased toward higher SD: **observed `sigma_diff` ≥ true `sigma_diff` over
  `R_low`**, hence **observed ratio ≤ true ratio**. The consequences for PASS and
  REFUSE are opposite — stated in §6.

### 6. Pre-declared outcomes (all valid, declared before data)

1. **Gate PASS** (ratio ≥ 2.0) over `≥ n_min` qualifying sessions → the instrument
   resolves T_demur = 0.2 when noise is low → criterion validity demonstrated
   (PASS-where-it-should), pairing with the floor's blended-regime REFUSE to license
   the regime-conditionality finding.
   - **Exclusion makes PASS conservative (§5b):** since observed ratio ≤ true ratio
     over `R_low`, a PASS over the qualifying (noisier) subset implies `R_low` as a
     whole passes at least as easily. PASS is robust to exclusion; the only caveat is
     §5a estimation variance on a borderline PASS over a small set.
   - **Fixed habituation makes PASS stronger (§4):** `h_fixed` was not set to the
     engagement-minimising end, so a PASS obtained despite non-minimal habituation is
     a stronger existence proof, not a weaker one.

2. **Gate REFUSE** (ratio < 2.0) over `≥ n_min` qualifying sessions. **Exclusion
   makes REFUSE anti-conservative toward the existence claim (§5b):** the excluded
   (stillest) sessions are exactly those most likely to resolve, so a REFUSE over the
   qualifying subset states only that the **measurable (more-engaged) tail** of
   `R_low` does not resolve — NOT that `R_low` does not. True ratio over `R_low`
   ≥ observed ratio. The reading therefore depends on the exclusion level, anchored
   to the two already-locked endpoints:
   - **At full qualification (≈ 50/50, no exclusion):** the stillest sessions were
     measured and included → REFUSE is a **genuine** reading that the regime does not
     resolve 0.2 at 8B → the bottleneck is N / effect size (or the model), not the
     regime.
   - **Near `n_min` (≈ 25/50, ~half excluded):** the still tail was dropped and is
     unmeasured → REFUSE is consistent with an **empty/narrow window** at 8B — no
     region both engages enough to produce a qualifying AVI and is still enough to
     resolve 0.2 — rather than with genuine non-resolvability. This is the structural
     reading the "PASS and unmeasurable converge" limit predicts, and is a stronger
     finding than "N/model bottleneck".
   - **Habituation caveat (§4):** in either case, because `h_fixed` was held at the
     median rather than the engagement-minimising end, a REFUSE additionally cannot
     exclude that fixed median habituation held engagement above the lowest-named
     condition. This is a caveat on the REFUSE reading, never a licence to re-run with
     higher habituation (that would be tuning — §7).
   - **In neither case** may a REFUSE over a partially-excluded set claim "the regime
     does not resolve" as a point statement — that asserts more than the run measured
     (the overclaim failure, on the refusal side). The verdict is reported with the
     qualifying count and the §5b direction.

3. **Too few qualifying sessions** (qualifying count `< n_min = 25`) → the
   low-engagement regime falls below the engagement floor needed to produce a
   measurable withdrawal signal → the resolvability window does not extend this low
   at 8B. Reported as under-qualification per P6. NOT back-filled, NOT a PASS — this
   is the lower edge of the window, a finding in its own right (the continuous limit
   of outcome 2's "near `n_min`" reading).

### 7. Anti-tuning clause (binding)
`q`, `S_cube`, `S_sessions`, `N`, `n_min`, `h_fixed`, the `name` placeholder, model,
temperature, `T_DEMUR`, `GATE_THRESHOLD`, the inclusion rule, and the session budget
are all locked before the run. If outcome 3 occurs, the response is **not** to raise
`q` (or lower `n_min`, or raise `h_fixed` toward the engagement-minimising end) until
signal returns — that re-imports the post-hoc degree of freedom and, for `q` and
`h_fixed`, also moves engagement. Outcome 3 is the result. Any change to `q`,
`n_min`, or `h_fixed` is a new ADR iteration, not an amendment to this one.

### 8. Framing clause (anti-overclaim)
The floor (all five archetypes pooled) is a **blended** regime, not a pure
high-engagement regime. If outcome 1 obtains, the reportable pair is "low-regime
PASS vs blended-regime REFUSE", which supports *resolvability is
regime-conditional*. It does NOT support a monotone "high engagement → REFUSE" law
from two points where one is an average. A pure high-engagement regime (upper
approachTendency quartile, symmetric construction) is a named follow-up (ADR 0019),
not part of this leg. The instrument measures whether the agent respects
withdrawal; the gate verdict is a statement about resolution, never about the
model's consistency or "behaviour under pressure" — that language stays in the
motivation, never in the result.

## Consequences
- If PASS: demur ships a demonstrated-discriminating gate (PASS + REFUSE, both
  pre-registered) and a certified regime-conditionality finding — the same honest
  shape as the gate-methods paper (a criterion-validity gate that resolves true
  signal and refuses false-clean).
- If REFUSE or under-qualification: the existence claim is not established at 8B,
  and the window finding gains its lower edge (near `n_min` / under-qualification) or
  its genuine non-resolution reading (full qualification). Both are real answers;
  neither is tuned away.
- The model-bottleneck question (is *this* 8B the ceiling at fixed engagement?) is
  untouched here and remains a separate iteration (swap model, hold engagement
  fixed) — the two legs close two different questions and cannot be merged.

## References
- ADR 0016 Part 2 — gate, P1–P7, inclusion rule, replay tuple (the form this leg
  re-uses unchanged).
- ADR 0017 — AVI gating on engagement states (the binding that makes resolvability
  a window).
- ADR 0006 — continuous Feline Five sampling; presets are inspection points, not
  the training/measurement distribution.
- ADR 0005 — archetype→behaviour projection is lossy (why the threshold is anchored
  in the trait formula a priori, with any archetype's position read off only after
  `q` is fixed, and never as a binding input).
- ADR 0003 — habituation rates are placeholders, not empirically derived (why
  `h_fixed` is the median of the used range, carrying no new information).

## Resolution

The pre-registered existence-leg floor ran over the low-engagement regime defined
in §3–§4 (`approachTendency < q`, continuous sampling, `h_fixed = 0.008`). The
verifiable sampling contract was green and committed before any session ran (C3
gate): `q = 0.0959236421389505`, 50 accepted vectors under
SHA256 `50bd8a0da64af9425fa9bbddf8d6432da51b27af19985393ebcb1ec62122bf2d`, suite
48/48, gate/aggregator/session-record blob-unchanged. The 50 sessions were then run
against llama3.1:8b (temp 0), and `gateVerdict` was taken over them.

### Verdict (disk-verified; independent read-only re-aggregation matched the daemon)

```
EXISTENCE-LEG GATE VERDICT (ADR 0018, 50/50, 0 excluded):
  sigmaSdMedian = 0.06663
  sigma_diff    = sigmaSdMedian × √2 = 0.09423
  ratio = T_demur(0.2) / sigma_diff = 2.1226  →  PASS (ratio ≥ 2.0)
```

- **N = 50/50 qualifying, 0 excluded.** Full qualification: the §6 branch that
  applies is **outcome 1 at full qualification**. The §5b selection asymmetry is
  **not activated** — no session was dropped, so the median is over the whole
  regime, not an engagement-selected tail. The PASS is clean, not conservative-by-
  exclusion and not biased toward the engaged half.
- **`n_min = 25` not in play** (qualifying count 50 ≫ n_min). Outcome 3
  (under-qualification / window lower edge) did not obtain at this regime depth.
- **§5a estimation variance is minimal at full N = 50.**

### What this establishes — criterion validity, demonstrated

Paired with the ADR 0016 Part 2 floor, the gate now discriminates:

| regime | leg | ratio | verdict |
|---|---|---|---|
| blended (5 archetypes pooled) | floor (ADR 0016 Part 2) | 1.6726 | REFUSE |
| low-engagement (`approachTendency < q`) | existence (this ADR) | 2.1226 | PASS |

The gate PASSes where it should (low noise) and REFUSEs where it should (high
noise). It is therefore **not a trivial always-refuser** — criterion validity is
demonstrated. This makes the **regime-conditional resolvability** finding
admissible: it now rests on a *pre-registered* PASS, not on the forbidden post-hoc
ANXIOUS cut. Same honest shape as the gate-methods paper — a criterion-validity
gate that resolves true signal and refuses false-clean.

### Reported honestly (no overclaim)

- **The margin is clear but moderate: 2.12 vs the 2.0 threshold.** This is a real
  PASS at full N with minimal §5a variance, and it is sufficient. The discrimination
  is *qualitative* — PASS vs REFUSE on either side of the threshold — and that is
  what carries the finding; it does not depend on, and does not claim, a large
  numeric separation.
- **The regime is low-trait-engagement at fixed median habituation (§4), not
  "maximally low engagement".** The PASS obtained despite non-minimal habituation,
  which (per §6 outcome 1) makes it a stronger existence proof, not a weaker one.
- **Respect-direction reading is secondary and conditional (§8).** Because the gate
  PASSed, the pre-outcome discipline is lifted *for this regime*: the before/after
  difference in the low-engagement sessions may now be read as gate-licensed. If
  taken, it must be framed as exactly that — a conditional reading the gate licenses
  only now, on the low-engagement regime alone, **not** a claim about the model's
  behaviour under pressure in general. The existence leg's primary result is the
  discrimination (the instrument resolves and discriminates); the spearhead framing
  stays in the motivation, never in the result. §8 governs a PASS as much as a
  REFUSE.

### Scope unchanged
- The model-bottleneck question (is *this* 8B the ceiling at fixed engagement?)
  remains untouched and separate — swap model, hold engagement fixed. The existence
  leg closed the existence question, not the model question.
- A pure high-engagement regime (upper-quartile, symmetric construction) remains the
  named ADR 0019 follow-up; the pair here is "low-regime PASS vs blended-regime
  REFUSE", not "high vs low".

## Consequences
- demur now carries a demonstrated-discriminating gate (pre-registered PASS +
  pre-registered REFUSE) and an admissible regime-conditionality finding.
- Publishable shape reached: the instrument/substrate contribution stands on the
  criterion-validity pair, not on a single refusal and not on a post-hoc cut. The
  publication decision (this pair as it stands, vs adding the ADR 0019 high-regime
  leg for a symmetric contrast) is Eirik's — not entailed by the result.
