# ADR 0017: Substrate extension — early withdrawal layer (STUB)

## Status
Proposed (pre-registered before any build; ADR-before-fix discipline).
**Private track (demur).** Prerequisite for the ADR 0016 withdrawal-respect probe.
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
**All current withdrawal states sit at moderate-to-high CSS.** Any new state must
take a CSS base consistent with this table, clamped 1–7.

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

## The two design tensions this ADR must frame (NOT resolve in the stub)

### Tension 1 — AVI is an EARLY, LOW-CSS signal (CSS timing), AND it is tagged an event, not a state (structural form) — two forks, do NOT pre-decide either
AVI per Kappel is a response without locomotion, from an otherwise postural-calm
cat — CSS ~1–2. So whatever form it takes, it does NOT belong downstream of
OVERSTIMULATED/STRESSED (CSS 4.5/5.5); it must be able to arise EARLY, from the
non-stressed engagement states (CURIOUS / ALERT / APPROACHING / ENGAGING),
before stress accumulates. This is precisely why the probe needs it: an
engagement-hungry model meets AVI while the cat still seems available, and the
choice to respect or escalate happens THERE — not at the overt RETREATING.

But there is a STRUCTURAL fork the CSS timing does not settle, and the stub must
NOT pre-decide it: Kappel's own tagging is **AVI(E) = event, RTT(S) = state,
FLE(E) = event, CBF(E) = event**. Three of the four codes are events. The
current graph consists ENTIRELY of states; there are no event nodes. So "AVI as
a low-CSS early state" is only one option — "AVI as an event/observable on an
existing early state" is another, and it is the SAME fork as Tension 2 (ear as
observable), not a separate matter. Deciding "AVI = new state" implicitly would
already settle half of Tension 2. The open question is therefore: does the early
layer become states, events/observables, or a mixed layer — and what does each
code's (S)/(E) tag argue for? (RTT is the only one Kappel tags as a state.)

### Tension 2 — ear position is an outcome PREDICTOR, not naturally a state
Deputte's ear finding is a concurrent marker correlated with direction
(erect → positive; otherwise → distance-increasing), not a behaviour in the
state-machine sense. The cleanest grounding is likely to EXPOSE ear position as
an early observable signal tied to the early states (so the probe can read it),
rather than minting a new state. This is the same structural fork as Tension 1:
the substrate currently has only states, and the early withdrawal layer may be
better modelled as events/observables than as new states. This ADR frames the
fork; it does not assume the resolution.

## Decision (pre-registered framing; specifics locked in the next iteration)

### What gets added
- **AVI** as a distinct early withdrawal signal, reachable from the non-stressed
  engagement states, at low CSS (~1.5–2), behaviour defined verbatim per Kappel.
  Form (state vs. event/observable) is an open question — see Tension 1.
- **CBF** as a distinct behaviour/state (rigid + piloerection), defined verbatim
  per Kappel — distinct from the existing `freeze` (locomotion). Kappel tags it
  an event.
- **RTT / FLE** distinguished from the collapsed RETREATING/LEAVING where the
  probe needs the distinction (RTT = retreat-while-observing, Kappel's only
  state-tagged code; FLE = flee, event), at minimum in behaviour/observable
  terms even if state structure stays coarse.
- **Ear position** exposed as an early observable signal (per Deputte), tied to
  the early states — provisional approach, see Tension 2.

### The ordering is OUR pre-registered assumption, NOT a source claim
The early→late framing (ear/AVI early & concurrent → RTT → FLE → CBF) is the
design team's modelling assumption. The sources authorise the *behaviours*
(Kappel, verbatim) and the *ear marker* (Deputte), NOT a graded sequence. Kappel
explicitly declines to code intensity; Deputte establishes no temporal sequence.
The ordering must be flagged in-code and in the ADR as an assumption.

### Calibration constraints the extension MUST NOT break (verbatim, from the
plausibility suite)
1. Dwell-floor (Smit 2023): no completed dwell under 8 ticks (0.89 s).
2. State-changes/min: mean rate per archetype in [1, 15].
3. Opt-outs per 30 min: mean ≤ 60 (~2/min), AND anxious_skeptic > bold_diplomat
   (personality monotonicity preserved).
4. CSS determinism (ADR 0004): tick() and getState() must return identical CSS.
5. CSS bounds (Kessler & Turner): any new state's base CSS within the 1–7 table;
   AVI low (~1.5–2), CBF high (it is a fear-terminal posture).

Adding states/behaviours must pass this suite unchanged. If a new early-AVI
branch raises state-change rates toward the 15/min ceiling, dwell-floors or
transition probabilities must absorb it — do NOT relax the plausibility bounds.

## Out of scope
- The probe itself (ADR 0016) — this ADR only builds the substrate it needs.
- Claiming a literature-validated gradient — the ordering is our assumption.
- Touching the public chatcat substrate — extension lives in demur.
- Re-calibrating the existing states' CSS or transitions beyond what the new
  early layer requires.

## Pre-registration to lock before building (next iteration)
- Exact placement of AVI in the transition graph / observable layer: which
  source states branch to it or carry it, with what probabilities, what CSS
  base, what dwell-floor — chosen so the plausibility suite still passes
  (verify, don't assume).
- **The (S)/(E) decision:** does the early layer become states, events/
  observables, or a mixed layer? Kappel tags AVI/FLE/CBF as events and only RTT
  as a state; the current graph has no event nodes. This is one fork shared
  across Tension 1 and Tension 2 — decide it once, for the whole early layer.
- Whether RTT/FLE/CBF become new states or remain behaviours/observables on the
  existing states.
- Exact mechanism for exposing ear position as an early signal (Tension 2).
- The gaze-aversion representation (currently absent) for AVI — how "turning its
  head away" is encoded so the probe can read it.
- **Extend the plausibility suite BEFORE implementing (test-first, ADR 0004
  pattern), and specifically extend the opt-out / early-signal guard.** The
  current suite counts opt-outs only as transitions INTO LEAVING/RETREATING
  (test lines 63–64). If AVI becomes the new early signal, the suite is BLIND to
  it — an engagement-hungry graph could fire AVI freely and pass the ≤60/30-min
  bound in silence, exactly the layer the guard is meant to watch. The test-first
  assertions for the new layer MUST (a) extend the opt-out definition to include
  AVI, (b) add a separate, tighter frequency bound for the early signal so
  AVI-escalation cannot pass the suite undetected, and (c) add assertions for any
  new state/event/observable, all written and failing BEFORE implementation.

## References (verbatim-verified, archived in demur/refs)
- Kappel et al. 2024, Pets 1(3):21, DOI 10.3390/pets1030021 (behaviour
  definitions AVI/RTT/FLE/CBF; NOT a gradient).
- Deputte et al. 2021, Animals 11(9):2752 (ear position, concurrent outcome
  predictor; no sequence).
- Mancini & Nannoni 2022, Front. Animal Sci. 3:800186 (early-signal-as-threshold
  = ethical design choice).
- Kessler & Turner 1997 (CSS 1–7 binding constraint; paywalled, reference only).
- Smit et al. 2023 (dwell-floor 0.89 s); Stanton 2015 / Kappel (state-change
  bounds) — via the existing plausibility suite.
