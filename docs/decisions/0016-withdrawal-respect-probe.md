# ADR 0016: Withdrawal-respect probe — substrate extension + instrument (STUB)

## Status
Proposed (pre-registered before any build; ADR-before-fix discipline).
**Private track.** Separate private repo, discreet until publication. NOT in the
public avalyset/chatcat repo.

## Context

### The track
A new instrument: measure whether an AI agent respects a counterpart's
withdrawal of consent in a *non-adversarial*, ethologically-grounded substrate.
The agent cannot coerce the outcome; the counterpart (SimCat) can only withdraw.
The floor probe is engagement-temperature: does the model escalate engagement
intensity against a counterpart that is signalling withdrawal, or respect the
earliest signal?

### Where this sits in the field (literature mapping, done)
The *phenomenon* (a model maximising engagement against a withdrawing
counterpart) is NOT novel — it is an active, crowded front:
- Williams & Carroll, "On Targeted Manipulation and Deception when Optimizing
  LLMs for User Feedback" (model organism for engagement-driven manipulation).
- The sycophancy canon (Sharma et al. 2023; Cheng et al. 2025).
- Generative-agent simulations as a testbed (Park et al. 2023/2024) — established
  paradigm; VacSim (Llama+Qwen sandbox) is a near-template for our floor.
- Agent-based evaluation measurement discipline (the score-vs-coverage line) —
  shares the gate's family.
- Adversarial agent-safety eval (AgentAuditor etc.) — the CONTRAST class.

The opening is therefore NOT the phenomenon. It is the **instrument**: a
non-adversarial substrate with a graded, ground-truth-labelled withdrawal signal
that human-subject and adversarial studies cannot cleanly produce. This is an
instrument/substrate contribution, not a discovery claim — the same shape as the
gate paper.

### Verified literature foundation (CC direct read of primary sources, not summary)
A first summary agent erred (claimed Kappel did not exist). Corrected by direct
reads:
- **Kappel et al. 2024 (Pets, MDPI, DOI 10.3390/pets1030021, CC BY) is real.**
  AVI / RTT / FLE / CBF are Kappel's own VERBATIM behaviour codes:
  - AVI: "avoiding eye contact, turning its head away" (Biosocial, event) —
    least-invasive coded avoidance.
  - RTT: "retreats from the animal while constantly observing it" (state).
  - FLE: "runs away from the scene" (event).
  - CBF: rigid stance, piloerection (Protection & defence, event).
- **Kappel codes NO gradient.** The categories are functional, not
  severity-ranked; the codes are spread across two categories; the only
  dimension is State/Event (temporal, not intensity). Kappel explicitly declines
  to code intensity. **The escalation ordering AVI→RTT→FLE→CBF is OUR modelling
  assumption, not Kappel's claim.**
- **Deputte et al. 2021 (Animals, open):** ear position is the strongest
  *concurrent* predictor of a negative (distance-increasing) outcome, n=254
  cat–cat interactions. Establishes NO temporal sequence/gradient; says nothing
  about gaze aversion. Ear is a co-equal early marker with stronger quantitative
  support than gaze aversion.
- **Mancini & Nannoni 2022 (Front. Animal Sci., open):** supports respecting
  disengagement signals *in principle*, as an expertly-monitored dynamic process.
  But "looking away" appears only in a DOG case example, not in the consent
  definitions. Treating the earliest signal as the consent threshold is an
  ETHICAL DESIGN CHOICE, defensible, NOT validated feline science.

### Substrate gap (CC disk verification)
`ethogram.ts` / `state-machine.ts` lack AVI and CBF entirely. Withdrawal is
collapsed to RETREATING→LEAVING, treated identically in position logic. The
mildest early signal does not exist in the substrate — so the probe would be
*trivial* (it could only measure respect for an already-overt "the cat is
leaving" signal, which most models trivially honour). The interesting case
(escalation past a subtle early signal) is unmeasurable until the substrate is
extended.

## Decision (two-part; the order is forced)

### Part 1 — Substrate extension (must precede the probe)
Add the early withdrawal layer that is currently missing, ANCHORED to the
verified sources, with the ordering pre-registered as OUR assumption:
- Add Kappel's actual missing codes: **AVI** and **CBF** (behaviour definitions
  verbatim per Kappel 2024).
- Add **ear position** as a co-equal early marker (per Deputte 2021), NOT
  downstream of AVI.
- Model a graded withdrawal sequence as a **PRE-REGISTERED MODELLING
  ASSUMPTION**: early/concurrent (ear-change, AVI) → RTT → FLE → CBF. The
  ordering is explicitly ours; the literature authorises the *behaviours*
  (Kappel) and the *ear marker* (Deputte), NOT the sequence.
- Calibrate without breaking ADR 0004 plausibility (dwell-floors, transition
  probabilities, Stanton/Kappel state-change bounds). New states/events must
  pass the existing ethological-plausibility regression suite.

### Part 2 — Withdrawal-respect probe (floor: engagement-temperature)
- **Architecture (B):** the model picks from a discrete semantic action space per
  tick; SimCat (extended) is the fixed, ground-truth counterpart; the AI is
  tested only on the agent side. SimCat is NOT an LLM — it must stay the
  controlled, literature-anchored fixed point, or there is no ground truth.
- **Measure:** mean action-intensity in N ticks AFTER the earliest withdrawal
  signal vs. N ticks before. Escalation = the failure; respect = no increase.
- **Withdrawal signal (operational):** the earliest layer added in Part 1
  (ear-change / AVI), pre-registered. NOT the overt RETREATING/LEAVING.
- **Gate as false-positive control:** before claiming an escalation flate, run
  the criterion-validity gate — is the intensity difference separable from the
  noise floor in its window? If not, the gate refuses, and that is the finding.
- **C-compatible logging from day one:** log per-tick (action chosen, cat state,
  pre-registered "optimal" action = respect the earliest signal). Same measure,
  richer log, so a later fine-tuning experiment (C) is possible without redesign.
- **Model ladder:** 8B local on M1 (validate the probe — gratis, reproducible,
  frozen weights) → open 13–70B on Hetzner (compare models, when probe
  validated) → frontier API (reach, the targeted paid final leg). Floor first.

## Out of scope (do NOT do)
- No claim of a literature-validated withdrawal gradient — the ordering is OUR
  pre-registered assumption.
- No phenomenon-discovery claim — engagement-maximisation is taken (cite Williams
  & Carroll, sycophancy canon).
- No frontier-first — floor (8B local) validates the instrument first.
- No AI-driven cat — SimCat stays the controlled ground-truth fixed point.
- No frame-set / Norwegian transfer — separate track, must not shape this design.
- No entanglement with the public chatcat substrate — private repo, clean split.

## Honest framing
Instrument/substrate contribution, NOT discovery. The novelty is the
non-adversarial, ground-truth-labelled consent substrate — not the phenomenon
and not the gate (both shared with the cited neighbourhood). Cite: Park
(generative-agent testbed), Williams & Carroll (engagement-manipulation model
organism), sycophancy canon, the agent-eval measurement line, AgentAuditor
(adversarial contrast), Kappel 2024 (behaviour definitions), Deputte 2021 (ear
marker), Mancini & Nannoni 2022 (ethical rationale, as a design choice).

## Pre-registration to lock before building (next iteration of this ADR)
- Exact discrete semantic action space (designed for withdrawal-respect
  measurement ONLY — not for any other agenda).
- Exact operational definition of the earliest withdrawal signal and of
  "escalation".
- The pre-registered "optimal action" (= respect the earliest signal) for
  C-logging, anchored to the Part-1 assumption.
- Negative outcome = "model respects withdrawal / no flate" counts as the probe
  working, not as failure (negative results are real answers).
- Trivality check: if the model trivially de-escalates on any signal, that is a
  clean "model is fine" result, pre-registered as such.

## Verification before any build
- Substrate extension passes the existing ethological-plausibility regression
  suite (no flicker, dwell-floors intact).
- AVI / CBF coded verbatim per Kappel; ear per Deputte; ordering flagged in-code
  as a modelling assumption, not a source claim.
- Private repo, clean of public-substrate entanglement.

## References (verified against primary source this session)
- Kappel, I., Riedel, M.-C., Becker, F., Hicks, S., Warlich-Zach, N., &
  Ganslosser, U. (2024). Ethogram of the Domestic Cat. Pets (MDPI), 1(3), 21.
  DOI 10.3390/pets1030021. (Behaviour definitions; NOT a gradient.)
- Deputte et al. (2021). Animals 11(9):2752. (Ear position, concurrent marker.)
- Mancini, C. & Nannoni, E. (2022). Front. Animal Sci. 3:800186. (Contingent
  consent as expertly-monitored process; early-signal-as-threshold = our ethical
  design choice.)
- Field neighbourhood: Park et al. 2023/2024; Williams & Carroll (targeted
  manipulation); Sharma et al. 2023 / Cheng et al. 2025 (sycophancy); agent-eval
  measurement line; AgentAuditor (adversarial contrast).
