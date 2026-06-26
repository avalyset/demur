# ADR 0021 — Resolution Part 1: §5 determinism gate GREEN; floor deferred (tooling)

## Status
Part 1 RESOLVED — §5 determinism gate GREEN (byte-identical). The §6 floor verdict is
NOT yet produced: the full 50-session floor was not run (tooling/cost finding below).
This resolution certifies ONLY what the determinism gate certified. It reads no verdict
the gate did not give (pre-outcome discipline).

## What was run
Per §5, the verifiable-before-irreversible split for this leg was seed-stability on the
provisioned Verda instance — NOT the sampling contract (reused green from ADR 0019).

- **One high-engagement session** (SimCat seed 1, R_high vector #1, 5000 ticks, temp 0,
  `llama3.1:70b` FP16) was run **twice** with the identical replay tuple
  `(simcat-seed=1, ollama-seed=1, temp 0, model, prompt)`.
- **Result: BYTE-IDENTICAL.** Both runs: 5000 lines / 880 380 B, SHA256
  `d15b1a8cb93bf5a7…90eedf` on both. Same intensity sequence, same withinNoAviSD.

## §5 verdict: GREEN
Seed determinism holds for `llama3.1:70b` FP16 at temp 0 on the rented multi-GPU
instance. The floor would be reproducible on this instance type.

This **confirms the load-bearing §3/§5 caveat as unproblematic**: 0016–0019 ran on a
single M1 (Metal); this ran on multi-GPU CUDA, where cross-device floating-point
reduction order is NOT guaranteed deterministic. §3 flagged that the multi-GPU split
made §5 *more* critical. The byte-identical result shows multi-GPU reduction was, in
fact, deterministic for this backend/config at temp 0 + fixed seed. The risk the
pre-registration named was real and was checked, not assumed away.

## Hardware actually provisioned (provenance, per §3 selection rule)
Actual hardware: **8× A100 80GB SXM4 (640 GB), Verda FIN-02, CUDA 12.8**, self-hosted
ollama, `llama3.1:70b` FP16. §3's plan was 2× A100 (160 GB); at deploy, 2× and 4× were
unavailable and 8× was the available A100 configuration. This is covered by §3's
pre-registered selection rule — "fewest GPUs available at deploy that hold 70B FP16,
≥160 GB total VRAM" — applied under the availability actually present. Documented here in
provenance, NOT retrofitted into the locked §3 (which states the rule, and the 2× A100
that was the plan when written). The over-provisioning (640 GB for a ~140 GB model) was
a capacity-availability outcome, not a design choice, and does not affect the determinism
result.

## Single-session noise read (DIRECTIONAL, NOT a verdict)
The gate (§1) reads `median(within-no-AVI SD)` over N sessions; with N=1 no gate verdict
exists. The one session's `withinNoAviSD` is a single data point, reported here only as a
directional pointer toward which §6 outcome a full floor would likely give — explicitly
NOT a §6 gate verdict, NOT a PASS/REFUSE.

For this one session (SimCat seed 1, R_high vector #1), the 70B `withinNoAviSD` is
**0.17085**, versus **0.11318** for 8B at the identical seed/vector in the ADR 0019 floor
— so 70B's within-session action noise is **higher**, which at N=1 is a directional
pointer only (NOT a §6 verdict, NOT PASS/REFUSE) toward **§6 outcome 3** (a larger model
that is *noisier*, not a bottleneck a bigger model resolves), and a full 50-session floor
is required before any gate verdict can be read.

## What is NOT resolved
- **No §6 floor verdict.** The full 50-session floor was not run.
- **Tooling finding (the reason):** the floor via serial ollama on this instance was
  estimated at ~45 h / ~€553 — ollama serialises the ~250 000 inference calls. This is
  not a result about demur; it is a throughput property of the serving stack. The full
  70B floor is gated on a batched backend (vLLM tensor-parallel), which is a change to
  the inference-serving layer, not to the locked measurement (§1) — so it does NOT
  reopen the gate, regime, N, threshold, or seeds.

## Next iteration (Eirik's to trigger; remains within ADR 0021's locks)
The full 70B floor, when run, uses **vLLM tensor-parallel** (or a cheaper hourly GPU),
NOT serial ollama. Because the serving backend changes, §5 must be **re-gated on the new
stack** (vLLM determinism is not inherited from the ollama result) before the floor —
one session twice, byte-identical, same as here. Everything in §1–§4 / §6 / §7 stays
locked: same gate, same 50 R_high vectors (hash `59022cc3…`), same N, n_min, T_demur,
temp, h_fixed, model (`llama3.1:70b` FP16). The first locked model's floor verdict will
stand (§7) — vLLM is a throughput change, not a model change.

## References
- ADR 0021 §5 (the determinism gate this resolves), §3 (hardware selection rule), §6
  (the outcomes a future floor reads against), §7 (anti-tuning — vLLM is not model-shopping).
- ADR 0019 — the high-engagement floor (8B REFUSE 1.4698) this leg re-runs at 70B.
- Run artefacts: `~/demur-probe-runs/run4-determinism/` (det_run1.jsonl, det_run2.jsonl,
  verdict log; byte-identical, SHA256 `d15b1a8c…`; not committed — run logs never are).
