import { source } from "../source.js";

const eyeCriterionSource = source("17-16", 17, "EYE — Eye infection, other than conjunctivitis", "EYE");
const eyeAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "EYE.secondary-bsi");
const eyeItem = (id, label, options = {}) => Object.freeze({ id, label, source: eyeCriterionSource, ...options });
const otherCause = { exclusionId: "eye-other-recognized-cause" };

export const eyeDefinition = Object.freeze({
  majorCategoryCode: "EENT",
  majorCategoryName: "Eye, Ear, Nose, Throat, or Mouth Infection",
  siteCode: "EYE",
  siteName: "Eye infection, other than conjunctivitis",
  source: eyeCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({
      id: "EYE-1",
      label: "Criterion 1 — organism from anterior or posterior chamber or vitreous fluid",
      source: eyeCriterionSource,
      allOf: Object.freeze([
        eyeItem("eye-chamber-vitreous-organism", "Organism(s) identified from anterior or posterior chamber or vitreous fluid by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
      ]),
      groups: Object.freeze([])
    }),
    Object.freeze({
      id: "EYE-2",
      label: "Criterion 2 — at least two clinical findings and timely antimicrobial therapy",
      source: eyeCriterionSource,
      allOf: Object.freeze([
        eyeItem("eye-antimicrobial-therapy-within-two-days", "Physician or physician designee initiates antimicrobial therapy within two days of onset or worsening of symptoms")
      ]),
      groups: Object.freeze([
        Object.freeze({
          id: "EYE-2-findings",
          label: "At least two qualifying eye signs or symptoms",
          minimumRequiredCount: 2,
          anyOf: Object.freeze([
            eyeItem("eye-pain", "Eye pain, with no other recognized cause", otherCause),
            eyeItem("eye-visual-disturbance", "Visual disturbance, with no other recognized cause", otherCause),
            eyeItem("eye-hypopyon", "Hypopyon, with no other recognized cause", otherCause)
          ])
        })
      ])
    })
  ]),
  exclusions: Object.freeze([
    eyeItem("eye-other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" }),
    eyeItem("eye-conjunctivitis", "Conjunctivitis is excluded from EYE; evaluate the distinct CONJ site definition", { type: "alternate-site-routing", disqualifiesSite: true })
  ]),
  hardExclusionIds: Object.freeze(["eye-conjunctivitis"]),
  notes: Object.freeze([
    Object.freeze({ id: "EYE-note-boundary", text: "EYE is limited to eye infection other than conjunctivitis; conjunctivitis evidence does not satisfy either EYE criterion.", source: eyeCriterionSource }),
    Object.freeze({ id: "EYE-note-asterisk", text: "Each listed sign or symptom qualifies only when there is no other recognized cause.", source: eyeCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "EYE-report-conj", text: "Keep conjunctivitis separate from EYE and evaluate it under CONJ.", source: eyeCriterionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: eyeAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete EYE definition is met", source: eyeAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism has the required NHSN relationship to an organism identified from the EYE site specimen", source: eyeAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the EYE secondary BSI attribution period", source: eyeAttributionSource })
  ]) })
});
