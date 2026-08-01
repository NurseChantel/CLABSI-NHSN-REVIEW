import { episCriterionSource, episAttributionSource } from "../source.js";

const episItem = (id, label) => Object.freeze({ id, label, source: episCriterionSource });
const episPostpartumVaginalDelivery = episItem("epis-postpartum-vaginal-delivery", "Patient had a postpartum vaginal delivery");
export const episDefinition = Object.freeze({
  majorCategoryCode: "REPR", majorCategoryName: "Reproductive Tract Infection", siteCode: "EPIS", siteName: "Episiotomy infection",
  source: episCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "EPIS-1", label: "Criterion 1 — purulent drainage from episiotomy site", source: episCriterionSource, allOf: Object.freeze([
      episPostpartumVaginalDelivery,
      episItem("epis-purulent-drainage", "Purulent drainage from the episiotomy site")
    ]) }),
    Object.freeze({ id: "EPIS-2", label: "Criterion 2 — episiotomy abscess", source: episCriterionSource, allOf: Object.freeze([
      episPostpartumVaginalDelivery,
      episItem("epis-abscess", "Episiotomy abscess")
    ]) })
  ]),
  exclusions: Object.freeze([]),
  notes: Object.freeze([]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: episAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete EPIS definition is met", source: episAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the EPIS criterion", source: episAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the EPIS secondary BSI attribution period (or in the infection window when used as a criterion element)", source: episAttributionSource })
  ]) })
});
