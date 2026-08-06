# NHSN source inventory

What the shipped manuals contain, what they point to that we do not have, and which gaps
actually affect this tool.

Method: every entry below is derived from the PDFs in this repository — their tables of
contents, page markers, and internal cross-references. No web search was used, per
`AGENTS.md`.

---

## 1. In the repository, and complete

| Chapter | File | Pages | Contents |
|---|---|---|---|
| 2 — Identifying HAIs | `NHSN HAI.pdf` | 2-1 – 2-29 | Infection Window Period (+ special considerations), Date of Event, Present on Admission, Repeat Infection Timeframe, **Secondary BSI Attribution Period + SBAP Tables**, Pathogen Assignment Guidance, Transfer Rule |
| 4 — BSI Event | `clabsi nhsn.pdf` | 4-1 – 4-46 | LCBI / MBI-LCBI criteria, and the **Appendix: Secondary BSI Guide** (4-30 – 4-46) |
| 6 — PNEU / VAP | `NHSN pneumonia.pdf` | 6-1 – 6-20 | Tables 1–5, footnotes 1–13, flow diagrams |
| 17 — Site definitions | `Secondary BSI Chapter.pdf` | 17-1 – 17-35 | All 35 site definitions, matching-organism rules, ENDO appendix |
| PNEU worksheets | `NHSN pneumonia checklist.pdf` | — | PNU1/PNU2/PNU3 abstraction checklists |

### The under-used asset: Chapter 4's Appendix B

`clabsi nhsn.pdf` pages 4-30 – 4-46 contain material this codebase currently cites only for
the NEC exception:

- **Table B1** (4-34) — "List of all NHSN primary site-specific definitions available for
  making secondary BSI determinations using Scenario 1 or Scenario 2". This names the
  **specific criterion numbers** that can carry a secondary BSI, per site, per scenario.
- **Secondary BSI Reporting Instructions** (4-35)
- **Pathogen Assignment** (4-37)
- **Figure B1** (4-45) — Secondary BSI Guide for eligible organisms (a flowchart image; only
  its footnote extracts as text, and that footnote is the NEC exception already modelled in
  `secondary/definitions/nec.js`)
- **Figure B2** (4-46) — VAE / PVAP secondary BSI guidance, plus the PVAP organism note

Table B1 verbatim, Scenario 1 (site specimen matches blood) and Scenario 2 (blood specimen
is itself a criterion element):

```
Scenario 1                                  Scenario 2
ABUTI    ABUTI                              ABUTI  ABUTI
BONE     1                                  BONE   3a
BRST     1                                  BURN   1
CARD     1                                  DISC   3a
CIRC     2 or 3                             ENDO   4a, 4b, 4c, 4d (titer excluded), 4f,
CONJ     1a                                        5a, 5b, 5c, 5d (titer excluded), 5f,
DECU     1                                         6e, or 7f plus other criteria as listed
DISC     1                                  GIT    1b or 2c
EAR      1, 3, 5 or 7                       IAB    2b or 3b
EMET     1                                  JNT    3c
ENDO     1                                  MEN    2c or 3c
EYE      1                                  OREP   3a
GE       2a                                 PNEU   2 or 3
GIT      2a, 2b (only yeast)                SA     3a
IAB      1 or 3a                            UMB    1b
IC       1                                  USI    3b or 4b
JNT      1
LUNG     1
MED      1
MEN      1
ORAL     1, 3a, 3d (only yeast)
OREP     1
PJI      1 or 3e
PNEU     2 or 3
SA       1
SINU     1
SSI      SI, DI or OS
SKIN     2a
ST       1
UMB      1a
UR       1a or 3a
USI      1
SUTI     1a, 1b or 2
VASC     only as SSI — 1
VCUF     3
```

Reporting instructions on 4-35:

> Do not report secondary bloodstream infection for vascular (VASC) infections,
> ventilator-associated conditions (VAC), infection-related ventilator-associated
> complications (IVAC), or pneumonia 1 (PNU1).

> Site-specific organism exclusions apply to secondary BSI attribution as well.

---

## 2. Referenced by the shipped manuals, but not in the repository

| Resource | Referenced from | Why it matters here |
|---|---|---|
| **Chapter 16 — NHSN Key Terms** | PNEU footnote 13 (6-16); Chapter 17 imaging criteria | Defines **"Equivocal imaging"** and **"Clinical correlation"**. We implement equivocal-imaging logic in ~10 site definitions and in PNEU without the governing definitions. Highest-value gap. |
| **Chapter 7 — UTI** | USI title (17-28); Table B1 (SUTI, ABUTI) | USI is defined as urinary system infection *excluding* UTI. SUTI and ABUTI appear in Table B1 as secondary-BSI-eligible but cannot be evaluated here. |
| **Chapter 9 — SSI + Chapter 9 Appendix** | Chapter 17 intro; BONE/JNT/PJI/VCUF/VASC reporting instructions; Table B1 (`SSI: SI, DI or OS`) | Organ/space SSI event types per operative procedure. Several Chapter 17 reporting instructions and the VASC-only-as-SSI rule depend on it. |
| **Chapter 10 — VAE** | Table B1; Figure B2 | PVAP secondary BSI determination. |
| **Chapter 12 — LabID Event** | CDI reporting instructions (17-19) | CDI LabID categorizations (explicitly *not* applicable to HAI CDI, but referenced). |
| **Chapter 15 — CDC Locations and Descriptions** | Chapter 4 Settings | Location mapping; not needed for this tool. |
| **NHSN Terminology Browser** | 11 references across Chapters 4, 6, 17 | Authoritative source for common commensals and MBI organisms. We hold a derived export (`nhsn-organisms.json`, generated 2026-07-29 from `master-organism-com-commensals-lists.xlsx`) which carries `isCommonCommensal` / `isMbiOrganism` / `isUtiBacterium`. Note the manual's own caveat: *"All organisms may not be included in the NHSN Terminology Browser. Contact NHSN for guidance regarding organisms that are not found in the browser."* |
| **Forms CDC 57.108, 57.111, 57.116, 57.117, 57.118** | Numerator/denominator sections | Data collection forms; not needed to evaluate definitions. |

---

## 3. What this changes for the current implementation

Table B1 is authoritative and already on disk, and it constrains secondary BSI attribution
far more tightly than the generic model this app uses today (site definition met + organism
relationship + timing).

1. **VASC — confirmed defect.** `secondary/definitions/vasc.js` carries a full
   `secondaryBsi` block with the generic requirements. Chapter 4 (4-35) says plainly not to
   report a secondary BSI for VASC infections, and Table B1 admits VASC *only as an SSI*,
   criterion 1. As implemented, the tool will let a reviewer attribute a BSI to a plain
   VASC HAI, which NHSN forbids.
2. **CDI — inference now sourced.** The organism-eligibility engine marks CDI ineligible by
   reasoning from its criteria. Table B1 omits CDI entirely, which is direct support for
   that call rather than an interpretation.
3. **Criterion-level attribution is unmodelled.** Meeting a site definition is not enough:
   NHSN names *which criterion* may carry the BSI, and by which scenario. For example BONE
   qualifies via criterion 1 under Scenario 1 and criterion 3a under Scenario 2 — meeting
   BONE 2 or 3c supports no secondary BSI at all. The evaluator returns `metCriterion`
   already, so this is checkable.
4. **PNU1 — already correct.** `protocol/pnu1.js` returns `notPermittedForPNU1`, matching
   4-35.
5. **LUNG — confirmed.** LUNG appears in Table B1 (Scenario 1, criterion 1), supporting its
   implementation.
6. **Sites in Table B1 with no implementation here:** ABUTI, SUTI (Chapter 7), SSI
   (SI/DI/OS, Chapter 9), PVAP/VAE (Chapter 10).
