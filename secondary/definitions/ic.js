import { icCriterionSource, icInstructionSource, icAttributionSource } from "../source.js";

const icItem = (id, label, options = {}) => Object.freeze({ id, label, source: icCriterionSource, ...options });
const icFindings = Object.freeze([
  icItem("headache", "Headache, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("dizziness", "Dizziness, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("fever", "Fever (>38.0°C)"),
  icItem("localizing-neurologic-signs", "Localizing neurologic sign(s), with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("changing-consciousness", "Changing level of consciousness, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("confusion", "Confusion, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const icInfantFindings = Object.freeze([
  icItem("fever", "Fever (>38.0°C)"),
  icItem("hypothermia", "Hypothermia (<36.0°C)"),
  icItem("apnea", "Apnea, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("bradycardia", "Bradycardia, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("localizing-neurologic-signs", "Localizing neurologic sign(s), with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("changing-consciousness", "Changing level of consciousness (for example, irritability, poor feeding, lethargy), with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const icSupport = Object.freeze([
  icItem("microscopic-organism", "Organism(s) seen on microscopic examination of brain or abscess tissue obtained by needle aspiration, during an invasive procedure, or at autopsy"),
  icItem("definitive-imaging", "Imaging test evidence definitive for infection (for example, ultrasound, CT scan, MRI, radionuclide brain scan, or arteriogram)"),
  icItem("equivocal-imaging-with-treatment", "Equivocal imaging supported by clinical correlation: physician or physician-designee documentation of antimicrobial treatment for intracranial infection"),
  icItem("diagnostic-antibody", "Diagnostic single antibody titer (IgM) or 4-fold increase in paired sera (IgG) for organism")
]);

export const icDefinition = Object.freeze({
  majorCategoryCode: "CNS", majorCategoryName: "Central Nervous System Infection", siteCode: "IC", siteName: "Intracranial infection (brain abscess, subdural or epidural infection, encephalitis)",
  source: icCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "IC-1", label: "Criterion 1 — brain tissue or dura organism", source: icCriterionSource, allOf: Object.freeze([icItem("brain-tissue-dura-organism", "Organism(s) identified from brain tissue or dura by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "IC-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: icCriterionSource, allOf: Object.freeze([icItem("gross-histopathologic-evidence", "Abscess or evidence of intracranial infection on gross anatomic or histopathologic examination")]) }),
    Object.freeze({ id: "IC-3", label: "Criterion 3 — signs or symptoms and supporting evidence", source: icCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      Object.freeze({ id: "IC-3-findings", label: "At least two signs or symptoms", minimumRequiredCount: 2, anyOf: icFindings }),
      Object.freeze({ id: "IC-3-support", label: "At least one supporting test", minimumRequiredCount: 1, anyOf: icSupport })
    ]) }),
    Object.freeze({ id: "IC-4", label: "Criterion 4 — patient ≤1 year of age", source: icCriterionSource, allOf: Object.freeze([icItem("age-one-or-younger", "Patient ≤1 year of age")]), groups: Object.freeze([
      Object.freeze({ id: "IC-4-findings", label: "At least two signs or symptoms", minimumRequiredCount: 2, anyOf: icInfantFindings }),
      Object.freeze({ id: "IC-4-support", label: "At least one supporting test", minimumRequiredCount: 1, anyOf: icSupport })
    ]) })
  ]),
  exclusions: Object.freeze([icItem("other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "IC-note-equivocal-imaging", text: "Equivocal imaging qualifies only when supported by clinical correlation, specifically physician or physician-designee documentation of antimicrobial treatment for intracranial infection.", source: icCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "IC-report-encephalitis", text: "Report as MEN if meningitis (MEN) and encephalitis (IC) are present together.", source: icInstructionSource }),
    Object.freeze({ id: "IC-report-abscess", text: "Report as IC if meningitis (MEN) and a brain abscess (IC) are present together after operation.", source: icInstructionSource }),
    Object.freeze({ id: "IC-report-spinal", text: "Report as SA if meningitis (MEN) and spinal abscess/infection (SA) are present together.", source: icInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: icAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete IC definition is met", source: icAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the IC criterion", source: icAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the IC secondary BSI attribution period (or in the infection window when used as a criterion element)", source: icAttributionSource })
  ]) })
});
