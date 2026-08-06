import { jntCriterionSource, jntInstructionSource, jntAttributionSource } from "../source.js";

const jntItem = (id, label, options = {}) => Object.freeze({ id, label, source: jntCriterionSource, ...options });
const jntFindings = Object.freeze([
  jntItem("jnt-swelling", "Swelling, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  jntItem("jnt-pain-tenderness", "Pain or tenderness, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  jntItem("jnt-heat", "Heat, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  jntItem("jnt-effusion", "Evidence of effusion, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  jntItem("jnt-limited-motion", "Limitation of motion, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const jntFindingsGroup = Object.freeze({ id: "JNT-3-findings", label: "At least two signs or symptoms", minimumRequiredCount: 2, anyOf: jntFindings });

export const jntDefinition = Object.freeze({
  majorCategoryCode: "BJ", majorCategoryName: "Bone and Joint Infection", siteCode: "JNT", siteName: "Joint or bursa infection (not for use as Organ/Space SSI after HPRO or KPRO procedures)",
  source: jntCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "JNT-1", label: "Criterion 1 — organism identified from joint fluid or synovial biopsy", source: jntCriterionSource, allOf: Object.freeze([jntItem("jnt-site-organism", "Organism(s) identified from joint fluid or synovial biopsy by culture or non-culture based microbiologic testing performed for purposes of clinical diagnosis and treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "JNT-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: jntCriterionSource, allOf: Object.freeze([jntItem("jnt-gross-histopathologic-evidence", "Evidence of joint or bursa infection on gross anatomic or histopathologic examination")]) }),
    // Manual 17-9 lists 3a and 3b as separate sub-criteria; keep them distinct so the
    // criterion reported back to the reviewer is the one the evidence actually met.
    Object.freeze({ id: "JNT-3a", label: "Criterion 3a — suspected infection, findings, and joint-fluid cell-count evidence", source: jntCriterionSource, allOf: Object.freeze([jntItem("jnt-suspected-infection", "Suspected joint or bursa infection")]), groups: Object.freeze([
      jntFindingsGroup,
      Object.freeze({ id: "JNT-3a-support", label: "At least one qualifying joint-fluid finding", minimumRequiredCount: 1, anyOf: Object.freeze([
        jntItem("jnt-elevated-joint-wbc", "Elevated joint fluid white blood cell count (per reporting laboratory's reference range)"),
        jntItem("jnt-positive-leukocyte-esterase", "Positive leukocyte esterase test strip of joint fluid")
      ]) })
    ]) }),
    Object.freeze({ id: "JNT-3b", label: "Criterion 3b — suspected infection, findings, and joint-fluid Gram stain", source: jntCriterionSource, allOf: Object.freeze([
      jntItem("jnt-suspected-infection", "Suspected joint or bursa infection"),
      jntItem("jnt-gram-stain-organisms-wbc", "Organism(s) and white blood cells seen on Gram stain of joint fluid")
    ]), groups: Object.freeze([jntFindingsGroup]) }),
    Object.freeze({ id: "JNT-3c", label: "Criterion 3c — suspected infection, findings, and blood organism", source: jntCriterionSource, allOf: Object.freeze([
      jntItem("jnt-suspected-infection", "Suspected joint or bursa infection"),
      jntItem("jnt-blood-organism", "Organism(s) identified from blood by culture or non-culture based microbiologic testing performed for purposes of clinical diagnosis and treatment (not ASC/AST)")
    ]), groups: Object.freeze([jntFindingsGroup]) }),
    Object.freeze({ id: "JNT-3d", label: "Criterion 3d — suspected infection, findings, and imaging", source: jntCriterionSource, allOf: Object.freeze([
      jntItem("jnt-suspected-infection", "Suspected joint or bursa infection")
    ]), groups: Object.freeze([jntFindingsGroup]), alternatives: Object.freeze([
      Object.freeze({ id: "definitive-imaging", label: "Definitive imaging pathway", source: jntCriterionSource, allOf: Object.freeze([
        jntItem("jnt-definitive-imaging", "Imaging test evidence definitive for infection (for example, x-ray, CT scan, MRI, or radiolabel scan [gallium, technetium, etc.])")
      ]), groups: Object.freeze([]) }),
      Object.freeze({ id: "equivocal-imaging", label: "Equivocal imaging pathway", source: jntCriterionSource, allOf: Object.freeze([
        jntItem("jnt-equivocal-imaging", "Imaging test evidence for infection is equivocal"),
        jntItem("jnt-antimicrobial-treatment", "Physician or physician-designee documentation of antimicrobial treatment for joint or bursa infection")
      ]), groups: Object.freeze([]) })
    ]) })
  ]),
  exclusions: Object.freeze([
    jntItem("other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" }),
    jntItem("jnt-hpro-kpro-organ-space", "Use as Organ/Space SSI after HPRO or KPRO procedures", { type: "exclusion", blocksPathway: true })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "JNT-note-restriction", text: "JNT — Joint or bursa infection (not for use as Organ/Space SSI after HPRO or KPRO procedures).", source: jntCriterionSource }),
    Object.freeze({ id: "JNT-note-equivocal-imaging", text: "Equivocal imaging qualifies only when supported by clinical correlation, specifically physician or physician-designee documentation of antimicrobial treatment for joint or bursa infection.", source: jntCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "JNT-report-bone", text: "If a patient meets both organ space JNT and BONE report the SSI as BONE.", source: jntInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: jntAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete JNT definition is met", source: jntAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the JNT criterion", source: jntAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the JNT secondary BSI attribution period (or in the infection window when used as a criterion element)", source: jntAttributionSource })
  ]) })
});
