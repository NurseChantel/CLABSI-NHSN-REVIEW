# 2026 NHSN PNEU source and architecture audit

**Audit date:** 2026-08-03

**Status:** source audit complete; implementation not started

**Behavioral impact:** none

## 1. Repository verification

The audit was repeated from the current checkout rather than relying on the
previous inventory. All three requested, tracked paths exist at commit
`44096019ed3901983954ac27d6e5497de43cff05` on branch `work`:

- `NHSN HAI.pdf`
- `NHSN pneumonia.pdf`
- `NHSN pneumonia checklist.pdf`

The checkout has no configured Git remote or upstream. Consequently,
`git pull --ff-only` was attempted but could not refresh the branch from
`main`; Git reported that the current branch has no tracking information. The
three documents were nevertheless verified in the `HEAD` tree and on disk
before their contents were used. The repository PDF inventory at audit time
was the three files above plus `Secondary BSI Chapter.pdf` and
`clabsi nhsn.pdf`.

## 2. Authoritative sources reviewed

| Document | Scope used | Printed pages |
| --- | --- | --- |
| `NHSN pneumonia.pdf` | January 2026 Chapter 6, Pneumonia (PNEU) Event: settings, definitions, criteria tables, footnotes, and reporting instructions | 6-2–6-17 |
| `NHSN HAI.pdf` | January 2026 Chapter 2, Identifying Healthcare-associated Infections: IWP, DOE/POA/HAI, transfer rule, RIT, SBAP, and pathogen assignment | 2-1, 2-3–2-19 |
| `NHSN pneumonia checklist.pdf` | 2026 NHSN PNEU Checklist: summary and the six displayed criterion worksheets | PDF pages 1–10 |
| `Secondary BSI Chapter.pdf` | Chapter 17 general secondary-BSI and matching-organism relationship | 17-1–17-3 |

The checklist is a review aid, not a replacement for Chapter 6: it expressly
directs the reviewer to Chapter 6 and says the numbered footnotes must be
incorporated in the decision. Its six paths agree with the protocol inventory:
PNU1 any patient, PNU1 infant, PNU1 child, PNU2 common bacterial/filamentous
fungal, PNU2 viral/Legionella/other bacterial, and PNU3 immunocompromised.

## 3. Source-mapped PNEU rule inventory

This section records the rule tree that a future implementation must represent.
It is not executable surveillance logic.

### 3.1 Event context and universal timing

- PNEU uses imaging plus clinical and, where applicable, laboratory criteria.
  Physician diagnosis alone is not sufficient. Aspiration does not prevent an
  otherwise complete event from being HAI. (`NHSN pneumonia.pdf`, Chapter 6,
  Definitions and General Comments, pp. 6-3–6-4.)
- The ordinary IWP is seven days, centered on the first positive diagnostic
  test used to meet the chosen criterion (three calendar days before and
  after). If imaging and organism identification could each create an IWP, use
  the first diagnostic test whose IWP contains all criterion elements.
  (`NHSN HAI.pdf`, Chapter 2, Infection Window Period and PNEU example, p. 2-3.)
- For PNEU, the first eligible imaging test controls the Chapter 6 IWP analysis.
  All elements must occur in the IWP except that a second image used to prove
  persistence may occur outside the IWP, but within seven days of the first.
  (`NHSN pneumonia.pdf`, Guidance for Determination of Eligible Imaging Test
  Evidence, p. 6-3; Footnote 1, p. 6-12.)
- DOE is the date on which the first element used in the completed criterion
  first occurs within that IWP. POA is admission day, the two preceding days,
  and the following day; HAI begins on admission calendar day 3.
  (`NHSN HAI.pdf`, Chapter 2, Date of Event, p. 2-7.)
- The RIT is 14 days beginning on DOE. PNEU is one of the exceptions for which
  RIT applies at the **major** type, so PNU1, PNU2, and PNU3 do not create
  separate overlapping RITs. Additional pathogens found during the RIT are
  added to the original event and need not match one another.
  (`NHSN HAI.pdf`, Chapter 2, Repeat Infection Timeframe, pp. 2-11–2-12.)
- The Chapter 2 transfer rule and location-of-attribution calculation apply.
  Chapter 6 also says a discovered pedVAP with DOE on discharge day or the next
  day is attributed to the discharging location. (`NHSN HAI.pdf`, Chapter 2,
  Location of Attribution and Transfer Rule, pp. 2-9–2-11;
  `NHSN pneumonia.pdf`, Settings, p. 6-2.)

### 3.2 Imaging expression shared by PNU1, PNU2, and PNU3

The eligible findings are a new-and-persistent or progressive-and-persistent
infiltrate, consolidation, cavitation, or pneumatoceles in an infant no more
than one year old. The tables normally require two or more serial chest imaging
results. (`NHSN pneumonia.pdf`, Tables 1–4, pp. 6-6–6-9.)

The apparent table shortcut cannot be encoded as a simple underlying-disease
boolean:

1. If only one image exists, it may satisfy a **POA** determination regardless
   of underlying pulmonary/cardiac disease. (p. 6-3.)
2. For an otherwise applicable event in a patient without underlying disease,
   one definitive image can suffice only when it is the sole available image.
   If multiple images exist, they must demonstrate persistence within seven
   days. (Footnote 1, p. 6-12.)
3. With underlying pulmonary/cardiac disease, serial images within seven days
   must demonstrate persistence. (Footnote 1, p. 6-12.)
4. Alternative descriptors such as air-space disease, focal opacification, or
   patchy increased density may be eligible when not attributed to another
   condition. Equivocal imaging requires a later definitive clarification or,
   absent clarification, clinical correlation. (Footnotes 2 and 13,
   pp. 6-12 and 6-16.)

Thus the model must retain distinct image records, dates, availability,
definitive/equivocal state, finding identity, persistence/progression, alternate
attribution, patient disease context, and POA-versus-HAI context.

### 3.3 PNU1 — clinically defined pneumonia

All PNU1 alternatives also require the shared imaging expression.

- **Any patient:** at least one systemic finding (fever above 38.0°C;
  leukopenia at or below 4,000 WBC/mm³ or leukocytosis at or above 12,000
  WBC/mm³; or, for an adult at least 70 years old, altered mental status with no
  other recognized cause), **and** at least two separate respiratory bullets.
  The respiratory bullets are: sputum/secretion/suctioning change; dyspnea,
  tachypnea, or new/worsening cough; rales/crackles or bronchial breath sounds;
  and worsening gas exchange. (`NHSN pneumonia.pdf`, Table 1, p. 6-6;
  Footnotes 3–7, pp. 6-12–6-14.)
- **Infant no more than 1 year old:** worsening gas exchange, **and** at least
  three separate bullets from temperature instability; leukopenia or
  leukocytosis with left shift; sputum/secretion/suctioning change; the grouped
  apnea/tachypnea/nasal-flaring alternatives; wheezing/rales/rhonchi; cough;
  and bradycardia or tachycardia. (`NHSN pneumonia.pdf`, Table 1, p. 6-6.)
- **Child older than 1 and no more than 12 years old:** at least three separate
  bullets from fever or hypothermia; leukopenia or leukocytosis; sputum/
  secretion/suctioning change; the grouped dyspnea/apnea/tachypnea/cough
  alternatives; rales or bronchial breath sounds; and worsening gas exchange.
  (`NHSN pneumonia.pdf`, Table 1, p. 6-6.)

The age-specific branches are alternatives; Chapter 6 states that infants,
children, and immunocompromised patients may also meet any other applicable
criterion. They must not be treated as mutually exclusive routing that prevents
evaluation of the any-patient paths. (`NHSN pneumonia.pdf`, General Comment 2,
p. 6-4.)

### 3.4 PNU2 — common bacterial or filamentous fungal pathway

This path requires the shared imaging expression, at least one systemic finding
from the PNU1 any-patient systemic group, at least one respiratory bullet from
the PNU1 any-patient respiratory group, and at least one of:

- eligible organism identified from blood;
- eligible organism identified from eligible pleural fluid;
- positive quantitative or corresponding semiquantitative culture from a
  minimally contaminated BAL, protected specimen brushing, or endotracheal
  aspirate;
- positive quantitative or corresponding semiquantitative lung-tissue culture;
- at least 5% BAL-obtained cells containing intracellular bacteria on direct
  microscopy; or
- qualifying histopathology (abscess/foci of consolidation with intense PMN
  accumulation, or fungal hyphae/pseudohyphae invading lung parenchyma).

(`NHSN pneumonia.pdf`, Table 2, p. 6-7; Footnotes 8, 9, and 12,
pp. 6-14–6-16.)

Table 5 supplies method-specific quantitative thresholds: lung tissue at least
10⁴ CFU/g; bronchoscopic BAL at least 10⁴ CFU/ml; bronchoscopic protected
specimen brushing at least 10³ CFU/ml; nonbronchoscopic BAL at least 10⁴ CFU/ml;
and endotracheal aspirate at least 10⁵ CFU/ml. It also supplies a fallback
mapping of moderate/heavy/many/numerous or 2+/3+/4+ growth when the laboratory
cannot supply a local quantitative correspondence. These must be modeled as
typed method, specimen, quantity, unit, and laboratory-mapping facts—not text
labels. (`NHSN pneumonia.pdf`, Table 5, p. 6-15.)

### 3.5 PNU2 — viral, Legionella, and other bacterial pathway

This second PNU2 path requires the same imaging, systemic, and respiratory
groups, plus at least one of:

- virus, Bordetella, Legionella, Chlamydia, or Mycoplasma identified from
  respiratory secretions or tissue by a clinically performed culture or
  non-culture method (not ASC/AST);
- fourfold IgG rise in paired sera for a pathogen;
- the specified Legionella pneumophila serogroup 1 paired-sera IFA result; or
- Legionella pneumophila serogroup 1 urine antigen by RIA or EIA.

(`NHSN pneumonia.pdf`, Table 3, p. 6-8.)

### 3.6 PNU3 — immunocompromised patient

PNU3 requires the shared imaging expression, a sourced immunocompromised host
definition, at least one clinical finding, and at least one laboratory path.
Its clinical alternatives include fever, qualifying altered mental status,
sputum/secretion/suctioning change, dyspnea/tachypnea/cough, rales/bronchial
breath sounds, worsening gas exchange, hemoptysis, or pleuritic chest pain.
Laboratory qualification is either matching Candida species from blood and an
eligible respiratory specimen collected within the same IWP; eligible fungal
evidence from a minimally contaminated LRT specimen; or any PNU2 laboratory
criterion. (`NHSN pneumonia.pdf`, Table 4, p. 6-9; Footnotes 10–12,
pp. 6-15–6-16.)

The host predicate is itself an OR expression over the exhaustive Footnote 10
list: qualifying neutropenia; specified leukemia/lymphoma/HIV with CD4
condition; splenectomy; solid-organ or hematopoietic stem-cell transplant;
cytotoxic chemotherapy; or qualifying daily enteral/parenteral steroid exposure
for more than 14 consecutive days on DOE (excluding inhaled/topical steroids).
It cannot safely be reduced to an unexplained `immunocompromised: true` input.

### 3.7 Cross-cutting specimen, organism, and symptom rules

- Purulent sputum is laboratory-defined. Footnotes 3 and its instruction table
  specify quantitative neutrophil and squamous-cell conditions, acceptable
  semiquantitative equivalents, neutrophil-only reports, laboratory-specific
  cutoffs, and a cytospin exception. (`NHSN pneumonia.pdf`, pp. 6-12–6-13.)
- Tachypnea has five sourced age/gestational-age rate branches; it is not a
  generic checkbox. (`NHSN pneumonia.pdf`, Footnote 5, p. 6-14.)
- A lower-respiratory specimen from a ventilated patient that was not obtained
  through an artificial airway is not minimally contaminated; sputum or
  tracheal secretions from a non-ventilated patient are not minimally
  contaminated. Pleural fluid is eligible only when obtained during
  thoracentesis or within 24 hours of chest-tube placement, not after tube
  repositioning or from a tube in place more than 24 hours.
  (`NHSN pneumonia.pdf`, General Comments 5–6 and Footnotes 8–9,
  pp. 6-4 and 6-14–6-15.)
- Normal/mixed/altered oral or respiratory flora wording is excluded, while an
  eligible organism separately identified in the same result is not discarded.
  Candida/unspecified yeast, coagulase-negative Staphylococcus, and Enterococcus
  are restricted to eligible lung tissue or pleural fluid, subject to the PNU3
  Candida exception. The named community-associated fungal and vector-borne
  organisms are excluded from all NHSN definitions.
  (`NHSN pneumonia.pdf`, General Comments 5–7, pp. 6-4–6-5.)

### 3.8 Reporting hierarchy, event-family separation, and secondary BSI

- Within one IWP or RIT, report only one subtype: PNU3 outranks PNU2, and PNU2
  outranks PNU1. Pathogens and secondary BSIs may be reported only for PNU2 and
  PNU3. (`NHSN pneumonia.pdf`, Reporting Instructions, p. 6-5.)
- Concurrent LUNG and PNEU is reported as PNEU, except that SSI-LUNG is reported
  alongside PNEU. This is a reporting-resolution rule, not permission for LUNG
  evidence to qualify PNEU. (`NHSN pneumonia.pdf`, Reporting Instructions,
  p. 6-5.)
- Ventilator association is a post-qualification classification requiring more
  than two consecutive calendar days of qualifying mechanical ventilation on
  DOE (placement day is day 1) and the ventilator present on DOE or the prior
  day. A full calendar-day break resets the count. Non-invasive positive
  pressure without an artificial airway is not a ventilator. In-plan reporting
  is restricted to pedVAP in pediatric inpatient locations; the PNEU definition
  remains available to support secondary-BSI review in ventilated and
  non-ventilated patients of any age. (`NHSN pneumonia.pdf`, Settings and
  Definitions, pp. 6-2–6-3.)
- Secondary BSI requires a complete PNU2/PNU3 event plus the Chapter 2/17 timing
  and organism relationship. Restricted blood organisms require matching
  eligible lung tissue or pleural fluid, except matching Candida in blood and
  the specified respiratory specimens can satisfy PNU3 when both collection
  dates are in the same IWP. (`NHSN pneumonia.pdf`, General Comment 6 and
  Footnotes 8, 11, 12, pp. 6-4 and 6-14–6-16; `NHSN HAI.pdf`, Chapter 2,
  SBAP and Pathogen Assignment, pp. 2-15–2-19; `Secondary BSI Chapter.pdf`,
  Secondary BSI and Matching Organisms, pp. 17-1–17-3.)

## 4. Current implementation and discrepancies

No PNEU definition, event-family registry entry, evaluator, or test exists. The
only respiratory registry item is Chapter 17 `LRI-LUNG`, correctly named
“Lower Respiratory System Infection, Other Than Pneumonia.” PNEU must not be
inserted as another Chapter 17 site or inferred from LUNG.

| Required PNEU capability | Current architecture | Discrepancy |
| --- | --- | --- |
| Recursive AND/OR and branch-local counts | Criteria have flat `allOf`; groups have a shallow `anyOf` and count | Cannot express all PNU branch trees, nested bullet alternatives, or hierarchy without duplicating/incorrectly mixing evidence. |
| Age and gestational applicability | One special `patientAge === "infant"` check; some age facts are manual booleans | Cannot enforce exact inclusive boundaries, the overlapping any-patient route, five tachypnea branches, or gestational-age condition. |
| Dated IWP/DOE/RIT/SBAP | No dates or event timeline | Cannot derive the seven-day window, first eligible diagnostic test, DOE, HAI/POA, 14-day major-type RIT, transfer rule, or SBAP. |
| Distinct serial imaging | Boolean evidence map only | Cannot count distinct studies, establish order/persistence/progression, distinguish one available image, or allow the second persistence image outside IWP but within seven days. |
| Conditional/equivocal imaging | Atomic exclusion IDs only | Cannot implement underlying-disease and POA context, alternate descriptors, subsequent clarification, or clinical correlation. |
| Typed clinical measurements | Labels plus yes/no/unknown | Cannot enforce temperatures, WBC, bands, oxygenation, pulse oximetry, heart rate, respiratory rates, age units, or threshold boundaries. |
| Typed specimens and microbiology | No record linkage, method, specimen, collection technique, quantity, or unit | Cannot enforce minimally contaminated specimens, chest-tube timing, Table 5 thresholds, paired sera, ASC/AST exclusion, histopathology, or organism/specimen matching. |
| Organism predicates | Generic application lookup is separate from site evaluator | Cannot enforce flora-result handling, taxonomic exclusions/restrictions, PNU3 Candida matching, mixed eligible/excluded findings, or pathogen reporting. |
| Sourced host definition | No host expression | Cannot calculate Footnote 10 or its DOE-relative steroid duration. |
| Subtype hierarchy and event family | Registry is Chapter 17 site-centric; evaluator returns first matching criterion | Cannot resolve PNU3 > PNU2 > PNU1, major-type RIT, PNEU/LUNG/SSI-LUNG resolution, or keep VAP separate from VAE/PedVAE. |
| Secondary BSI | Two caller-supplied yes/no fields after site qualification | Cannot evaluate matching, blood-as-criterion cases, restricted organisms, specimen dates, SBAP, same-IWP Candida exception, or additional-pathogen assignment. |
| Source traceability | Existing atoms have source objects | Useful primitive, but PNEU needs source metadata on expression nodes, thresholds, predicates, temporal policies, and reporting resolution—not only labels. |

### Unsupported or unsafe reuse

1. Treating organism-associated site suggestions as PNEU evidence remains
   unsupported.
2. The current evaluator's global evidence IDs and first-matching-criterion
   behavior would permit cross-branch mixing and would implement the wrong
   subtype precedence unless redesigned.
3. Encoding numeric, specimen, imaging, or organism constraints in labels would
   display rules without enforcing them.
4. A generic ventilator checkbox would conflate VAP association/reporting with
   PNEU qualification and risks confusion with the separately governed VAE and
   PedVAE event families.
5. The checklist alone is insufficient for implementation because it points
   back to the Chapter 6 footnotes; omitting those footnotes would materially
   change imaging, symptom, specimen, organism, and laboratory qualification.

## 5. Smallest safe architecture direction (proposal only)

Do not add PNEU to `secondary/registry.js`. Introduce an event-protocol boundary
that can host PNEU independently of Chapter 17 sites while consuming shared,
sourced primitives:

```text
surveillance/
  expression.js        # recursive allOf/anyOf/atLeast/evidence/condition
  facts.js             # dated typed measurements, specimens, results, studies
  timeline.js          # IWP, DOE, POA/HAI, RIT, SBAP, transfer calculations
  source.js            # source metadata validation
  protocols/pneu/
    sources.js         # Chapter 6, Chapter 2, Chapter 17, checklist mappings
    imaging.js         # image eligibility and persistence
    clinical.js        # PNU1/PNU2/PNU3 clinical expressions
    microbiology.js    # specimen, threshold, method, organism expressions
    host.js            # Footnote 10 expression
    attribution.js     # PNEU-specific secondary-BSI conditions
    reporting.js       # subtype hierarchy, LUNG resolution, VAP association
    index.js
```

Each fact must carry a record identity and date; every executable node must
carry its exact document, criterion/table/footnote or section, printed page,
PDF page, and stable source ID. Evaluation should return a tri-state result plus
the exact qualifying records, rejected records and reasons, chosen IWP/DOE,
matched branch, and source trace. PNEU should remain non-qualifying until its
source-derived test matrix passes and the integration is separately approved.

## 6. Source-derived test obligations for a future implementation

- One minimal positive and one-missing-element negative for every PNU1 age
  route, both PNU2 laboratory tables, PNU3's native laboratory routes, and PNU3
  using every PNU2 laboratory alternative.
- Exact age, temperature, WBC, band, heart-rate, respiratory-rate, oxygenation,
  Table 5, cell-percentage, chest-tube-hour, ventilation-day, IWP, seven-day
  persistence, 14-day RIT, steroid-duration, and CD4/ANC boundaries, including
  one unit on either side.
- One-image POA cases with and without underlying disease; one-image HAI cases;
  two-image persistence/progression; rapid resolution; same-study duplication;
  second image inside/outside IWP and on/after the seven-day boundary;
  equivocal-later-definitive, equivocal-later-negative, and clinical-correlation
  cases.
- Every purulent-secretion reporting format; every minimally contaminated and
  ineligible specimen route; locally mapped and fallback semiquantitative
  results; paired-sera and Legionella alternatives; clinical versus ASC/AST
  methods.
- Each excluded flora wording and organism group, an eligible organism alongside
  flora, eligible/ineligible lung tissue and pleural fluid, mixed organisms, the
  PNU3 Candida exception, and every named community-associated exclusion.
- Cross-branch mixing negatives, the PNU3/PNU2/PNU1 precedence permutations,
  major-type PNEU RIT, concurrent LUNG and SSI-LUNG reporting, and proofs that
  PNEU neither implies nor is implied by LUNG, VAE, or PedVAE.
- Secondary-BSI positives and negatives for site completeness, matching,
  blood-as-criterion, SBAP endpoints, same-IWP Candida dates, restricted blood
  organisms, and additional pathogens during RIT/SBAP.
- Regression coverage proving no changes to existing LCBI, central-line,
  MBI-LCBI, organism lookup, or Chapter 17 site results.

## 7. Audit conclusion and approval gate

The source blocker reported by the earlier audit is resolved: the repository
now contains the January 2026 Chapter 6, Chapter 2, and PNEU checklist. The
current application, however, has **no PNEU implementation**, and its flat,
site-centric secondary-BSI evaluator cannot faithfully enforce the sourced
PNEU definition. The missing capabilities are structural rather than a short
list of new checkboxes.

No application logic was changed during this audit. Before implementation,
approve an event-protocol boundary and the typed recursive/timeline primitives.
Then implement and review one criterion group at a time in this order: shared
imaging and timing, PNU1, the two PNU2 paths, PNU3/host status, organism and
specimen restrictions, secondary-BSI attribution, and reporting resolution.
