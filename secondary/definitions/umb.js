import { source } from "../source.js";

const umbCriterionSource = source("17-27", 28, "UMB — Omphalitis", "UMB");
const umbInstructionSource = source("17-27", 28, "UMB — Reporting Instructions", "UMB.reporting-instructions");
const umbAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "UMB.secondary-bsi");
const umbItem = (id, label) => Object.freeze({ id, label, source: umbCriterionSource });

const age = () => umbItem("umb-age-30-days-or-younger", "Patient is ≤30 days old");
const erythemaOrDrainage = Object.freeze({
  id: "UMB-1-clinical",
  label: "At least one qualifying umbilical clinical finding",
  minimumRequiredCount: 1,
  anyOf: Object.freeze([
    umbItem("umb-erythema", "Erythema of the umbilicus"),
    umbItem("umb-drainage", "Drainage from the umbilicus")
  ])
});

export const umbDefinition = Object.freeze({
  majorCategoryCode: "SST",
  majorCategoryName: "Skin and Soft Tissue Infection",
  siteCode: "UMB",
  siteName: "Omphalitis",
  source: umbCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({
      id: "UMB-1a",
      label: "Criterion 1a — umbilical finding and organism from drainage or needle aspirate",
      source: umbCriterionSource,
      allOf: Object.freeze([age(), umbItem("umb-drainage-or-aspirate-organism", "Organism(s) identified from drainage or needle aspirate of the umbilicus by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]),
      groups: Object.freeze([erythemaOrDrainage])
    }),
    Object.freeze({
      id: "UMB-1b",
      label: "Criterion 1b — umbilical finding and organism from blood",
      source: umbCriterionSource,
      allOf: Object.freeze([age(), umbItem("umb-blood-organism", "Organism(s) identified from blood by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]),
      groups: Object.freeze([erythemaOrDrainage])
    }),
    Object.freeze({
      id: "UMB-2",
      label: "Criterion 2 — erythema and purulence at the umbilicus",
      source: umbCriterionSource,
      allOf: Object.freeze([
        age(),
        umbItem("umb-erythema", "Erythema of the umbilicus"),
        umbItem("umb-purulence", "Purulence at the umbilicus")
      ]),
      groups: Object.freeze([])
    })
  ]),
  exclusions: Object.freeze([
    Object.freeze({ id: "umb-umbilical-catheter-vessel-infection", label: "Infection is of an umbilical artery or vein related to an umbilical catheter; apply VASC or LCBI according to the blood result instead of UMB", source: umbInstructionSource, type: "alternate-site-routing", disqualifiesSite: true })
  ]),
  hardExclusionIds: Object.freeze(["umb-umbilical-catheter-vessel-infection"]),
  notes: Object.freeze([
    Object.freeze({ id: "UMB-note-branches", text: "Drainage, erythema, a positive culture, or a provider diagnosis alone does not meet UMB; one complete criterion is required.", source: umbCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "UMB-report-vascular-catheter", text: "Report infection of an umbilical artery or vein related to an umbilical catheter as VASC when there is no accompanying positive blood result; when the blood result is positive, report LCBI.", source: umbInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: umbAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete UMB definition is met", source: umbAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "For UMB 1a, the blood contains at least one eligible matching organism to the site-specific specimen; for UMB 1b, the positive blood specimen is the criterion element", source: umbAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "For UMB 1a, the blood specimen is collected in the UMB secondary BSI attribution period; for UMB 1b, it is collected in the UMB infection window period", source: umbAttributionSource })
  ]) })
});
