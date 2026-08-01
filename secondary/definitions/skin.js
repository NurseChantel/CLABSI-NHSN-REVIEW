import { source } from "../source.js";

const skinCriterionSource = source("17-26", 27, "SKIN — Skin infection", "SKIN");
const skinInstructionSource = source("17-26–17-27", "27–28", "SKIN — Reporting Instructions", "SKIN.reporting-instructions");
const skinAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "SKIN.secondary-bsi");
const otherCauseId = "skin-other-recognized-cause";
const skinItem = (id, label, options = {}) => Object.freeze({ id, label, source: skinCriterionSource, ...options });
const finding = (id, label) => skinItem(id, `${label}, with no other recognized cause`, { exclusionId: otherCauseId });

const criterionOneFindings = Object.freeze([
  skinItem("skin-purulent-drainage", "Purulent drainage"),
  skinItem("skin-pustules", "Pustules"),
  skinItem("skin-vesicles", "Vesicles"),
  skinItem("skin-boils-not-acne", "Boils (excluding acne)")
]);
const localizedFindings = Object.freeze([
  finding("skin-localized-pain", "Localized pain"),
  finding("skin-localized-tenderness", "Localized tenderness"),
  finding("skin-localized-swelling", "Localized swelling"),
  finding("skin-erythema", "Erythema"),
  finding("skin-heat", "Heat")
]);
const supportingEvidence = Object.freeze([
  skinItem("skin-site-organism", "Organism(s) identified from aspirate or drainage from the affected site by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST); identification of two or more common commensal organisms without a recognized pathogen is not eligible"),
  skinItem("skin-tissue-multinucleated-giant-cells", "Multinucleated giant cells seen on microscopic examination of affected tissue"),
  skinItem("skin-diagnostic-antibody", "Diagnostic single antibody titer (IgM) or fourfold increase in paired sera (IgG) for the organism")
]);
const route = (id, label) => Object.freeze({ id, label, source: skinInstructionSource, type: "alternate-site-routing", disqualifiesSite: true });

export const skinDefinition = Object.freeze({
  majorCategoryCode: "SST", majorCategoryName: "Skin and Soft Tissue Infection", siteCode: "SKIN", siteName: "Skin infection (skin and/or subcutaneous) excluding decubitus ulcers, burns, and infections at vascular access sites",
  source: skinCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "SKIN-1", label: "Criterion 1 — qualifying drainage or skin lesion", source: skinCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      Object.freeze({ id: "SKIN-1-findings", label: "At least one qualifying finding", minimumRequiredCount: 1, anyOf: criterionOneFindings })
    ]) }),
    Object.freeze({ id: "SKIN-2", label: "Criterion 2 — localized findings and supporting evidence", source: skinCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      Object.freeze({ id: "SKIN-2-findings", label: "At least two localized signs or symptoms", minimumRequiredCount: 2, anyOf: localizedFindings }),
      Object.freeze({ id: "SKIN-2-support", label: "At least one qualifying microbiologic, microscopic, or serologic result", minimumRequiredCount: 1, anyOf: supportingEvidence })
    ]) })
  ]),
  exclusions: Object.freeze([
    route("skin-decubitus-ulcer", "Infection is of a decubitus ulcer; apply DECU instead of SKIN"),
    route("skin-burn-infection", "Infection is of a burn, including an infected burn covered by a temporary graft or dressing; apply BURN instead of SKIN"),
    route("skin-vascular-access-site", "Localized infection is at a vascular access site; apply VASC unless an organism identified from blood meets LCBI criteria, in which case report LCBI"),
    route("skin-omphalitis", "Infection is omphalitis in an infant; apply UMB instead of SKIN"),
    route("skin-circumcision-site", "Infection is of a newborn circumcision site; apply CIRC instead of SKIN"),
    route("skin-breast-infection", "Infection is a breast abscess or mastitis; apply BRST instead of SKIN (and assess SSI when identified after an NHSN operative procedure)"),
    Object.freeze({ id: "skin-acne", label: "Acne is not reported as a skin/soft tissue HAI", source: skinInstructionSource, type: "exclusion", disqualifiesSite: true }),
    Object.freeze({ id: otherCauseId, label: "Another recognized cause applies to a localized sign or symptom marked by NHSN with an asterisk", source: skinCriterionSource, type: "exclusion" })
  ]),
  hardExclusionIds: Object.freeze(["skin-decubitus-ulcer", "skin-burn-infection", "skin-vascular-access-site", "skin-omphalitis", "skin-circumcision-site", "skin-breast-infection", "skin-acne"]),
  notes: Object.freeze([
    Object.freeze({ id: "SKIN-note-common-commensals", text: "Two or more common commensal organisms without a recognized pathogen are not eligible for criterion 2a; the NHSN Terminology Browser supplies the common-commensal list.", source: skinCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "SKIN-report-autograft", text: "Report SKIN or ST criteria in the setting of a permanent skin graft (autograft) over a burn wound.", source: skinInstructionSource }),
    Object.freeze({ id: "SKIN-report-acne", text: "Do not report acne as a skin/soft tissue HAI.", source: skinInstructionSource }),
    Object.freeze({ id: "SKIN-report-routes", text: "Use the NHSN site-specific definitions identified in the alternate-site routing exclusions for UMB, CIRC, DECU, BURN, BRST, and VASC/LCBI.", source: skinInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: skinAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete SKIN definition is met", source: skinAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the SKIN criterion", source: skinAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the SKIN secondary BSI attribution period (or in the infection window when used as a criterion element)", source: skinAttributionSource })
  ]) })
});
