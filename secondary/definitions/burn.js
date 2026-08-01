import { source } from "../source.js";

const burnCriterionSource = source("17-25", 26, "BURN — Burn infection", "BURN");
const burnInstructionSource = source("17-25", 26, "BURN — Reporting Instructions", "BURN.reporting-instructions");
const burnAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "BURN.secondary-bsi");
const burnItem = (id, label) => Object.freeze({ id, label, source: burnCriterionSource });

export const burnDefinition = Object.freeze({
  majorCategoryCode: "SST",
  majorCategoryName: "Skin and Soft Tissue Infection",
  siteCode: "BURN",
  siteName: "Burn infection",
  source: burnCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({
      id: "BURN-1",
      label: "Criterion 1 — burn wound change and organism identified from blood",
      source: burnCriterionSource,
      allOf: Object.freeze([
        burnItem("burn-wound-appearance-change", "Change in burn wound appearance or character, such as rapid eschar separation or dark brown, black, or violaceous discoloration of the eschar"),
        burnItem("burn-blood-organism", "Organism(s) identified from blood by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
      ]),
      groups: Object.freeze([])
    })
  ]),
  exclusions: Object.freeze([
    Object.freeze({ id: "burn-permanent-autograft", label: "The infection is in a permanent skin graft (autograft) over a burn wound; apply SKIN or ST criteria instead of BURN", source: burnInstructionSource, type: "alternate-site-routing", disqualifiesSite: true })
  ]),
  hardExclusionIds: Object.freeze(["burn-permanent-autograft"]),
  notes: Object.freeze([
    Object.freeze({ id: "BURN-note-blood-only", text: "The BURN criterion requires organism identification from blood; a burn-wound culture, drainage, fever, provider diagnosis, operative finding, or pathology finding is not listed as a BURN criterion element.", source: burnCriterionSource }),
    Object.freeze({ id: "BURN-note-boundary", text: "BURN has its own complete criterion; evidence from SKIN, ST, or DECU is not substituted for either required BURN element.", source: burnCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "BURN-report-temporary-cover", text: "Report BURN in the setting of an infected burn covered with a temporary graft or dressing.", source: burnInstructionSource }),
    Object.freeze({ id: "BURN-report-autograft", text: "For a permanent skin graft (autograft) over a burn wound, use the SKIN or ST criteria.", source: burnInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: burnAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete BURN definition is met", source: burnAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism used as the microbiologic element of the BURN criterion satisfies the NHSN organism relationship", source: burnAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen used as a BURN criterion element is collected in the BURN infection window period", source: burnAttributionSource })
  ]) })
});
