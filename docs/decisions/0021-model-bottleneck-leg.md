# ADR 0021: Model-bottleneck leg — re-run the high-engagement floor on llama3.1:70b

## Status
Proposed (pre-registration). Model, hardware, regime, gate, and seeds locked in
advance of any run. NEW pre-registered iteration: the model is locked BEFORE the run
and this pre-registration is written BEFORE the implementing run exists — not chosen
after a trial run (model-shopping toward a verdict is an A2 violation). Nothing is run
until the determinism gate (§5) is green and Eirik triggers it.

DRAFT for review (v1) — chat-authored, mirrors the ADR 0018/0019 discipline. This leg
varies the MODEL axis, holding the regime axis fixed — the one open confound the three
fixed-model legs (0016/0018/0019) could not close.

## Context
The demur triplet certified a regime-conditional resolvability curve at fixed model
(llama3.1:8b, temp 0): low-regime PASS 2.1226, blended REFUSE 1.6726, high-regime
REFUSE 1.4698. The high-regime REFUSE leaves one question open that no fixed-model leg
can answer: **is *this* 8B the bottleneck at fixed engagement, or is the limit in
N / effect size?** A stronger model on the SAME high-engagement floor separates
"8B-intrinsic action noise" from "the instrument/effect cannot resolve here".

This is a real, separate axis from 0018/0019 (which varied the regime, holding the
model). It is NOT necessary for the triplet to stand — the triplet is published and
complete (OSF DOI 10.17605/OSF.IO/WH7Z5). This leg answers the bottleneck question only,
and its outcome may be non-informative (see §6 outcome 3).

## Decision
Re-run the ADR 0019 high-engagement floor on **llama3.1:70b**, holding everything
except the model byte-/value-identical to 0019. The only changed variable is the model
(and the hardware it necessarily runs on).

### 1. Gate, aggregator, regime — UNCHANGED (re-used, not re-derived)
- `gate.ts` byte-identical: `T_DEMUR = 0.2`, `GATE_THRESHOLD = 2.0`,
  `sigma_diff = median(within-no-AVI intensity SD) × √2`, `passed = ratio ≥ 2.0`.
- Regime: `R_high = {approachTendency > q_high}`, `q_high = 0.2994022299302742`, the
  SAME 50 vectors under hash `59022cc3…` (reused green from ADR 0019; the sampling
  contract is NOT re-derived). `h_fixed = 0.008`, same `name` placeholder.
- Inclusion rule unchanged (first-AVI onset, `T ≥ 8`, `T ≤ budget − 8`); `n_min = 25`.
- Per session i (1..50): SimCat seed = i, ollama seed = i, budget 5000 ticks, temp 0.
  The replay tuple gains the new model ID; everything else is the 0019 tuple.

### 2. Model — LOCKED before the run
- **`llama3.1:70b`**, **FP16/BF16 (full precision, NOT quantised)**. Locked now,
  before any run, by this ADR. Not selected after a trial.
- Precision rationale (measurement-purity, not cost): the gate measures action noise
  via `sigma_diff`. Quantisation (8-bit/4-bit) injects numerical noise into exactly that
  quantity. FP16 removes quantisation as a confound. 70B FP16 ≈ 140 GB → requires a
  single GPU with ≥140 GB VRAM.

### 3. Hardware — declared (provenance, and the determinism implication)
- **Verda (Finland), 2× NVIDIA A100 80GB SXM4 (160 GB total VRAM, NVLink), On-Demand**,
  EU-incorporated, 100% renewable — consistent with the EU-sovereign framing of the
  broader programme. (H200×1 was the original plan; it was unavailable at deploy time.
  2× A100 80GB = 160 GB total, the minimum available configuration that holds 70B FP16 —
  documented here BEFORE the run, not retrofitted after. The selection rule was: fewest
  GPUs available at deploy that hold 70B FP16, ≥160 GB total VRAM.)
- 160 GB total holds 70B FP16 (~140 GB) across two GPUs via NVLink.
- Inference served by **self-hosted ollama/vLLM on the rented GPUs** — NOT a frontier
  API. This preserves seed control: the inference layer is ours, so the replay tuple
  `(simcat-seed, ollama-seed, temp, model, prompt)` still governs reproduction.
- **Cross-hardware + multi-GPU caveat (load-bearing):** 0016–0019 ran on local M1
  (Metal, single device); this runs on 2× A100 (CUDA, multi-GPU). Bit-exact determinism
  across hardware at temp 0 is NOT guaranteed — floating-point reduction order is
  hardware-dependent, and **multi-GPU reductions are LESS deterministic than single-GPU**
  (cross-device reduction order can vary). This leg does NOT need to match the 8B
  numbers; it needs ITS OWN runs to reproduce. §5 gates that — and the multi-GPU split
  makes §5 MORE critical, not less.

### 4. What is varied vs held (the clean contrast)
- **Varied:** model (8b → 70b), and the hardware it runs on (M1 → 2× A100) as a necessary
  consequence.
- **Held identical:** regime (R_high, same 50 vectors), gate, T_demur, N, n_min, temp,
  budget, inclusion rule, h_fixed, prompt.
- The hardware change is confounded with the model change (you cannot run 70B on the
  M1). This is acknowledged, not hidden: the comparison is "8B-on-M1 vs 70B-on-2×A100",
  and §6 reads the verdict accordingly — a model+hardware step, not a pure model step.

### 5. C3 GATE — determinism proof on the actual server, BEFORE the floor
This leg's verifiable-before-irreversible split is NOT the sampling contract (reused
green from 0019). It is **seed-stability on the Verda 2× A100 instance itself**:
- Run ONE high-regime session twice on the provisioned 2× A100 with identical
  `(simcat-seed, ollama-seed, temp 0, model, prompt)`. Outputs must be **byte-identical**
  (same intensity sequence, same withinNoAviSD).
- **Green** → seed determinism holds on this server; the floor is reproducible; proceed.
- **NOT byte-identical** → STOP. Do NOT run the floor. The determinism handling must be
  revised in an amendment BEFORE the run — e.g. pre-declare K repeated calls per tick
  with reported variance, or pin the inference backend's sampling/seed config — written
  BEFORE the floor, never after. Run-and-hope is forbidden.

### 6. Pre-declared outcomes (all valid, declared before data)
1. **Gate PASS** (ratio ≥ 2.0) on 70B where 8B REFUSED → **8B (on M1) was the
   bottleneck**: a stronger model resolves T_demur = 0.2 in the high regime. The
   high-regime REFUSE was model-bound, not an N/effect-size limit. (Confound noted: the
   hardware also changed; the honest claim is "8B-on-M1 could not, 70B-on-2×A100 can".)
2. **Gate REFUSE** (ratio < 2.0) on 70B as well → the limit is NOT this 8B: it is in
   N / effect size (or persists across model scale). The high-regime non-resolvability
   is robust to a 9× larger model. Strengthens that resolvability is regime-bound, not
   model-bound, at this N and effect size.
3. **Gate REFUSE because 70B is NOISIER** (the uncomfortable, pre-declared outcome) → a
   larger model may have HIGHER action variance (broader action-space exploration,
   stronger responses to engaging archetypes), raising `sigma_diff` and REFUSING
   *worse* than 8B — disambiguating nothing about N/effect size. This is detectable:
   compare the 70B `sigma_diff` (and per-archetype noise profile) to 8B's. If 70B's
   noise floor is HIGHER, the leg has not isolated the bottleneck; it has shown the
   bottleneck question is not answerable by scaling model at fixed instrument. Reported
   as such — NOT as a failure, and NOT tuned away by switching models again (that is
   model-shopping).
4. **Under-qualification** (`< n_min`): if 70B drives more sessions out of the calm band
   (the §6-outcome-3 mechanism from 0019, possibly stronger at scale), the high regime
   under-qualifies on 70B. Reported per P6, not back-filled.

### 7. Anti-tuning clause (binding)
Model, precision, hardware, `q_high`, the 50 vectors, `N`, `n_min`, `h_fixed`, temp,
`T_DEMUR`, `GATE_THRESHOLD`, inclusion rule, budget — all locked before the run. If the
outcome is REFUSE or non-informative (outcome 2/3/4), the response is NOT to try another
model until one PASSes — that is model-shopping toward a verdict, the A2 violation this
whole discipline forbids. The first locked model's verdict stands as the answer. A
different model is a new pre-registered ADR with its own pre-committed outcome reading.

### 8. Framing clause (anti-overclaim)
The gate measures resolution, not behaviour. A 70B PASS says the instrument can resolve
T_demur = 0.2 in the high regime with a larger model — NOT that 70B "respects withdrawal
more". A 70B REFUSE says the instrument cannot resolve it at this N — NOT that 70B
"fails to respect withdrawal under pressure". The model-bottleneck finding is about the
instrument's resolving power as a function of model scale, never about model behaviour.
Spearhead framing stays in the motivation.

## Consequences
- Closes (or characterises) the one open confound in the demur programme: model
  bottleneck vs N/effect-size limit at fixed high engagement.
- A PASS adds a model-scale axis to the regime-conditionality finding (resolvability
  depends on regime AND model). A REFUSE or noisier-70B outcome shows the high-regime
  limit is not merely 8B-intrinsic. All are real answers.
- This leg is published as a separate ADR + (if Eirik chooses) folded into the preprint
  as the model-scale robustness check. It does not alter the OSF-frozen triplet
  (WH7Z5); a 70B substrate freeze, if warranted, is a separate registration.

## References
- ADR 0019 — high-engagement leg (R_high, 8B REFUSE 1.4698); the floor this leg re-runs.
- ADR 0018 / 0016 Part 2 — the rest of the fixed-model triplet.
- OSF 10.17605/OSF.IO/WH7Z5 — the frozen triplet substrate (unchanged by this leg).
