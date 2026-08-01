import { necSource, necChapter17Source, necAttributionSource } from "../source.js";

const necItem = (id, label, options = {}) => Object.freeze({ id, label, source: necSource, ...options });
const necAge = necItem("nec-age-one-or-younger", "Infant is ≤1 year of age");
const necClinical = Object.freeze([
  necItem("nec-bilious-aspirate", "Bilious aspirate (excluding aspirate from a transpyloric feeding tube)", { exclusionId: "nec-transpyloric-bilious-aspirate" }),
  necItem("nec-vomiting", "Vomiting"),
  necItem("nec-abdominal-distention", "Abdominal distention"),
  necItem("nec-blood-in-stool", "Occult or gross blood in stools (with no rectal fissure)", { exclusionId: "nec-rectal-fissure" })
]);
const necClinicalGroup = (id) => Object.freeze({ id, label: "At least one qualifying clinical sign", minimumRequiredCount: 1, anyOf: necClinical });
const necDiagnosticCriterion = (id, label, imaging) => Object.freeze({ id, label, source: necSource, allOf: Object.freeze([necAge, ...imaging]), groups: Object.freeze([necClinicalGroup(`${id}-clinical`)]) });

export const necDefinition = Object.freeze({
  majorCategoryCode: "GI", majorCategoryName: "Gastrointestinal System Infection", siteCode: "NEC", siteName: "Necrotizing enterocolitis",
  source: necSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  patientAgeApplicability: "infant",
  criteria: Object.freeze([
    necDiagnosticCriterion("NEC-1a", "Criterion 1 — clinical sign and pneumatosis intestinalis", [
      necItem("nec-pneumatosis", "Pneumatosis intestinalis on abdominal imaging (an equivocal finding)"),
      necItem("nec-equivocal-imaging-treatment", "Physician or physician-designee documentation of antimicrobial treatment for NEC supports the equivocal imaging finding")
    ]),
    necDiagnosticCriterion("NEC-1b", "Criterion 1 — clinical sign and definitive portal venous gas", [necItem("nec-definitive-portal-venous-gas", "Definitive portal venous gas (hepatobiliary gas) on abdominal imaging")]),
    necDiagnosticCriterion("NEC-1c", "Criterion 1 — clinical sign and equivocal portal venous gas", [
      necItem("nec-equivocal-portal-venous-gas", "Equivocal portal venous gas (hepatobiliary gas) on abdominal imaging"),
      necItem("nec-equivocal-imaging-treatment", "Physician or physician-designee documentation of antimicrobial treatment for NEC supports the equivocal imaging finding")
    ]),
    necDiagnosticCriterion("NEC-1d", "Criterion 1 — clinical sign and definitive pneumoperitoneum", [necItem("nec-definitive-pneumoperitoneum", "Definitive pneumoperitoneum on abdominal imaging")]),
    necDiagnosticCriterion("NEC-1e", "Criterion 1 — clinical sign and equivocal pneumoperitoneum", [
      necItem("nec-equivocal-pneumoperitoneum", "Equivocal pneumoperitoneum on abdominal imaging"),
      necItem("nec-equivocal-imaging-treatment", "Physician or physician-designee documentation of antimicrobial treatment for NEC supports the equivocal imaging finding")
    ]),
    Object.freeze({ id: "NEC-2", label: "Criterion 2 — surgical NEC", source: necSource, allOf: Object.freeze([necAge]), groups: Object.freeze([
      Object.freeze({ id: "NEC-2-surgical", label: "At least one qualifying surgical finding", minimumRequiredCount: 1, anyOf: Object.freeze([
        necItem("nec-extensive-bowel-necrosis", "Surgical evidence of extensive bowel necrosis (>2 cm of bowel affected)"),
        necItem("nec-surgical-pneumatosis", "Surgical evidence of pneumatosis intestinalis, with or without intestinal perforation")
      ]) })
    ]) })
  ]),
  exclusions: Object.freeze([
    necItem("nec-transpyloric-bilious-aspirate", "The bilious aspirate is from a transpyloric feeding tube and is excluded", { type: "exclusion" }),
    necItem("nec-rectal-fissure", "A rectal fissure is present, so blood in stool does not qualify", { type: "exclusion" })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "NEC-note-purpose", text: "NEC definitions exist only to provide the exception for assigning a BSI secondary to NEC and must not be used for HAI surveillance.", source: necChapter17Source }),
    Object.freeze({ id: "NEC-note-imaging", text: "Pneumatosis is an equivocal abdominal imaging finding. Examples of abdominal imaging include KUB, ultrasound, or abdominal x-ray.", source: necSource }),
    Object.freeze({ id: "NEC-note-no-microbiology", text: "The NEC criteria contain neither a site-specific specimen nor an organism identified from blood.", source: necSource }),
    Object.freeze({ id: "NEC-note-age", text: "NEC criteria cannot be met in patients >1 year of age; review GIT for eligibility.", source: necSource })
  ]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, exception: "NEC", source: necAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "One complete NEC criterion is met", source: necAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an LCBI pathogen, or the same common commensal is identified from at least two blood specimens drawn on separate occasions on the same or consecutive calendar days", source: necAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The qualifying blood specimen(s) are collected during the NEC secondary BSI attribution period", source: necAttributionSource })
  ]) })
});

