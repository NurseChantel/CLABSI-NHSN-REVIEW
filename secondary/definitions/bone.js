import { boneCriterionSource, boneInstructionSource, boneTimingSource } from "../source.js";

const boneItem = (id, label, options = {}) => Object.freeze({ id, label, source: boneCriterionSource, ...options });
const boneFindings = Object.freeze([
  boneItem("bone-fever", "Fever (>38.0°C)"),
  boneItem("bone-swelling", "Swelling, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  boneItem("bone-pain-tenderness", "Pain or tenderness, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  boneItem("bone-heat", "Heat, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  boneItem("bone-drainage", "Drainage, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const boneFindingsGroup = (id) => Object.freeze({ id, label: "At least two localized signs or symptoms", minimumRequiredCount: 2, anyOf: boneFindings });
const boneBloodOrganism = boneItem("bone-blood-organism", "Organism(s) identified from blood by culture or non-culture based microbiologic testing performed for clinical diagnosis and treatment (not ASC/AST)");
const boneDefinitiveImaging = boneItem("bone-definitive-imaging", "Imaging test evidence definitive for infection (for example, x-ray, CT scan, MRI, or radiolabel scan [gallium, technetium, etc.])");
const boneEquivocalImaging = boneItem("bone-equivocal-imaging", "Imaging test evidence for infection is equivocal");
const boneTreatment = boneItem("bone-antimicrobial-treatment", "Physician or physician-designee documentation of antimicrobial treatment for osteomyelitis");
const boneDiagnosis = boneItem("bone-physician-diagnosis", "Physician or physician-designee diagnosis of osteomyelitis");

export const boneDefinition = Object.freeze({
  majorCategoryCode: "BJ", majorCategoryName: "Bone and Joint Infection", siteCode: "BONE", siteName: "Osteomyelitis",
  source: boneCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "BONE-1", label: "Criterion 1 — organism identified from bone", source: boneCriterionSource, allOf: Object.freeze([boneItem("bone-site-organism", "Organism(s) identified from bone by culture or non-culture based microbiologic testing performed for clinical diagnosis and treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "BONE-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: boneCriterionSource, allOf: Object.freeze([boneItem("bone-gross-histopathologic-evidence", "Evidence of osteomyelitis on gross anatomic or histopathologic examination")]) }),
    Object.freeze({ id: "BONE-3a-definitive", label: "Criterion 3a — localized findings, blood organism, and definitive imaging", source: boneCriterionSource, allOf: Object.freeze([boneBloodOrganism, boneDefinitiveImaging]), groups: Object.freeze([boneFindingsGroup("BONE-3a-definitive-findings")]) }),
    Object.freeze({ id: "BONE-3a-equivocal", label: "Criterion 3a — localized findings, blood organism, and clinically correlated equivocal imaging", source: boneCriterionSource, allOf: Object.freeze([boneBloodOrganism, boneEquivocalImaging, boneTreatment]), groups: Object.freeze([boneFindingsGroup("BONE-3a-equivocal-findings")]) }),
    Object.freeze({ id: "BONE-3b-definitive", label: "Criterion 3b — localized findings and definitive imaging", source: boneCriterionSource, allOf: Object.freeze([boneDefinitiveImaging]), groups: Object.freeze([boneFindingsGroup("BONE-3b-definitive-findings")]) }),
    Object.freeze({ id: "BONE-3b-equivocal", label: "Criterion 3b — localized findings and clinically correlated equivocal imaging", source: boneCriterionSource, allOf: Object.freeze([boneEquivocalImaging, boneDiagnosis, boneTreatment]), groups: Object.freeze([boneFindingsGroup("BONE-3b-equivocal-findings")]) }),
    Object.freeze({ id: "BONE-3c", label: "Criterion 3c — localized findings, physician diagnosis, and treatment", source: boneCriterionSource, allOf: Object.freeze([boneDiagnosis, boneTreatment]), groups: Object.freeze([boneFindingsGroup("BONE-3c-findings")]) })
  ]),
  evidenceSections: Object.freeze([
    Object.freeze({ id: "clinical", label: "Shared clinical evidence", evidenceIds: Object.freeze(boneFindings.map(({ id }) => id)) }),
    Object.freeze({ id: "microbiology", label: "Microbiology", evidenceIds: Object.freeze(["bone-site-organism", "bone-blood-organism"]) }),
    Object.freeze({ id: "imaging", label: "Imaging", evidenceIds: Object.freeze(["bone-definitive-imaging", "bone-equivocal-imaging"]) }),
    Object.freeze({ id: "operative-pathology", label: "Operative or pathology findings", evidenceIds: Object.freeze(["bone-gross-histopathologic-evidence"]) }),
    Object.freeze({ id: "diagnosis-treatment", label: "Physician diagnosis and treatment", evidenceIds: Object.freeze(["bone-physician-diagnosis", "bone-antimicrobial-treatment"]) })
  ]),
  exclusions: Object.freeze([boneItem("other-recognized-cause", "Another recognized cause applies to an asterisked localized sign or symptom", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "BONE-note-window", text: "The BONE infection window period is 21 days: the date the first positive diagnostic test used as a criterion element was obtained, the 10 calendar days before, and the 10 calendar days after.", source: boneTimingSource }),
    Object.freeze({ id: "BONE-note-rit", text: "The BONE RIT extends through the remainder of the patient's current admission.", source: boneTimingSource }),
    Object.freeze({ id: "BONE-note-secondary-period", text: "The BONE secondary BSI attribution period includes the 21-day infection window period and every subsequent day of the patient's current admission.", source: boneTimingSource }),
    Object.freeze({ id: "BONE-note-pathogen-limit", text: "Secondary BSI pathogen assignment is limited to organism(s) identified in blood that match the organism(s) used to meet the BONE definition; if the blood specimen itself can be used to meet a BONE criterion, all organisms in that specimen can be assigned.", source: boneTimingSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "BONE-report-med", text: "Report mediastinitis following cardiac surgery accompanied by osteomyelitis as SSI-MED rather than SSI-BONE.", source: boneInstructionSource }),
    Object.freeze({ id: "BONE-report-jnt", text: "If both organ-space JNT and BONE are met, report the SSI as BONE.", source: boneInstructionSource }),
    Object.freeze({ id: "BONE-report-pji", text: "After HPRO or KPRO, if both organ-space PJI and BONE are met, report the SSI as BONE.", source: boneInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: boneTimingSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete BONE definition is met", source: boneTimingSource }),
    Object.freeze({ id: "organism-relationship", label: "The organism(s) in the blood match the organism(s) used to meet BONE, or that blood specimen is itself used to meet the BONE criterion", source: boneTimingSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the 21-day BONE infection window or on a subsequent day of the same current admission", source: boneTimingSource })
  ]) })
});
