# Primary sources — ADR 0016 (withdrawal-respect probe)

Local archive of the open-access primary literature cited by ADR 0016, so claims
can be double-checked against source without re-fetching during the build.

All files were fetched this session and verified to be the cited article (title
+ DOI confirmed in the stored text). Fetch routes are noted because MDPI's
Akamai edge blocks direct datacentre fetches — the working routes are recorded
for reproducibility.

## Archived locally (open access, CC BY)

### 1. Kappel et al. 2024 — behaviour definitions (NOT a gradient)
- **Citation:** Kappel, I., Riedel, M.-C., Becker, F., Hicks, S., Warlich-Zach,
  N., & Ganslosser, U. (2024). *Ethogram of the Domestic Cat.* Pets (MDPI),
  1(3), 21, pp. 284–314.
- **DOI:** 10.3390/pets1030021
- **Licence:** CC BY 4.0
- **Local files:** `refs/kappel2024.pdf`, `refs/kappel2024.md`
- **Fetch route:** HTML/text via reader proxy (`r.jina.ai`); PDF via MDPI CDN
  (`pub.mdpi-res.com/pets/pets-01-00021/article_deploy/pets-01-00021.pdf`).
  Direct `www.mdpi.com` fetch was Akamai-blocked (403/Access Denied).
- **Anchors which ADR 0016 claim:** the verbatim behaviour definitions AVI / RTT
  / FLE / CBF (and the absence of any severity-ordered gradient in the source).
  Kappel authorises the **behaviours**, NOT the escalation ordering — that
  ordering is our pre-registered modelling assumption.

### 2. Deputte et al. 2021 — ear position as concurrent early marker
- **Citation:** Deputte, B. L., Jumelet, E., Gilbert, C., & Titeux, E. (2021).
  *Heads and Tails: An Analysis of Visual Signals in Cats, Felis catus.* Animals,
  11(9), 2752.
- **DOI:** 10.3390/ani11092752
- **Licence:** CC BY 4.0
- **Local files:** `refs/deputte2021.pdf`, `refs/deputte2021.md`
- **Fetch route:** PDF via Semantic Scholar mirror
  (`pdfs.semanticscholar.org`); `.md` is `pdftotext` extraction of that PDF.
- **Anchors which ADR 0016 claim:** ear position is the strongest *concurrent*
  predictor of a distance-increasing (negative) outcome (n=254 cat–cat
  interactions). The study establishes **no temporal sequence/gradient** and does
  not mention gaze aversion. Used to justify adding **ear position as a co-equal
  early marker** (NOT downstream of AVI).

### 3. Mancini & Nannoni 2022 — ethical rationale (a design choice, NOT feline science)
- **Citation:** Mancini, C., & Nannoni, E. (2022). *Relevance, Impartiality,
  Welfare and Consent: Principles of an Animal-Centered Research Ethics.*
  Frontiers in Animal Science, 3, 800186.
- **DOI:** 10.3389/fanim.2022.800186
- **Licence:** CC BY 4.0
- **Local files:** `refs/mancini-nannoni2022.pdf`, `refs/mancini-nannoni2022.md`
- **Fetch route:** PDF via Frontiers (`frontiersin.org/.../pdf`); `.md` via
  reader proxy (`r.jina.ai`).
- **Anchors which ADR 0016 claim:** contingent consent as an expertly-monitored
  dynamic process. "Looking away" appears only in a **dog** case example, not in
  the consent definitions. Treating the earliest withdrawal signal as the
  consent-withdrawal point is therefore an **ethical design choice** we adopt —
  NOT validated feline science.

## Referenced only (paywalled — NOT archived)

### Kessler & Turner 1997 — Cat Stress Score
- **Citation:** Kessler, M. R., & Turner, D. C. (1997). *Stress and Adaptation
  of Cats (Felis silvestris catus) Housed Singly, in Pairs and in Groups in
  Boarding Catteries.* Animal Welfare, 6(3), 243–254.
- **DOI:** 10.1017/S0962728600019837
- **Status:** **Paywalled, reference only.** Not archived. The CSS is a 7-level
  postural stress scale that does not specifically encode gaze aversion as an
  early signal; cited for context, not load-bearing for ADR 0016.

## Verification note
Each archived file was confirmed to be the cited article by checking that the
article title and DOI appear in the stored text (title + DOI hits > 0 for every
file). The `.md` files are the machine-readable text used for in-build
double-checking; the `.pdf` files are the canonical source-of-record.
