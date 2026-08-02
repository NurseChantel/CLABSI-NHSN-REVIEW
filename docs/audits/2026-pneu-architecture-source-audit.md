# 2026 NHSN PNEU architecture and source-mapping audit

**Status:** blocked at source audit; architecture proposal only  
**PNEU implementation status:** not implemented, not validated  
**Behavioral impact:** none

## 1. Scope and audit outcome

This audit was requested before any PNEU qualification logic is added. It does not
encode a pneumonia criterion, add PNEU to the registry, or change an evaluator.
It also deliberately does not infer pneumonia rules from clinical knowledge,
existing application behavior, or a non-repository source.

The repository does **not** contain the required 2026 PNEU source set:

| Required source | Repository result | Consequence |
| --- | --- | --- |
| Chapter 6 — Pneumonia (PNEU) Event | Not present as a standalone file and not contained in the file named `clabsi nhsn.pdf` | PNEU criteria, branches, imaging, clinical, laboratory, microbiology, host, ventilation, and reporting rules cannot be mapped. |
| Chapter 2 — Identifying Healthcare-associated Infections | Not present | Date of event, infection window period, and general RIT rules cannot be mapped for PNEU. |
| Approved 2026 PNEU checklist | Not present | No checklist was available to compare with the protocol. |
| Chapter 17 — Secondary BSI attribution | `Secondary BSI Chapter.pdf` is present | Only the general secondary-BSI source is available; it cannot supply the missing PNEU definition. |
| `clabsi nhsn.pdf` | Present; it is a 46-PDF-page Chapter 4 Bloodstream Infection Event document, not the complete Patient Safety Component Manual | It is not authority for Chapter 2 or Chapter 6 PNEU criteria. |

The embedded metadata and contents of `clabsi nhsn.pdf` identify it as
“Bloodstream Infections,” and the repository's own source mapping identifies its
relevant content as Chapter 4. Its filename therefore must not be treated as
proof that it contains the complete manual.

**Audit decision:** no complete, source-supported list of PNEU branches can be
produced from the approved files currently in the repository. The requested
criterion extraction is unresolved until the approved 2026 Chapter 6 and Chapter
2 files (and, if authorized, the 2026 checklist) are added. This is the safe
outcome required by `AGENTS.md`; filling the gaps from remembered or general
pneumonia rules would invent surveillance logic.

## 2. Exact sources and pages reviewed

### Available authoritative material

- `Secondary BSI Chapter.pdf`, Chapter 17, printed pages **17-1 through 17-3**
  (PDF pages **2 through 4**), sections addressing secondary bloodstream
  infection and matching organisms. These pages establish the general
  attribution interface already represented by the application. They do not
  define PNEU qualification.
- `clabsi nhsn.pdf`, document inventory and Chapter 4 identity; the file has 46
  PDF pages. Existing source metadata points to printed pages **4-30 through
  4-31** (PDF pages **31 through 32**) for the NEC-specific Secondary BSI Guide
  exception. Those pages are not a PNEU source and were not used to derive a
  PNEU rule.

### Required material not reviewable

There are no repository pages to cite for 2026 Chapter 6, Chapter 2, or a PNEU
checklist. Page-level PNEU source mapping is therefore pending, not silently
substituted with Chapter 17 or Chapter 4.

## 3. Requested PNEU source audit: unresolved mapping ledger

No PNEU qualification branch was identified from an authoritative PNEU source,
because no such source is present. This is the complete list of requested topics
and their audit disposition; it is **not** a list of clinical rules.

| Topic | Result | Source needed to resolve it |
| --- | --- | --- |
| Every PNEU criterion and branch | Unresolved; zero branches authorized for encoding | 2026 Chapter 6 criterion tables and footnotes |
| All age-specific branches | Unresolved | 2026 Chapter 6 age divisions and definitions |
| Imaging requirements | Unresolved | Chapter 6 imaging criteria and footnotes |
| One versus multiple imaging studies | Unresolved | Chapter 6 imaging instructions |
| Signs and symptoms by age | Unresolved | Chapter 6 criterion tables |
| Laboratory and microbiology alternatives | Unresolved | Chapter 6 criterion tables and notes |
| Eligible lower-respiratory specimens | Unresolved | Chapter 6 specimen tables/definitions |
| Quantitative and semiquantitative thresholds | Unresolved | Chapter 6 threshold tables and footnotes |
| Excluded organisms and specimen results | Unresolved | Chapter 6 exclusions and footnotes |
| Immunocompromised-patient criteria | Unresolved | Chapter 6 host definition and applicable branch |
| Viral, bacterial, fungal, and parasitic pathways | Unresolved | Chapter 6 branch definitions |
| Ventilator-related reporting context | Unresolved | Chapter 6 reporting instructions and any explicitly cross-referenced protocol |
| Date of event and infection window | Unresolved | 2026 Chapters 2 and 6 |
| Repeat Infection Timeframe | Unresolved | 2026 Chapter 2 plus any Chapter 6 exception |
| Secondary BSI attribution and exceptions | General Chapter 17 interface is present; PNEU-specific relationships/exceptions remain unresolved | 2026 Chapter 6 plus its explicit Chapter 17 cross-references |
| Pathogen-specific restrictions | Unresolved | Chapter 6 organism rules and footnotes |
| Qualification-affecting reporting instructions | Unresolved | Chapter 6 reporting instructions |

### Separation constraints to preserve

When sources become available, PNEU must receive its own event-family namespace
and must not reuse a positive result from `LRI-LUNG`, VAE, PedVAE, a
noninfectious pulmonary condition, community-onset labeling, or an unsupported
provider diagnosis. No mapping between those concepts is authorized by the
current source inventory.

## 4. Current pathway architecture inspected

The refactored secondary-site pathway has these useful primitives:

- a registry entry containing source metadata, implementation status, criteria,
  exclusions, notes, reporting instructions, and secondary-BSI requirements;
- top-level alternative criteria (`logic: "anyOf"` with one successful criterion);
- required atomic evidence in `criterion.allOf`;
- one or more `groups`, each with `anyOf` and `minimumRequiredCount`;
- a limited nested choice: a group entry may itself contain one `anyOf` array;
- tri-state evidence (`met`, `notMet`, or unknown by absence);
- atomic `exclusionId` relationships and definition-level hard exclusions;
- a single infant-only applicability check (`patientAgeApplicability ===
  "infant"` and `patientAge === "infant"`);
- a post-qualification secondary-BSI gate with two caller-supplied yes/no
  answers: organism relationship and attribution timing;
- source objects that carry document, chapter, printed page, PDF page, section
  heading, and a stable source-data identifier.

These primitives are enough for simple alternatives and counted symptom groups,
but labels currently carry much of the semantic burden. The evaluator does not
validate dates, measurements, specimen types, organisms, host state, or event
family.

## 5. Schema-gap analysis

| Requirement to assess | Current support | Precise gap / smallest reusable extension (proposal only) | Potential reuse |
| --- | --- | --- | --- |
| Age-dependent criteria | **Partial** | Replace the special infant equality check with a typed applicability predicate over age value/unit and explicit inclusive boundaries. Keep each branch's source. | NEC, pediatric Chapter 17 branches, future device-event protocols |
| Multiple required imaging findings | **Partial** | Counts can represent multiple checked atoms, but cannot establish that findings belong to eligible distinct studies. Add typed `studyEvidence` plus a distinct-study count constraint. | Any pathway requiring repeated imaging or distinct diagnostic collections |
| Progressive or persistent imaging | **No** | Add a reusable temporal comparison predicate over ordered studies (`persistent`, `progressive`, eligible interval if sourced). | Longitudinal imaging/laboratory definitions |
| Imaging conditional on underlying disease | **No** | Add `when`/`unless` predicates to a branch or group, evaluated from typed patient context. | Host-, device-, and history-conditioned pathways |
| Nested `allOf`/`anyOf` | **Partial** | Replace fixed criterion/group shapes with a recursive expression node: `allOf`, `anyOf`, `atLeast`, `evidence`, and `condition`. Preserve stable IDs and source on every node. | Simplifies complex ENDO-style and future site definitions |
| Minimum counts across groups | **Partial** | Existing count works only within a single `group.anyOf` and shallow nested entries. A recursive `atLeast: { count, of, distinctBy? }` is the smallest general form. | Distinct clinical elements, cultures, imaging studies |
| Quantitative microbiology | **No** | Add typed measurement comparison (`value`, `unit`, comparator, threshold) and an explicit semiquantitative category matcher. Never encode thresholds in labels alone. | Urine, tissue, and other quantitative culture protocols |
| Specimen-type restrictions | **No** | Add a canonical specimen fact and allow-list/deny-list predicates, with collection method/site when the source distinguishes them. | All culture-based site definitions |
| Organism exclusions | **Partial** | Boolean exclusions exist, but there is no organism taxonomy predicate tied to a result. Add organism/result predicates using stable organism IDs and explicit excluded-result reasons. | Chapter 17 sites and LCBI interfaces |
| Immunocompromised-host branches | **No** | Add a sourced host-status definition evaluated from its own recursive expression and referenced by branch conditions; do not accept an unexplained boolean. | MBI-related and other host-specific protocols without coupling their evaluators |
| Conditional secondary-BSI attribution | **No** | Replace the two opaque yes/no inputs, for pathways that need it, with a sourced attribution expression over qualifying site result, blood result, organism relationship, specimen relationship, and dates. Retain a locked gate. | All secondary-BSI pathways and exceptions |
| Special pathogen rules | **No** | Add reusable organism/result predicates and pathogen-specific conditional branches; keep each restriction source-local. | ENDO and other pathogen-specific definitions |
| Repeat infection timing | **No** | Add an event timeline model and sourced interval/boundary policy returning eligibility and the controlling prior event. | All HAI event families |
| Ventilator status without VAE confusion | **No** | Add neutral device-exposure context (`mechanicalVentilation` facts) and a separate `eventFamily` discriminator. Ventilator status must not invoke or imply a VAE/PedVAE result. | PNEU reporting context and device-associated metrics |
| Date of event / infection window | **No** | Add dated evidence, a rule for selecting the DOE-defining element, and an explicit inclusive window policy. | All HAI event families |
| PNEU/LRI/VAE separation | **No PNEU model** | Add immutable `eventFamily` and `siteCode` identities and prohibit cross-family qualification evidence unless a source explicitly defines a relationship. | Every protocol sharing an anatomic system |

### Why the schema must not be patched yet

The missing protocol determines which of these general capabilities PNEU
actually needs and their exact boundary semantics. Implementing a guessed
extension before source mapping risks designing around remembered criteria.
Approval should follow a page-cited audit based on the added source files.

## 6. Proposed minimal modular architecture

After the sources are supplied and the schema extensions are separately
approved, use a PNEU-specific directory rather than adding PNEU to Chapter 17's
flat files prematurely:

```text
secondary/definitions/pneu/
  index.js             # definition assembly; remains non-validated until audited tests pass
  applicability.js     # sourced age and host applicability expressions
  imaging.js           # imaging expressions and study-count/temporal policies
  clinical.js          # sourced signs/symptoms by applicable branch
  microbiology.js      # result, specimen, threshold, organism, and exclusion expressions
  attribution.js       # only PNEU-specific Secondary BSI relationships/exceptions
  timing.js            # DOE, infection-window, and RIT policies/references
  reporting.js         # qualification-affecting reporting context and family separation
  sources.js           # Chapter 6/2/17 page-level metadata only
```

A more general location outside `secondary/` may ultimately be preferable
because PNEU is an event protocol rather than a Chapter 17 LRI-LUNG definition.
That repository-level placement decision should be made after inspecting how the
application will expose non-Chapter-17 event families. In either placement:

1. keep `PNEU` distinct from the existing `LRI` major category and `LUNG` site;
2. keep VAE and PedVAE as distinct event families;
3. export no registry entry until the source audit establishes the correct
   integration boundary;
4. initially set `implementationStatus` to a non-qualifying value such as
   `sourceMapped` (only after that status is formally supported), never
   `validated`;
5. attach page-level source metadata to every expression and policy.

## 7. Proposed test matrix (design only)

Exact case values and expectations must be filled from cited Chapter 6/2/17
language. No test below authorizes a clinical threshold or age boundary.

| Area | Planned cases |
| --- | --- |
| Source metadata | Every node has document, chapter, printed/PDF page, heading/table/criterion, and stable ID; reject missing or non-2026 sources. |
| Each age group | Positive, negative, boundary-on-each-side, missing age, and wrong-unit cases for every source-defined age branch. |
| Each criterion branch | One minimal positive; each required element absent in turn; every alternative positive; cross-branch mixing negative. |
| Imaging | Required study count, same-study duplication negative, distinct-study boundary, persistent/progressive positive and negative, underlying-condition conditional paths, missing dates. |
| Clinical findings | Minimum-minus-one, exact minimum, alternative findings, wrong-age finding, undocumented finding. |
| Microbiology | Each eligible method/specimen/result path; threshold below/at/above boundary; unit conversion if authorized; semiquantitative categories; ineligible method. |
| Organisms/results | Each exclusion; mixed eligible/excluded results; no identification; each source-defined special pathogen restriction. |
| Host status | Each immunocompromised definition path, one missing element at a time, non-immunocompromised branch separation, unknown status. |
| Ventilation | Otherwise identical ventilated/non-ventilated PNEU cases; status affects only source-authorized context; neither case creates VAE/PedVAE qualification. |
| Event-family separation | PNEU evidence cannot satisfy LRI-LUNG; LRI-LUNG evidence cannot satisfy PNEU; PNEU does not imply VAE/PedVAE; provider diagnosis and community/noninfectious labels do not substitute for criteria. |
| DOE/window | Earliest/latest inclusive boundaries, one day outside, evidence without dates, DOE element selection, admission-context boundaries exactly as sourced. |
| RIT | First event, same-type event within RIT, exact last day, first day after, different event family, unresolved prior event. |
| Secondary BSI | Complete site plus matching relationship and timing; mismatch; timing outside; incomplete site; each PNEU exception; mixed organisms; blood used/not used as a criterion if source permits. |
| Reporting instructions | Each instruction that changes qualification or event assignment, plus a case proving descriptive instructions do not alter qualification. |
| Incomplete/excluded | Unknown required fact, explicit negative fact, excluded specimen, excluded organism, contradictory facts, no evidence. |
| Regression | Snapshot/current tests prove no existing Chapter 17 pathway result, LCBI/central-line/MBI result, or organism lookup changes. |

## 8. Discrepancy report and next approval gate

### Unsupported or missing

- The entire 2026 Chapter 6 PNEU definition and all requested subrules are absent.
- Chapter 2 timing foundations are absent.
- No authorized PNEU checklist is present.
- The evaluator has no typed dates, measurements, specimens, organisms,
  longitudinal studies, host definition, or event-family discriminator.
- Existing secondary-BSI inputs are manually asserted booleans rather than an
  evaluable conditional relationship.

### Simplified or incorrectly combinable if reused unchanged

- `patientAgeApplicability` supports only one special infant token, not arbitrary
  sourced age branches.
- `groups` provide shallow counted alternatives, not general nested logic or
  distinct-record counting.
- A label can describe a threshold or specimen restriction, but the evaluator
  cannot enforce it.
- Global evidence IDs could accidentally allow cross-branch or cross-event reuse
  unless event family and record linkage are made explicit.
- A generic ventilator boolean without an event-family boundary could wrongly
  conflate PNEU reporting context with VAE/PedVAE.

### Required next step

Add the approved 2026 Chapter 6 and Chapter 2 PDFs (and explicitly authorize any
checklist). Then repeat this audit with exact page/table/criterion citations and
a complete branch tree. Only after review and approval should a minimal schema
extension or PNEU definition be implemented.
