import { source } from "../source.js";

const decuCriterionSource = source("17-26", 27, "DECU — Decubitus ulcer infection (also known as pressure injury infection), including both superficial and deep infections", "DECU");
const decuAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "DECU.secondary-bsi");
const decuItem = (id, label, options = {}) => Object.freeze({ id, label, source: decuCriterionSource, ...options });
const symptom = (id, label) => decuItem(id, `${label}, with no other recognized cause`, { exclusionId: `${id}-other-cause` });
const otherCause = (symptomId, label) => Object.freeze({
  id: `${symptomId}-other-cause`,
  label: `Another recognized cause applies to ${label}`,
  source: decuCriterionSource,
  type: "exclusion"
});

const symptoms = Object.freeze([
  symptom("decu-edge-erythema", "Erythema of decubitus wound edges"),
  symptom("decu-edge-tenderness", "Tenderness of decubitus wound edges"),
  symptom("decu-edge-swelling", "Swelling of decubitus wound edges")
]);

const microbiology = Object.freeze([
  decuItem("decu-margin-aspirate-or-biopsy-culture", "Organism(s) identified by culture from needle aspiration of fluid or biopsy of tissue from the decubitus ulcer margin, performed for clinical diagnosis or treatment (not ASC/AST)"),
  decuItem("decu-margin-aspirate-or-biopsy-non-culture", "Organism(s) identified by a non-culture based microbiologic testing method from needle aspiration of fluid or biopsy of tissue from the decubitus ulcer margin, performed for clinical diagnosis or treatment (not ASC/AST)")
]);

export const decuDefinition = Object.freeze({
  majorCategoryCode: "SST",
  majorCategoryName: "Skin and Soft Tissue Infection",
  siteCode: "DECU",
  siteName: "Decubitus ulcer infection (also known as pressure injury infection), including both superficial and deep infections",
  source: decuCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({
      id: "DECU-1",
      label: "Criterion 1 — wound-edge findings and qualifying margin specimen",
      source: decuCriterionSource,
      allOf: Object.freeze([]),
      groups: Object.freeze([
        Object.freeze({ id: "DECU-1-symptoms", label: "At least two qualifying signs or symptoms at the decubitus wound edges", minimumRequiredCount: 2, anyOf: symptoms }),
        Object.freeze({ id: "DECU-1-microbiology", label: "Organism identification from an eligible needle aspirate or tissue biopsy of the decubitus ulcer margin", minimumRequiredCount: 1, anyOf: microbiology })
      ])
    })
  ]),
  exclusions: Object.freeze([
    otherCause("decu-edge-erythema", "erythema of the decubitus wound edges"),
    otherCause("decu-edge-tenderness", "tenderness of the decubitus wound edges"),
    otherCause("decu-edge-swelling", "swelling of the decubitus wound edges")
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "DECU-note-specimen", text: "The eligible site specimen is limited to needle aspiration of fluid or biopsy of tissue from the decubitus ulcer margin; a superficial wound specimen is not an element of DECU.", source: decuCriterionSource }),
    Object.freeze({ id: "DECU-note-boundary", text: "DECU is the site-specific definition for a decubitus ulcer (pressure injury) infection, including superficial and deep infection; SKIN and ST evidence is not substituted for this criterion.", source: decuCriterionSource })
  ]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: decuAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete DECU definition is met", source: decuAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the DECU site specimen", source: decuAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the DECU secondary BSI attribution period", source: decuAttributionSource })
  ]) })
});
