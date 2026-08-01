import { medCriterionSource, medInstructionSource, medAttributionSource } from "../source.js";

const medItem = (id, label, options = {}) => Object.freeze({ id, label, source: medCriterionSource, ...options });
const medOtherCause = { exclusionId: "med-other-recognized-cause" };
const medDrainageOrImaging = Object.freeze([medItem("med-purulent-drainage", "Purulent drainage from mediastinal area"), medItem("med-mediastinal-widening", "Mediastinal widening on imaging test")]);
export const medDefinition = Object.freeze({
  majorCategoryCode: "CVS", majorCategoryName: "Cardiovascular System Infection", siteCode: "MED", siteName: "Mediastinitis",
  source: medCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "MED-1", label: "Criterion 1 — organism from mediastinal tissue or fluid", source: medCriterionSource, allOf: Object.freeze([medItem("med-site-organism", "Organism(s) identified from mediastinal tissue or mediastinal fluid by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "MED-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: medCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      Object.freeze({ id: "MED-2-exam", label: "At least one qualifying examination finding", minimumRequiredCount: 1, anyOf: Object.freeze([medItem("med-gross-anatomic", "Evidence of mediastinitis on gross anatomic exam"), medItem("med-histopathology", "Evidence of mediastinitis on histopathologic exam")]) })
    ]) }),
    Object.freeze({ id: "MED-3", label: "Criterion 3 — sign or symptom plus drainage or imaging", source: medCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      Object.freeze({ id: "MED-3-symptoms", label: "At least one qualifying sign or symptom", minimumRequiredCount: 1, anyOf: Object.freeze([medItem("med-fever", "Fever (>38.0°C)"), medItem("med-chest-pain", "Chest pain, with no other recognized cause", medOtherCause), medItem("med-sternal-instability", "Sternal instability, with no other recognized cause", medOtherCause)]) }),
      Object.freeze({ id: "MED-3-support", label: "At least one qualifying drainage or imaging finding", minimumRequiredCount: 1, anyOf: medDrainageOrImaging })
    ]) }),
    Object.freeze({ id: "MED-4", label: "Criterion 4 — patient ≤1 year of age", source: medCriterionSource, ageApplicability: "infant", allOf: Object.freeze([medItem("med-age-one-or-younger", "Patient ≤1 year of age")]), groups: Object.freeze([
      Object.freeze({ id: "MED-4-symptoms", label: "At least one qualifying sign or symptom", minimumRequiredCount: 1, anyOf: Object.freeze([medItem("med-fever", "Fever (>38.0°C)"), medItem("med-hypothermia", "Hypothermia (<36.0°C)"), medItem("med-apnea", "Apnea, with no other recognized cause", medOtherCause), medItem("med-bradycardia", "Bradycardia, with no other recognized cause", medOtherCause), medItem("med-sternal-instability", "Sternal instability, with no other recognized cause", medOtherCause)]) }),
      Object.freeze({ id: "MED-4-support", label: "At least one qualifying drainage or imaging finding", minimumRequiredCount: 1, anyOf: medDrainageOrImaging })
    ]) })
  ]),
  exclusions: Object.freeze([medItem("med-other-recognized-cause", "Another recognized cause applies to a finding marked by NHSN with an asterisk", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "MED-note-space", text: "The mediastinal space is the area under the sternum and in front of the vertebral column; it is divided into anterior, middle, posterior, and superior regions.", source: medInstructionSource }),
    Object.freeze({ id: "MED-note-imaging", text: "For MED 4b, mediastinal stranding, mediastinal fluid collection, mediastinal edema, and mediastinal abscess are eligible imaging findings for the mediastinal-widening element.", source: medInstructionSource })
  ]),
  reportingInstructions: Object.freeze([Object.freeze({ id: "MED-report-bone", text: "Report mediastinitis following cardiac surgery that is accompanied by osteomyelitis as SSI-MED rather than SSI-BONE.", source: medInstructionSource })]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: medAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete MED definition is met", source: medAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the MED criterion", source: medAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the MED secondary BSI attribution period (or in the infection window when used as a criterion element)", source: medAttributionSource })
  ]) })
});
