# CLABSI / NHSN Review — codebase map

A static, dependency-free web application (ES modules, no build step) that walks an
infection preventionist through an NHSN bloodstream-infection review: primary LCBI
determination, and — the bulk of the code — the **secondary BSI** site definitions
that must be excluded before a BSI can be called primary.

Tests run with the Node built-in runner: `node --test`.

---

## 1. Authoritative sources and which code they govern

The repository ships the NHSN manual PDFs. **Every** surveillance rule in this codebase
must trace to one of them (see `AGENTS.md`). The split matters, because two different
chapters define two different families of events:

| Source PDF | NHSN chapter | Governs | Cited in code as |
|---|---|---|---|
| `Secondary BSI Chapter.pdf` | Ch. 17 — Surveillance Definitions for Specific Types of Infections | All 35 site-specific definitions (BONE…USI) | printed pages `17-1` … `17-35` |
| `NHSN pneumonia.pdf` | Ch. 6 — Device-associated Module, PNEU | PNU1 / PNU2 / PNU3 | printed pages `6-3` … `6-16` |
| `NHSN pneumonia checklist.pdf` | PNEU worksheets | Cross-check for the PNEU renderers | "PDF pages 2–10" |
| `NHSN HAI.pdf` | Ch. 2 — Identifying HAIs | Infection Window Period, RIT, secondary BSI attribution period | printed pages `2-3` … `2-19` |
| `clabsi nhsn.pdf` | Ch. 4 — BSI Event | LCBI/MBI-LCBI, and the **NEC** secondary-BSI exception | printed pages `4-30` … `4-31` |

**Pneumonia has its own chapter and never draws on Chapter 17.** Two consequences that
are easy to get wrong:

- PNEU is *not* a Chapter 17 site. It is registered separately in the UI as its own
  review family (`state.reviewFamily === "pneu"`), not as a `secondarySiteDefinitions`
  entry.
- Chapter 17 **LRI-LUNG** ("Other infection of the lower respiratory tract and pleural
  cavity", 17-22) is a *different event* from PNEU. Its reporting instruction: if a
  patient meets LUNG and PNEU, report PNEU only — unless the LUNG is an organ/space SSI,
  in which case report both. LUNG evidence is never PNEU evidence and vice versa.
- **NEC** is the one Chapter 17 site whose criteria live elsewhere: 17-22 defers to
  Chapter 4, so `secondary/definitions/nec.js` cites `clabsi nhsn.pdf` pages 4-30–4-31.

---

## 2. Repository layout

```
index.html                     Single page; static markup + section shells
style.css                      All styling (no framework)
app.js                         Controller: state, DOM wiring, organism lookup, rendering
organism-search.js             Synonym-aware organism lookup
organisms.json                 NHSN/CDC organism + synonym dataset
synonym_lookup.json            normalized term -> organism record(s)
nhsn-organisms.json            Full NHSN terminology export
nhsn-organism-dataset-bundle/  Generator script + README for the organism dataset

secondary/                     CHAPTER 17 — secondary BSI site definitions
  source.js                      Citation factory + one exported citation per site
  registry.js                    Category tree, placeholder generation, exports
  evaluator.js                   Generic criterion evaluator (pure, no DOM)
  definitions/*.js               One file per site code (bone.js, disc.js, …)

secondary-rules.js             Re-export barrel (legacy import path)
secondary-site-definitions.js  Re-export barrel (legacy import path)
secondary-evidence-ui.js       Renders a definition into checkbox HTML + progress text

protocol/                      CHAPTER 6 — PNEU event protocol
  index.js                       Barrel
  validation.js                  ok/error result type, ISO date validation
  patient-context.js             DOB, age-at-event, host status, ventilator periods
  timeline.js                    Infection window, RIT, calendar windows
  measurements.js                Typed measurement compare (value + unit + comparator)
  imaging.js                     Imaging study / relationship validation
  microbiology.js                Organism predicate + specimen validation
  expressions.js                 Boolean expression helpers
  attribution.js                 Secondary BSI attribution helpers
  evaluator.js                   Shared protocol evaluation scaffolding
  pnu1.js / pnu2.js / pnu3.js    The three PNEU algorithms (Tables 1–4)
  pnu1-renderer.js / …           Result -> HTML summary
  pneu-ui.js                     PNEU form state, rendering, and event handling

docs/audits/                   Dated discrepancy reports (manual vs implementation)
*.test.js                      One suite per site + protocol + UI concern
```

---

## 3. Secondary BSI: the definition schema

Every file in `secondary/definitions/` exports one frozen object. This is the contract
`secondary/evaluator.js` and `secondary-evidence-ui.js` both rely on.

```js
{
  majorCategoryCode, majorCategoryName,   // e.g. "BJ", "Bone and Joint Infection"
  siteCode, siteName,                     // e.g. "BONE", "Osteomyelitis"
  source,                                 // citation object (see source.js)
  implementationStatus: "validated",      // anything else => site cannot qualify
  patientAgeApplicability?: "infant",     // gates the whole definition

  criteria: [ Criterion, … ],             // OR-ed: any one met => definition met
  exclusions: [ Item, … ],
  hardExclusionIds?: [ id, … ],
  reportingInstructions?: [ { id, text, source } ],
  notes?: [ { id, text, source } ],
  secondaryBsi?: { lockedUntilSiteDefinitionMet, source, requirements: [ … ] }
}
```

### Criterion / branch shape

```js
Criterion = {
  id, label, source,
  allOf:  [ Item, … ],          // every item must be met
  groups: [ Group, … ],         // every group must be satisfied
  alternatives?: [ Branch, … ]  // AND at least one alternative branch met
}

Group = {
  id, label,
  minimumRequiredCount: n,
  anyOf: [ Item | SubGroup, … ] // SubGroup = { label, anyOf: [Item, …] }
}

Item = { id, label, source, exclusionId? }
```

### Evaluator semantics (`secondary/evaluator.js`)

- Evidence is a flat map `{ [itemId]: "met" | "notMet" | undefined }`.
- `atomMet` — item answered `met` **and** its `exclusionId` (if any) is not `met`.
  This models the manual's `*` footnote ("with no other recognized cause").
- `groupMet` — counts **entries**, not leaf items. A `SubGroup` counts **once** no
  matter how many of its members are met. This is how the manual's
  "only one condition within each element can be used" rules (MEN 2/3 group i,
  ENDO 5/6/7, PJI 3) are represented. Getting this wrong is the single most common
  source of over- or under-counting.
- `criterionMet` — `allOf` ∧ all `groups` ∧ (no alternatives ∨ some alternative met).
- Hard exclusions (`disqualifiesSite` / `blocksPathway` / `hardExclusionIds`) short-circuit
  the whole site before any criterion is tried.
- Returns a status from `secondaryEvaluationStatuses` plus, when nothing is met, a
  per-criterion `missing` list used to tell the user what is still outstanding.

Site definition met ≠ secondary BSI. Attribution additionally requires
`organismRelationship === "yes"` and `attributionTiming === "yes"`.

### Registry

`secondary/registry.js` builds a **placeholder** entry for every Chapter 17 site from
`categoryData` (code, name, printed page), then overwrites the implemented ones with the
real definitions. `implementedSecondaryPathways` lists which sites may qualify;
placeholders return `siteNotValidated` and carry `placeholderWarning`.

---

## 4. PNEU: the protocol architecture

PNEU does not use the Chapter 17 schema. It is a set of pure evaluator functions over a
structured input record, because the algorithm depends on dates, ages, units, and
quantitative thresholds rather than yes/no checkboxes alone.

Input shape (shared by all three algorithms):

```js
{
  patientContext: { dateOfBirth, gestationalAgeWeeksAtBirth?, hostStatus, ventilator },
  admissionDate, underlyingPulmonaryOrCardiacDisease, soleAvailableImage,
  imagingStudies: [ { id, date, modality, findings[], interpretation, … } ],
  imagingRelationships: [ { fromStudyId, toStudyId, type } ],
  measurements:  [ { id, kind, value, unit, date } ],   // temperature, wbc, bands, …
  clinicalFindings: [ { id, kind, date } ],
  // PNU2/PNU3 add:
  microbiologyResults[], histopathologyResults[], bloodResults[], hostEvidence[]
}
```

Each `evaluatePnuX(input)` returns `{ ok, value }` or `{ ok: false, errors }`, where
`value` carries `met`, `dateOfEvent`, `infectionWindow`, `repeatInfectionTimeframe`,
`secondaryBsiAttributionPeriod`, the per-domain sub-results
(`imaging`, `clinical`, `laboratoryEvidence`, `hostEligibility`), `remainingRequirements`,
and `secondaryBsi`.

Key shared rules, all in `pnu1.js` and reused by PNU2/PNU3:

- `evaluatePnuImaging` — two serial studies within 7 days showing persistence or
  progression, or the single-definitive-study exception when the patient has no
  underlying pulmonary/cardiac disease (footnote 1). Equivocal studies resolve via a
  later clarifying definitive study or documented clinical correlation (footnote 13).
- `pnuTachypneaThreshold` — the age-banded respiration rates of footnote 5.
- The evaluator iterates every imaging study as a candidate "first study", builds the
  infection window from it, and keeps the best attempt — so the user is told what is
  missing for the closest pathway rather than an arbitrary one.

`protocol/pneu-ui.js` owns PNEU form state (`createPneuState`), renders the criteria,
and translates DOM events back into the input record. `app.js` only mounts it.

---

## 5. Application wiring (`app.js`)

- One module-level `state` object; every interaction mutates it and re-renders the
  affected section. No framework, no virtual DOM.
- `state.reviewFamily` selects either a Chapter 17 major category (`BJ`, `CNS`, …) or
  `"pneu"`.
- Organism entry is synonym-normalized through `organism-search.js`; a matched organism
  yields *suggested* sites via `suggestionCategoryMap`. Per `AGENTS.md`, a suggestion is
  a chart-review starting point only and is never evidence that a site definition is met.
- `secondary-evidence-ui.js` renders any validated definition generically, so a new site
  needs no UI code — only a definition file plus a registry entry.

---

## 6. Test conventions

- One suite per site: `<site>-secondary-rules.test.js`. Each asserts the criteria
  structure, positive/negative/boundary evidence combinations, exclusion behaviour, and
  that the citation metadata points at the right printed page.
- Protocol suites: `pnu1-protocol.test.js`, `pnu2-protocol.test.js`,
  `pnu3-protocol.test.js`, `protocol-architecture.test.js`.
- UI suites: `secondary-evidence-ui.test.js`, `pneu-ui-integration.test.js`,
  `layout.test.js`, `bj-shared-evidence-ui.test.js` — these parse `index.html` /
  `style.css` as text and assert structural invariants.
- Tests are the regression contract for manual fidelity: a test that merely restates the
  current implementation is worthless. Each assertion should be derivable from a quoted
  line of the manual, and the suite should name the printed page it came from.

Run everything:

```bash
node --test
```
