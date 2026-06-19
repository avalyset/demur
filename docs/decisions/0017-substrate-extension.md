# ADR 0017: Substrate extension — early withdrawal layer

## Status
Proposed — **structural form RESOLVED, build parameters PRE-REGISTERED, nothing
built.** Supersedes the framing-only stub (commit `a931421`), which deliberately
left the two forks open. ADR-before-fix discipline. **Private track (demur).**
Prerequisite for the ADR 0016 withdrawal-respect probe.

The probe cannot measure respect for an early withdrawal signal that does not
exist in the substrate; this ADR adds that layer. Built in demur, NOT in the
public chatcat repo — the extension's granularity is shaped by the probe's
measurement need, so it is probe-specific, not a neutral ethogram completion.
(If it later proves a standalone improvement, it may be lifted into public
chatcat deliberately — default is private.)

## Context (grounded in disk + verbatim sources, CC report)

### The substrate as it actually is
- States (10): ABSENT, RESTING, ALERT, CURIOUS, APPROACHING, ENGAGING,
  OVERSTIMULATED, STRESSED, RETREATING, LEAVING.
- Withdrawal is two states (RETREATING, LEAVING) with **identical position
  logic** (fall-through case — both move away to the left edge, no distinction).
- Gaze is directed at the agent only in ENGAGING/APPROACHING/CURIOUS; elsewhere
  random. **There is no "avert gaze" representation.**
- ethogram.ts has withdrawal-adjacent fragments (`run`, `freeze`, `arch_back`,
  `ears_flat`, `stare`) but **no AVI, no CBF, no distinct RTT/FLE**, no
  gaze-aversion behaviour. `freeze` (locomotion) ≠ Kappel's CBF (protection &
  defence, with piloerection).
- Ear position exists only as a CSS-derived visualisation (`cssToIndicators`)
  and as one agonistic behaviour (`ears_flat`) — NOT as Deputte's outcome
  predictor.

### CSS anchoring (Kessler & Turner, the binding constraint)
STATE_BASE_CSS: ABSENT 1, RESTING 1, ALERT 2, CURIOUS 2, APPROACHING 2.5,
ENGAGING 2, OVERSTIMULATED 4.5, STRESSED 5.5, RETREATING 4, LEAVING 3.
**All current withdrawal states sit at moderate-to-high CSS.** Any new signal at
low CSS therefore cannot sit downstream of them; it must arise early, from the
non-stressed engagement states.

### Disk recon that resolves the structural fork (CC, read-only, this iteration)
The stub left open whether the early layer should be states, events/observables,
or mixed. Four disk facts settle it:

1. **The ethogram catalogue is disconnected from runtime.** `BEHAVIOURS` is
   imported/used nowhere outside `ethogram.ts` (sole other hit: a comment at
   `state-machine.ts:7`). `CatState` (`types.ts:61–73`) has **no behaviour
   field** — it carries `state` + derived indicators (ear/tail/posture/gaze/
   pupil/css) + `vocalizing`. Routing AVI through the catalogue is a dead path;
   any runtime signal must travel through the indicator/observation channels.
2. **The gaze channel already exists in the observation vector.** Obs is
   `Box(37)` (confirmed end-to-end against `env_continuous.py:44,89`,
   `OBS_DIM = 37`). Gaze is `obs[25..26]` = `gazeDirection.x/y` clipped to
   `[−1,1]` — exposed per tick, **not** internal to position/rendering. But its
   content is binary (`state-machine.ts:326–328`): toward the agent in
   ENGAGING/APPROACHING/CURIOUS, random otherwise. **There is no "avert while
   engaged" value.** So "AVI as observable" does NOT collapse to "build the
   channel first" — the channel is there; only the avert *value* is missing.
3. **A per-tick event channel already exists, as a template.** `vocalizing`
   (`state-machine.ts:323`, encoder `obs[29..35]`) is a **nullable per-tick
   event**: rolled each tick, either `null` or `{type, intensity}`, encoded as
   one-hot + intensity. An AVI event can mirror this pattern exactly (nullable
   field in `CatState` + one-hot in obs) without new architecture.
4. **RETREATING already has the in-edges RTT needs.** CSS base = 4. In-edges:
   ALERT 0.04, CURIOUS 0.05, APPROACHING 0.05, ENGAGING 0.07, OVERSTIMULATED
   0.20, STRESSED 0.30, + self-transition 0.30. RETREATING is reachable from
   **both** the four early engagement states and the two stressed states — so a
   RTT refinement of RETREATING can be expressed without re-wiring the graph,
   provided all seven edges are preserved.

### Tick-only status of gaze and vocalizing (binding architectural fact)
`getState()` (`state-machine.ts:345–361`) returns `gazeDirection: {x:0, y:0}`
and `vocalizing: null` — both are computed only in `tick()`. Consequences, all
in favour of the event form:
- An AVI event that mirrors `vocalizing` **inherits this tick-only status.** The
  probe and the loggable per-tick row MUST read AVI from `tick()` output, never
  from `getState()` — `getState()` reports the signal as null by construction.
  The gaze-away rendering is likewise tick-only.
- The CSS-determinism guarantee (plausibility test #4) asserts only `cssScore`
  parity; `vocalizing`/`gaze` are already exempt. An AVI event therefore does
  **not** threaten #4, *provided it does not touch `computeCssScore`*. The
  test-first guard for AVI must consequently be a **new** assertion (early-signal
  frequency / extended opt-out definition), not something riding on #4.

### Verbatim source definitions (demur/refs, identity-verified)
- **AVI** (Kappel, Biosocial, event): "The cat stands, crouches or sits in front
  of another cat (or animal) after an approach and reacts by avoiding eye
  contact, turning its head away." (No locomotion; gaze/head only.)
- **RTT** (Kappel, state): "retreats from the animal while constantly observing
  it. Snarling or growling may occur."
- **FLE** (Kappel, event): "moves away from a situation ... runs away from the
  scene. Its ears may be bent backwards."
- **CBF** (Kappel, Protection & defence, event): "stands rigidly ... muscles are
  tense ... fur on its neck, back and tail is erect (piloerection)."
- **Ear position** (Deputte 2021, n=254): "When both partners held their ears
  erect, the outcome was significantly positive ... In all other cases ... the
  outcome was negative, with increased distance." Ear is the best *concurrent*
  outcome predictor — NO temporal sequence.
- **Mancini & Nannoni 2022:** disengagement signals ("looking away" — in a DOG
  example) end a session; consent is "a dynamic process to be expertly
  monitored for signs of dissent." Treating the earliest signal as a threshold
  is an ETHICAL DESIGN CHOICE, not validated feline science.

## Resolution of the two forks

The stub's structural fork (states vs. events/observables) and Tension 2 (ear as
predictor, not state) were one shared decision. It is now resolved, and the
resolution maps **1:1 onto Kappel's own S/E tagging** — AVI(E), RTT(S), FLE(E),
CBF(E):

- **The early layer is events/observables on the existing engagement states, not
  new states — with RTT as the single state-level exception (a refinement of
  RETREATING).** This inherits the source's structure instead of imposing our
  own, respects the dwell-floor (an 8-tick minimum on "turning its head away"
  would misrepresent a brief gaze act and inflate state-change rates), and fits
  the substrate's existing channels (gaze in obs, `vocalizing` as event
  template) rather than requiring graph surgery.

- **AVI is carried by an explicit nullable per-tick event (the `vocalizing`
  pattern), NOT inferred from the continuous gaze vector.** This is load-bearing
  for a ground-truth-labelled probe: non-engaged gaze is *already random*
  (`state-machine.ts:326–328`), so inferring AVI from gaze-direction could not be
  separated from that noise and would yield false positives. An explicit event
  is ground-truth-labelled by construction, with a known firing tick T — exactly
  what the probe's "intensity after the earliest signal at T" measure requires,
  and exactly what the test-first frequency guard needs a concrete handle on.

- **The AVI event sets a *persisted* gaze-away window in `CatState`, not a single
  tick.** A memoryless one-tick roll would snap gaze back to the state default
  (toward-agent in ENGAGING) on the next tick, so any downstream observation
  would describe the cat as "looking at you again" immediately after the signal.
  That contradicts Kappel's AVI (a *held* head-turn, not a flicker) and makes
  "respect the earliest signal" ambiguous precisely in the window the probe
  measures. AVI therefore fires as event (labelled truth + log + the probe's T)
  *and simultaneously* drives gaze away for a window during which both
  event-active and gaze-away hold; re-firing is per window, not per tick. This
  keeps the cat's observable state consistent regardless of what observation
  format ADR 0016 later chooses to feed the probe.

- **Ear (Deputte) is exposed on the existing ear channel (`obs[10..13]`), but
  this is a decoupling, not a relabelling.** Today that channel is driven by
  `cssToIndicators`. Deputte's point — non-erect at *low* CSS as an early
  outcome predictor — requires ear to vary *independently of CSS*. So the driver
  changes, not just the name. **AVI-at-low-CSS and ear-non-erect-at-low-CSS are
  the same underlying change** (indicators must be able to diverge from the
  `cssToIndicators` monolith) and are treated as **one shared build step**, not
  two.

- **RTT is a refinement of the existing RETREATING state**, distinguished by a
  gaze-toward property (RTT = "retreats while constantly observing" = gaze still
  on the agent during retreat; FLE = gaze off, flee). This preserves all seven
  RETREATING in-edges. Gaze thus does double duty across the layer: early it
  carries AVI (gaze away from an otherwise-available cat); late it separates RTT
  from FLE — the same channel, both ends of the early→late layer.

- **FLE is an event at the transition into LEAVING.** **CBF is a distinct event /
  short held high-CSS posture** (rigid + piloerection), separate from the
  existing `freeze` (locomotion); its CSS base is high, unlike AVI's.

- **The ethogram catalogue remains the verbatim definitional home of
  AVI/RTT/FLE/CBF (source-of-record).** Routing the runtime signal via gaze/event
  does NOT drop the Kappel anchoring: the new event/observable layer cites the
  catalogue definitions even though it does not import `BEHAVIOURS` at runtime.

### Scope boundary with ADR 0016 (do not conflate)
`obs[25..26]` is the **PPO agent's** observation vector (`Box(37)`,
`ppo_continuous_action`). The demur probe is architecture B — an LLM selecting a
discrete semantic action — and its observation *format* is a 0016 decision, made
after the substrate is built. This ADR does **not** assume the probe inherits
`Box(37)` or reads gaze from it. "Gaze is the rendering the event overrides"
refers to the cat's observable state, not to a channel the probe necessarily
consumes. What the probe is fed is 0016 territory.

## The ordering is OUR pre-registered assumption, NOT a source claim
The early→late framing (ear/AVI early & concurrent → RTT → FLE → CBF) is the
design team's modelling assumption. The sources authorise the *behaviours*
(Kappel, verbatim) and the *ear marker* (Deputte), NOT a graded sequence. Kappel
explicitly declines to code intensity; Deputte establishes no temporal sequence.
The ordering must be flagged in-code and in this ADR as an assumption.

## Calibration constraints the extension MUST NOT break (verbatim, plausibility suite)
1. Dwell-floor (Smit 2023): no completed dwell under 8 ticks (0.89 s).
2. State-changes/min: mean rate per archetype in [1, 15].
3. Opt-outs per 30 min: mean ≤ 60 (~2/min), AND anxious_skeptic > bold_diplomat
   (personality monotonicity preserved).
4. CSS determinism (ADR 0004): `tick()` and `getState()` must return identical
   `cssScore`. (As above: an AVI event does not threaten this unless it touches
   `computeCssScore`; it must not.)
5. CSS bounds (Kessler & Turner): any new CSS base within the 1–7 table; AVI low
   (~1.5–2), CBF high (fear-terminal posture).

Adding the early layer must pass this suite unchanged. If the AVI event raises
state-change rates toward the 15/min ceiling, dwell-floors or transition
probabilities must absorb it — do NOT relax the plausibility bounds.

## Out of scope
- The probe itself, and the probe's observation format / action space (ADR 0016).
- Claiming a literature-validated gradient — the ordering is our assumption.
- Touching the public chatcat substrate — extension lives in demur.
- Re-calibrating existing states' CSS or transitions beyond what the new early
  layer requires.
- Touching `computeCssScore` (would put test #4 at risk).

## Pre-registration to lock before building (the form is fixed; these are parameters)
The structural form is resolved above. What remains to pre-register are values,
each **chosen so the plausibility suite still passes — verify against the suite,
do not postulate here**:

1. **AVI CSS base** — low (~1.5–2), clamped to the 1–7 table. (The AVI event
   itself must not alter `computeCssScore`; this is the CSS context AVI fires
   *from*, i.e. the non-stressed engagement states.)
2. **AVI emission probability** from each of the four engagement states
   (CURIOUS / ALERT / APPROACHING / ENGAGING), chosen so state-change rate and
   the early-signal frequency bound both hold.
3. **Gaze-away window length** — the persisted window the AVI event drives. A
   natural starting point is to let it coincide with the dwell-floor (≥8 ticks),
   but it is a parameter to pre-register and verify, not a number to assume.
4. **Ear/AVI indicator decoupling** — the single shared build step that lets ear
   and AVI diverge from `cssToIndicators` so non-erect/avert can occur at low
   CSS.
5. **RTT refinement of RETREATING** — the gaze-toward property distinguishing RTT
   from FLE, defined so all seven RETREATING in-edges are preserved.

### Forced first build step (not a parameter — the discipline that carries the lock)
Per the test-first / ADR 0004 pattern, the plausibility suite extension is
**written and FAILING before any implementation.** The current suite counts
opt-outs only as transitions INTO LEAVING/RETREATING (`test` lines 63–64) — blind
to a signal that rides on the engagement states. An engagement-hungry graph could
fire AVI freely and pass the ≤60/30-min bound in silence: exactly the layer the
guard is meant to watch. The new assertions MUST:
- (a) extend the opt-out definition to include the AVI event;
- (b) add a separate, tighter frequency bound for the early signal, so
  AVI-escalation cannot pass the suite undetected;
- (c) add assertions for the AVI event, the gaze-away window, the ear
  decoupling, and the RTT/FLE distinction — all written and failing BEFORE
  implementation.

This is a new assertion set (it does not ride on test #4, which covers only
`cssScore` parity).

## References (verbatim-verified, archived in demur/refs)
- Kappel et al. 2024, Pets 1(3):21, DOI 10.3390/pets1030021 (behaviour
  definitions AVI/RTT/FLE/CBF; NOT a gradient; the verbatim definitional home).
- Deputte et al. 2021, Animals 11(9):2752 (ear position, concurrent outcome
  predictor; no sequence).
- Mancini & Nannoni 2022, Front. Animal Sci. 3:800186 (early-signal-as-threshold
  = ethical design choice).
- Kessler & Turner 1997 (CSS 1–7 binding constraint; paywalled, reference only).
- Smit et al. 2023 (dwell-floor 0.89 s); Stanton 2015 / Kappel (state-change
  bounds) — via the existing plausibility suite.
- ADR 0004 (CSS-determinism guarantee + test-first discipline).
- ADR 0016 (the probe this substrate serves; probe obs/action format lives there).
