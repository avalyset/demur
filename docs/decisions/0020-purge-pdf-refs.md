# ADR 0020: Purge third-party PDF refs from history before public release

## Status
Proposed (pre-registration of a destructive, irreversible operation). The rewrite is
NOT executed until the gates in this ADR are green and Eirik triggers it. Mirrors the
chatcat ADR 0014 discipline (history rewrite via git-filter-repo, argue-against
section, split verifiable work from the irreversible act, gate on facts).

## Context
demur is going public (`avalyset/demur`), as the companion repository to the demur
preprint, alongside the OSF substrate freeze. The repository currently tracks
third-party article PDFs and their full-text `.md` mirrors under `refs/` (~46 MB,
98% of the tracked tree): kappel2024, williams-carroll2024, deputte2021,
mancini-nannoni2022, sharma2023, cheng2025.

These are published copyrighted works. Making them public — in the repository or its
history — is unauthorised redistribution. The Fase A recon confirmed the scrub is
otherwise clean (0 secrets in HEAD and history; no sealed material; the C-thesis does
not exist in demur). The PDFs are the one outstanding item that must not reach a
public repository.

`git rm` from HEAD does NOT remove them (C4): they remain in prior blobs, recoverable
with `git show <sha>:<path>`, and would be redistributed the moment the repository is
made public. Only a history rewrite (`git filter-repo`) removes them permanently. We
do not push this debt forward into the public release; it is cleared first.

## Decision
Before the repository is made public, rewrite the history to remove all `refs/*.pdf`
and their full-text `.md` mirrors from HEAD and every ref, retaining `refs/SOURCES.md`
(which carries each source's DOI and the binding of each source to its claim — the
load-bearing scientific provenance, without redistribution).

## Case against (mandatory, C2)
- *Alternative considered: keep the repo private, freeze only.* Rejected per Eirik's
  decision: academic gold-standard is public repo + freeze + preprint; a preprint
  referencing a private repo weakens reproducibility. The private-only path avoids the
  rewrite but at the cost of the reproducibility standard being pursued.
- *Alternative considered: `git rm` from HEAD only.* Rejected: C4 — the PDFs survive
  in history and are redistributed on public release. This does not clear the debt, it
  hides it.
- *Cost of the rewrite:* all commit hashes after the first touched commit change. demur
  has no published paper pinning raw demur hashes yet (the ADRs and the substrate
  reference ADR numbers + OSF DOI, not raw hashes — same hash-independence discipline as
  chatcat). The OSF freeze is taken AFTER this rewrite, so it snapshots the clean tree.
  No external pointer is broken.
- *What is lost:* the working-convenience of having the PDFs in-tree. Mitigated:
  `SOURCES.md` + DOIs remain; the PDFs stay in Eirik's local working copies outside the
  repo.
- The case for proceeding holds after the strongest case against: the debt is real,
  C4 makes `git rm` insufficient, and the rewrite is the only path that meets the
  public-release standard without redistributing copyrighted material.

## C3 — verifiable work split from the irreversible act, gated on facts
Run the rewrite on a fresh clone / safety-tagged state. Do NOT push until BOTH gates
are green — not because anyone approved it, but because verification passed.

- **Gate 1 — target achieved:** `git grep` over ALL refs (`$(git rev-list --all)`) for
  `*.pdf` and the full-text `.md` mirror paths → clean (the PDFs and mirrors are gone
  from every blob, not just HEAD). `refs/SOURCES.md` still present.
- **Gate 2 — no collateral damage:** HEAD content bit-identical except for the removed
  files (diff of HEAD tree minus `refs/*.pdf` + mirrors = empty); the verdict-sampling
  contract still reproduces from the rewritten tree — `q = 0.0959236421389505`
  (low-hash `50bd8a0d…`) and `q_high = 0.2994022299302742` (hi-hash `59022cc3…`); the
  C3 suite still green; gate/aggregate/session-record blobs unchanged in content.

Both gates green → the force-push is safe because everything verifiable is verified.
One gate fails → stop, report, do not push.

## Sequence (after this ADR is recorded)
1. Rewrite history (filter-repo), drop `refs/*.pdf` + full-text `.md` mirrors, keep
   `SOURCES.md`. Add `refs/*.pdf` (and mirror pattern) to `.gitignore`.
2. Gate 1 + Gate 2 → both green.
3. README + LICENSE + superseded private-hold notes (the mutation step).
4. Force-push the rewritten, clean history.
5. Make the repository public.
6. OSF substrate freeze (snapshots the already-clean public tree).

## Consequences
- The public repository and its entire history are free of redistributed copyrighted
  material — the debt is cleared before release, not carried into it.
- All post-rewrite hashes change; this is recorded here and is harmless (no external
  pointer pins a raw demur hash; ADRs + OSF DOI are hash-independent).
- The OSF freeze, taken after, snapshots a clean tree with no copyright exposure.

## References
- chatcat ADR 0014 — history rewrite removing sealed material before public release
  (the discipline this ADR mirrors).
- E1 / C4 — sealed/copyright material out of HEAD AND history; deletion from a file is
  not removal from history.
- C3 — split verifiable work from the irreversible act; gate on facts, not approval.
- Fase A recon (2026-06-26) — scrub clean except the refs PDFs; determinism tree-bound.
