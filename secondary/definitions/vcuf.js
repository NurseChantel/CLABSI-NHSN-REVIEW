import { vcufCriterionSource, vcufInstructionSource, vcufAttributionSource } from "../source.js";

const vcufItem = (id, label) => Object.freeze({ id, label, source: vcufCriterionSource });
export const vcufDefinition = Object.freeze({
  majorCategoryCode: "REPR", majorCategoryName: "Reproductive Tract Infection", siteCode: "VCUF", siteName: "Vaginal cuff infection",
  source: vcufCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "VCUF-1", label: "Criterion 1 — purulent drainage", source: vcufCriterionSource, allOf: Object.freeze([
      vcufItem("vcuf-purulent-drainage", "Purulent drainage from the vaginal cuff")
    ]) }),
    Object.freeze({ id: "VCUF-2", label: "Criterion 2 — abscess or other evidence of infection", source: vcufCriterionSource, allOf: Object.freeze([
      vcufItem("vcuf-abscess-or-infection-evidence", "Abscess or other evidence of infection at the vaginal cuff on gross anatomic examination or invasive procedure")
    ]) }),
    Object.freeze({ id: "VCUF-3", label: "Criterion 3 — organism from vaginal cuff fluid or tissue", source: vcufCriterionSource, allOf: Object.freeze([
      vcufItem("vcuf-cuff-fluid-tissue-organism", "Organism(s) identified from fluid or tissue from the vaginal cuff by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]) })
  ]),
  exclusions: Object.freeze([]),
  notes: Object.freeze([
    Object.freeze({ id: "VCUF-note-site-definition-timing", text: "The VCUF site definition does not make a hysterectomy procedure or the SSI surveillance period a qualifying element; those facts determine SSI reporting under the separate reporting instruction.", source: vcufInstructionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "VCUF-report-ssi", text: "Report vaginal cuff infections as SSI-VCUF when the date of event occurs within the 30-day surveillance period following a hysterectomy procedure.", source: vcufInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: vcufAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete VCUF definition is met", source: vcufAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the VCUF criterion", source: vcufAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the VCUF secondary BSI attribution period (or in the infection window when used as a criterion element)", source: vcufAttributionSource })
  ]) })
});
