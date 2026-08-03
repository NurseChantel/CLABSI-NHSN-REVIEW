# Reusable event-protocol architecture

This directory provides source-aware, validated primitives for event protocols
that cannot be represented safely by the existing flat Chapter 17 secondary-site
evaluator. It is intentionally separate: `secondary/evaluator.js` and every
existing Chapter 17 definition retain their current API and behavior.

## Source justification

The module boundaries implement the architecture approved by the completed
2026 PNEU audit in `docs/audits/2026-pneu-architecture-source-audit.md`:

- `expressions.js` — recursive AND, OR, minimum-count, conditional, evidence,
  and predicate expressions with sourced failure messages;
- `timeline.js` — exact calendar dates, inclusive windows, IWP construction,
  DOE candidate selection, and RIT construction;
- `patient-context.js` — typed age, sourced host status, and dated invasive
  ventilator periods;
- `measurements.js` — typed measurements and explicit-unit comparisons;
- `imaging.js` — dated studies, definitive/equivocal interpretation, eligible
  findings, and distinct-study persistence/progression relationships;
- `microbiology.js` — dated specimen/test/organism records, specimen
  restrictions, quantitative and semiquantitative thresholds, and organism
  inclusion/exclusion predicates;
- `attribution.js` — evaluable site qualification, organism relationship, and
  inclusive Secondary BSI attribution timing;
- `evaluator.js` — validated event-family/site boundaries, ordered subtype
  hierarchy, and a stable event-result shape.

The controlling repository sources are `NHSN pneumonia.pdf` (Chapter 6,
printed pages 6-2–6-16), `NHSN HAI.pdf` (Chapter 2, printed pages 2-3–2-19),
`NHSN pneumonia checklist.pdf` (PDF pages 1–10), and
`Secondary BSI Chapter.pdf` (printed pages 17-1–17-3).

## Deliberately deferred

There is no PNEU registry entry or PNU1, PNU2, PNU3, VAP, VAE, PedVAE, or LUNG
qualification definition in this directory. The architecture accepts sourced
protocol definitions but does not infer a clinical rule. PNEU-specific
expressions, exact host-reason calculations, imaging eligibility policies,
organism taxonomies, specimen rules, subtype reporting, and attribution
exceptions remain deferred for criterion-by-criterion implementation and
manual-derived tests.
