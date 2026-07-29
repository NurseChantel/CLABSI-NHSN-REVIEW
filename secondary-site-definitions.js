const document = "Secondary BSI Chapter.pdf";
const warning = "Site definition not yet validated against the current NHSN manual. This pathway cannot qualify for secondary BSI attribution.";

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

export const secondarySiteDefinitions = Object.freeze(Object.fromEntries(categoryData.flatMap(([majorCategoryCode, majorCategoryName, sites]) => sites.map(([siteCode, siteName, printed]) => [siteCode, Object.freeze({
  majorCategoryCode, majorCategoryName, siteCode, siteName,
  source: Object.freeze({ document, printedPage: `17-${printed}`, pdfPage: printed + 1, sectionHeading: `${siteCode}-${siteName}` }),
  implementationStatus: "placeholder", criteria: Object.freeze([]), notes: warning
})]))));

export const secondarySiteCategories = Object.freeze(categoryData.map(([majorCategoryCode, majorCategoryName, sites]) => Object.freeze({
  majorCategoryCode, majorCategoryName, siteCodes: Object.freeze(sites.map(([siteCode]) => siteCode))
})));

export const secondaryEvaluationStatuses = Object.freeze(["siteNotSelected", "siteNotValidated", "siteDefinitionIncomplete", "siteDefinitionMet", "secondaryAttributionIncomplete", "secondaryAttributionMet", "secondaryAttributionFailed"]);
export { warning as placeholderWarning };

export function evaluateSecondarySite({ siteCode = "" } = {}) {
  const definition = secondarySiteDefinitions[siteCode];
  if (!definition) return { status: "siteNotSelected", siteDefinitionMet: false, secondaryAttributionMet: false };
  if (definition.implementationStatus !== "validated") return { status: "siteNotValidated", siteDefinitionMet: false, secondaryAttributionMet: false, definition, message: warning };
  return { status: "siteDefinitionIncomplete", siteDefinitionMet: false, secondaryAttributionMet: false, definition };
}

export function selectSecondarySite(state, siteCode) {
  if (state.siteCode === siteCode) return state;
  return { ...state, siteCode, evidence: new Set(), organismRelationship: "", attributionTiming: "" };
}
