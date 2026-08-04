# PNEU category-navigation discrepancy report

**Audit date:** 2026-08-04  
**Scope:** navigation presentation only; no surveillance criterion, evaluator,
or attribution logic changed

## Sources and implementation reviewed

The previously completed PNEU integration audit reviewed `NHSN pneumonia.pdf`,
Chapter 6, Reporting Instructions (printed page 6-5) and Tables 1–3 (printed
pages 6-6–6-8), plus `NHSN HAI.pdf`, Chapter 2 (printed pages 2-3–2-19).
This follow-up also inspected the live category navigation in `index.html`, the
navigation state handling in `app.js`, and the PNEU isolation regression in
`pneu-ui-integration.test.js`.

## Discrepancy

PNEU was presented in a separate “review family” row while the Chapter 17
categories appeared in a second row. That presentation did not match the
requested Secondary BSI workflow, in which Pneumonia Event should be available
in the same category chooser as the other potential secondary BSI sources. The
heading also described the controls as review families rather than “Secondary
BSI categories.”

## Safe implementation boundary

The navigation can present PNEU beside the Chapter 17 category buttons without
placing PNEU in the Chapter 17 definition registry or sharing LRI-LUNG evidence.
Selecting a Chapter 17 category continues to use the existing site-code flow;
selecting PNEU continues to use its independent Chapter 6 state, evaluator, and
subtype controls. No unsupported, missing, simplified, or combined surveillance
criterion was identified or introduced by this presentation-only change.
