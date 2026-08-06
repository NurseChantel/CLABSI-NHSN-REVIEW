// NHSN Secondary BSI Guide — Table B1.
//
// Source: clabsi nhsn.pdf, Chapter 4 (Bloodstream Infection Event),
// "Appendix: Secondary BSI Guide", Table B1 on printed page 4-34 and the Secondary BSI
// Reporting Instructions on printed page 4-35.
//
// Meeting a site definition is NOT sufficient to attribute a bloodstream infection to it.
// Table B1 names the specific criterion of each site that may carry a secondary BSI, and
// by which scenario:
//
//   Scenario 1 — the positive blood specimen contains at least one eligible matching
//     organism to the site-specific specimen, the blood is collected in the site's
//     secondary BSI attribution period, and an eligible organism identified FROM THE SITE
//     SPECIMEN is used as an element to meet the site definition.
//   Scenario 2 — the positive blood specimen is ITSELF an element of the site definition,
//     and is collected in the site's infection window period.
//
// Entries carry `requiredEvidenceIds` where Table B1 names a specific lettered option
// rather than a whole criterion (for example MEN "2c", which is the blood-organism option
// inside MEN criterion 2).

export const TABLE_B1_SOURCE = Object.freeze({
  document: "clabsi nhsn.pdf",
  chapter: "Chapter 4 — Bloodstream Infection Event",
  printedPage: "4-34",
  pdfPage: 35,
  sectionHeading: "Appendix: Secondary BSI Guide — Table B1",
  sourceDataId: "secondary-bsi-guide.table-b1"
});
export const REPORTING_INSTRUCTION_SOURCE = Object.freeze({
  document: "clabsi nhsn.pdf",
  chapter: "Chapter 4 — Bloodstream Infection Event",
  printedPage: "4-35",
  pdfPage: 36,
  sectionHeading: "Appendix: Secondary BSI Guide — Secondary BSI Reporting Instructions",
  sourceDataId: "secondary-bsi-guide.reporting-instructions"
});
export const NEC_EXCEPTION_SOURCE = Object.freeze({
  document: "clabsi nhsn.pdf",
  chapter: "Chapter 4 — Bloodstream Infection Event",
  printedPage: "4-45",
  pdfPage: 46,
  sectionHeading: "Appendix: Secondary BSI Guide — Figure B1 footnote (NEC exception)",
  sourceDataId: "secondary-bsi-guide.nec-exception"
});

export const SCENARIO_DEFINITIONS = Object.freeze({
  1: Object.freeze({
    id: 1,
    name: "Scenario 1 — matching organism from the site specimen",
    requirements: Object.freeze([
      "The positive blood specimen contains at least one eligible matching organism to the site-specific specimen.",
      "The blood specimen is collected in the site-specific secondary BSI attribution period.",
      "An eligible organism identified from the site-specific specimen is used as an element to meet the site-specific definition."
    ]),
    source: TABLE_B1_SOURCE
  }),
  2: Object.freeze({
    id: 2,
    name: "Scenario 2 — the blood specimen is itself a criterion element",
    requirements: Object.freeze([
      "The positive blood specimen is an element of the site-specific definition.",
      "The blood specimen is collected in the site-specific infection window period.",
      "An eligible organism identified in a blood specimen is used as an element to meet the site-specific definition."
    ]),
    source: TABLE_B1_SOURCE
  })
});

const entry = (siteCode, scenario, label, criterionIds, options = {}) => Object.freeze({
  siteCode, scenario, label,
  criterionIds: Object.freeze(criterionIds),
  requiredEvidenceIds: Object.freeze(options.requiredEvidenceIds || []),
  note: options.note || "",
  source: TABLE_B1_SOURCE
});

// Table B1, printed page 4-34. Left column.
const SCENARIO_1 = Object.freeze([
  entry("BONE", 1, "1", ["BONE-1"]),
  entry("BRST", 1, "1", ["BRST-1"]),
  entry("CARD", 1, "1", ["CARD-1"]),
  entry("CIRC", 1, "2 or 3", ["CIRC-2", "CIRC-3"]),
  entry("CONJ", 1, "1a", ["CONJ-1"], { requiredEvidenceIds: ["conj-site-organism"] }),
  entry("DECU", 1, "1", ["DECU-1"]),
  entry("DISC", 1, "1", ["DISC-1"]),
  entry("EAR", 1, "1, 3, 5 or 7", ["EAR-1", "EAR-3", "EAR-5", "EAR-7"]),
  entry("EMET", 1, "1", ["EMET-1"]),
  entry("ENDO", 1, "1", ["ENDO-1"]),
  entry("EYE", 1, "1", ["EYE-1"]),
  entry("GE", 1, "2a", ["GE-2a"]),
  entry("GIT", 1, "2a", ["GIT-2a"]),
  entry("GIT", 1, "2b (only yeast)", ["GIT-2b"], { note: "Table B1 admits GIT 2b for Scenario 1 only when the organism is yeast." }),
  entry("IAB", 1, "1 or 3a", ["IAB-1", "IAB-3a"]),
  entry("IC", 1, "1", ["IC-1"]),
  entry("JNT", 1, "1", ["JNT-1"]),
  entry("LUNG", 1, "1", ["LUNG-1"]),
  entry("MED", 1, "1", ["MED-1"]),
  entry("MEN", 1, "1", ["MEN-1"]),
  entry("ORAL", 1, "1", ["ORAL-1"]),
  entry("ORAL", 1, "3a", ["ORAL-3"], { requiredEvidenceIds: ["oral-3a-virus"] }),
  entry("ORAL", 1, "3d (only yeast)", ["ORAL-3"], { requiredEvidenceIds: ["oral-3d-fungal-elements"], note: "Table B1 admits ORAL 3d for Scenario 1 only when the organism is yeast." }),
  entry("OREP", 1, "1", ["OREP-1"]),
  entry("PJI", 1, "1", ["PJI-1"]),
  entry("PJI", 1, "3e", ["PJI-3"], { requiredEvidenceIds: ["pji-single-specimen-organism"] }),
  entry("SA", 1, "1", ["SA-1"]),
  entry("SINU", 1, "1", ["SINU-1"]),
  entry("SKIN", 1, "2a", ["SKIN-2"], { requiredEvidenceIds: ["skin-site-organism"] }),
  entry("ST", 1, "1", ["ST-1"]),
  entry("UMB", 1, "1a", ["UMB-1a"]),
  entry("UR", 1, "1a", ["UR-1"], { requiredEvidenceIds: ["ur-1-support-upper-respiratory-organism"] }),
  entry("UR", 1, "3a", ["UR-3"], { requiredEvidenceIds: ["ur-3-support-upper-respiratory-organism"] }),
  entry("USI", 1, "1", ["USI-1"]),
  entry("VCUF", 1, "3", ["VCUF-3"]),
  // "VASC only as SSI — 1". A VASC reported as a healthcare-associated infection rather
  // than an organ/space SSI carries no secondary BSI; see PROHIBITED_SITES below.
  entry("VASC", 1, "1 (only as SSI)", ["VASC-1"], { note: "Admitted only when the VASC is reported as an organ/space surgical site infection. A VASC reported as an HAI carries no secondary BSI." })
]);

// Table B1, printed page 4-34. Right column.
const SCENARIO_2 = Object.freeze([
  entry("BONE", 2, "3a", ["BONE-3a-definitive", "BONE-3a-equivocal"]),
  entry("BURN", 2, "1", ["BURN-1"]),
  entry("DISC", 2, "3a", ["DISC-3a-definitive", "DISC-3a-equivocal"]),
  // ENDO 4a, 4b, 4c, 4d (titer excluded), 4f, 5a, 5b, 5c, 5d (titer excluded), 5f, 6e, 7f.
  // 4e/5e (Bartonella indirect immunofluorescence) are absent from Table B1, so a
  // serology-only identification cannot carry a secondary BSI.
  entry("ENDO", 2, "4a", ["ENDO-4"], { requiredEvidenceIds: ["endo-major-typical"] }),
  entry("ENDO", 2, "4b", ["ENDO-4"], { requiredEvidenceIds: ["endo-major-prosthetic-typical"] }),
  entry("ENDO", 2, "4c", ["ENDO-4"], { requiredEvidenceIds: ["endo-major-nontypical"] }),
  entry("ENDO", 2, "4d (titer excluded)", ["ENDO-4"], { requiredEvidenceIds: ["endo-coxiella"], note: "Only the identification of Coxiella burnetii from a blood specimen qualifies. The anti-phase I IgG titer route is excluded by Table B1." }),
  entry("ENDO", 2, "4f", ["ENDO-4"], { requiredEvidenceIds: ["endo-special-pcr"] }),
  entry("ENDO", 2, "5a", ["ENDO-5"], { requiredEvidenceIds: ["endo-major-typical"] }),
  entry("ENDO", 2, "5b", ["ENDO-5"], { requiredEvidenceIds: ["endo-major-prosthetic-typical"] }),
  entry("ENDO", 2, "5c", ["ENDO-5"], { requiredEvidenceIds: ["endo-major-nontypical"] }),
  entry("ENDO", 2, "5d (titer excluded)", ["ENDO-5"], { requiredEvidenceIds: ["endo-coxiella"], note: "Only the identification of Coxiella burnetii from a blood specimen qualifies. The anti-phase I IgG titer route is excluded by Table B1." }),
  entry("ENDO", 2, "5f", ["ENDO-5"], { requiredEvidenceIds: ["endo-special-pcr"] }),
  entry("ENDO", 2, "6e", ["ENDO-6"], { requiredEvidenceIds: ["endo-minor-recognized"] }),
  entry("ENDO", 2, "6e", ["ENDO-6"], { requiredEvidenceIds: ["endo-minor-commensal"] }),
  entry("ENDO", 2, "7f", ["ENDO-7"], { requiredEvidenceIds: ["endo-minor-recognized"] }),
  entry("ENDO", 2, "7f", ["ENDO-7"], { requiredEvidenceIds: ["endo-minor-commensal"] }),
  entry("GIT", 2, "1b", ["GIT-1b"]),
  entry("GIT", 2, "2c", ["GIT-2c-definitive", "GIT-2c-equivocal"]),
  entry("IAB", 2, "2b", ["IAB-2b"]),
  entry("IAB", 2, "3b", ["IAB-3b-definitive", "IAB-3b-equivocal"]),
  entry("JNT", 2, "3c", ["JNT-3c"]),
  entry("MEN", 2, "2c", ["MEN-2"], { requiredEvidenceIds: ["blood-organism"] }),
  entry("MEN", 2, "3c", ["MEN-3"], { requiredEvidenceIds: ["blood-organism"] }),
  entry("OREP", 2, "3a", ["OREP-3"], { requiredEvidenceIds: ["orep-blood-organism"] }),
  entry("SA", 2, "3a", ["SA-3a"]),
  entry("UMB", 2, "1b", ["UMB-1b"]),
  entry("USI", 2, "3b", ["USI-3"], { requiredEvidenceIds: ["usi-blood-organism"] }),
  entry("USI", 2, "4b", ["USI-4"], { requiredEvidenceIds: ["usi-blood-organism"] })
]);

export const TABLE_B1_ENTRIES = Object.freeze([...SCENARIO_1, ...SCENARIO_2]);

// Printed page 4-35: "Do not report secondary bloodstream infection for vascular (VASC)
// infections, ventilator-associated conditions (VAC), infection-related
// ventilator-associated complications (IVAC), or pneumonia 1 (PNU1)."
export const PROHIBITED_SITES = Object.freeze({
  VASC: Object.freeze({
    message: "Do not report a secondary bloodstream infection for a vascular (VASC) infection. Table B1 admits VASC only as an organ/space surgical site infection, criterion 1. If LCBI criteria are met, report the event as an LCBI.",
    exception: "An organ/space SSI-VASC meeting criterion 1 may carry a secondary BSI under Scenario 1.",
    source: REPORTING_INSTRUCTION_SOURCE
  }),
  PNU1: Object.freeze({ message: "Pathogens and secondary bloodstream infections are not reported for PNU1.", source: REPORTING_INSTRUCTION_SOURCE }),
  VAC: Object.freeze({ message: "Do not report a secondary bloodstream infection for a ventilator-associated condition (VAC).", source: REPORTING_INSTRUCTION_SOURCE }),
  IVAC: Object.freeze({ message: "Do not report a secondary bloodstream infection for an infection-related ventilator-associated complication (IVAC).", source: REPORTING_INSTRUCTION_SOURCE })
});

// Figure B1 footnote, printed page 4-45. NEC carries neither a matching site specimen nor a
// blood-organism criterion element, so it sits outside Scenarios 1 and 2.
export const NEC_EXCEPTION = Object.freeze({
  siteCode: "NEC",
  message: "A BSI is considered secondary to NEC if the patient meets one of the two NEC criteria AND an organism identified from a blood specimen, collected during the secondary BSI attribution period, is an LCBI pathogen or the same common commensal is identified from 2 or more blood specimens drawn on separate occasions on the same or consecutive days.",
  source: NEC_EXCEPTION_SOURCE
});

// Sites listed in Table B1 whose definitions live in chapters this application does not
// yet carry. Recorded so the gap is visible rather than silently absent.
export const UNIMPLEMENTED_TABLE_B1_SITES = Object.freeze([
  Object.freeze({ siteCode: "ABUTI", criteria: "ABUTI", chapter: "Chapter 7 — UTI" }),
  Object.freeze({ siteCode: "SUTI", criteria: "1a, 1b or 2", chapter: "Chapter 7 — UTI" }),
  Object.freeze({ siteCode: "SSI", criteria: "SI, DI or OS", chapter: "Chapter 9 — SSI" }),
  Object.freeze({ siteCode: "PNEU", criteria: "2 or 3", chapter: "Chapter 6 — PNEU (evaluated by the PNEU protocol, not Chapter 17)" })
]);

const answered = (evidence, id) => evidence?.[id] === "met";

/**
 * Which Table B1 scenarios a met criterion can support.
 * @param siteCode Chapter 17 site code
 * @param metCriterion the criterion id returned by the site evaluator, or null
 * @param evidence the site's evidence map, used to resolve lettered sub-options
 */
export function evaluateSecondaryBsiGuide({ siteCode = "", metCriterion = null, evidence = {} } = {}) {
  const prohibited = PROHIBITED_SITES[siteCode] || null;
  const siteEntries = TABLE_B1_ENTRIES.filter(item => item.siteCode === siteCode);

  if (!metCriterion) {
    return { siteCode, listedInTableB1: siteEntries.length > 0, prohibited, eligible: false, scenarios: [], matchedEntries: [], siteEntries, necException: siteCode === "NEC" ? NEC_EXCEPTION : null };
  }

  const matchedEntries = siteEntries.filter(item =>
    item.criterionIds.includes(metCriterion) && item.requiredEvidenceIds.every(id => answered(evidence, id))
  );
  const scenarios = [...new Set(matchedEntries.map(item => item.scenario))].sort();

  return {
    siteCode,
    listedInTableB1: siteEntries.length > 0,
    prohibited,
    eligible: matchedEntries.length > 0 && !prohibited,
    scenarios,
    matchedEntries,
    siteEntries,
    necException: siteCode === "NEC" ? NEC_EXCEPTION : null
  };
}
