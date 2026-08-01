import { source, orepCriterionSource, orepInstructionSource, orepAttributionSource } from "../source.js";

const orepItem = (id, label, options = {}) => Object.freeze({ id, label, source: orepCriterionSource, ...options });
const orepAlternateSiteSource = source("17-23–17-24", "24–25", "REPR site definitions and OREP exclusions/reporting instructions", "OREP.alternate-sites");
const orepSites = Object.freeze([
  orepItem("orep-site-deep-pelvic", "Deep pelvic tissue or pelvic space"),
  orepItem("orep-site-epididymis", "Epididymis"),
  orepItem("orep-site-testes", "Testes"),
  orepItem("orep-site-prostate", "Prostate"),
  orepItem("orep-site-vagina", "Vagina (infection other than vaginitis)"),
  orepItem("orep-site-ovaries", "Ovaries"),
  orepItem("orep-site-uterus", "Uterus (infection other than endometritis)"),
  orepItem("orep-site-chorioamnionitis", "Chorioamnionitis")
]);
const orepSiteGroup = (id) => Object.freeze({ id, label: "At least one eligible OREP anatomical site", minimumRequiredCount: 1, anyOf: orepSites });
const orepOtherCause = { exclusionId: "orep-other-recognized-cause" };
const orepAlternateSites = Object.freeze([
  Object.freeze({ id: "orep-vaginitis", label: "Vaginitis is present; vaginitis is excluded from OREP", source: orepAlternateSiteSource, type: "exclusion", blocksPathway: true, routeTo: "Not OREP" }),
  Object.freeze({ id: "orep-endometritis", label: "Endometritis is present; report as EMET rather than OREP", source: orepAlternateSiteSource, type: "exclusion", blocksPathway: true, routeTo: "EMET" }),
  Object.freeze({ id: "orep-vaginal-cuff-infection", label: "Vaginal cuff infection is present; report as VCUF rather than OREP", source: orepAlternateSiteSource, type: "exclusion", blocksPathway: true, routeTo: "VCUF" }),
  Object.freeze({ id: "orep-episiotomy-infection", label: "Episiotomy infection is present; evaluate the separately defined EPIS site rather than OREP", source: orepAlternateSiteSource, type: "exclusion", blocksPathway: true, routeTo: "EPIS" })
]);

export const orepDefinition = Object.freeze({
  majorCategoryCode: "REPR", majorCategoryName: "Reproductive Tract Infection", siteCode: "OREP", siteName: "Pelvic tissue/space infection or other infection of the male or female reproductive tract",
  source: orepCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "OREP-1", label: "Criterion 1 — organism from eligible OREP tissue or fluid", source: orepCriterionSource, allOf: Object.freeze([
      orepItem("orep-site-specimen-organism", "Organism(s) identified from tissue or fluid from the selected OREP site (excluding urine and vaginal swabs) by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]), groups: Object.freeze([orepSiteGroup("OREP-1-sites")]) }),
    Object.freeze({ id: "OREP-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: orepCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      orepSiteGroup("OREP-2-sites"),
      Object.freeze({ id: "OREP-2-exam", label: "At least one qualifying examination finding", minimumRequiredCount: 1, anyOf: Object.freeze([
        orepItem("orep-gross-anatomic-evidence", "Abscess or other evidence of infection of the affected site on gross anatomic examination"),
        orepItem("orep-histopathologic-evidence", "Abscess or other evidence of infection of the affected site on histopathologic examination")
      ]) })
    ]) }),
    Object.freeze({ id: "OREP-3", label: "Criterion 3 — suspected site infection, two findings, and supporting evidence", source: orepCriterionSource, allOf: Object.freeze([
      orepItem("orep-suspected-infection", "Suspected infection of the selected OREP site")
    ]), groups: Object.freeze([
      orepSiteGroup("OREP-3-sites"),
      Object.freeze({ id: "OREP-3-findings", label: "At least two qualifying signs or symptoms", minimumRequiredCount: 2, anyOf: Object.freeze([
        orepItem("orep-fever", "Fever (>38.0°C)"),
        orepItem("orep-nausea", "Nausea, with no other recognized cause", orepOtherCause),
        orepItem("orep-vomiting", "Vomiting, with no other recognized cause", orepOtherCause),
        orepItem("orep-pain-tenderness", "Pain or tenderness, with no other recognized cause", orepOtherCause),
        orepItem("orep-dysuria", "Dysuria, with no other recognized cause", orepOtherCause)
      ]) }),
      Object.freeze({ id: "OREP-3-support", label: "At least one qualifying microbiology or treatment alternative", minimumRequiredCount: 1, anyOf: Object.freeze([
        orepItem("orep-blood-organism", "Organism(s) identified from blood by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)"),
        orepItem("orep-antimicrobial-within-two-days", "Physician or physician designee initiates antimicrobial therapy within two days of onset or worsening of symptoms")
      ]) })
    ]) })
  ]),
  exclusions: Object.freeze([
    ...orepAlternateSites,
    orepItem("orep-other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" })
  ]),
  hardExclusionIds: Object.freeze(orepAlternateSites.map(({ id }) => id)),
  notes: Object.freeze([
    Object.freeze({ id: "OREP-note-boundary", text: "OREP includes chorioamnionitis, but excludes vaginitis, endometritis, and vaginal cuff infections. Selection of an organism-associated suggested site alone does not establish OREP.", source: orepCriterionSource }),
    Object.freeze({ id: "OREP-note-nonexhaustive-sites", text: "The source introduces its anatomical list as examples and does not provide an exhaustive list. This pathway exposes the named sites and deep pelvic tissue/space only; an unlisted site requires source-based review rather than automatic qualification.", source: orepCriterionSource }),
    Object.freeze({ id: "OREP-note-no-extra-branches", text: "The OREP definition provides no imaging-only, operative-procedure-only, pathology-only, or physician-diagnosis-only criterion.", source: orepCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "OREP-report-emet", text: "Report endometritis as EMET.", source: orepInstructionSource }),
    Object.freeze({ id: "OREP-report-vcuf", text: "Report vaginal cuff infections as VCUF.", source: orepInstructionSource }),
    Object.freeze({ id: "OREP-report-uti", text: "If the patient meets both an OREP event (HAI or organ/space SSI) and a UTI criterion, report both events.", source: orepInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: orepAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete OREP definition is met", source: orepAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the OREP criterion", source: orepAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the OREP secondary BSI attribution period (or in the infection window when used as a criterion element)", source: orepAttributionSource })
  ]) })
});
