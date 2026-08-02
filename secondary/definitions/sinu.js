import { source } from "../source.js";

const sinuCriterionSource = source("17-17", 18, "SINU — Sinusitis", "SINU");
const sinuAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "SINU.secondary-bsi");
const sinuItem = (id, label, options = {}) => Object.freeze({ id, label, source: sinuCriterionSource, ...options });
const otherCause = { exclusionId: "sinu-other-recognized-cause" };
const criterion = (id, label, allOf = [], groups = []) => Object.freeze({ id, label, source: sinuCriterionSource, allOf: Object.freeze(allOf), groups: Object.freeze(groups) });

export const sinuDefinition = Object.freeze({
  majorCategoryCode: "EENT",
  majorCategoryName: "Eye, Ear, Nose, Throat, or Mouth Infection",
  siteCode: "SINU",
  siteName: "Sinusitis",
  source: sinuCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    criterion("SINU-1", "Criterion 1 — organism from invasively obtained sinus-cavity fluid or tissue", [
      sinuItem("sinu-invasive-fluid-tissue-organism", "Organism(s) identified from fluid or tissue from the sinus cavity obtained during an invasive procedure by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]),
    criterion("SINU-2", "Criterion 2 — qualifying clinical finding and imaging evidence", [
      sinuItem("sinu-imaging-evidence", "Imaging test evidence of sinusitis (for example, x-ray or CT scan)")
    ], [
      Object.freeze({
        id: "SINU-2-findings",
        label: "At least one qualifying sinusitis sign or symptom, with no other recognized cause",
        minimumRequiredCount: 1,
        anyOf: Object.freeze([
          sinuItem("sinu-fever", "Fever (>38.0°C)"),
          sinuItem("sinu-pain-tenderness", "Pain or tenderness over the involved sinus, with no other recognized cause", otherCause),
          sinuItem("sinu-headache", "Headache, with no other recognized cause", otherCause),
          sinuItem("sinu-purulent-exudate", "Purulent exudate, with no other recognized cause", otherCause),
          sinuItem("sinu-nasal-obstruction", "Nasal obstruction, with no other recognized cause", otherCause)
        ])
      })
    ])
  ]),
  exclusions: Object.freeze([
    sinuItem("sinu-other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "SINU-note-asterisk", text: "Pain or tenderness over the involved sinus, headache, purulent exudate, and nasal obstruction qualify only when there is no other recognized cause.", source: sinuCriterionSource })
  ]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({
    lockedUntilSiteDefinitionMet: true,
    source: sinuAttributionSource,
    eligibleScenario1Criteria: Object.freeze(["SINU-1"]),
    eligibleScenario2Criteria: Object.freeze([]),
    requirements: Object.freeze([
      Object.freeze({ id: "site-definition", label: "A complete SINU definition is met", source: sinuAttributionSource }),
      Object.freeze({ id: "organism-relationship", label: "The blood organism has the required NHSN relationship to an organism identified from the SINU site specimen", source: sinuAttributionSource }),
      Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the SINU secondary BSI attribution period", source: sinuAttributionSource })
    ])
  })
});
