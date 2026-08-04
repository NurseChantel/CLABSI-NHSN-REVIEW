import { pjiCriterionSource, pjiInstructionSource, pjiAttributionSource } from "../source.js";

const pjiItem = (id, label, options = {}) => Object.freeze({ id, label, source: pjiCriterionSource, ...options });
const pjiRestriction = () => pjiItem("pji-organ-space-after-hpro-kpro", "PJI is for use as Organ/Space SSI following HPRO and KPRO only");
const pjiMinorCriteria = Object.freeze([
  Object.freeze({ id: "PJI-3-ab", label: "Minor criterion a or b (counts as one minor criterion)", anyOf: Object.freeze([
    pjiItem("pji-elevated-crp-and-esr", "Elevated serum C-reactive protein (CRP; >100 mg/L) and erythrocyte sedimentation rate (ESR; >30 mm/hr.)"),
    pjiItem("pji-leukocyte-esterase", "\"++\" (or greater) change on leukocyte esterase test strip of synovial fluid")
  ]) }),
  Object.freeze({ id: "pji-elevated-synovial-pmn-group", label: "Minor criterion", anyOf: Object.freeze([pjiItem("pji-elevated-synovial-pmn", "Elevated synovial fluid polymorphonuclear neutrophil percentage (PMN% >90%)")]) }),
  Object.freeze({ id: "pji-positive-histology-group", label: "Minor criterion", anyOf: Object.freeze([pjiItem("pji-positive-histology", "Positive histological analysis of periprosthetic tissue (>5 neutrophils (PMNs) per high power field)")]) }),
  Object.freeze({ id: "pji-single-specimen-organism-group", label: "Minor criterion", anyOf: Object.freeze([pjiItem("pji-single-specimen-organism", "Organism(s) identified from a single positive periprosthetic specimen (tissue or fluid) by culture or non-culture based microbiologic testing performed for clinical diagnosis and treatment (not ASC/AST)")]) }),
  Object.freeze({ id: "pji-alpha-defensin-group", label: "Minor criterion", anyOf: Object.freeze([pjiItem("pji-alpha-defensin", "Synovial fluid alpha-defensin positive")]) }),
  Object.freeze({ id: "pji-physician-diagnosis-group", label: "Minor criterion", anyOf: Object.freeze([pjiItem("pji-physician-diagnosis", "Physician diagnosis of periprosthetic joint infection")]) }),
]);

export const pjiDefinition = Object.freeze({
  majorCategoryCode: "BJ", majorCategoryName: "Bone and Joint Infection", siteCode: "PJI", siteName: "Periprosthetic Joint Infection (for use as Organ/Space SSI following HPRO and KPRO only)",
  source: pjiCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "PJI-1", label: "Criterion 1 — two positive periprosthetic specimens", source: pjiCriterionSource, allOf: Object.freeze([
      pjiRestriction(), pjiItem("pji-two-positive-specimens", "Two positive periprosthetic specimens (tissue or fluid) with at least one matching organism, identified by culture or non-culture based microbiologic testing performed for clinical diagnosis and treatment (not ASC/AST)")
    ]) }),
    Object.freeze({ id: "PJI-2", label: "Criterion 2 — communicating sinus tract, purulence, or other gross evidence", source: pjiCriterionSource, allOf: Object.freeze([pjiRestriction()]), groups: Object.freeze([
      Object.freeze({ id: "PJI-2-evidence", label: "At least one operative or gross anatomic finding", minimumRequiredCount: 1, anyOf: Object.freeze([
        pjiItem("pji-sinus-tract", "A sinus tract communicating with the joint"), pjiItem("pji-purulence", "Purulence"), pjiItem("pji-other-gross-evidence", "Other gross anatomic evidence of infection")
      ]) })
    ]) }),
    Object.freeze({ id: "PJI-3", label: "Criterion 3 — three minor criteria", source: pjiCriterionSource, allOf: Object.freeze([pjiRestriction()]), groups: Object.freeze([
      Object.freeze({ id: "PJI-3-minor", label: "At least three minor criteria", minimumRequiredCount: 3, anyOf: pjiMinorCriteria })
    ]) })
  ]),
  exclusions: Object.freeze([]),
  notes: Object.freeze([
    Object.freeze({ id: "PJI-note-sinus", text: "A sinus tract is a narrow opening or passageway that can extend in any direction through soft tissue and results in dead space with potential for abscess formation.", source: pjiCriterionSource }),
    Object.freeze({ id: "PJI-note-matching", text: "A matching organism is defined on page 17-1.", source: pjiCriterionSource }),
    Object.freeze({ id: "PJI-note-hardware", text: "Organism(s) identified from hip or knee hardware can meet criterion 1, or a single hardware organism can meet criterion 3e.", source: pjiCriterionSource }),
    Object.freeze({ id: "PJI-note-imaging", text: "The PJI definition lists no imaging criterion.", source: pjiCriterionSource })
  ]),
  reportingInstructions: Object.freeze([Object.freeze({ id: "PJI-report-bone", text: "After an HPRO or a KPRO, if both organ space PJI and BONE are met, report the SSI as BONE.", source: pjiInstructionSource })]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: pjiAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete PJI definition is met", source: pjiAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the PJI criterion", source: pjiAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the PJI secondary BSI attribution period (or in the infection window when used as a criterion element)", source: pjiAttributionSource })
  ]) })
});
