import { usiCriterionSource, usiInstructionSource, usiAttributionSource } from "../source.js";

const usiItem = (id, label, options = {}) => Object.freeze({ id, label, source: usiCriterionSource, ...options });
const usiNotUti = "usi-chapter-7-uti";
const usiCriterionItem = (id, label, options = {}) => usiItem(id, label, options);
const usiPurulentDrainage = usiCriterionItem("usi-purulent-drainage", "Purulent drainage from affected site");
const usiBloodOrganism = usiCriterionItem("usi-blood-organism", "Organism(s) identified from blood by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)");
const usiDefinitiveImaging = usiCriterionItem("usi-definitive-imaging", "Imaging test evidence definitive for infection (for example, ultrasound, CT scan, MRI, or radiolabel scan [gallium, technetium])");
const usiEquivocalImaging = usiCriterionItem("usi-equivocal-imaging", "Imaging test evidence for infection is equivocal");
const usiImagingTreatment = usiCriterionItem("usi-antimicrobial-treatment", "Physician or physician-designee documentation of antimicrobial treatment for urinary system infection supports the equivocal imaging finding");

// Manual 17-28: imaging belongs to sub-criterion "b" only. Sub-criterion "a" — purulent
// drainage from the affected site — stands alone and must not require imaging.
const usiSupportAlternatives = Object.freeze([
  Object.freeze({ id: "a-purulent-drainage", label: "a — purulent drainage from affected site", allOf: Object.freeze([usiPurulentDrainage]) }),
  Object.freeze({ id: "b-blood-organism-and-definitive-imaging", label: "b — organism identified from blood AND definitive imaging", allOf: Object.freeze([usiBloodOrganism, usiDefinitiveImaging]) }),
  Object.freeze({ id: "b-blood-organism-and-equivocal-imaging", label: "b — organism identified from blood AND clinically correlated equivocal imaging", allOf: Object.freeze([usiBloodOrganism, usiEquivocalImaging, usiImagingTreatment]) })
]);

export const usiDefinition = Object.freeze({
  majorCategoryCode: "USI", majorCategoryName: "Urinary System Infection", siteCode: "USI", siteName: "Urinary System Infection (kidney, ureter, bladder, urethra, or perinephric space excluding UTI [see Chapter 7].)",
  source: usiCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "USI-1", label: "Criterion 1 — affected-site fluid (not urine) or tissue organism", source: usiCriterionSource, allOf: Object.freeze([usiCriterionItem("usi-site-organism", "Organism(s) identified from fluid (not urine) or tissue from affected site by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "USI-2", label: "Criterion 2 — abscess or other evidence of infection", source: usiCriterionSource, allOf: Object.freeze([usiCriterionItem("usi-anatomic-pathology-evidence", "Abscess or other evidence of infection on gross anatomical exam, during invasive procedure, or on histopathologic exam")]) }),
    Object.freeze({ id: "USI-3", label: "Criterion 3 — sign or symptom plus purulent drainage, or blood organism with imaging", source: usiCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      Object.freeze({ id: "USI-3-findings", label: "At least one sign or symptom", minimumRequiredCount: 1, anyOf: Object.freeze([usiCriterionItem("usi-fever", "Fever (>38.0°C)"), usiCriterionItem("usi-localized-pain-tenderness", "Localized pain or tenderness, with no other recognized cause", { exclusionId: "usi-other-recognized-cause" })]) })
    ]), alternatives: usiSupportAlternatives }),
    Object.freeze({ id: "USI-4", label: "Criterion 4 — patient <1 year of age", source: usiCriterionSource, allOf: Object.freeze([usiCriterionItem("usi-age-under-one", "Patient <1 year of age")]), alternatives: usiSupportAlternatives, groups: Object.freeze([
      Object.freeze({ id: "USI-4-findings", label: "At least one sign or symptom", minimumRequiredCount: 1, anyOf: Object.freeze([
        usiCriterionItem("usi-fever", "Fever (>38.0°C)"), usiCriterionItem("usi-hypothermia", "Hypothermia (<36.0°C)"),
        usiCriterionItem("usi-apnea", "Apnea, with no other recognized cause", { exclusionId: "usi-other-recognized-cause" }), usiCriterionItem("usi-bradycardia", "Bradycardia, with no other recognized cause", { exclusionId: "usi-other-recognized-cause" }),
        usiCriterionItem("usi-lethargy", "Lethargy, with no other recognized cause", { exclusionId: "usi-other-recognized-cause" }), usiCriterionItem("usi-vomiting", "Vomiting, with no other recognized cause", { exclusionId: "usi-other-recognized-cause" })
      ]) })
    ]) })
  ]),
  exclusions: Object.freeze([
    usiItem(usiNotUti, "This event is a UTI evaluated under Chapter 7; Chapter 7 UTI evidence is excluded from USI and must be evaluated under the NHSN UTI chapter instead (no automatic redirect or classification)", { type: "exclusion", disqualifiesSite: true }),
    usiItem("usi-other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "USI-note-uti-exclusion", text: "USI excludes UTI (see Chapter 7); urine is not an eligible fluid for USI criterion 1.", source: usiCriterionSource }),
    Object.freeze({ id: "USI-note-imaging-scope", text: "Imaging test evidence is required only for sub-criterion b (organism identified from blood). Sub-criterion a, purulent drainage from the affected site, does not require imaging.", source: usiCriterionSource }),
    Object.freeze({ id: "USI-note-equivocal-imaging", text: "Equivocal imaging qualifies only when supported by clinical correlation, specifically physician or physician-designee documentation of antimicrobial treatment for urinary system infection.", source: usiCriterionSource })
  ]),
  reportingInstructions: Object.freeze([Object.freeze({ id: "USI-report-circ", text: "Report infections following circumcision in newborns as SST-CIRC.", source: usiInstructionSource })]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: usiAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete USI definition is met", source: usiAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the USI criterion", source: usiAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the USI secondary BSI attribution period (or in the infection window when used as a criterion element)", source: usiAttributionSource })
  ]) })
});
