# Fidelity audit — Chapter 17 secondary BSI sites and Chapter 6 PNEU

Date: 2026-08-05
Method: full text extraction of the shipped manuals (`pdftotext -layout`), then a
structural diff of every implemented criterion against the extracted text.

Sources of truth:

- `Secondary BSI Chapter.pdf` — Chapter 17, printed pages 17-1 – 17-35 (all sites except pneumonia)
- `NHSN pneumonia.pdf` — Chapter 6 PNEU, printed pages 6-3 – 6-16 (Tables 1–5, footnotes 1–13)
- `clabsi nhsn.pdf` — Chapter 4, printed pages 4-30 – 4-31 (NEC secondary-BSI exception only)

Baseline: 419 tests passing. **The existing tests encode the defects below**, so they
pass while the implementation is wrong. Tests are re-derived from manual text as part of
the remediation.

---

## A. Findings — Chapter 17

### A1. PJI criterion 3 is missing a minor criterion and merges two others — **critical**

Manual, 17-9 – 17-10, "Having three of the following minor criteria":

> a. elevated serum C-reactive protein (CRP; >100 mg/L) and erythrocyte sedimentation rate (ESR; >30 mm/hr.)
> b. elevated synovial fluid white blood cell (WBC; >10,000 cells/μL) count OR "++" (or greater) change on leukocyte esterase test strip of synovial fluid.
> c. elevated synovial fluid polymorphonuclear neutrophil percentage (PMN% >90%)
> d. positive histological analysis of periprosthetic tissue (>5 neutrophils (PMNs) per high power field).
> e. organism(s) identified from a single positive periprosthetic specimen …
> f. Synovial fluid alpha-defensin positive.
> g. Physician diagnosis of periprosthetic joint infection.

That is **seven** minor criteria, a–g. `secondary/definitions/pji.js` has two defects:

1. **"Elevated synovial fluid WBC > 10,000 cells/μL" does not exist anywhere in the
   codebase.** Only the leukocyte-esterase half of minor criterion b is implemented.
2. Minor criteria **a and b are merged into a single element** labelled
   `"Minor criterion a or b (counts as one minor criterion)"`. The manual lists them as
   two independent minor criteria; nothing in the PJI section says they collapse.

Failure case: CRP >100 + ESR >30 (a), synovial WBC 14,000 (b), PMN% 92 (c) = three minor
criteria = PJI 3 **met** per the manual. The implementation cannot score (b) at all and
would count (a) as one element, returning **not met**.

Fix: seven separate minor elements; element b becomes a two-option sub-group
(synovial WBC >10,000 cells/μL **OR** "++" leukocyte esterase) so that only one of the
two counts, per group-counting semantics.

### A2. USI criteria 3 and 4 require imaging on the purulent-drainage pathway — **critical**

Manual, 17-28:

> 3. Patient has one of the following signs or symptoms: fever (>38.0°C) / localized pain or tenderness*
>    And at least one of the following:
>      a. purulent drainage from affected site
>      b. organism(s) identified from blood … **AND** imaging test evidence definitive for infection …

Imaging is a requirement of **option b only**. `usi.js` places `usiImaging` in the
top-level `allOf` of both USI-3 and USI-4, so it is demanded even when the user selects
option a.

Failure case: fever + purulent drainage from the affected site meets USI 3a per the
manual; the implementation reports the definition incomplete pending imaging.

Fix: replace the drainage/blood group with two alternatives — `purulent drainage`, or
`blood organism AND imaging` (with definitive/equivocal-plus-treatment split, matching
how BONE/GIT/IAB already model footnoted imaging).

### A3. BONE 3b (equivocal imaging) demands a physician diagnosis the manual does not — **high**

Manual, 17-7 – 17-8, criterion 3b:

> b. imaging test evidence definitive for infection …, which if equivocal is supported by
> clinical correlation, specifically, physician or physician designee documentation of
> **antimicrobial treatment for osteomyelitis**.

`BONE-3b-equivocal` requires `bone-equivocal-imaging` **and** `bone-physician-diagnosis`
**and** `bone-antimicrobial-treatment`. The diagnosis element belongs to criterion 3c
("physician … diagnosis of osteomyelitis **with** documentation of antimicrobial
treatment"), not to 3b. Requiring it collapses 3b into 3c and makes 3b unreachable.

Fix: drop `bone-physician-diagnosis` from `BONE-3b-equivocal`.

### A4. JNT merges manual sub-criteria 3a and 3b — **medium**

Manual, 17-9:

> a. elevated joint fluid white blood cell count … OR positive leukocyte esterase test strip of joint fluid.
> b. organism(s) and white blood cells seen on Gram stain of joint fluid.

`jnt.js` has one criterion `JNT-3a` whose group mixes all three items. The evaluation
result is equivalent (both are "at least one of"), but the criterion the reviewer is told
they met is mislabelled — `JNT-3a` is reported when the evidence actually satisfies 3b.
For a surveillance tool the criterion letter is part of the answer.

Fix: split into `JNT-3a` (joint-fluid WBC / leukocyte esterase) and `JNT-3b`
(Gram stain organisms + WBCs).

### A5. SA 3a/3b collapse the equivocal-imaging condition into the imaging checkbox — **medium**

`sa.js` uses a single item whose label is
`"Imaging test evidence definitive … ; equivocal imaging …"`. A reviewer with equivocal
imaging and no documented antimicrobial treatment can still tick it. Every comparable
site (BONE, DISC, IC, EAR, GIT, IAB, NEC) models this as definitive **or**
equivocal + treatment. SA should match.

Fix: split into definitive and equivocal-plus-treatment alternatives.

### A6. CDI adds an RIT element that is not a criterion — **medium**

Manual, 17-18, criteria:

> 1. Positive test for toxin-producing C. difficile on an unformed stool specimen …
> 2. Patient has evidence of pseudomembranous colitis on gross anatomic … or histopathologic exam.

`cdi.js` adds `cdi-new-event-rit-eligible` to the `allOf` of **both** criteria. The RIT
rule is a reporting instruction ("Report each new GI-CDI according to the Repeat
Infection Timeframe rule"), not an element of the site definition. As implemented, a
reviewer with a positive toxin test on unformed stool is told CDI is not met until they
tick an element the manual does not list.

Fix: move to `reportingInstructions`; keep the text, drop the gate.

### A7. VCUF criteria 1 and 2 drift from the manual wording — **low**

Manual, 17-24:

> 1. Purulent drainage from the vaginal cuff **on gross anatomic exam**.
> 2. Abscess or other evidence of infection at the vaginal cuff **on gross anatomic exam**.

`vcuf.js` drops "on gross anatomic exam" from criterion 1, and criterion 2 adds
"or invasive procedure", which the VCUF section does not offer.

Fix: restore the manual wording exactly.

### A8. ENDO 4e Bartonella titre uses the wrong comparator — **low**

Manual ENDO 4e (17-30) says IgG titer **≥ 1:800**; ENDO 5e (17-31) says **> 1:800**.
`endo.js` shares one item using `>1:800` for both, so a titre of exactly 1:800 is
rejected on the ENDO 4 pathway where the manual accepts it.

Fix: separate items per criterion with the correct comparator.

### A9. LRI-LUNG is unimplemented — **high (coverage gap)**

`LUNG` is the only Chapter 17 site still a registry placeholder, so it always returns
`siteNotValidated` and can never be excluded as a secondary BSI source. Manual text at
17-22 gives three criteria plus specimen-eligibility rules that materially affect BSI
review (lung tissue and pleural fluid only; sputum / ETA / BAL are **not** eligible;
pleural fluid must be from thoracentesis or within 24 h of chest-tube placement, and is
ineligible after repositioning or > 24 h).

Fix: implement `secondary/definitions/lung.js` and register it as validated.

### A10. Items checked and found faithful

BONE 1/2/3a/3c · DISC · JNT 1/2/3c/3d · PJI 1/2 · IC · MEN (including the group-i
"cannot supply both elements" rule) · SA 1/2 · CARD · MED · VASC · CONJ · EAR · EYE ·
ORAL · SINU · UR · GE · GIT · IAB · NEC · EMET · EPIS · OREP · BRST · BURN · CIRC ·
DECU · SKIN · ST · UMB · ENDO 1/2/3/5/6/7 (element counting verified against
"only one condition within each element can be used").

---

## B. Findings — Chapter 6 PNEU

### B1. Tachypnea thresholds are wrong for adults and invent a band — **critical**

Manual footnote 5, 6-13:

| Age group | Rate |
|---|---|
| Adults | > 25 |
| Children > 1 year old | > 30 |
| Children 2 months – 12 months old | > 50 |
| Infants < 2 months old | > 60 |
| Premature infants < 37 weeks gestation, until the 40th week | > 75 |

`pnuTachypneaThreshold` in `protocol/pnu1.js` implements: `>5 yr → 30`, `>1 yr → 40`,
`≥2 mo → 50`, `<2 mo → 60`, premature `→ 75`.

- Adults get **30** instead of **25** — under-counts tachypnea in every adult review.
- A **40** band for ages 1–5 exists nowhere in the manual.

Fix: `> 12 yr → 25`, `> 1 yr through ≤ 12 yr → 30`, `2–12 mo → 50`, `< 2 mo → 60`,
premature `→ 75`. The adult/child boundary is set at 12 years because that is the
boundary NHSN itself uses for the PNU1 alternate paediatric criteria (Table 1, 6-6:
"for child > 1 year old or ≤ 12 years old"); the footnote table names the groups but not
the cut-point. This interpretation is recorded here and in a code comment.

### B2. PNU1 child hypothermia threshold is wrong — **high**

Manual Table 1, 6-6: `hypothermia (< 36.0°C or < 96.8°F)`.
`pnu1.js` `clinicalGroups` uses `{ comparator: "lt", value: 36.5 }`. A temperature of
36.2 °C is scored as hypothermia when the manual requires < 36.0.

### B3. PNU1 child bullet 4 uses the wrong cough finding — **low**

Manual: `Dyspnea, or apnea, or tachypnea (5), or new onset or worsening cough`.
The child branch matches finding kind `cough`; the manual's "new onset or worsening
cough" corresponds to kind `new-or-worsening-cough` (used correctly in the any-patient
branch). Plain `cough` is the infant bullet 6 finding.

### B4. PNU3's "PNU2 laboratory criteria" pathway only offers Table 2 — **high**

Manual Table 4, 6-9, laboratory column ends:

> OR
> Any of the following from:
> **LABORATORY CRITERIA DEFINED UNDER PNU2**

PNU2 laboratory criteria are Table 2 (common bacterial/fungal) **and** Table 3 (viral,
Legionella, other bacterial). The evaluator `pnu3.js` is correct — it delegates to
`evaluatePnu2` and accepts any branch — but the **UI** (`pneu-ui.js`, `pnu3Laboratory`)
renders only `labSelector(..., "common")`, so a reviewer cannot record a Legionella urine
antigen or a fourfold paired-sera rise on a PNU3 review.

### B5. Table 5 threshold list is incomplete in the UI — **low**

`thresholdText` omits non-bronchoscopic protected specimen brushing (NB-PSB, ≥ 10³
CFU/ml) and protected BAL (B-PBAL, ≥ 10⁴ CFU/ml) from Table 5, 6-15.

### B6. PNU1 infant bullet 4 label loses manual qualifiers — **low**

Manual: `Apnea, tachypnea (5), nasal flaring with retraction of chest wall, or nasal
flaring with grunting`. The UI label is just "Nasal flaring", which is not the criterion —
bare nasal flaring without retraction or grunting does not qualify.

### B7. Presentation — the criteria tables do not read like the manual — **the reported problem**

`renderPneuAbstraction` selects a single age pathway from the date of birth and renders
only that one, behind a banner reading "Active age pathway: …". The manual page presents
**all three pathways stacked in one Signs/Symptoms cell**, separated by
`ALTERNATE CRITERIA` bands. Consequences:

- The reviewer cannot see the criteria they are not on, so the page never matches the
  printed table they are cross-checking against.
- Missing-requirement feedback is a single terse strip (`conciseNeeded`) that flattens
  everything to phrases like "One systemic finding" with no indication of *which* bullet
  group is short or by how many.
- Evidence-date inputs, interpretation selects and developer diagnostics are interleaved
  with the criteria text, so the criteria themselves are visually subordinate to the
  form controls.

Remediation (see plan §C4): render the full manual table — all pathways, manual bullet
wording, footnote superscripts — with checkboxes on the bullets, the age-applicable
pathway active and the others dimmed but legible, and a persistent per-pathway
"still needed" readout that names the exact bullet groups outstanding.

---

## C. Remediation plan

**C1 — Chapter 17 criterion fixes** (A1–A8). One site per commit-sized change, no
schema changes required; A2 and A5 use the existing `alternatives` branch mechanism.

**C2 — Implement LUNG** (A9). New `secondary/definitions/lung.js`, registry entry,
promotion to `implementedSecondaryPathways`, dedicated test suite.

**C3 — PNEU evaluator fixes** (B1–B3, B5). Contained in `protocol/pnu1.js` and the UI
threshold table; `pnu2.js`/`pnu3.js` inherit the corrected threshold function.

**C4 — PNEU presentation rebuild** (B4, B6, B7). Rewrite the criteria renderers in
`protocol/pneu-ui.js` to mirror Tables 1–4, plus a live requirements panel driven by the
evaluator's per-domain results rather than the flattened `conciseNeeded` strings.

**C5 — Manual-derived tests.** Every fix above gets positive, negative and boundary
cases quoting the printed page they came from, so the suite stops ratifying the
implementation and starts checking the manual.

---

## D. Resolution log — 2026-08-05

All findings above are implemented. Suite: **461 tests passing** (was 419).

| Finding | Change |
|---|---|
| A1 PJI | `pji.js` — seven minor criteria a–g; minor criterion b is a two-option sub-group; added the missing `pji-elevated-synovial-wbc` (>10,000 cells/μL) |
| A2 USI | `usi.js` — criteria 3 and 4 use `alternatives`: purulent drainage alone, or blood organism + definitive imaging, or blood organism + equivocal imaging with documented treatment |
| A3 BONE | `bone.js` — `BONE-3b-equivocal` no longer requires a physician diagnosis |
| A4 JNT | `jnt.js` — `JNT-3b` split out of `JNT-3a` |
| A5 SA | `sa.js` — definitive / equivocal-plus-treatment imaging alternatives |
| A6 CDI | `cdi.js` — RIT gate removed from both criteria; retained as a reporting instruction |
| A7 VCUF | `vcuf.js` — manual wording restored ("on gross anatomic exam"; no invasive procedure) |
| A8 ENDO | `endo.js` — ENDO 4e uses ≥1:800 and ENDO 5e uses >1:800. **Additional defect found during the fix:** the prosthetic-material pathway required 3 blood collections where 17-30/17-31 require ≥2; corrected, and "matching" restored to all three collection-count labels |
| A9 LUNG | New `secondary/definitions/lung.js`, registered and validated; new `lung-secondary-rules.test.js` |
| B1 Tachypnea | `pnu1.js` — adults >25, children >1 through ≤12 >30, 2–12 months >50, <2 months >60, premature >75. The unsupported 40 band is gone |
| B2 Hypothermia | `pnu1.js` — child branch uses <36.0 °C |
| B3 Child cough | `pnu1.js` — child bullet 4 matches `new-or-worsening-cough`; `crackles` added to the child rales bullet per footnote 6 |
| B4 PNU3 laboratory | `pneu-ui.js` — Table 4 now offers both PNU2 laboratory tables under "LABORATORY CRITERIA DEFINED UNDER PNU2" |
| B5 Table 5 | `pneu-manual-view.js` — all seven collection techniques including NB-PSB and protected BAL |
| B6 Infant bullet 4 | Manual wording restored: "nasal flaring with retraction of chest wall, or nasal flaring with grunting" |
| B7 Presentation | New `protocol/pneu-manual-view.js` + rewritten renderers — see below |

### Snapshot rebaselines

Two behaviour-lock hashes necessarily changed and were regenerated with the reason
recorded next to them: `bj-shared-evidence-ui.test.js` (BONE, JNT, PJI) and
`test-fixtures-chapter17-evaluator-snapshots.json`. DISC was unaffected.

### Presentation rebuild (B7)

The PNEU criteria now render as the printed tables:

- **All pathways are shown.** Table 1's three age pathways are stacked in one
  Signs/Symptoms cell separated by `ALTERNATE CRITERIA` bands, exactly as printed. The
  age-applicable pathway is marked "Applies to this patient"; the others are dimmed and
  marked "Age criteria not met" rather than hidden.
- **PNU2 is two tables.** Table 2 and Table 3 render as separate three-column algorithms
  with an OR rule between them, instead of one merged cell.
- **Bullet text is transcribed from the manual**, with footnote superscripts and an
  expandable footnote list (1–13) beneath each table.
- **Every bullet is a checkbox.** Checking one now records dated evidence the evaluator
  actually accepts — previously a measurement checkbox did nothing at all (`app.js`
  discarded `data-measurement-confirm`) and a finding checkbox stored an empty date, which
  falls outside the infection window and so never counted.
- **Shortfall is stated at the point of interaction**: each bullet group carries an inline
  counter ("1 of 2") and, when short, a hint naming what is missing ("select 1 more from a
  different bullet"). A summary panel at the top lists every outstanding requirement.
- **Overflow is contained.** Verified programmatically at 1440 px, 1000 px and 375 px:
  no element escapes its table cell and the page has no horizontal overflow.

An additional UI defect was fixed in passing: selecting a laboratory finding in one table
left the other table's selection active while the two shared a single specimen record,
so stale threshold guidance rendered against the wrong specimen.
