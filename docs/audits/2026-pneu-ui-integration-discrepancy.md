# PNEU UI integration discrepancy report

**Audit date:** 2026-08-03  
**Scope:** integration only; no surveillance criteria were changed

## Sources reviewed

The UI boundary was checked against `NHSN pneumonia.pdf`, Chapter 6,
Reporting Instructions (printed page 6-5) and Tables 1–3 (printed pages
6-6–6-8), and `NHSN HAI.pdf`, Chapter 2, Infection Window Period, Date of
Event, Repeat Infection Timeframe, and Secondary BSI Attribution Period
(printed pages 2-3–2-19). These sources support a distinct PNEU event family,
the PNU1/PNU2 subtype labels, and the timeline and attribution results exposed
by the existing protocol modules.

## Implementation inspected

* `protocol/pnu1.js` and `protocol/pnu2.js` already contain source-mapped,
  tested evaluators.
* `protocol/pnu1-renderer.js` and `protocol/pnu2-renderer.js` already contain
  compact result renderers.
* `app.js` imports only the Chapter 17 secondary-site evaluator and renderer.
* The Secondary BSI UI builds navigation exclusively from
  `secondarySiteCategories`; therefore PNEU is not selectable.
* The only lower-respiratory choice is the Chapter 17 `LRI` category and its
  `LUNG` site. Its state is stored in `siteEvidence`.

## Discrepancies and integration boundary

1. **Missing:** no PNEU event-family navigation or subtype selector exists.
2. **Missing:** the PNU1/PNU2 evaluators and renderers are not imported by the
   live application.
3. **Missing:** there is no independent PNEU input state, so safe subtype
   switching cannot currently be demonstrated.
4. **Unsupported:** adding PNU1/PNU2 to `secondarySiteDefinitions` would combine
   a Chapter 6 event family with the Chapter 17 registry.
5. **Unsupported:** renaming or reusing `LRI-LUNG` would cross-qualify evidence
   between definitions. Chapter 6 instead describes PNEU/LUNG concurrency as a
   reporting-resolution rule (printed page 6-5), not shared qualification.
6. **Deferred:** PNU3 must remain visibly unavailable; no PNU3 UI integration
   is approved by this task.

The smallest safe change is a dedicated PNEU UI registry that references the
existing PNU1/PNU2 exports, maintains one input document per subtype, and is
selected alongside—not inside—the Chapter 17 pathway navigator.
