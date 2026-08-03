# BJ shared-evidence presentation audit

## Scope and source review

This presentation-only audit covers BONE, DISC, JNT, and PJI. The applicable
definitions were checked against `Secondary BSI Chapter.pdf`, Chapter 17:
BONE printed pages 17-7–17-8 (PDF 8–9), DISC 17-8 (PDF 9), JNT 17-9
(PDF 10), and PJI 17-9–17-10 (PDF 10–11). No criterion, attribution rule, or
source metadata change is authorized by this audit.

## Discrepancy report

The schema already reuses stable evidence IDs, and the evaluator correctly
reads evidence by ID. The renderer, however, walks every criterion branch and
renders a new checkbox each time an evidence object is referenced. This makes
the UI imply that identical facts must be abstracted repeatedly. It also gives
all ungrouped minimum-count requirements the generic instruction “Select ONE
qualifying supporting test,” including two-finding BJ groups.

No unsupported, missing, simplified, or incorrectly combined BJ surveillance
criterion was identified. The discrepancy is confined to presentation.

## Exact duplicates safe to share

| Pathway | Shared evidence IDs | Referencing criteria |
| --- | --- | --- |
| BONE | `bone-fever`, `bone-swelling`, `bone-pain-tenderness`, `bone-heat`, `bone-drainage` | 3a definitive/equivocal, 3b definitive/equivocal, 3c |
| BONE | `bone-blood-organism` | 3a definitive/equivocal |
| BONE | `bone-definitive-imaging` | 3a definitive, 3b definitive |
| BONE | `bone-equivocal-imaging` | 3a equivocal, 3b equivocal |
| BONE | `bone-antimicrobial-treatment` | 3a equivocal, 3b equivocal, 3c |
| BONE | `bone-physician-diagnosis` | 3b equivocal, 3c |
| DISC | `disc-fever`, `disc-pain` | 3a definitive/equivocal, 3b definitive/equivocal |
| DISC | `disc-blood-organism` | 3a definitive/equivocal |
| DISC | `disc-definitive-imaging` | 3a definitive, 3b definitive |
| DISC | `disc-equivocal-imaging`, `disc-antimicrobial-treatment` | 3a equivocal, 3b equivocal |
| JNT | `jnt-suspected-infection` and all five `jnt-*` localized findings | 3a, 3c, 3d definitive/equivocal |
| PJI | `pji-organ-space-after-hpro-kpro` | Criteria 1, 2, and 3 |

## Items intentionally not consolidated

Definitive and equivocal imaging remain separate. Physician diagnosis and
antimicrobial treatment remain separate. Site and blood organisms, individual
specimen requirements, operative/gross evidence, histopathology, JNT laboratory
alternatives, and every PJI minor criterion remain separate because their
wording, specimen, threshold, anatomy, or NHSN interpretation differs. BONE
pain/tenderness and DISC vertebral-disc pain are not shared across pathways.
No apparently duplicated item remains unresolved within a single BJ pathway.

## Evaluator safety baseline

Before implementation, exhaustive boolean evidence snapshots were captured for
all unique evidence IDs: BONE 8,192 states, DISC 512, JNT 131,072, and PJI 4,096.
The implementation must reproduce the status, site-definition result, and first
met criterion for every state without changing the evaluator.
