import { gitAttributionSource, gitCriterionSource, gitInstructionSource } from "../source.js";

const gitItem = (id, label, options = {}) => Object.freeze({ id, label, source: gitCriterionSource, ...options });
const otherCauseId = "git-selected-symptom-other-recognized-cause";
const symptoms = Object.freeze([
  gitItem("git-fever-over-38", "Fever (>38.0°C)"),
  gitItem("git-nausea", "Nausea, with no other recognized cause", { exclusionId: otherCauseId }),
  gitItem("git-vomiting", "Vomiting, with no other recognized cause", { exclusionId: otherCauseId }),
  gitItem("git-pain-or-tenderness", "Pain or tenderness, with no other recognized cause", { exclusionId: otherCauseId }),
  gitItem("git-odynophagia", "Odynophagia, with no other recognized cause", { exclusionId: otherCauseId }),
  gitItem("git-dysphagia", "Dysphagia, with no other recognized cause", { exclusionId: otherCauseId })
]);
const symptomGroup = (id) => Object.freeze({ id, label: "At least two signs or symptoms compatible with infection of the organ or tissue involved", minimumRequiredCount: 2, anyOf: symptoms });
const clinicalCriterion = (id, label, allOf) => Object.freeze({ id, label, source: gitCriterionSource, allOf: Object.freeze(allOf), groups: Object.freeze([symptomGroup(`${id}-symptoms`)]) });
const grossOrHistopath = gitItem("git-gross-or-histopath-evidence", "Abscess or other evidence of gastrointestinal tract infection on gross anatomic or histopathologic exam");
const bloodMbi = gitItem("git-blood-mbi-organism", "Organism(s) identified from blood by culture or a non-culture-based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST), including at least one MBI organism from the NHSN Terminology Browser");
const imaging = gitItem("git-definitive-imaging", "Imaging test evidence definitive for gastrointestinal infection (for example, endoscopic exam, MRI, or CT scan)");
const equivocalImaging = gitItem("git-equivocal-imaging", "Imaging test evidence equivocal for gastrointestinal infection (for example, endoscopic exam, MRI, or CT scan)");
const equivocalSupport = gitItem("git-equivocal-imaging-antimicrobial-treatment", "If the imaging finding is equivocal, physician or physician-designee documentation of antimicrobial treatment for gastrointestinal tract infection supports the finding");

export const gitDefinition = Object.freeze({
  majorCategoryCode: "GI",
  majorCategoryName: "Gastrointestinal System Infection",
  siteCode: "GIT",
  siteName: "Gastrointestinal tract infection (esophagus, stomach, small and large bowel, and rectum) excluding gastroenteritis, appendicitis, and C. difficile infection",
  source: gitCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "GIT-1a", label: "Criterion 1a — gross anatomic or histopathologic evidence", source: gitCriterionSource, allOf: Object.freeze([grossOrHistopath]) }),
    Object.freeze({ id: "GIT-1b", label: "Criterion 1b — gross anatomic or histopathologic evidence and an MBI organism in blood", source: gitCriterionSource, allOf: Object.freeze([grossOrHistopath, bloodMbi]) }),
    clinicalCriterion("GIT-2a", "Criterion 2a — clinical findings and organism from an invasive-procedure specimen or aseptically placed drain", [gitItem("git-invasive-specimen-organism", "Organism(s) identified from drainage or tissue obtained during an invasive procedure, or drainage from an aseptically placed drain, by culture or a non-culture-based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]),
    clinicalCriterion("GIT-2b", "Criterion 2b — clinical findings and direct microscopic evidence", [gitItem("git-invasive-specimen-microscopy", "Organism(s) on Gram stain, fungal elements on KOH stain, or multinucleated giant cells on microscopic examination of drainage or tissue obtained during an invasive procedure or drainage from an aseptically placed drain")]),
    clinicalCriterion("GIT-2c-definitive", "Criterion 2c — clinical findings, an MBI organism in blood, and definitive imaging", [bloodMbi, imaging]),
    clinicalCriterion("GIT-2c-equivocal", "Criterion 2c — clinical findings, an MBI organism in blood, and supported equivocal imaging", [bloodMbi, equivocalImaging, equivocalSupport]),
    clinicalCriterion("GIT-2d-definitive", "Criterion 2d — clinical findings and definitive imaging", [imaging]),
    clinicalCriterion("GIT-2d-equivocal", "Criterion 2d — clinical findings and supported equivocal imaging", [equivocalImaging, equivocalSupport])
  ]),
  exclusions: Object.freeze([
    gitItem(otherCauseId, "A selected nausea, vomiting, pain or tenderness, odynophagia, or dysphagia finding has another recognized cause", { type: "exclusion" }),
    gitItem("git-ge-evidence-only", "Gastroenteritis evidence alone cannot satisfy GIT", { type: "boundary" }),
    gitItem("git-cdi-evidence-only", "C. difficile infection evidence alone cannot satisfy GIT", { type: "boundary" }),
    gitItem("git-appendicitis-evidence-only", "Appendicitis evidence alone cannot satisfy GIT", { type: "boundary" }),
    gitItem("git-iab-evidence-only", "IAB evidence alone cannot satisfy GIT", { type: "boundary" }),
    gitItem("git-nec-evidence-only", "NEC evidence alone cannot satisfy GIT; in patients >1 year, pneumatosis intestinalis is only an equivocal GIT imaging finding", { type: "boundary" })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "GIT-note-equivocal-imaging", text: "Equivocal imaging qualifies only when supported by physician or physician-designee documentation of antimicrobial treatment for gastrointestinal tract infection.", source: gitCriterionSource }),
    Object.freeze({ id: "GIT-note-pneumatosis", text: "In patients >1 year, pneumatosis intestinalis is considered an equivocal imaging finding for GIT.", source: gitInstructionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "GIT-report-ge-precedence", text: "If both GI-GE and GI-GIT criteria are met, report only GI-GIT and use the GI-GIT event date.", source: gitInstructionSource }),
    Object.freeze({ id: "GIT-report-histopath-match", text: "For GIT 1b, if an organism is identified on histopathologic exam, the blood specimen must contain a matching organism.", source: gitInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: gitAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "One complete GIT criterion is met", source: gitAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism has the required NHSN relationship to the GIT site criterion", source: gitAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the GIT secondary BSI attribution period", source: gitAttributionSource })
  ]) })
});
