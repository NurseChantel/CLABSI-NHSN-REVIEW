import { vascCriterionSource, vascInstructionSource, vascSecondaryBsiProhibitionSource } from "../source.js";

const vascRestrictionId = "vasc-access-device-blood-organism";
const vascItem = (id, label, options = {}) => Object.freeze({ id, label, source: vascCriterionSource, ...options });
const vascFindings = Object.freeze([
  vascItem("vasc-fever", "Fever (>38.0°C)"),
  vascItem("vasc-pain", "Pain at the involved vascular site, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" }),
  vascItem("vasc-erythema", "Erythema at the involved vascular site, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" }),
  vascItem("vasc-heat", "Heat at the involved vascular site, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" })
]);
const vascInfantFindings = Object.freeze([
  vascFindings[0], vascItem("vasc-hypothermia", "Hypothermia (<36.0°C)"),
  vascItem("vasc-apnea", "Apnea, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" }),
  vascItem("vasc-bradycardia", "Bradycardia, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" }),
  vascItem("vasc-lethargy", "Lethargy, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" }), ...vascFindings.slice(1)
]);
const vascFindingGroup = (id, findings) => Object.freeze({ id, label: "At least one qualifying sign or symptom", minimumRequiredCount: 1, anyOf: findings });
const vascCannulaCulture = vascItem("vasc-cannula-tip-colonies", "More than 15 colonies cultured from an intravascular cannula tip using a semi-quantitative culture method");

export const vascDefinition = Object.freeze({
  majorCategoryCode: "CVS", majorCategoryName: "Cardiovascular System Infection", siteCode: "VASC", siteName: "Arterial or venous infection excluding infections involving vascular access devices with organisms identified in the blood",
  source: vascCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "VASC-1", label: "Criterion 1 — organism from extracted artery or vein", source: vascCriterionSource, allOf: Object.freeze([vascItem("vasc-extracted-vessel-organism", "Organism(s) identified from extracted arteries or veins by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "VASC-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: vascCriterionSource, allOf: Object.freeze([vascItem("vasc-gross-histopathologic-evidence", "Evidence of arterial or venous infection on gross anatomic or histopathologic examination")]) }),
    Object.freeze({ id: "VASC-3", label: "Criterion 3 — vascular-site finding and cannula-tip culture", source: vascCriterionSource, allOf: Object.freeze([vascCannulaCulture]), groups: Object.freeze([vascFindingGroup("VASC-3-findings", vascFindings)]) }),
    Object.freeze({ id: "VASC-4", label: "Criterion 4 — purulent drainage", source: vascCriterionSource, allOf: Object.freeze([vascItem("vasc-purulent-drainage", "Purulent drainage at the involved vascular site")]) }),
    Object.freeze({ id: "VASC-5", label: "Criterion 5 — patient ≤1 year, age-specific finding, and cannula-tip culture", source: vascCriterionSource, allOf: Object.freeze([vascItem("vasc-age-one-or-younger", "Patient ≤1 year of age"), vascCannulaCulture]), groups: Object.freeze([vascFindingGroup("VASC-5-findings", vascInfantFindings)]) })
  ]),
  exclusions: Object.freeze([
    Object.freeze({ id: vascRestrictionId, label: "The infection involves a vascular access device and organism(s) are identified in the blood (excluded from VASC)", source: vascCriterionSource, type: "exclusion" }),
    Object.freeze({ id: "vasc-other-recognized-cause", label: "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", source: vascCriterionSource, type: "exclusion" })
  ]),
  hardExclusionIds: Object.freeze([vascRestrictionId]),
  notes: Object.freeze([
    Object.freeze({ id: "VASC-note-imaging", text: "The VASC definition lists no imaging criterion or physician-diagnosis criterion.", source: vascCriterionSource }),
    Object.freeze({ id: "VASC-note-lcbi", text: "If LCBI criteria are met in the presence of an arterial or vascular infection, report LCBI rather than VASC.", source: vascCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "VASC-report-device-no-blood", text: "Report infection of an arteriovenous graft, shunt, fistula, or intravascular cannulation site without organism(s) identified from blood as CVS-VASC.", source: vascInstructionSource }),
    Object.freeze({ id: "VASC-report-ssi", text: "Report an Organ/Space VASC infection as an SSI, not an LCBI, when an SSI has a secondary BSI.", source: vascInstructionSource }),
    Object.freeze({ id: "VASC-report-lcbi", text: "Report intravascular infection with organism(s) identified from blood that meets LCBI criteria as BSI-LCBI.", source: vascInstructionSource }),
    Object.freeze({ id: "VASC-report-no-secondary-bsi", text: "Do not report a secondary bloodstream infection for a vascular (VASC) infection. Table B1 admits VASC only as an organ/space surgical site infection, criterion 1.", source: vascSecondaryBsiProhibitionSource })
  ]),
  // clabsi nhsn.pdf, Chapter 4, Appendix: Secondary BSI Guide, printed page 4-35:
  // "Do not report secondary bloodstream infection for vascular (VASC) infections,
  // ventilator-associated conditions (VAC), infection-related ventilator-associated
  // complications (IVAC), or pneumonia 1 (PNU1)." Table B1 (4-34) admits VASC only as an
  // organ/space SSI, criterion 1.
  secondaryBsi: Object.freeze({
    reportable: false,
    lockedUntilSiteDefinitionMet: true,
    source: vascSecondaryBsiProhibitionSource,
    message: "Do not report a secondary bloodstream infection for a vascular (VASC) infection. Table B1 admits VASC only as an organ/space surgical site infection, criterion 1. Where organism(s) identified from blood meet LCBI criteria, report the event as an LCBI rather than as a VASC with a secondary BSI.",
    exception: Object.freeze({ id: "vasc-organ-space-ssi", label: "The VASC is reported as an organ/space surgical site infection meeting criterion 1", source: vascSecondaryBsiProhibitionSource }),
    requirements: Object.freeze([])
  })
});
