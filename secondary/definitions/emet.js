import { emetCriterionSource, emetInstructionSource, emetAttributionSource } from "../source.js";

const emetItem = (id, label, options = {}) => Object.freeze({ id, label, source: emetCriterionSource, ...options });
export const emetDefinition = Object.freeze({
  majorCategoryCode: "REPR", majorCategoryName: "Reproductive Tract Infection", siteCode: "EMET", siteName: "Endometritis",
  source: emetCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "EMET-1", label: "Criterion 1 — organism from endometrial fluid or tissue", source: emetCriterionSource, allOf: Object.freeze([
      emetItem("emet-endometrial-organism", "Organism(s) identified from endometrial fluid or tissue by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]) }),
    Object.freeze({ id: "EMET-2", label: "Criterion 2 — suspected endometritis and at least two signs or symptoms", source: emetCriterionSource, allOf: Object.freeze([
      emetItem("emet-suspected", "Suspected endometritis")
    ]), groups: Object.freeze([
      Object.freeze({ id: "EMET-2-findings", label: "At least two qualifying signs or symptoms", minimumRequiredCount: 2, anyOf: Object.freeze([
        emetItem("emet-fever", "Fever (>38.0°C)"),
        emetItem("emet-pain-tenderness", "Pain or tenderness (uterine or abdominal), with no other recognized cause", { exclusionId: "emet-other-recognized-cause" }),
        emetItem("emet-purulent-drainage", "Purulent drainage from uterus")
      ]) })
    ]) })
  ]),
  exclusions: Object.freeze([
    emetItem("emet-other-recognized-cause", "Another recognized cause applies to uterine or abdominal pain or tenderness", { type: "exclusion" })
  ]),
  notes: Object.freeze([]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "EMET-report-chorioamnionitis", text: "Do not report an HAI chorioamnionitis as EMET; see OREP.", source: emetInstructionSource }),
    Object.freeze({ id: "EMET-report-poa-chorioamnionitis", text: "Do not report subsequent postpartum endometritis after a vaginal delivery as an HAI when the patient is admitted with POA chorioamnionitis (OREP).", source: emetInstructionSource }),
    Object.freeze({ id: "EMET-report-cesarean", text: "Report organ-space SSI-EMET when a C-section was performed on a patient with chorioamnionitis and the patient later develops endometritis.", source: emetInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: emetAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete EMET definition is met", source: emetAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the EMET criterion", source: emetAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the EMET secondary BSI attribution period (or in the infection window when used as a criterion element)", source: emetAttributionSource })
  ]) })
});
