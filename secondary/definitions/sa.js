import { saCriterionSource, saInstructionSource, saAttributionSource } from "../source.js";

const saItem = (id, label, options = {}) => Object.freeze({ id, label, source: saCriterionSource, ...options });
const saLocalizedFindings = Object.freeze([
  saItem("sa-fever", "Fever (>38.0°C)"),
  saItem("sa-back-pain", "Back pain, with no other recognized cause", { exclusionId: "sa-other-recognized-cause" }),
  saItem("sa-tenderness", "Tenderness, with no other recognized cause", { exclusionId: "sa-other-recognized-cause" }),
  saItem("sa-radiculitis", "Radiculitis, with no other recognized cause", { exclusionId: "sa-other-recognized-cause" }),
  saItem("sa-paraparesis", "Paraparesis, with no other recognized cause", { exclusionId: "sa-other-recognized-cause" }),
  saItem("sa-paraplegia", "Paraplegia, with no other recognized cause", { exclusionId: "sa-other-recognized-cause" })
]);
const saFindingsGroup = (id) => Object.freeze({ id, label: "At least one localized sign or symptom", minimumRequiredCount: 1, anyOf: saLocalizedFindings });
const saDefinitiveImaging = saItem("sa-definitive-imaging", "Imaging test evidence definitive for spinal abscess/infection (for example, myelography, ultrasound, CT scan, MRI, or other scans [gallium, technetium, etc.])");
const saEquivocalImaging = saItem("sa-equivocal-imaging", "Imaging test evidence for spinal abscess/infection is equivocal");
const saImagingTreatment = saItem("sa-antimicrobial-treatment", "Physician or physician-designee documentation of antimicrobial treatment for spinal abscess/infection supports the equivocal imaging finding");
// Manual 17-12: imaging "which if equivocal is supported by clinical correlation".
// Modelled the same way as BONE, DISC, IC, EAR, GIT and IAB so an equivocal study
// cannot qualify without documented antimicrobial treatment.
const saImagingAlternatives = Object.freeze([
  Object.freeze({ id: "definitive-imaging", label: "Definitive imaging pathway", source: saCriterionSource, allOf: Object.freeze([saDefinitiveImaging]) }),
  Object.freeze({ id: "equivocal-imaging", label: "Clinically correlated equivocal imaging pathway", source: saCriterionSource, allOf: Object.freeze([saEquivocalImaging, saImagingTreatment]) })
]);

export const saDefinition = Object.freeze({
  majorCategoryCode: "CNS", majorCategoryName: "Central Nervous System Infection", siteCode: "SA", siteName: "Spinal abscess/infection (spinal abscess, spinal subdural or epidural infection)",
  source: saCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "SA-1", label: "Criterion 1 — organism from spinal abscess or purulent material", source: saCriterionSource, allOf: Object.freeze([saItem("sa-site-organism", "Organism(s) identified from an abscess or from purulent material found in the spinal epidural or subdural space by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "SA-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: saCriterionSource, allOf: Object.freeze([saItem("sa-gross-histopathologic-evidence", "Abscess or other evidence of spinal infection on gross anatomic or histopathologic examination")]) }),
    Object.freeze({ id: "SA-3a", label: "Criterion 3a — localized finding, blood organism, and imaging", source: saCriterionSource, allOf: Object.freeze([
      saItem("sa-blood-organism", "Organism(s) identified from blood by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]), groups: Object.freeze([saFindingsGroup("SA-3a-findings")]), alternatives: saImagingAlternatives }),
    Object.freeze({ id: "SA-3b", label: "Criterion 3b — localized finding and imaging", source: saCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([saFindingsGroup("SA-3b-findings")]), alternatives: saImagingAlternatives })
  ]),
  exclusions: Object.freeze([saItem("sa-other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "SA-note-equivocal-imaging", text: "Equivocal imaging qualifies only with clinical correlation: physician or physician-designee documentation of antimicrobial treatment for spinal abscess/infection.", source: saCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "SA-report-men", text: "Report as SA if meningitis (MEN) and spinal abscess/infection (SA) are present together after operation.", source: saInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: saAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete SA definition is met", source: saAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the SA criterion", source: saAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the SA secondary BSI attribution period (or in the infection window when used as a criterion element)", source: saAttributionSource })
  ]) })
});
