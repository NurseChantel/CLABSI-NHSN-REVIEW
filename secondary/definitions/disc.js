import { discCriterionSource, discAttributionSource } from "../source.js";

const discItem = (id, label, options = {}) => Object.freeze({ id, label, source: discCriterionSource, ...options });
const discFindings = Object.freeze([
  discItem("disc-fever", "Fever (>38.0°C)"),
  discItem("disc-pain", "Pain at the involved vertebral disc space, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const discFindingsGroup = (id) => Object.freeze({ id, label: "At least one sign or symptom", minimumRequiredCount: 1, anyOf: discFindings });
const discBloodOrganism = discItem("disc-blood-organism", "Organism(s) identified from blood by culture or non-culture based microbiologic testing performed for purposes of clinical diagnosis and treatment (not ASC/AST)");
const discDefinitiveImaging = discItem("disc-definitive-imaging", "Imaging test evidence definitive for infection (for example, x-ray, CT scan, MRI, or radiolabel scan [gallium, technetium, etc.])");
const discEquivocalImaging = discItem("disc-equivocal-imaging", "Imaging test evidence for infection is equivocal");
const discTreatment = discItem("disc-antimicrobial-treatment", "Physician or physician-designee documentation of antimicrobial treatment for vertebral disc space infection");

export const discDefinition = Object.freeze({
  majorCategoryCode: "BJ", majorCategoryName: "Bone and Joint Infection", siteCode: "DISC", siteName: "Disc space infection",
  source: discCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "DISC-1", label: "Criterion 1 — organism identified from vertebral disc space", source: discCriterionSource, allOf: Object.freeze([discItem("disc-site-organism", "Organism(s) identified from vertebral disc space by culture or non-culture based microbiologic testing performed for purposes of clinical diagnosis and treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "DISC-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: discCriterionSource, allOf: Object.freeze([discItem("disc-gross-histopathologic-evidence", "Evidence of vertebral disc space infection on gross anatomic or histopathologic examination")]) }),
    Object.freeze({ id: "DISC-3a-definitive", label: "Criterion 3a — finding, blood organism, and definitive imaging", source: discCriterionSource, allOf: Object.freeze([discBloodOrganism, discDefinitiveImaging]), groups: Object.freeze([discFindingsGroup("DISC-3a-definitive-findings")]) }),
    Object.freeze({ id: "DISC-3a-equivocal", label: "Criterion 3a — finding, blood organism, and clinically correlated equivocal imaging", source: discCriterionSource, allOf: Object.freeze([discBloodOrganism, discEquivocalImaging, discTreatment]), groups: Object.freeze([discFindingsGroup("DISC-3a-equivocal-findings")]) }),
    Object.freeze({ id: "DISC-3b-definitive", label: "Criterion 3b — finding and definitive imaging", source: discCriterionSource, allOf: Object.freeze([discDefinitiveImaging]), groups: Object.freeze([discFindingsGroup("DISC-3b-definitive-findings")]) }),
    Object.freeze({ id: "DISC-3b-equivocal", label: "Criterion 3b — finding and clinically correlated equivocal imaging", source: discCriterionSource, allOf: Object.freeze([discEquivocalImaging, discTreatment]), groups: Object.freeze([discFindingsGroup("DISC-3b-equivocal-findings")]) })
  ]),
  exclusions: Object.freeze([discItem("other-recognized-cause", "Another recognized cause applies to pain at the involved vertebral disc space", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "DISC-note-equivocal-imaging", text: "Equivocal imaging qualifies only when supported by clinical correlation, specifically physician or physician-designee documentation of antimicrobial treatment for vertebral disc space infection.", source: discCriterionSource })
  ]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: discAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete DISC definition is met", source: discAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the DISC criterion", source: discAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the DISC secondary BSI attribution period (or in the infection window when used as a criterion element)", source: discAttributionSource })
  ]) })
});
