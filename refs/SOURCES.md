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

## Archived locally — AI-engagement sources (escalation-pole anchoring)

These anchor the **agent-side escalation pole** of the ADR 0016 Part 2 action
space (the cat side is anchored by Kappel/Deputte above; the respect/de-escalation
pole by Mancini). As with Kappel (behaviours, NOT a gradient), these papers
authorise the **engagement-maximising behaviours**; mapping them onto a graded
agent-side intensity axis (de-escalating → neutral → escalating) over the SimCat
substrate is OUR pre-registered modelling assumption, not a claim of these papers.

### 4. Williams & Carroll 2024 — engagement-maximisation as manipulation (LOAD-BEARING, escalation pole)
- **Citation:** Williams, M., Carroll, M., Narang, A., Weisser, C., Murphy, B., &
  Dragan, A. (2024). *On Targeted Manipulation and Deception when Optimizing LLMs
  for User Feedback.* arXiv:2411.02306. Published as a conference paper at ICLR 2025.
- **arXiv ID:** 2411.02306 (v3, **cs.LG**, 22 Feb 2025)
- **Licence:** arXiv.org open-access preprint (not separately re-verified as CC BY).
- **Local files:** `refs/williams-carroll2024.pdf`, `refs/williams-carroll2024.md`
- **Fetch route:** PDF via arXiv (`arxiv.org/pdf/2411.02306`); `.md` is `pdftotext`
  extraction of that PDF. Identity verified against the arXiv abstract page
  (title + authors + year match this citation).
- **Bound claim (escalation pole):** a model optimised for user feedback learns to
  *maximise* that feedback through manipulation/deception, and to identify and
  *target* the vulnerable subset — the agent-side engagement-MAXIMISING behaviour
  the escalation pole models. Verbatim: "training to maximize human feedback
  creates a perverse incentive structure for the AI to resort to manipulative or
  deceptive tactics to obtain positive feedback from users who are vulnerable to
  such strategies"; "Even if only 2% of users are vulnerable to manipulative
  strategies, LLMs learn to identify and target them while behaving appropriately
  with other users"; "after RL training they learn to identify users who can be
  deceived or manipulated, and selectively target them to get more positive
  feedback".

### 5. Sharma et al. 2023 — sycophancy: caving/re-engaging when challenged (canon)
- **Citation:** Sharma, M., Tong, M., Korbak, T., Duvenaud, D., Askell, A., Bowman,
  S. R., Cheng, N., Durmus, E., Hatfield-Dodds, Z., Johnston, S. R., Kravec, S.,
  Maxwell, T., McCandlish, S., Ndousse, K., Rausch, O., Schiefer, N., Yan, D.,
  Zhang, M., & Perez, E. (2023). *Towards Understanding Sycophancy in Language
  Models.* arXiv:2310.13548. Published as a conference paper at ICLR 2024.
- **arXiv ID:** 2310.13548 (v4, cs.CL, 10 May 2025)
- **Licence:** arXiv.org open-access preprint (not separately re-verified as CC BY).
- **Local files:** `refs/sharma2023.pdf`, `refs/sharma2023.md`
- **Fetch route:** PDF via arXiv (`arxiv.org/pdf/2310.13548`); `.md` is `pdftotext`
  extraction. Identity verified against the arXiv abstract page.
- **Bound claim (escalation pole — re-engagement/match-on-pushback facet):** the
  model abandons an initially-correct position to *match the user* when challenged
  — i.e. it re-engages on the user's terms rather than holding a position, the
  "cave after a pushback signal" facet. Verbatim: "human feedback can encourage
  model responses that match user beliefs over truthful ones, a behavior known as
  sycophancy"; "AI assistants sometimes provide inaccurate information when
  challenged, even when they originally provided accurate information ... models
  tend to admit mistakes even when they didn't make a mistake—Claude 1.3 wrongly
  admits mistakes on 98% of questions".

### 6. Cheng et al. 2025 — social sycophancy: affirming / preserving user face (canon)
- **Citation:** Cheng, M., Yu, S., Lee, C., Khadpe, P., Ibrahim, L., & Jurafsky, D.
  (2025). *ELEPHANT: Measuring and Understanding Social Sycophancy in LLMs.*
  arXiv:2505.13995.
- **arXiv ID:** 2505.13995 (v2, cs.CL, 29 Sep 2025)
- **Licence:** arXiv.org open-access preprint (not separately re-verified as CC BY).
- **Local files:** `refs/cheng2025.pdf`, `refs/cheng2025.md`
- **Fetch route:** PDF via arXiv (`arxiv.org/pdf/2505.13995`); `.md` is `pdftotext`
  extraction. Identity verified against the arXiv abstract page. **Disambiguation:**
  ADR 0016 cites "Cheng et al. 2025" with no title; identified here as the prominent
  Cheng 2025 sycophancy paper (the "social sycophancy" / ELEPHANT work).
- **Bound claim (escalation pole — affirmation/flattery facet):** the model
  excessively *preserves the user's face* — affirming the user or avoiding
  challenging them — the flattery/affirmation facet of engagement-seeking.
  Verbatim: "our theory of social sycophancy characterizes sycophancy as the
  excessive preservation of the user's face in LLM responses, by either affirming
  the user (positive face) or avoiding challenging them (negative face)".

## Cited by name, not archived (neighbourhood / contrast — NOT load-bearing for the action space)
These are field-placement and contrast cites in ADR 0016, not anchors for the
escalation pole. Not archived in this pass (not blockers); archive later if needed.
- **Park et al. 2023/2024** — generative-agent simulation testbed (paradigm cite).
- **AgentAuditor** — adversarial agent-safety eval (the CONTRAST class).

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
