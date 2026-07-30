const document = "Secondary BSI Chapter.pdf";
const warning = "Site definition not yet validated against the current NHSN manual. This pathway cannot qualify for secondary BSI attribution.";
const source = (printedPage, pdfPage, sectionHeading, sourceDataId) => Object.freeze({ document, chapter: "Chapter 17 — Surveillance Definitions for Specific Types of Infections", printedPage, pdfPage, sectionHeading, sourceDataId });
const menCriterionSource = source("17-11", 12, "MEN — Meningitis or ventriculitis", "MEN");
const menInstructionSource = source("17-12", 13, "MEN — Reporting Instructions", "MEN.reporting-instructions");
const attributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "MEN.secondary-bsi");
const item = (id, label, options = {}) => Object.freeze({ id, label, source: menCriterionSource, ...options });
const labAlternatives = Object.freeze([
  item("csf-profile", "Increased white cells, elevated protein, and decreased glucose in CSF (per the reporting laboratory's reference range)"),
  item("csf-gram-stain", "Organism(s) seen on Gram stain of CSF"),
  item("blood-organism", "Organism(s) identified from blood by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)"),
  item("diagnostic-antibody", "Diagnostic single antibody titer (IgM) or 4-fold increase in paired sera (IgG) for organism")
]);
const suspected = item("suspected", "Suspected meningitis or ventriculitis");
const meningeal = item("meningeal-signs", "Meningeal sign(s), with no other recognized cause", { exclusionId: "other-recognized-cause" });
const cranial = item("cranial-nerve-signs", "Cranial nerve sign(s), with no other recognized cause", { exclusionId: "other-recognized-cause" });

export const menDefinition = Object.freeze({
  majorCategoryCode: "CNS", majorCategoryName: "Central Nervous System Infection", siteCode: "MEN", siteName: "Meningitis or ventriculitis",
  source: menCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "MEN-1", label: "Criterion 1 — CSF organism", source: menCriterionSource, allOf: Object.freeze([item("csf-organism", "Organism(s) identified from cerebrospinal fluid (CSF) by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "MEN-2", label: "Criterion 2 — suspected MEN, findings, and supporting test", source: menCriterionSource, allOf: Object.freeze([suspected]), groups: Object.freeze([
      Object.freeze({ id: "MEN-2-findings", label: "At least two finding groups", minimumRequiredCount: 2, anyOf: Object.freeze([
        Object.freeze({ id: "MEN-2-i", label: "Fever or headache (group i; this group alone cannot supply both required elements)", anyOf: Object.freeze([item("fever", "Fever (>38.0°C)"), item("headache", "Headache")]) }),
        Object.freeze({ id: "MEN-2-ii", label: "Meningeal signs (group ii)", anyOf: Object.freeze([meningeal]) }),
        Object.freeze({ id: "MEN-2-iii", label: "Cranial nerve signs (group iii)", anyOf: Object.freeze([cranial]) })
      ]) }),
      Object.freeze({ id: "MEN-2-support", label: "At least one supporting test", minimumRequiredCount: 1, anyOf: labAlternatives })
    ]) }),
    Object.freeze({ id: "MEN-3", label: "Criterion 3 — patient ≤1 year of age", source: menCriterionSource, allOf: Object.freeze([item("age-one-or-younger", "Patient ≤1 year of age"), suspected]), groups: Object.freeze([
      Object.freeze({ id: "MEN-3-findings", label: "At least two finding groups", minimumRequiredCount: 2, anyOf: Object.freeze([
        Object.freeze({ id: "MEN-3-i", label: "Age-specific signs (group i; this group alone cannot supply both required elements)", anyOf: Object.freeze([
          item("fever", "Fever (>38.0°C)"), item("hypothermia", "Hypothermia (<36.0°C)"), item("apnea", "Apnea, with no other recognized cause", { exclusionId: "other-recognized-cause" }), item("bradycardia", "Bradycardia, with no other recognized cause", { exclusionId: "other-recognized-cause" }), item("irritability", "Irritability, with no other recognized cause", { exclusionId: "other-recognized-cause" })
        ]) }),
        Object.freeze({ id: "MEN-3-ii", label: "Meningeal signs (group ii)", anyOf: Object.freeze([meningeal]) }),
        Object.freeze({ id: "MEN-3-iii", label: "Cranial nerve signs (group iii)", anyOf: Object.freeze([cranial]) })
      ]) }),
      Object.freeze({ id: "MEN-3-support", label: "At least one supporting test", minimumRequiredCount: 1, anyOf: labAlternatives })
    ]) })
  ]),
  exclusions: Object.freeze([item("other-recognized-cause", "Another recognized cause applies to a finding marked by NHSN with an asterisk", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "MEN-note-group-i", text: "Elements of group i alone may not be used to meet the two required elements in MEN 2 or MEN 3.", source: menCriterionSource }),
    Object.freeze({ id: "MEN-note-seizures", text: "Seizures do not meet the cranial nerve sign element for MEN 2 or MEN 3.", source: menInstructionSource }),
    Object.freeze({ id: "MEN-note-shunt", text: "Organisms identified from explanted ventricular shunts are eligible for MEN 1.", source: menInstructionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "MEN-report-shunt", text: "Report CSF shunt infection as SSI-MEN if it occurs within 90 days of placement; if later or after manipulation/access, it is CNS-MEN but is not reportable as an SSI.", source: menInstructionSource }),
    Object.freeze({ id: "MEN-report-encephalitis", text: "Report as MEN if meningitis (MEN) and encephalitis (IC) are present together.", source: menInstructionSource }),
    Object.freeze({ id: "MEN-report-abscess", text: "Report as IC if MEN and a brain abscess (IC) are present together after operation.", source: menInstructionSource }),
    Object.freeze({ id: "MEN-report-spinal", text: "Report as SA if MEN and spinal abscess/infection (SA) are present together.", source: menInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: attributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete MEN definition is met", source: attributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the MEN criterion", source: attributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the MEN secondary BSI attribution period (or in the infection window when used as a criterion element)", source: attributionSource })
  ]) })
});

const categoryData = [
  ["BJ", "Bone and Joint Infection", [["BONE", "Osteomyelitis", 7], ["DISC", "Disc space infection", 8], ["JNT", "Joint or bursa infection (not for use as Organ/Space SSI after HPRO or KPRO procedures)", 9], ["PJI", "Periprosthetic Joint Infection (for use as Organ/Space SSI following HPRO and KPRO only)", 9]]],
  ["CNS", "Central Nervous System Infection", [["IC", "Intracranial infection (brain abscess, subdural or epidural infection, encephalitis)", 10], ["MEN", "Meningitis or ventriculitis", 11], ["SA", "Spinal abscess/infection (spinal abscess, spinal subdural or epidural infection)", 12]]],
  ["CVS", "Cardiovascular System Infection", [["CARD", "Myocarditis or pericarditis", 13], ["ENDO", "Endocarditis", 29], ["MED", "Mediastinitis", 13], ["VASC", "Arterial or venous infection excluding infections involving vascular access devices with organisms identified in the blood", 14]]],
  ["EENT", "Eye, Ear, Nose, Throat, or Mouth Infection", [["CONJ", "Conjunctivitis", 15], ["EAR", "Ear, mastoid infection", 15], ["EYE", "Eye infection, other than conjunctivitis", 16], ["ORAL", "Oral cavity infection (mouth, tongue, or gums)", 17], ["SINU", "Sinusitis", 17], ["UR", "Upper respiratory tract infection, pharyngitis, laryngitis, epiglottitis", 18]]],
  ["GI", "Gastrointestinal System Infection", [["CDI", "Clostridioides difficile Infection", 18], ["GE", "Gastroenteritis (excluding C. difficile infections)", 19], ["GIT", "Gastrointestinal tract infection (esophagus, stomach, small and large bowel, and rectum) excluding gastroenteritis, appendicitis, and C. difficile infection", 20], ["IAB", "Intraabdominal infection, not specified elsewhere, including gallbladder, bile ducts, liver (excluding viral hepatitis), spleen, pancreas, peritoneum, retroperitoneal, subphrenic or subdiaphragmatic space, or other intraabdominal tissue or area not specified elsewhere", 21], ["NEC", "Necrotizing enterocolitis", 22]]],
  ["LRI", "Lower Respiratory System Infection, Other Than Pneumonia", [["LUNG", "Other infection of the lower respiratory tract and pleural cavity", 22]]],
  ["REPR", "Reproductive Tract Infection", [["EMET", "Endometritis", 23], ["EPIS", "Episiotomy infection", 23], ["OREP", "Deep pelvic tissue infection or other infection of the male or female reproductive tract (for example, epididymis, testes, prostate, vagina, ovaries, uterus) including chorioamnionitis, but excluding vaginitis, endometritis or vaginal cuff infections", 23], ["VCUF", "Vaginal cuff infection", 24]]],
  ["SST", "Skin and Soft Tissue Infection", [["BRST", "Breast infection or mastitis", 24], ["BURN", "Burn infection", 25], ["CIRC", "Newborn circumcision infection", 25], ["DECU", "Decubitus ulcer infection (also known as pressure injury infection), including both superficial and deep infections", 26], ["SKIN", "Skin infection (skin and/or subcutaneous) excluding decubitus ulcers, burns, and infections at vascular access sites", 26], ["ST", "Soft tissue infection (muscle and/or fascia [for example, necrotizing fasciitis, infectious gangrene, necrotizing cellulitis, infectious myositis, lymphadenitis, lymphangitis, or parotitis]) excluding decubitus ulcers, burns, and infections at vascular access sites", 27], ["UMB", "Omphalitis", 27]]],
  ["USI", "Urinary System Infection", [["USI", "Urinary System Infection (kidney, ureter, bladder, urethra, or perinephric space excluding UTI [see Chapter 7].)", 28]]]
];
const placeholders = categoryData.flatMap(([majorCategoryCode, majorCategoryName, sites]) => sites.map(([siteCode, siteName, printed]) => [siteCode, Object.freeze({ majorCategoryCode, majorCategoryName, siteCode, siteName, source: source(`17-${printed}`, printed + 1, `${siteCode}-${siteName}`, siteCode), implementationStatus: "placeholder", criteria: Object.freeze([]), notes: warning })]));
export const secondarySiteDefinitions = Object.freeze({ ...Object.fromEntries(placeholders), MEN: menDefinition });
export const secondarySiteCategories = Object.freeze(categoryData.map(([majorCategoryCode, majorCategoryName, sites]) => Object.freeze({ majorCategoryCode, majorCategoryName, siteCodes: Object.freeze(sites.map(([siteCode]) => siteCode)) })));
export const secondaryEvaluationStatuses = Object.freeze(["siteNotSelected", "siteNotValidated", "notStarted", "siteDefinitionIncomplete", "siteDefinitionMet", "exclusionApplies", "secondaryAttributionIncomplete", "secondaryAttributionMet"]);
export { warning as placeholderWarning };

const answer = (evidence, id) => evidence?.[id] || "unknown";
function atomMet(atom, evidence) { return answer(evidence, atom.id) === "met" && (!atom.exclusionId || answer(evidence, atom.exclusionId) !== "met"); }
function groupMet(group, evidence) { return group.anyOf.filter(entry => entry.anyOf ? entry.anyOf.some(atom => atomMet(atom, evidence)) : atomMet(entry, evidence)).length >= group.minimumRequiredCount; }
function criterionMet(criterion, evidence) { return criterion.allOf.every(atom => atomMet(atom, evidence)) && (criterion.groups || []).every(group => groupMet(group, evidence)); }
function requiredMessages(criterion, evidence) {
  const missing = criterion.allOf.filter(atom => !atomMet(atom, evidence)).map(atom => `${atom.label}: ${answer(evidence, atom.id) === "notMet" ? "not met" : "unknown or not documented"}`);
  for (const group of criterion.groups || []) if (!groupMet(group, evidence)) missing.push(`${group.label}: ${group.minimumRequiredCount} required; current qualifying groups do not meet the minimum`);
  return missing;
}
export function evaluateSecondarySite({ siteCode = "", evidence = {}, organismRelationship = "", attributionTiming = "" } = {}) {
  const definition = secondarySiteDefinitions[siteCode];
  if (!definition) return { status: "siteNotSelected", siteDefinitionMet: false, secondaryAttributionMet: false };
  if (definition.implementationStatus !== "validated") return { status: "siteNotValidated", siteDefinitionMet: false, secondaryAttributionMet: false, definition, message: warning };
  const started = Object.values(evidence).some(Boolean);
  const metCriterion = definition.criteria.find(criterion => criterionMet(criterion, evidence));
  const exclusionApplies = answer(evidence, "other-recognized-cause") === "met";
  if (!metCriterion) return { status: exclusionApplies ? "exclusionApplies" : started ? "siteDefinitionIncomplete" : "notStarted", siteDefinitionMet: false, secondaryAttributionMet: false, definition, branches: definition.criteria.map(criterion => ({ id: criterion.id, missing: requiredMessages(criterion, evidence) })) };
  const secondaryAttributionMet = organismRelationship === "yes" && attributionTiming === "yes";
  return { status: secondaryAttributionMet ? "secondaryAttributionMet" : "siteDefinitionMet", siteDefinitionMet: true, secondaryAttributionMet, metCriterion: metCriterion.id, definition, attributionMissing: [!organismRelationship && "Organism/specimen relationship is unknown", organismRelationship === "no" && "Organism/specimen relationship is not met", !attributionTiming && "Attribution timing is unknown", attributionTiming === "no" && "Attribution timing is not met"].filter(Boolean) };
}
export function selectSecondarySite(state, siteCode) { if (state.siteCode === siteCode) return state; return { ...state, siteCode, evidence: {}, organismRelationship: "", attributionTiming: "" }; }
