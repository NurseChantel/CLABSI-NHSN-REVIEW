import { source } from "../source.js";

const urCriterionSource = source("17-18", 19, "UR — Upper respiratory tract infection, pharyngitis, laryngitis, epiglottitis", "UR");
const urAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "UR.secondary-bsi");
const urItem = (id, label, options = {}) => Object.freeze({ id, label, source: urCriterionSource, ...options });
const otherCause = { exclusionId: "ur-other-recognized-cause" };
const criterion = (id, label, allOf = [], groups = [], options = {}) => Object.freeze({ id, label, source: urCriterionSource, allOf: Object.freeze(allOf), groups: Object.freeze(groups), ...options });

const supportGroup = (id) => Object.freeze({
  id,
  label: "At least one qualifying microbiology, antibody, or diagnosis finding",
  minimumRequiredCount: 1,
  anyOf: Object.freeze([
    urItem(`${id}-upper-respiratory-organism`, "Organism(s) identified from an upper respiratory site (nasal cavity, larynx, nasopharynx, pharynx, or epiglottis) by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST); sputum and tracheal aspirate are excluded because they are not upper respiratory specimens"),
    urItem(`${id}-diagnostic-antibody`, "Diagnostic single antibody titer (IgM) or fourfold increase in paired sera (IgG) for organism"),
    urItem(`${id}-physician-diagnosis`, "Physician or physician designee diagnosis of an upper respiratory infection")
  ])
});

export const urDefinition = Object.freeze({
  majorCategoryCode: "EENT",
  majorCategoryName: "Eye, Ear, Nose, Throat, or Mouth Infection",
  siteCode: "UR",
  siteName: "Upper respiratory tract infection, pharyngitis, laryngitis, epiglottitis",
  source: urCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    criterion("UR-1", "Criterion 1 — at least two clinical findings and supporting evidence", [], [
      Object.freeze({
        id: "UR-1-findings",
        label: "At least two qualifying upper respiratory signs or symptoms",
        minimumRequiredCount: 2,
        anyOf: Object.freeze([
          urItem("ur-1-fever", "Fever (>38.0°C)"),
          urItem("ur-1-pharynx-erythema", "Erythema of pharynx, with no other recognized cause", otherCause),
          urItem("ur-1-sore-throat", "Sore throat, with no other recognized cause", otherCause),
          urItem("ur-1-cough", "Cough, with no other recognized cause", otherCause),
          urItem("ur-1-hoarseness", "Hoarseness, with no other recognized cause", otherCause),
          urItem("ur-1-tachypnea", "Tachypnea, with no other recognized cause", otherCause),
          urItem("ur-1-nasal-discharge", "Nasal discharge, with no other recognized cause", otherCause),
          urItem("ur-1-purulent-throat-exudate", "Purulent exudate in throat, with no other recognized cause", otherCause)
        ])
      }),
      supportGroup("ur-1-support")
    ]),
    criterion("UR-2", "Criterion 2 — abscess demonstrated by an eligible examination or imaging method", [], [
      Object.freeze({
        id: "UR-2-abscess",
        label: "Abscess shown by at least one NHSN-permitted method",
        minimumRequiredCount: 1,
        anyOf: Object.freeze([
          urItem("ur-2-gross-anatomic-abscess", "Abscess on gross anatomic exam"),
          urItem("ur-2-histopathologic-abscess", "Abscess on histopathologic exam"),
          urItem("ur-2-imaging-abscess", "Abscess on imaging test")
        ])
      })
    ]),
    criterion("UR-3", "Criterion 3 — patient ≤1 year of age, at least two clinical findings, and supporting evidence", [
      urItem("ur-3-age-one-or-younger", "Patient ≤1 year of age")
    ], [
      Object.freeze({
        id: "UR-3-findings",
        label: "At least two qualifying infant signs or symptoms",
        minimumRequiredCount: 2,
        anyOf: Object.freeze([
          urItem("ur-3-fever", "Fever (>38.0°C)"),
          urItem("ur-3-hypothermia", "Hypothermia (<36.0°C)"),
          urItem("ur-3-apnea", "Apnea, with no other recognized cause", otherCause),
          urItem("ur-3-bradycardia", "Bradycardia, with no other recognized cause", otherCause),
          urItem("ur-3-nasal-discharge", "Nasal discharge, with no other recognized cause", otherCause),
          urItem("ur-3-purulent-throat-exudate", "Purulent exudate in throat, with no other recognized cause", otherCause)
        ])
      }),
      supportGroup("ur-3-support")
    ], { ageApplicability: "infant" })
  ]),
  exclusions: Object.freeze([
    urItem("ur-other-recognized-cause", "Another recognized cause applies to a selected sign or symptom marked by NHSN with an asterisk", { type: "exclusion" }),
    urItem("ur-sputum-or-tracheal-aspirate", "The only microbiology evidence is from sputum or tracheal aspirate; NHSN excludes these because they are not upper respiratory specimens", { type: "exclusion" })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "UR-note-cause", text: "Findings marked with an asterisk qualify only when there is no other recognized cause.", source: urCriterionSource }),
    Object.freeze({ id: "UR-note-specimens", text: "Eligible upper respiratory sites are specifically the nasal cavity, larynx, nasopharynx, pharynx, and epiglottis. Sputum and tracheal aspirate are excluded.", source: urCriterionSource })
  ]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({
    lockedUntilSiteDefinitionMet: true,
    source: urAttributionSource,
    eligibleScenario1Criteria: Object.freeze(["UR-1a", "UR-3a"]),
    eligibleScenario2Criteria: Object.freeze([]),
    requirements: Object.freeze([
      Object.freeze({ id: "site-definition", label: "A complete UR definition is met", source: urAttributionSource }),
      Object.freeze({ id: "organism-relationship", label: "The blood organism has the required NHSN matching relationship to an organism identified from the eligible upper respiratory site specimen used to meet UR 1a or UR 3a", source: urAttributionSource }),
      Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the UR secondary BSI attribution period", source: urAttributionSource })
    ])
  })
});
