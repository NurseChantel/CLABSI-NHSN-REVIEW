# 2026 PNEU checklist presentation discrepancy report

**Audit date:** 2026-08-04  
**Scope:** PNEU presentation and form-state adapter only

## Authoritative material reviewed

The presentation was compared with `NHSN pneumonia checklist.pdf`, PNU1
worksheets (PDF pages 2–4) and PNU2 worksheets (PDF pages 5–8). Existing
qualification behavior was separately traced to the source-mapped evaluators in
`protocol/pnu1.js` and `protocol/pnu2.js`. The checklist is presentation
authority; those evaluators remain qualification authority.

## Existing implementation inspected

* `protocol/pneu-ui.js` rendered patient, timeline, imaging, clinical, and
  laboratory data as long generic sections.
* PNU1 age findings were filtered, but the any-patient and applicable pediatric
  criteria were blended into one clinical form.
* PNU2 exposed all 14 evaluator laboratory branches as equivalent top-level
  accordions rather than the checklist's two major OR algorithms.
* Alternative findings inside a checklist bullet were individual controls with
  no visible group boundary or group count.
* Generic laboratory records exposed fields for unrelated alternatives at the
  same time.
* Evaluator validation strings, including protocol object paths, were displayed
  in the normal status banner.
* Seed data supplied example dates and treated one entered study as the sole
  available study without an explicit reviewer decision.

## Discrepancies to correct

1. **Incorrectly combined presentation:** PNU1 any-patient and pediatric
   alternatives need separate OR criterion accordions.
2. **Missing relationship cues:** imaging, systemic/required clinical, and
   respiratory sections need explicit AND separators; alternatives and group
   minima need explicit OR/count language.
3. **Simplified grouping:** respiratory alternatives need checklist bullet
   containers and counts by group, not by individual symptom.
4. **Unsupported workflow implication:** a single entered image must not imply
   that it is the only available image.
5. **Overexposed implementation detail:** PNU2's 14 evaluator branch identifiers
   must be organized under the two checklist algorithms, with conditional fields
   for the chosen alternative.
6. **Unsafe normal-mode validation:** raw object paths must be mapped to local,
   human-readable field messages; raw details may appear only in developer
   diagnostics.
7. **Unnecessary PNU1 section:** PNU1 needs a compact no-laboratory note rather
   than a laboratory evidence form.
8. **Missing source placement:** each main criterion needs checklist source
   metadata and collapsed guidance/footnotes.
9. **Excessive expansion:** only the met or closest viable main criterion should
   open automatically.
10. **Invented evidence dates:** initial and newly added evidence must have blank
    dates until explicitly entered.

## Protected behavior

No changes are authorized for PNU1/PNU2 evaluator logic, imaging qualification,
thresholds, timing, specimen/organism rules, Secondary BSI attribution, PNU3,
Chapter 17, LRI-LUNG, the surveillance header, or sticky behavior. Integration
tests must compare evaluator output before and after form rendering/control-only
operations.
