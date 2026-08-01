import { menCriterionSource, menInstructionSource, attributionSource } from "../source.js";

const item = (id, label, options = {}) => Object.freeze({ id, label, source: menCriterionSource, ...options });
const labAlternatives = Object.freeze([
  item("csf-profile", "Increased white cells, elevated protein, and decreased glucose in CSF (per the reporting laboratory's reference range)"),
  item("csf-gram-stain", "Organism(s) seen on Gram stain of CSF"),
  item("blood-organism", "Organism(s) identified from blood by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)"),
  item("diagnostic-antibody", "Diagnostic single antibody titer (IgM) or 4-fold increase in paired sera (IgG) for organism")
]);
const suspected = item("suspected", "Suspected meningitis or ventriculitis");
const meningeal = item("meningeal-signs", "Meningeal sign(s), with no other recognized cause", { exclusionId: "other-recognized-cause" });
const cranial = item("cranial-nerve-signs", "Cranial nerve sign(s), with no other recognized cause", { exclusionId: "other-recognized-cause" });

export const menDefinition = Object.freeze({
  majorCategoryCode: "CNS", majorCategoryName: "Central Nervous System Infection", siteCode: "MEN", siteName: "Meningitis or ventriculitis",
  source: menCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "MEN-1", label: "Criterion 1 — CSF organism", source: menCriterionSource, allOf: Object.freeze([item("csf-organism", "Organism(s) identified from cerebrospinal fluid (CSF) by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "MEN-2", label: "Criterion 2 — suspected MEN, findings, and supporting test", source: menCriterionSource, allOf: Object.freeze([suspected]), groups: Object.freeze([
      Object.freeze({ id: "MEN-2-findings", label: "At least two finding groups", minimumRequiredCount: 2, anyOf: Object.freeze([
        Object.freeze({ id: "MEN-2-i", label: "Fever or headache (group i; this group alone cannot supply both required elements)", anyOf: Object.freeze([item("fever", "Fever (>38.0°C)"), item("headache", "Headache")]) }),
        Object.freeze({ id: "MEN-2-ii", label: "Meningeal signs (group ii)", anyOf: Object.freeze([meningeal]) }),
        Object.freeze({ id: "MEN-2-iii", label: "Cranial nerve signs (group iii)", anyOf: Object.freeze([cranial]) })
      ]) }),
      Object.freeze({ id: "MEN-2-support", label: "At least one supporting test", minimumRequiredCount: 1, anyOf: labAlternatives })
    ]) }),
    Object.freeze({ id: "MEN-3", label: "Criterion 3 — patient ≤1 year of age", source: menCriterionSource, allOf: Object.freeze([item("age-one-or-younger", "Patient ≤1 year of age"), suspected]), groups: Object.freeze([
      Object.freeze({ id: "MEN-3-findings", label: "At least two finding groups", minimumRequiredCount: 2, anyOf: Object.freeze([
        Object.freeze({ id: "MEN-3-i", label: "Age-specific signs (group i; this group alone cannot supply both required elements)", anyOf: Object.freeze([
          item("fever", "Fever (>38.0°C)"), item("hypothermia", "Hypothermia (<36.0°C)"), item("apnea", "Apnea, with no other recognized cause", { exclusionId: "other-recognized-cause" }), item("bradycardia", "Bradycardia, with no other recognized cause", { exclusionId: "other-recognized-cause" }), item("irritability", "Irritability, with no other recognized cause", { exclusionId: "other-recognized-cause" })
        ]) }),
        Object.freeze({ id: "MEN-3-ii", label: "Meningeal signs (group ii)", anyOf: Object.freeze([meningeal]) }),
        Object.freeze({ id: "MEN-3-iii", label: "Cranial nerve signs (group iii)", anyOf: Object.freeze([cranial]) })
      ]) }),
      Object.freeze({ id: "MEN-3-support", label: "At least one supporting test", minimumRequiredCount: 1, anyOf: labAlternatives })
    ]) })
  ]),
  exclusions: Object.freeze([item("other-recognized-cause", "Another recognized cause applies to a finding marked by NHSN with an asterisk", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "MEN-note-group-i", text: "Elements of group i alone may not be used to meet the two required elements in MEN 2 or MEN 3.", source: menCriterionSource }),
    Object.freeze({ id: "MEN-note-seizures", text: "Seizures do not meet the cranial nerve sign element for MEN 2 or MEN 3.", source: menInstructionSource }),
    Object.freeze({ id: "MEN-note-shunt", text: "Organisms identified from explanted ventricular shunts are eligible for MEN 1.", source: menInstructionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "MEN-report-shunt", text: "Report CSF shunt infection as SSI-MEN if it occurs within 90 days of placement; if later or after manipulation/access, it is CNS-MEN but is not reportable as an SSI.", source: menInstructionSource }),
    Object.freeze({ id: "MEN-report-encephalitis", text: "Report as MEN if meningitis (MEN) and encephalitis (IC) are present together.", source: menInstructionSource }),
    Object.freeze({ id: "MEN-report-abscess", text: "Report as IC if MEN and a brain abscess (IC) are present together after operation.", source: menInstructionSource }),
    Object.freeze({ id: "MEN-report-spinal", text: "Report as SA if MEN and spinal abscess/infection (SA) are present together.", source: menInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: attributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete MEN definition is met", source: attributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the MEN criterion", source: attributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the MEN secondary BSI attribution period (or in the infection window when used as a criterion element)", source: attributionSource })
  ]) })
});
