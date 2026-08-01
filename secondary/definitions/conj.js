import { source } from "../source.js";

const conjCriterionSource = source("17-15", 16, "CONJ — Conjunctivitis", "CONJ");
const conjInstructionSource = source("17-15", 16, "CONJ — Reporting Instructions", "CONJ.reporting-instructions");
const conjAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "CONJ.secondary-bsi");
const conjItem = (id, label, options = {}) => Object.freeze({ id, label, source: conjCriterionSource, ...options });

const clinicalFindings = Object.freeze([
  conjItem("conj-pain", "Pain of conjunctiva or around eye"),
  conjItem("conj-erythema", "Erythema of conjunctiva or around eye"),
  conjItem("conj-swelling", "Swelling of conjunctiva or around eye")
]);

const supportingEvidence = Object.freeze([
  conjItem("conj-site-organism", "Organism(s) identified from conjunctival scraping or purulent exudate obtained from the conjunctiva or contiguous tissues (for example, eyelid, cornea, meibomian glands, or lacrimal glands) by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)"),
  conjItem("conj-exudate-gram-stain", "White blood cells and organism(s) seen on Gram stain of exudate"),
  conjItem("conj-purulent-exudate", "Purulent exudate"),
  conjItem("conj-multinucleated-giant-cells", "Multinucleated giant cells seen on microscopic examination of conjunctival exudate or scrapings"),
  conjItem("conj-diagnostic-antibody", "Diagnostic single antibody titer (IgM) or 4-fold increase in paired sera (IgG) for organism")
]);

export const conjDefinition = Object.freeze({
  majorCategoryCode: "EENT",
  majorCategoryName: "Eye, Ear, Nose, Throat, or Mouth Infection",
  siteCode: "CONJ",
  siteName: "Conjunctivitis",
  source: conjCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({
      id: "CONJ-1",
      label: "Criterion 1 — clinical finding and supporting evidence",
      source: conjCriterionSource,
      allOf: Object.freeze([]),
      groups: Object.freeze([
        Object.freeze({ id: "CONJ-1-findings", label: "At least one qualifying sign or symptom", minimumRequiredCount: 1, anyOf: clinicalFindings }),
        Object.freeze({ id: "CONJ-1-support", label: "At least one qualifying microbiologic, laboratory, or exudate finding", minimumRequiredCount: 1, anyOf: supportingEvidence })
      ])
    })
  ]),
  exclusions: Object.freeze([
    Object.freeze({ id: "conj-chemical-conjunctivitis", label: "Chemical conjunctivitis caused by silver nitrate (AgNO3)", source: conjInstructionSource, type: "exclusion", disqualifiesSite: true }),
    Object.freeze({ id: "conj-part-of-other-viral-illness", label: "Conjunctivitis occurs as part of another viral illness; do not report a separate CONJ case (for example, apply UR when appropriate)", source: conjInstructionSource, type: "alternate-site-routing", disqualifiesSite: true })
  ]),
  hardExclusionIds: Object.freeze(["conj-chemical-conjunctivitis", "conj-part-of-other-viral-illness"]),
  notes: Object.freeze([
    Object.freeze({ id: "CONJ-note-complete-pair", text: "A clinical finding and one listed supporting finding are both required; redness, drainage, culture, or diagnosis alone does not meet CONJ.", source: conjCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "CONJ-report-eye", text: "Report other infections of the eye as EYE.", source: conjInstructionSource }),
    Object.freeze({ id: "CONJ-report-viral-illness", text: "Do not report a separate CONJ case when conjunctivitis occurs as part of another viral illness (for example, UR).", source: conjInstructionSource }),
    Object.freeze({ id: "CONJ-report-chemical", text: "Do not report chemical conjunctivitis caused by silver nitrate (AgNO3) as a healthcare-associated infection.", source: conjInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: conjAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete CONJ definition is met", source: conjAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism has the required NHSN relationship to the organism identified from the CONJ site specimen", source: conjAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the CONJ secondary BSI attribution period", source: conjAttributionSource })
  ]) })
});
