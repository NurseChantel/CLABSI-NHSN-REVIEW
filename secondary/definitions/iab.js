import { iabAttributionSource, iabCriterionSource, iabInstructionSource } from "../source.js";

const iabItem = (id, label, options = {}) => Object.freeze({ id, label, source: iabCriterionSource, ...options });
const otherCauseId = "iab-selected-finding-other-recognized-cause";
const clinicalFindings = Object.freeze([
  iabItem("iab-fever-over-38", "Fever (>38.0°C)"),
  iabItem("iab-hypotension", "Hypotension"),
  iabItem("iab-nausea", "Nausea, with no other recognized cause", { exclusionId: otherCauseId }),
  iabItem("iab-vomiting", "Vomiting, with no other recognized cause", { exclusionId: otherCauseId }),
  iabItem("iab-abdominal-pain-or-tenderness", "Abdominal pain or tenderness, with no other recognized cause", { exclusionId: otherCauseId }),
  iabItem("iab-elevated-transaminase", "At least one elevated SGOT, SGPT, ALT, or AST level, as defined by the laboratory's normal range, with no other recognized cause", { exclusionId: otherCauseId }),
  iabItem("iab-jaundice", "Jaundice, with no other recognized cause", { exclusionId: otherCauseId })
]);
const clinicalGroup = (id) => Object.freeze({ id, label: "At least two qualifying signs or symptoms", minimumRequiredCount: 2, anyOf: clinicalFindings });
const clinicalCriterion = (id, label, allOf, groups = []) => Object.freeze({ id, label, source: iabCriterionSource, allOf: Object.freeze(allOf), groups: Object.freeze([clinicalGroup(`${id}-clinical`), ...groups]) });
const grossOrHistopath = iabItem("iab-gross-or-histopath-evidence", "Abscess or other evidence of intraabdominal infection on gross anatomic or histopathologic exam");
const bloodMbi = iabItem("iab-blood-mbi-organism", "Organism(s) identified from blood by culture or a non-culture-based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST), including at least one MBI organism from the NHSN Terminology Browser");
const definitiveImaging = iabItem("iab-definitive-imaging", "Imaging test evidence definitive for intraabdominal infection (for example, ultrasound, CT, MRI, ERCP, radiolabel scan, or abdominal x-ray)");
const equivocalImaging = iabItem("iab-equivocal-imaging", "Imaging test evidence equivocal for intraabdominal infection (including biliary ductal dilatation for cholangitis)");
const equivocalSupport = iabItem("iab-equivocal-imaging-antimicrobial-treatment", "Physician or physician-designee documentation of antimicrobial treatment for intraabdominal infection supports the equivocal imaging finding");
const invasiveEvidenceGroup = Object.freeze({ id: "IAB-3a-invasive-evidence", label: "At least one eligible invasive-procedure or aseptically placed drain microbiology result", minimumRequiredCount: 1, anyOf: Object.freeze([
  iabItem("iab-invasive-specimen-gram-stain", "Organism(s) seen on Gram stain of intraabdominal fluid or tissue obtained during an invasive procedure or from an aseptically placed intraabdominal drain"),
  iabItem("iab-invasive-specimen-organism", "Organism(s) identified from intraabdominal fluid or tissue obtained during an invasive procedure or from an aseptically placed intraabdominal drain by culture or a non-culture-based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
]) });

export const iabDefinition = Object.freeze({
  majorCategoryCode: "GI",
  majorCategoryName: "Gastrointestinal System Infection",
  siteCode: "IAB",
  siteName: "Intraabdominal infection, not specified elsewhere, including gallbladder, bile ducts, liver (excluding viral hepatitis), spleen, pancreas, peritoneum, retroperitoneal, subphrenic or subdiaphragmatic space, or other intraabdominal tissue or area not specified elsewhere",
  source: iabCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "IAB-1", label: "Criterion 1 — organism from an intraabdominal abscess or purulent material", source: iabCriterionSource, allOf: Object.freeze([
      iabItem("iab-abscess-or-purulent-material-organism", "Organism(s) identified from an abscess or purulent material from an intraabdominal space by culture or a non-culture-based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]) }),
    Object.freeze({ id: "IAB-2a", label: "Criterion 2a — gross anatomic or histopathologic evidence", source: iabCriterionSource, allOf: Object.freeze([grossOrHistopath]) }),
    Object.freeze({ id: "IAB-2b", label: "Criterion 2b — gross anatomic or histopathologic evidence and an MBI organism in blood", source: iabCriterionSource, allOf: Object.freeze([grossOrHistopath, bloodMbi]) }),
    clinicalCriterion("IAB-3a", "Criterion 3a — clinical findings and eligible intraabdominal specimen microbiology", [], [invasiveEvidenceGroup]),
    clinicalCriterion("IAB-3b-definitive", "Criterion 3b — clinical findings, an MBI organism in blood, and definitive imaging", [bloodMbi, definitiveImaging]),
    clinicalCriterion("IAB-3b-equivocal", "Criterion 3b — clinical findings, an MBI organism in blood, and supported equivocal imaging", [bloodMbi, equivocalImaging, equivocalSupport])
  ]),
  exclusions: Object.freeze([
    iabItem(otherCauseId, "A selected nausea, vomiting, abdominal pain or tenderness, elevated transaminase, or jaundice finding has another recognized cause", { type: "exclusion" }),
    iabItem("iab-noninfectious-pancreatitis-only", "Pancreatitis is not reportable as IAB unless it is determined to be infectious in origin", { type: "boundary" }),
    iabItem("iab-viral-hepatitis-only", "Viral hepatitis is excluded from IAB", { type: "boundary" }),
    iabItem("iab-cdi-evidence-only", "CDI evidence alone cannot satisfy IAB", { type: "boundary" }),
    iabItem("iab-ge-evidence-only", "GE evidence alone cannot satisfy IAB", { type: "boundary" }),
    iabItem("iab-git-evidence-only", "GIT evidence alone cannot satisfy IAB", { type: "boundary" }),
    iabItem("iab-nec-evidence-only", "NEC evidence alone cannot satisfy IAB", { type: "boundary" }),
    iabItem("iab-appendicitis-evidence-only", "Appendicitis evidence alone cannot satisfy IAB", { type: "boundary" }),
    iabItem("iab-ssi-evidence-only", "SSI classification or evidence alone cannot satisfy the IAB site definition", { type: "boundary" })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "IAB-note-not-elsewhere", text: "Use IAB only for an intraabdominal infection not specified elsewhere.", source: iabCriterionSource }),
    Object.freeze({ id: "IAB-note-transaminases", text: "Eligible transaminases are SGOT, SGPT, ALT, and AST; one result above the laboratory's normal range meets the laboratory finding.", source: iabInstructionSource }),
    Object.freeze({ id: "IAB-note-equivocal", text: "Equivocal imaging qualifies only with physician or physician-designee documentation of antimicrobial treatment for intraabdominal infection; biliary ductal dilatation is equivocal for cholangitis.", source: iabInstructionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "IAB-report-histopath-match", text: "For IAB 2b, when an organism is identified on histopathologic exam, the blood specimen must contain a matching organism.", source: iabInstructionSource }),
    Object.freeze({ id: "IAB-report-pancreatitis", text: "Do not report pancreatitis unless it is determined to be infectious in origin.", source: iabInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: iabAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "One complete IAB criterion is met", source: iabAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism has the required NHSN relationship to the IAB site criterion", source: iabAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the IAB secondary BSI attribution period", source: iabAttributionSource })
  ]) })
});
