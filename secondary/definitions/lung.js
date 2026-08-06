import { lungCriterionSource, lungInstructionSource, lungAttributionSource } from "../source.js";

const lungItem = (id, label, options = {}) => Object.freeze({ id, label, source: lungCriterionSource, ...options });

// Manual 17-22, criterion 1: the specimen must be lung tissue or pleural fluid. The
// pleural-fluid asterisk restricts eligibility to thoracentesis or collection within
// 24 hours of chest tube placement; the footnote on 17-23 makes a specimen collected
// after repositioning, or more than 24 hours after placement, ineligible.
const lungSpecimenEvidence = Object.freeze({
  id: "LUNG-1-specimen", label: "At least one qualifying lung tissue or eligible pleural fluid result", minimumRequiredCount: 1, anyOf: Object.freeze([
    lungItem("lung-tissue-gram-stain", "Organism(s) seen on Gram stain of lung tissue"),
    lungItem("lung-tissue-organism", "Organism(s) identified from lung tissue by a culture or non-culture based microbiologic testing method performed for purposes of clinical diagnosis or treatment (not ASC/AST)"),
    lungItem("lung-pleural-fluid-gram-stain", "Organism(s) seen on Gram stain of eligible pleural fluid", { exclusionId: "lung-ineligible-pleural-fluid" }),
    lungItem("lung-pleural-fluid-organism", "Organism(s) identified from eligible pleural fluid by a culture or non-culture based microbiologic testing method performed for purposes of clinical diagnosis or treatment (not ASC/AST)", { exclusionId: "lung-ineligible-pleural-fluid" })
  ])
});

const lungDefinitiveImaging = lungItem("lung-definitive-imaging", "Imaging test evidence of abscess or infection (excludes imaging test evidence of pneumonia)");
const lungEquivocalImaging = lungItem("lung-equivocal-imaging", "Imaging test evidence of abscess or infection is equivocal (excludes imaging test evidence of pneumonia)");
const lungImagingTreatment = lungItem("lung-antimicrobial-treatment", "Physician or physician-designee documentation of antimicrobial treatment for lung infection supports the equivocal imaging finding");

export const lungDefinition = Object.freeze({
  majorCategoryCode: "LRI", majorCategoryName: "Lower Respiratory System Infection, Other Than Pneumonia", siteCode: "LUNG", siteName: "Other infection of the lower respiratory tract and pleural cavity",
  source: lungCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "LUNG-1", label: "Criterion 1 — organism seen on Gram stain of, or identified from, lung tissue or eligible pleural fluid", source: lungCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([lungSpecimenEvidence]) }),
    Object.freeze({ id: "LUNG-2", label: "Criterion 2 — lung abscess or other evidence of infection on examination", source: lungCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      Object.freeze({ id: "LUNG-2-evidence", label: "At least one qualifying examination finding", minimumRequiredCount: 1, anyOf: Object.freeze([
        lungItem("lung-abscess-gross-anatomic", "Lung abscess or other evidence of infection (for example, empyema) on gross anatomic examination"),
        lungItem("lung-abscess-histopathologic", "Lung abscess or other evidence of infection (for example, empyema) on histopathologic examination")
      ]) })
    ]) }),
    Object.freeze({ id: "LUNG-3", label: "Criterion 3 — imaging test evidence of abscess or infection", source: lungCriterionSource, allOf: Object.freeze([]), alternatives: Object.freeze([
      Object.freeze({ id: "definitive-imaging", label: "Definitive imaging pathway", source: lungCriterionSource, allOf: Object.freeze([lungDefinitiveImaging]) }),
      Object.freeze({ id: "equivocal-imaging", label: "Clinically correlated equivocal imaging pathway", source: lungCriterionSource, allOf: Object.freeze([lungEquivocalImaging, lungImagingTreatment]) })
    ]) })
  ]),
  exclusions: Object.freeze([
    lungItem("lung-ineligible-pleural-fluid", "The pleural fluid specimen was collected after a chest tube was repositioned, or more than 24 hours after chest tube placement, and is not eligible for LUNG 1", { type: "exclusion" }),
    lungItem("lung-lower-respiratory-secretions-only", "The only microbiology evidence is lower respiratory tract secretions (for example, sputum, endotracheal or tracheal aspirate, or bronchoalveolar lavage), which are not eligible for LUNG", { type: "exclusion" }),
    lungItem("lung-pneu-met-not-organ-space-ssi", "The patient also meets PNEU and the LUNG infection is not a surgical site organ/space infection; report PNEU only", { type: "exclusion", disqualifiesSite: true })
  ]),
  hardExclusionIds: Object.freeze(["lung-pneu-met-not-organ-space-ssi"]),
  notes: Object.freeze([
    Object.freeze({ id: "LUNG-note-specimens", text: "Lung tissue and pleural fluid are the only specimens eligible for LUNG. Lower respiratory tract secretions such as sputum, endotracheal or tracheal aspirate, and bronchoalveolar lavage are not eligible.", source: lungInstructionSource }),
    Object.freeze({ id: "LUNG-note-pleural-eligibility", text: "Pleural fluid is eligible for LUNG 1 only when obtained during thoracentesis or within 24 hours of chest tube placement. A specimen collected after a chest tube is repositioned, or more than 24 hours after placement, is not eligible; repositioning must be documented in the patient record by a healthcare professional.", source: lungInstructionSource }),
    Object.freeze({ id: "LUNG-note-imaging-scope", text: "LUNG criterion 3 imaging must show abscess or infection and expressly excludes imaging test evidence of pneumonia. Equivocal imaging qualifies only with clinical correlation, specifically physician or physician-designee documentation of antimicrobial treatment for lung infection.", source: lungCriterionSource }),
    Object.freeze({ id: "LUNG-note-pneu-separation", text: "LUNG is a Chapter 17 event and is distinct from the Chapter 6 PNEU event. PNEU evidence does not meet LUNG and LUNG evidence does not meet PNEU.", source: lungInstructionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "LUNG-report-pneu", text: "If a patient meets LUNG and PNEU, report PNEU only — unless the LUNG is a surgical site organ/space infection, in which case report both PNEU and SSI-LUNG.", source: lungInstructionSource }),
    Object.freeze({ id: "LUNG-report-specimens", text: "Lung tissue or pleural fluid are the only specimens eligible for LUNG.", source: lungInstructionSource }),
    Object.freeze({ id: "LUNG-report-secretions", text: "Lower respiratory tract secretions (such as sputum, endotracheal/tracheal aspirate, bronchoalveolar lavage) are not eligible for LUNG.", source: lungInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: lungAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete LUNG definition is met", source: lungAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the lung tissue or eligible pleural fluid specimen used to meet LUNG", source: lungAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the LUNG secondary BSI attribution period (or in the infection window when used as a criterion element)", source: lungAttributionSource })
  ]) })
});
