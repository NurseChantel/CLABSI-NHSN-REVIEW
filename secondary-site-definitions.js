const document = "Secondary BSI Chapter.pdf";
const warning = "Site definition not yet validated against the current NHSN manual. This pathway cannot qualify for secondary BSI attribution.";
const source = (printedPage, pdfPage, sectionHeading, sourceDataId) => Object.freeze({ document, chapter: "Chapter 17 — Surveillance Definitions for Specific Types of Infections", printedPage, pdfPage, sectionHeading, sourceDataId });
const menCriterionSource = source("17-11", 12, "MEN — Meningitis or ventriculitis", "MEN");
const menInstructionSource = source("17-12", 13, "MEN — Reporting Instructions", "MEN.reporting-instructions");
const attributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "MEN.secondary-bsi");
const icCriterionSource = source("17-10–17-11", "11–12", "IC — Intracranial infection", "IC");
const icInstructionSource = source("17-11", 12, "IC — Reporting Instructions", "IC.reporting-instructions");
const icAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "IC.secondary-bsi");
const saCriterionSource = source("17-12", 13, "SA — Spinal abscess/infection", "SA");
const saInstructionSource = source("17-12", 13, "SA — Reporting Instructions", "SA.reporting-instructions");
const saAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "SA.secondary-bsi");
const boneCriterionSource = source("17-7–17-8", "8–9", "BONE — Osteomyelitis", "BONE");
const boneInstructionSource = source("17-8", 9, "BONE — Reporting Instructions", "BONE.reporting-instructions");
const boneTimingSource = source("17-7", 8, "BONE infection window, RIT, and secondary BSI attribution period", "BONE.timing-and-secondary-bsi");
const discCriterionSource = source("17-8", 9, "DISC — Disc space infection", "DISC");
const discAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "DISC.secondary-bsi");
const pjiCriterionSource = source("17-9–17-10", "10–11", "PJI — Periprosthetic Joint Infection", "PJI");
const pjiInstructionSource = source("17-10", 11, "PJI — Reporting Instruction", "PJI.reporting-instruction");
const pjiAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "PJI.secondary-bsi");
const usiCriterionSource = source("17-28–17-29", "29–30", "USI — Urinary System Infection", "USI");
const usiInstructionSource = source("17-29", 30, "USI — Reporting Instructions", "USI.reporting-instructions");
const usiAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "USI.secondary-bsi");
const jntCriterionSource = source("17-9", 10, "JNT — Joint or bursa infection (not for use as Organ/Space SSI after HPRO or KPRO procedures)", "JNT");
const jntInstructionSource = source("17-9", 10, "JNT — Reporting Instruction", "JNT.reporting-instruction");
const jntAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "JNT.secondary-bsi");
const endoTimingSource = source("17-29", 30, "ENDO Appendix — infection window, RIT, and secondary BSI attribution period", "ENDO.timing-and-secondary-bsi");
const endoCriterionSource = source("17-30–17-33", "31–34", "ENDO — Endocarditis", "ENDO");
const endoFootnoteSource = source("17-34–17-35", "35–36", "ENDO Footnotes", "ENDO.footnotes");
const medCriterionSource = source("17-13–17-14", "14–15", "MED — Mediastinitis", "MED");
const medInstructionSource = source("17-14", 15, "MED — Comment and Reporting Instruction", "MED.reporting-instruction");
const medAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "MED.secondary-bsi");
const cardCriterionSource = source("17-13", 14, "CARD — Myocarditis or pericarditis", "CARD");
const cardAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "CARD.secondary-bsi");
const vascCriterionSource = source("17-14", 15, "VASC — Arterial or venous infection", "VASC");
const vascInstructionSource = source("17-14", 15, "VASC — Reporting Instructions", "VASC.reporting-instructions");
const vascAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "VASC.secondary-bsi");
const necSource = Object.freeze({ document: "clabsi nhsn.pdf", chapter: "Chapter 4 — Bloodstream Infection Event (Central Line-Associated Bloodstream Infection and Non-central Line Associated Bloodstream Infection)", printedPage: "4-30–4-31", pdfPage: "31–32", sectionHeading: "Appendix: Secondary BSI Guide — Exception to Scenarios 1 & 2: Necrotizing Enterocolitis (NEC)", sourceDataId: "NEC" });
const necChapter17Source = source("17-22", 23, "NEC — Necrotizing enterocolitis (See Chapter 4)", "NEC.chapter-17-note");
const necAttributionSource = Object.freeze({ ...necSource, sourceDataId: "NEC.secondary-bsi-exception" });
const emetCriterionSource = source("17-23", 24, "EMET — Endometritis", "EMET");
const emetInstructionSource = source("17-23", 24, "EMET — Reporting Instructions", "EMET.reporting-instructions");
const emetAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "EMET.secondary-bsi");
const episCriterionSource = source("17-23", 24, "EPIS — Episiotomy infection", "EPIS");
const episAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "EPIS.secondary-bsi");
const orepCriterionSource = source("17-23–17-24", "24–25", "OREP — Pelvic tissue/space infection or other infection of the male or female reproductive tract", "OREP");
const orepInstructionSource = source("17-24", 25, "OREP — Reporting Instructions", "OREP.reporting-instructions");
const orepAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "OREP.secondary-bsi");
const cdiCriterionSource = source("17-18–17-19", "19–20", "CDI — Clostridioides difficile Infection", "CDI");
const cdiInstructionSource = source("17-19", 20, "CDI — Reporting Instructions and Comments", "CDI.reporting-instructions");
const cdiAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "CDI.secondary-bsi");
const vcufCriterionSource = source("17-24", 25, "VCUF — Vaginal cuff infection", "VCUF");
const vcufInstructionSource = source("17-24", 25, "VCUF — Reporting Instruction", "VCUF.reporting-instruction");
const vcufAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "VCUF.secondary-bsi");
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

const episItem = (id, label) => Object.freeze({ id, label, source: episCriterionSource });
const episPostpartumVaginalDelivery = episItem("epis-postpartum-vaginal-delivery", "Patient had a postpartum vaginal delivery");
export const episDefinition = Object.freeze({
  majorCategoryCode: "REPR", majorCategoryName: "Reproductive Tract Infection", siteCode: "EPIS", siteName: "Episiotomy infection",
  source: episCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "EPIS-1", label: "Criterion 1 — purulent drainage from episiotomy site", source: episCriterionSource, allOf: Object.freeze([
      episPostpartumVaginalDelivery,
      episItem("epis-purulent-drainage", "Purulent drainage from the episiotomy site")
    ]) }),
    Object.freeze({ id: "EPIS-2", label: "Criterion 2 — episiotomy abscess", source: episCriterionSource, allOf: Object.freeze([
      episPostpartumVaginalDelivery,
      episItem("epis-abscess", "Episiotomy abscess")
    ]) })
  ]),
  exclusions: Object.freeze([]),
  notes: Object.freeze([]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: episAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete EPIS definition is met", source: episAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the EPIS criterion", source: episAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the EPIS secondary BSI attribution period (or in the infection window when used as a criterion element)", source: episAttributionSource })
  ]) })
});

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

const cdiItem = (id, label, options = {}) => Object.freeze({ id, label, source: cdiCriterionSource, ...options });
const cdiRitItem = cdiItem("cdi-new-event-rit-eligible", "No existing GI-CDI Repeat Infection Timeframe (RIT) prevents this from being reported as a new GI-CDI event", { source: cdiInstructionSource });

export const cdiDefinition = Object.freeze({
  majorCategoryCode: "GI", majorCategoryName: "Gastrointestinal System Infection", siteCode: "CDI", siteName: "Clostridioides difficile Infection",
  source: cdiCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "CDI-1", label: "Criterion 1 — toxin-producing C. difficile test from an unformed stool specimen", source: cdiCriterionSource, allOf: Object.freeze([
      cdiItem("cdi-positive-toxin-producing-test", "Positive test for toxin-producing C. difficile"),
      cdiItem("cdi-unformed-stool-specimen", "The tested stool specimen was unformed (conformed to the shape of the container)"),
      cdiRitItem
    ]) }),
    Object.freeze({ id: "CDI-2", label: "Criterion 2 — pseudomembranous colitis", source: cdiCriterionSource, allOf: Object.freeze([
      cdiRitItem
    ]), groups: Object.freeze([
      Object.freeze({ id: "CDI-2-evidence", label: "At least one qualifying examination finding", minimumRequiredCount: 1, anyOf: Object.freeze([
        cdiItem("cdi-pseudomembranous-colitis-gross", "Evidence of pseudomembranous colitis on gross anatomic examination (including endoscopic examination)"),
        cdiItem("cdi-pseudomembranous-colitis-histopathology", "Evidence of pseudomembranous colitis on histopathologic examination")
      ]) })
    ]) })
  ]),
  exclusions: Object.freeze([]),
  notes: Object.freeze([
    Object.freeze({ id: "CDI-note-multitest", text: "When a multi-testing methodology is used for C. difficile identification, the result of the last test finding placed in the patient medical record determines whether CDI criterion 1 is met.", source: cdiInstructionSource }),
    Object.freeze({ id: "CDI-note-doe", text: "For CDI criterion 1, the date of event is the collection date of the unformed stool specimen, not the date diarrhea began.", source: cdiInstructionSource }),
    Object.freeze({ id: "CDI-note-labid", text: "CDI LabID Event categorizations do not apply to HAIs, including C. difficile-associated gastrointestinal infections (GI-CDI).", source: cdiInstructionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "CDI-report-coexisting-enteric", text: "Report CDI and GE or GIT when additional enteric organism(s) are identified and the GE or GIT criteria are also met.", source: cdiInstructionSource }),
    Object.freeze({ id: "CDI-report-rit", text: "Report each new GI-CDI according to the NHSN Repeat Infection Timeframe (RIT) rule for HAIs in Chapter 2.", source: cdiInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: cdiAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete CDI definition is met", source: cdiAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism has the required NHSN relationship to the CDI site criterion; CDI qualification alone does not establish this relationship", source: cdiAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the CDI secondary BSI attribution period", source: cdiAttributionSource })
  ]) })
});

const vcufItem = (id, label) => Object.freeze({ id, label, source: vcufCriterionSource });
export const vcufDefinition = Object.freeze({
  majorCategoryCode: "REPR", majorCategoryName: "Reproductive Tract Infection", siteCode: "VCUF", siteName: "Vaginal cuff infection",
  source: vcufCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "VCUF-1", label: "Criterion 1 — purulent drainage", source: vcufCriterionSource, allOf: Object.freeze([
      vcufItem("vcuf-purulent-drainage", "Purulent drainage from the vaginal cuff")
    ]) }),
    Object.freeze({ id: "VCUF-2", label: "Criterion 2 — abscess or other evidence of infection", source: vcufCriterionSource, allOf: Object.freeze([
      vcufItem("vcuf-abscess-or-infection-evidence", "Abscess or other evidence of infection at the vaginal cuff on gross anatomic examination or invasive procedure")
    ]) }),
    Object.freeze({ id: "VCUF-3", label: "Criterion 3 — organism from vaginal cuff fluid or tissue", source: vcufCriterionSource, allOf: Object.freeze([
      vcufItem("vcuf-cuff-fluid-tissue-organism", "Organism(s) identified from fluid or tissue from the vaginal cuff by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]) })
  ]),
  exclusions: Object.freeze([]),
  notes: Object.freeze([
    Object.freeze({ id: "VCUF-note-site-definition-timing", text: "The VCUF site definition does not make a hysterectomy procedure or the SSI surveillance period a qualifying element; those facts determine SSI reporting under the separate reporting instruction.", source: vcufInstructionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "VCUF-report-ssi", text: "Report vaginal cuff infections as SSI-VCUF when the date of event occurs within the 30-day surveillance period following a hysterectomy procedure.", source: vcufInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: vcufAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete VCUF definition is met", source: vcufAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the VCUF criterion", source: vcufAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the VCUF secondary BSI attribution period (or in the infection window when used as a criterion element)", source: vcufAttributionSource })
  ]) })
});

const medItem = (id, label, options = {}) => Object.freeze({ id, label, source: medCriterionSource, ...options });
const medOtherCause = { exclusionId: "med-other-recognized-cause" };
const medDrainageOrImaging = Object.freeze([medItem("med-purulent-drainage", "Purulent drainage from mediastinal area"), medItem("med-mediastinal-widening", "Mediastinal widening on imaging test")]);
export const medDefinition = Object.freeze({
  majorCategoryCode: "CVS", majorCategoryName: "Cardiovascular System Infection", siteCode: "MED", siteName: "Mediastinitis",
  source: medCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "MED-1", label: "Criterion 1 — organism from mediastinal tissue or fluid", source: medCriterionSource, allOf: Object.freeze([medItem("med-site-organism", "Organism(s) identified from mediastinal tissue or mediastinal fluid by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "MED-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: medCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      Object.freeze({ id: "MED-2-exam", label: "At least one qualifying examination finding", minimumRequiredCount: 1, anyOf: Object.freeze([medItem("med-gross-anatomic", "Evidence of mediastinitis on gross anatomic exam"), medItem("med-histopathology", "Evidence of mediastinitis on histopathologic exam")]) })
    ]) }),
    Object.freeze({ id: "MED-3", label: "Criterion 3 — sign or symptom plus drainage or imaging", source: medCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      Object.freeze({ id: "MED-3-symptoms", label: "At least one qualifying sign or symptom", minimumRequiredCount: 1, anyOf: Object.freeze([medItem("med-fever", "Fever (>38.0°C)"), medItem("med-chest-pain", "Chest pain, with no other recognized cause", medOtherCause), medItem("med-sternal-instability", "Sternal instability, with no other recognized cause", medOtherCause)]) }),
      Object.freeze({ id: "MED-3-support", label: "At least one qualifying drainage or imaging finding", minimumRequiredCount: 1, anyOf: medDrainageOrImaging })
    ]) }),
    Object.freeze({ id: "MED-4", label: "Criterion 4 — patient ≤1 year of age", source: medCriterionSource, ageApplicability: "infant", allOf: Object.freeze([medItem("med-age-one-or-younger", "Patient ≤1 year of age")]), groups: Object.freeze([
      Object.freeze({ id: "MED-4-symptoms", label: "At least one qualifying sign or symptom", minimumRequiredCount: 1, anyOf: Object.freeze([medItem("med-fever", "Fever (>38.0°C)"), medItem("med-hypothermia", "Hypothermia (<36.0°C)"), medItem("med-apnea", "Apnea, with no other recognized cause", medOtherCause), medItem("med-bradycardia", "Bradycardia, with no other recognized cause", medOtherCause), medItem("med-sternal-instability", "Sternal instability, with no other recognized cause", medOtherCause)]) }),
      Object.freeze({ id: "MED-4-support", label: "At least one qualifying drainage or imaging finding", minimumRequiredCount: 1, anyOf: medDrainageOrImaging })
    ]) })
  ]),
  exclusions: Object.freeze([medItem("med-other-recognized-cause", "Another recognized cause applies to a finding marked by NHSN with an asterisk", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "MED-note-space", text: "The mediastinal space is the area under the sternum and in front of the vertebral column; it is divided into anterior, middle, posterior, and superior regions.", source: medInstructionSource }),
    Object.freeze({ id: "MED-note-imaging", text: "For MED 4b, mediastinal stranding, mediastinal fluid collection, mediastinal edema, and mediastinal abscess are eligible imaging findings for the mediastinal-widening element.", source: medInstructionSource })
  ]),
  reportingInstructions: Object.freeze([Object.freeze({ id: "MED-report-bone", text: "Report mediastinitis following cardiac surgery that is accompanied by osteomyelitis as SSI-MED rather than SSI-BONE.", source: medInstructionSource })]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: medAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete MED definition is met", source: medAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the MED criterion", source: medAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the MED secondary BSI attribution period (or in the infection window when used as a criterion element)", source: medAttributionSource })
  ]) })
});

const endoItem = (id, label, options = {}) => Object.freeze({ id, label, source: endoCriterionSource, ...options });
const endoGroup = (id, label, minimumRequiredCount, anyOf) => Object.freeze({ id, label, minimumRequiredCount, anyOf: Object.freeze(anyOf) });
const endoImaging = Object.freeze([
  endoItem("endo-echo-ct-vegetation", "Echocardiography or cardiac CT: vegetation on cardiac valve or supporting structures"),
  endoItem("endo-echo-ct-perforation", "Echocardiography or cardiac CT: valvular/leaflet perforation"),
  endoItem("endo-echo-ct-aneurysm", "Echocardiography or cardiac CT: valvular/leaflet aneurysm"),
  endoItem("endo-echo-ct-abscess", "Echocardiography or cardiac CT: perivalvular or peri-graft abscess"),
  endoItem("endo-echo-ct-pseudoaneurysm", "Echocardiography or cardiac CT: pseudoaneurysm"),
  endoItem("endo-echo-ct-fistula", "Echocardiography or cardiac CT: intracardiac fistula"),
  endoItem("endo-echo-new-regurgitation", "Echocardiography: significant new (moderate or severe), valve-specific valvular regurgitation compared with previous imaging; worsening of pre-existing regurgitation is not eligible"),
  endoItem("endo-echo-ct-dehiscence", "Echocardiography or cardiac CT: new partial dehiscence of prosthetic valve compared with previous imaging"),
  endoItem("endo-pet-late-activity", "FDG PET/CT: abnormal metabolic activity involving a native or prosthetic valve, ascending aortic graft with valve involvement, intracardiac device leads, or other intracardiac prosthetic material more than 3 months after cardiac surgery"),
  endoItem("endo-pet-early-activity", "FDG PET/CT: abnormal metabolic activity within 3 months after implantation of a prosthetic valve, ascending aortic graft with valve involvement, intracardiac device leads, or other intracardiac prosthetic material")
]);
const endoMajorMicrobiology = Object.freeze([
  endoItem("endo-major-typical", "Typical infectious endocarditis organism(s) (Staphylococcus aureus, Staphylococcus lugdunensis, Enterococcus faecalis, all streptococcal species except Streptococcus pneumoniae and Streptococcus pyogenes, Granulicatella spp., Abiotrophia spp., Gemella spp., or HACEK group microorganisms) identified from 2 or more blood collections drawn on separate occasions with no more than 1 calendar day between specimen collections"),
  endoItem("endo-major-prosthetic-typical", "In the presence of prosthetic material, coagulase-negative Staphylococci, Corynebacterium striatum, Corynebacterium jeikeium, Serratia marcescens, Pseudomonas aeruginosa, Cutibacterium acnes, non-tuberculous mycobacteria, or Candida spp. identified from 3 or more blood collections drawn on separate occasions with no more than 1 calendar day between specimen collections"),
  endoItem("endo-major-nontypical", "A non-typical infectious endocarditis organism identified from 3 or more blood collections drawn on separate occasions with no more than 1 calendar day between specimen collections"),
  endoItem("endo-coxiella", "Coxiella burnetii identified by anti-phase I IgG antibody titer >1:800 or identified from a single blood specimen by an eligible culture or non-culture based microbiologic testing method"),
  endoItem("endo-bartonella-serology", "Indirect immunofluorescence assay for IgM and IgG antibodies to Bartonella henselae or Bartonella quintana with IgG titer >1:800"),
  endoItem("endo-special-pcr", "Coxiella burnetii, Bartonella species, or Tropheryma whipplei identified in blood by PCR or another non-culture-based testing method")
]);
const endoRisk = endoItem("endo-risk", "Prior endocarditis, prosthetic valve, previous valve repair, CIED, uncorrected congenital heart disease, more than mild valvular regurgitation or stenosis, hypertrophic obstructive cardiomyopathy, or known IV drug use (may be documented during the current admission outside the infection window, but must not set the date of event)");
const endoFever = endoItem("endo-fever", "Fever (>38.0°C)");
const endoNewRegurgitation = endoItem("endo-auscultation-regurgitation", "New valvular regurgitation on auscultation when an echocardiogram is not available");
const endoVascular = endoItem("endo-vascular", "Vascular phenomenon: major arterial embolus, septic pulmonary infarct, mycotic aneurysm, intracranial hemorrhage, conjunctival hemorrhage, or documented Janeway lesion");
const endoImmune = endoItem("endo-immunologic", "Immunologic phenomenon: Osler's node, Roth's spot, positive rheumatoid factor, or documented immune complex-mediated glomerulonephritis (qualifying renal biopsy, or unexplained acute kidney injury/acute-on-chronic kidney injury plus two of hematuria, proteinuria, cellular casts, hypocomplementemia, cryoglobulinemia, or circulating immune complexes)");
const endoMinorMicro = Object.freeze({ id: "endo-minor-micro", label: "Blood microbiology", anyOf: Object.freeze([
  endoItem("endo-minor-recognized", "Recognized pathogen identified from blood by an eligible culture or non-culture based microbiologic testing method"),
  endoItem("endo-minor-commensal", "Same common commensal identified from 2 or more blood collections on separate occasions on the same or consecutive days by an eligible culture or non-culture based microbiologic testing method")
]) });
const endoClinicalElements = Object.freeze([
  Object.freeze({ id: "endo-risk-element", label: "Predisposition", anyOf: Object.freeze([endoRisk]) }),
  Object.freeze({ id: "endo-fever-element", label: "Fever", anyOf: Object.freeze([endoFever]) }),
  Object.freeze({ id: "endo-regurgitation-element", label: "New auscultated regurgitation", anyOf: Object.freeze([endoNewRegurgitation]) }),
  Object.freeze({ id: "endo-vascular-element", label: "Vascular phenomena", anyOf: Object.freeze([endoVascular]) }),
  Object.freeze({ id: "endo-immunologic-element", label: "Immunologic phenomena", anyOf: Object.freeze([endoImmune]) })
]);

export const endoDefinition = Object.freeze({
  majorCategoryCode: "CVS", majorCategoryName: "Cardiovascular System Infection", siteCode: "ENDO", siteName: "Endocarditis",
  source: endoCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "ENDO-1", label: "Criterion 1 — organism from eligible cardiac or embolic specimen", source: endoCriterionSource, allOf: Object.freeze([endoItem("endo-site-organism", "Organism(s) identified by an eligible culture or non-culture method from cardiac vegetation, cardiac tissue, explanted prosthetic valve or sewing ring, ascending aortic graft with valve involvement, endovascular CIED, arterial embolus, or eligible pacemaker/defibrillator lead or intracardiac VAD component")]) }),
    Object.freeze({ id: "ENDO-2", label: "Criterion 2 — histopathologic endocarditis", source: endoCriterionSource, allOf: Object.freeze([endoItem("endo-histopathology", "Endocarditis seen on histopathologic examination of cardiac vegetation, cardiac tissue, explanted prosthetic valve or sewing ring, ascending aortic graft with valve involvement, endovascular CIED, or embolus")]) }),
    Object.freeze({ id: "ENDO-3", label: "Criterion 3 — intraoperative gross anatomic evidence", source: endoCriterionSource, allOf: Object.freeze([endoItem("endo-operative", "Intraoperative evidence of endocarditis on gross anatomic examination during a cardiac operative procedure")]) }),
    Object.freeze({ id: "ENDO-4", label: "Criterion 4 — imaging and major microbiology", source: endoCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([endoGroup("ENDO-4-imaging", "At least one qualifying imaging finding; equivocal evidence also requires physician or physician-designee documentation of antimicrobial treatment for endocarditis", 1, endoImaging), endoGroup("ENDO-4-microbiology", "At least one qualifying major microbiology pathway", 1, endoMajorMicrobiology)]) }),
    Object.freeze({ id: "ENDO-5", label: "Criterion 5 — three clinical elements and major microbiology", source: endoCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([endoGroup("ENDO-5-clinical", "At least three different clinical elements (only one condition within each element)", 3, endoClinicalElements), endoGroup("ENDO-5-microbiology", "At least one qualifying major microbiology pathway", 1, endoMajorMicrobiology)]) }),
    Object.freeze({ id: "ENDO-6", label: "Criterion 6 — imaging and three minor elements", source: endoCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([endoGroup("ENDO-6-imaging", "At least one qualifying imaging finding; equivocal evidence also requires physician or physician-designee documentation of antimicrobial treatment for endocarditis", 1, endoImaging), endoGroup("ENDO-6-elements", "At least three different elements (only one condition within each element)", 3, [endoClinicalElements[0], endoClinicalElements[1], endoClinicalElements[3], endoClinicalElements[4], endoMinorMicro])]) }),
    Object.freeze({ id: "ENDO-7", label: "Criterion 7 — one condition from each of six elements", source: endoCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([endoGroup("ENDO-7-elements", "All six distinct elements are required", 6, [...endoClinicalElements, endoMinorMicro])]) })
  ]),
  exclusions: Object.freeze([]),
  notes: Object.freeze([
    Object.freeze({ id: "ENDO-note-equivocal", text: "Equivocal echocardiographic, cardiac CT, or FDG PET/CT evidence qualifies only with physician or physician-designee documentation of antimicrobial treatment for endocarditis.", source: endoFootnoteSource }),
    Object.freeze({ id: "ENDO-note-risk-timing", text: "Predisposition elements documented during the current admission may be outside the ENDO infection window or SSI surveillance period and must not set the ENDO date of event.", source: endoFootnoteSource }),
    Object.freeze({ id: "ENDO-note-window", text: "The ENDO infection window is 21 days: the first positive diagnostic test used as an element, 10 calendar days before, and 10 calendar days after; the RIT extends through the remainder of the current admission.", source: endoTimingSource })
  ]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: endoTimingSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete ENDO definition is met", source: endoTimingSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism matches the organism used to meet ENDO, unless that blood specimen itself can be used to meet the ENDO criterion", source: endoTimingSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the 21-day ENDO infection window or on a subsequent day of the same current admission", source: endoTimingSource })
  ]) })
});

const icItem = (id, label, options = {}) => Object.freeze({ id, label, source: icCriterionSource, ...options });
const icFindings = Object.freeze([
  icItem("headache", "Headache, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("dizziness", "Dizziness, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("fever", "Fever (>38.0°C)"),
  icItem("localizing-neurologic-signs", "Localizing neurologic sign(s), with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("changing-consciousness", "Changing level of consciousness, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("confusion", "Confusion, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const icInfantFindings = Object.freeze([
  icItem("fever", "Fever (>38.0°C)"),
  icItem("hypothermia", "Hypothermia (<36.0°C)"),
  icItem("apnea", "Apnea, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("bradycardia", "Bradycardia, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("localizing-neurologic-signs", "Localizing neurologic sign(s), with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  icItem("changing-consciousness", "Changing level of consciousness (for example, irritability, poor feeding, lethargy), with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const icSupport = Object.freeze([
  icItem("microscopic-organism", "Organism(s) seen on microscopic examination of brain or abscess tissue obtained by needle aspiration, during an invasive procedure, or at autopsy"),
  icItem("definitive-imaging", "Imaging test evidence definitive for infection (for example, ultrasound, CT scan, MRI, radionuclide brain scan, or arteriogram)"),
  icItem("equivocal-imaging-with-treatment", "Equivocal imaging supported by clinical correlation: physician or physician-designee documentation of antimicrobial treatment for intracranial infection"),
  icItem("diagnostic-antibody", "Diagnostic single antibody titer (IgM) or 4-fold increase in paired sera (IgG) for organism")
]);

export const icDefinition = Object.freeze({
  majorCategoryCode: "CNS", majorCategoryName: "Central Nervous System Infection", siteCode: "IC", siteName: "Intracranial infection (brain abscess, subdural or epidural infection, encephalitis)",
  source: icCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "IC-1", label: "Criterion 1 — brain tissue or dura organism", source: icCriterionSource, allOf: Object.freeze([icItem("brain-tissue-dura-organism", "Organism(s) identified from brain tissue or dura by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "IC-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: icCriterionSource, allOf: Object.freeze([icItem("gross-histopathologic-evidence", "Abscess or evidence of intracranial infection on gross anatomic or histopathologic examination")]) }),
    Object.freeze({ id: "IC-3", label: "Criterion 3 — signs or symptoms and supporting evidence", source: icCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      Object.freeze({ id: "IC-3-findings", label: "At least two signs or symptoms", minimumRequiredCount: 2, anyOf: icFindings }),
      Object.freeze({ id: "IC-3-support", label: "At least one supporting test", minimumRequiredCount: 1, anyOf: icSupport })
    ]) }),
    Object.freeze({ id: "IC-4", label: "Criterion 4 — patient ≤1 year of age", source: icCriterionSource, allOf: Object.freeze([icItem("age-one-or-younger", "Patient ≤1 year of age")]), groups: Object.freeze([
      Object.freeze({ id: "IC-4-findings", label: "At least two signs or symptoms", minimumRequiredCount: 2, anyOf: icInfantFindings }),
      Object.freeze({ id: "IC-4-support", label: "At least one supporting test", minimumRequiredCount: 1, anyOf: icSupport })
    ]) })
  ]),
  exclusions: Object.freeze([icItem("other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "IC-note-equivocal-imaging", text: "Equivocal imaging qualifies only when supported by clinical correlation, specifically physician or physician-designee documentation of antimicrobial treatment for intracranial infection.", source: icCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "IC-report-encephalitis", text: "Report as MEN if meningitis (MEN) and encephalitis (IC) are present together.", source: icInstructionSource }),
    Object.freeze({ id: "IC-report-abscess", text: "Report as IC if meningitis (MEN) and a brain abscess (IC) are present together after operation.", source: icInstructionSource }),
    Object.freeze({ id: "IC-report-spinal", text: "Report as SA if meningitis (MEN) and spinal abscess/infection (SA) are present together.", source: icInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: icAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete IC definition is met", source: icAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the IC criterion", source: icAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the IC secondary BSI attribution period (or in the infection window when used as a criterion element)", source: icAttributionSource })
  ]) })
});

const saItem = (id, label, options = {}) => Object.freeze({ id, label, source: saCriterionSource, ...options });
const saLocalizedFindings = Object.freeze([
  saItem("sa-fever", "Fever (>38.0°C)"),
  saItem("sa-back-pain", "Back pain, with no other recognized cause", { exclusionId: "sa-other-recognized-cause" }),
  saItem("sa-tenderness", "Tenderness, with no other recognized cause", { exclusionId: "sa-other-recognized-cause" }),
  saItem("sa-radiculitis", "Radiculitis, with no other recognized cause", { exclusionId: "sa-other-recognized-cause" }),
  saItem("sa-paraparesis", "Paraparesis, with no other recognized cause", { exclusionId: "sa-other-recognized-cause" }),
  saItem("sa-paraplegia", "Paraplegia, with no other recognized cause", { exclusionId: "sa-other-recognized-cause" })
]);
const saFindingsGroup = (id) => Object.freeze({ id, label: "At least one localized sign or symptom", minimumRequiredCount: 1, anyOf: saLocalizedFindings });
const saDefinitiveImaging = saItem("sa-definitive-imaging", "Imaging test evidence definitive for spinal abscess/infection (for example, myelography, ultrasound, CT scan, MRI, or other scans); equivocal imaging is eligible only with physician or physician-designee documentation of antimicrobial treatment for spinal abscess/infection");

export const saDefinition = Object.freeze({
  majorCategoryCode: "CNS", majorCategoryName: "Central Nervous System Infection", siteCode: "SA", siteName: "Spinal abscess/infection (spinal abscess, spinal subdural or epidural infection)",
  source: saCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "SA-1", label: "Criterion 1 — organism from spinal abscess or purulent material", source: saCriterionSource, allOf: Object.freeze([saItem("sa-site-organism", "Organism(s) identified from an abscess or from purulent material found in the spinal epidural or subdural space by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "SA-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: saCriterionSource, allOf: Object.freeze([saItem("sa-gross-histopathologic-evidence", "Abscess or other evidence of spinal infection on gross anatomic or histopathologic examination")]) }),
    Object.freeze({ id: "SA-3a", label: "Criterion 3a — localized finding, blood organism, and imaging", source: saCriterionSource, allOf: Object.freeze([
      saItem("sa-blood-organism", "Organism(s) identified from blood by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)"), saDefinitiveImaging
    ]), groups: Object.freeze([saFindingsGroup("SA-3a-findings")]) }),
    Object.freeze({ id: "SA-3b", label: "Criterion 3b — localized finding and imaging", source: saCriterionSource, allOf: Object.freeze([saDefinitiveImaging]), groups: Object.freeze([saFindingsGroup("SA-3b-findings")]) })
  ]),
  exclusions: Object.freeze([saItem("sa-other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "SA-note-equivocal-imaging", text: "Equivocal imaging qualifies only with clinical correlation: physician or physician-designee documentation of antimicrobial treatment for spinal abscess/infection.", source: saCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "SA-report-men", text: "Report as SA if meningitis (MEN) and spinal abscess/infection (SA) are present together after operation.", source: saInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: saAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete SA definition is met", source: saAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the SA criterion", source: saAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the SA secondary BSI attribution period (or in the infection window when used as a criterion element)", source: saAttributionSource })
  ]) })
});

const boneItem = (id, label, options = {}) => Object.freeze({ id, label, source: boneCriterionSource, ...options });
const boneFindings = Object.freeze([
  boneItem("bone-fever", "Fever (>38.0°C)"),
  boneItem("bone-swelling", "Swelling, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  boneItem("bone-pain-tenderness", "Pain or tenderness, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  boneItem("bone-heat", "Heat, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  boneItem("bone-drainage", "Drainage, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const boneFindingsGroup = (id) => Object.freeze({ id, label: "At least two localized signs or symptoms", minimumRequiredCount: 2, anyOf: boneFindings });
const boneBloodOrganism = boneItem("bone-blood-organism", "Organism(s) identified from blood by culture or non-culture based microbiologic testing performed for clinical diagnosis and treatment (not ASC/AST)");
const boneDefinitiveImaging = boneItem("bone-definitive-imaging", "Imaging test evidence definitive for infection (for example, x-ray, CT scan, MRI, or radiolabel scan [gallium, technetium, etc.])");
const boneEquivocalImaging = boneItem("bone-equivocal-imaging", "Imaging test evidence for infection is equivocal");
const boneTreatment = boneItem("bone-antimicrobial-treatment", "Physician or physician-designee documentation of antimicrobial treatment for osteomyelitis");
const boneDiagnosis = boneItem("bone-physician-diagnosis", "Physician or physician-designee diagnosis of osteomyelitis");

export const boneDefinition = Object.freeze({
  majorCategoryCode: "BJ", majorCategoryName: "Bone and Joint Infection", siteCode: "BONE", siteName: "Osteomyelitis",
  source: boneCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "BONE-1", label: "Criterion 1 — organism identified from bone", source: boneCriterionSource, allOf: Object.freeze([boneItem("bone-site-organism", "Organism(s) identified from bone by culture or non-culture based microbiologic testing performed for clinical diagnosis and treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "BONE-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: boneCriterionSource, allOf: Object.freeze([boneItem("bone-gross-histopathologic-evidence", "Evidence of osteomyelitis on gross anatomic or histopathologic examination")]) }),
    Object.freeze({ id: "BONE-3a-definitive", label: "Criterion 3a — localized findings, blood organism, and definitive imaging", source: boneCriterionSource, allOf: Object.freeze([boneBloodOrganism, boneDefinitiveImaging]), groups: Object.freeze([boneFindingsGroup("BONE-3a-definitive-findings")]) }),
    Object.freeze({ id: "BONE-3a-equivocal", label: "Criterion 3a — localized findings, blood organism, and clinically correlated equivocal imaging", source: boneCriterionSource, allOf: Object.freeze([boneBloodOrganism, boneEquivocalImaging, boneTreatment]), groups: Object.freeze([boneFindingsGroup("BONE-3a-equivocal-findings")]) }),
    Object.freeze({ id: "BONE-3b-definitive", label: "Criterion 3b — localized findings and definitive imaging", source: boneCriterionSource, allOf: Object.freeze([boneDefinitiveImaging]), groups: Object.freeze([boneFindingsGroup("BONE-3b-definitive-findings")]) }),
    Object.freeze({ id: "BONE-3b-equivocal", label: "Criterion 3b — localized findings and clinically correlated equivocal imaging", source: boneCriterionSource, allOf: Object.freeze([boneEquivocalImaging, boneDiagnosis, boneTreatment]), groups: Object.freeze([boneFindingsGroup("BONE-3b-equivocal-findings")]) }),
    Object.freeze({ id: "BONE-3c", label: "Criterion 3c — localized findings, physician diagnosis, and treatment", source: boneCriterionSource, allOf: Object.freeze([boneDiagnosis, boneTreatment]), groups: Object.freeze([boneFindingsGroup("BONE-3c-findings")]) })
  ]),
  exclusions: Object.freeze([boneItem("other-recognized-cause", "Another recognized cause applies to an asterisked localized sign or symptom", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "BONE-note-window", text: "The BONE infection window period is 21 days: the date the first positive diagnostic test used as a criterion element was obtained, the 10 calendar days before, and the 10 calendar days after.", source: boneTimingSource }),
    Object.freeze({ id: "BONE-note-rit", text: "The BONE RIT extends through the remainder of the patient's current admission.", source: boneTimingSource }),
    Object.freeze({ id: "BONE-note-secondary-period", text: "The BONE secondary BSI attribution period includes the 21-day infection window period and every subsequent day of the patient's current admission.", source: boneTimingSource }),
    Object.freeze({ id: "BONE-note-pathogen-limit", text: "Secondary BSI pathogen assignment is limited to organism(s) identified in blood that match the organism(s) used to meet the BONE definition; if the blood specimen itself can be used to meet a BONE criterion, all organisms in that specimen can be assigned.", source: boneTimingSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "BONE-report-med", text: "Report mediastinitis following cardiac surgery accompanied by osteomyelitis as SSI-MED rather than SSI-BONE.", source: boneInstructionSource }),
    Object.freeze({ id: "BONE-report-jnt", text: "If both organ-space JNT and BONE are met, report the SSI as BONE.", source: boneInstructionSource }),
    Object.freeze({ id: "BONE-report-pji", text: "After HPRO or KPRO, if both organ-space PJI and BONE are met, report the SSI as BONE.", source: boneInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: boneTimingSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete BONE definition is met", source: boneTimingSource }),
    Object.freeze({ id: "organism-relationship", label: "The organism(s) in the blood match the organism(s) used to meet BONE, or that blood specimen is itself used to meet the BONE criterion", source: boneTimingSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the 21-day BONE infection window or on a subsequent day of the same current admission", source: boneTimingSource })
  ]) })
});

const discItem = (id, label, options = {}) => Object.freeze({ id, label, source: discCriterionSource, ...options });
const discFindings = Object.freeze([
  discItem("disc-fever", "Fever (>38.0°C)"),
  discItem("disc-pain", "Pain at the involved vertebral disc space, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const discFindingsGroup = (id) => Object.freeze({ id, label: "At least one sign or symptom", minimumRequiredCount: 1, anyOf: discFindings });
const discBloodOrganism = discItem("disc-blood-organism", "Organism(s) identified from blood by culture or non-culture based microbiologic testing performed for purposes of clinical diagnosis and treatment (not ASC/AST)");
const discDefinitiveImaging = discItem("disc-definitive-imaging", "Imaging test evidence definitive for infection (for example, x-ray, CT scan, MRI, or radiolabel scan [gallium, technetium, etc.])");
const discEquivocalImaging = discItem("disc-equivocal-imaging", "Imaging test evidence for infection is equivocal");
const discTreatment = discItem("disc-antimicrobial-treatment", "Physician or physician-designee documentation of antimicrobial treatment for vertebral disc space infection");

export const discDefinition = Object.freeze({
  majorCategoryCode: "BJ", majorCategoryName: "Bone and Joint Infection", siteCode: "DISC", siteName: "Disc space infection",
  source: discCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "DISC-1", label: "Criterion 1 — organism identified from vertebral disc space", source: discCriterionSource, allOf: Object.freeze([discItem("disc-site-organism", "Organism(s) identified from vertebral disc space by culture or non-culture based microbiologic testing performed for purposes of clinical diagnosis and treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "DISC-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: discCriterionSource, allOf: Object.freeze([discItem("disc-gross-histopathologic-evidence", "Evidence of vertebral disc space infection on gross anatomic or histopathologic examination")]) }),
    Object.freeze({ id: "DISC-3a-definitive", label: "Criterion 3a — finding, blood organism, and definitive imaging", source: discCriterionSource, allOf: Object.freeze([discBloodOrganism, discDefinitiveImaging]), groups: Object.freeze([discFindingsGroup("DISC-3a-definitive-findings")]) }),
    Object.freeze({ id: "DISC-3a-equivocal", label: "Criterion 3a — finding, blood organism, and clinically correlated equivocal imaging", source: discCriterionSource, allOf: Object.freeze([discBloodOrganism, discEquivocalImaging, discTreatment]), groups: Object.freeze([discFindingsGroup("DISC-3a-equivocal-findings")]) }),
    Object.freeze({ id: "DISC-3b-definitive", label: "Criterion 3b — finding and definitive imaging", source: discCriterionSource, allOf: Object.freeze([discDefinitiveImaging]), groups: Object.freeze([discFindingsGroup("DISC-3b-definitive-findings")]) }),
    Object.freeze({ id: "DISC-3b-equivocal", label: "Criterion 3b — finding and clinically correlated equivocal imaging", source: discCriterionSource, allOf: Object.freeze([discEquivocalImaging, discTreatment]), groups: Object.freeze([discFindingsGroup("DISC-3b-equivocal-findings")]) })
  ]),
  exclusions: Object.freeze([discItem("other-recognized-cause", "Another recognized cause applies to pain at the involved vertebral disc space", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "DISC-note-equivocal-imaging", text: "Equivocal imaging qualifies only when supported by clinical correlation, specifically physician or physician-designee documentation of antimicrobial treatment for vertebral disc space infection.", source: discCriterionSource })
  ]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: discAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete DISC definition is met", source: discAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the DISC criterion", source: discAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the DISC secondary BSI attribution period (or in the infection window when used as a criterion element)", source: discAttributionSource })
  ]) })
});

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

const usiItem = (id, label, options = {}) => Object.freeze({ id, label, source: usiCriterionSource, ...options });
const usiNotUti = "usi-chapter-7-uti";
const usiCriterionItem = (id, label, options = {}) => usiItem(id, label, options);
const usiDrainageOrBlood = (id) => Object.freeze({ id, label: "At least one drainage or blood finding", minimumRequiredCount: 1, anyOf: Object.freeze([
  usiCriterionItem("usi-purulent-drainage", "Purulent drainage from affected site"),
  usiCriterionItem("usi-blood-organism", "Organism(s) identified from blood by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
]) });
const usiImaging = usiCriterionItem("usi-definitive-imaging", "Imaging test evidence definitive for infection (for example, ultrasound, CT scan, MRI, or radiolabel scan [gallium, technetium]); if equivocal, supported by clinical correlation, specifically physician or physician-designee documentation of antimicrobial treatment for urinary system infection");

export const usiDefinition = Object.freeze({
  majorCategoryCode: "USI", majorCategoryName: "Urinary System Infection", siteCode: "USI", siteName: "Urinary System Infection (kidney, ureter, bladder, urethra, or perinephric space excluding UTI [see Chapter 7].)",
  source: usiCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "USI-1", label: "Criterion 1 — affected-site fluid (not urine) or tissue organism", source: usiCriterionSource, allOf: Object.freeze([usiCriterionItem("usi-site-organism", "Organism(s) identified from fluid (not urine) or tissue from affected site by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "USI-2", label: "Criterion 2 — abscess or other evidence of infection", source: usiCriterionSource, allOf: Object.freeze([usiCriterionItem("usi-anatomic-pathology-evidence", "Abscess or other evidence of infection on gross anatomical exam, during invasive procedure, or on histopathologic exam")]) }),
    Object.freeze({ id: "USI-3", label: "Criterion 3 — sign or symptom, drainage or blood finding, and imaging", source: usiCriterionSource, allOf: Object.freeze([usiImaging]), groups: Object.freeze([
      Object.freeze({ id: "USI-3-findings", label: "At least one sign or symptom", minimumRequiredCount: 1, anyOf: Object.freeze([usiCriterionItem("usi-fever", "Fever (>38.0°C)"), usiCriterionItem("usi-localized-pain-tenderness", "Localized pain or tenderness, with no other recognized cause", { exclusionId: "usi-other-recognized-cause" })]) }), usiDrainageOrBlood("USI-3-support")
    ]) }),
    Object.freeze({ id: "USI-4", label: "Criterion 4 — patient <1 year of age", source: usiCriterionSource, allOf: Object.freeze([usiCriterionItem("usi-age-under-one", "Patient <1 year of age"), usiImaging]), groups: Object.freeze([
      Object.freeze({ id: "USI-4-findings", label: "At least one sign or symptom", minimumRequiredCount: 1, anyOf: Object.freeze([
        usiCriterionItem("usi-fever", "Fever (>38.0°C)"), usiCriterionItem("usi-hypothermia", "Hypothermia (<36.0°C)"),
        usiCriterionItem("usi-apnea", "Apnea, with no other recognized cause", { exclusionId: "usi-other-recognized-cause" }), usiCriterionItem("usi-bradycardia", "Bradycardia, with no other recognized cause", { exclusionId: "usi-other-recognized-cause" }),
        usiCriterionItem("usi-lethargy", "Lethargy, with no other recognized cause", { exclusionId: "usi-other-recognized-cause" }), usiCriterionItem("usi-vomiting", "Vomiting, with no other recognized cause", { exclusionId: "usi-other-recognized-cause" })
      ]) }), usiDrainageOrBlood("USI-4-support")
    ]) })
  ]),
  exclusions: Object.freeze([
    usiItem(usiNotUti, "This event is a UTI evaluated under Chapter 7; Chapter 7 UTI evidence is excluded from USI and must be evaluated under the NHSN UTI chapter instead (no automatic redirect or classification)", { type: "exclusion", disqualifiesSite: true }),
    usiItem("usi-other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" })
  ]),
  notes: Object.freeze([Object.freeze({ id: "USI-note-uti-exclusion", text: "USI excludes UTI (see Chapter 7); urine is not an eligible fluid for USI criterion 1.", source: usiCriterionSource })]),
  reportingInstructions: Object.freeze([Object.freeze({ id: "USI-report-circ", text: "Report infections following circumcision in newborns as SST-CIRC.", source: usiInstructionSource })]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: usiAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete USI definition is met", source: usiAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the USI criterion", source: usiAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the USI secondary BSI attribution period (or in the infection window when used as a criterion element)", source: usiAttributionSource })
  ]) })
});

const jntItem = (id, label, options = {}) => Object.freeze({ id, label, source: jntCriterionSource, ...options });
const jntFindings = Object.freeze([
  jntItem("jnt-swelling", "Swelling, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  jntItem("jnt-pain-tenderness", "Pain or tenderness, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  jntItem("jnt-heat", "Heat, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  jntItem("jnt-effusion", "Evidence of effusion, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  jntItem("jnt-limited-motion", "Limitation of motion, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const jntFindingsGroup = Object.freeze({ id: "JNT-3-findings", label: "At least two signs or symptoms", minimumRequiredCount: 2, anyOf: jntFindings });

export const jntDefinition = Object.freeze({
  majorCategoryCode: "BJ", majorCategoryName: "Bone and Joint Infection", siteCode: "JNT", siteName: "Joint or bursa infection (not for use as Organ/Space SSI after HPRO or KPRO procedures)",
  source: jntCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "JNT-1", label: "Criterion 1 — organism identified from joint fluid or synovial biopsy", source: jntCriterionSource, allOf: Object.freeze([jntItem("jnt-site-organism", "Organism(s) identified from joint fluid or synovial biopsy by culture or non-culture based microbiologic testing performed for purposes of clinical diagnosis and treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "JNT-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: jntCriterionSource, allOf: Object.freeze([jntItem("jnt-gross-histopathologic-evidence", "Evidence of joint or bursa infection on gross anatomic or histopathologic examination")]) }),
    Object.freeze({ id: "JNT-3a", label: "Criterion 3a — suspected infection, findings, and joint-fluid laboratory evidence", source: jntCriterionSource, allOf: Object.freeze([jntItem("jnt-suspected-infection", "Suspected joint or bursa infection")]), groups: Object.freeze([
      jntFindingsGroup,
      Object.freeze({ id: "JNT-3a-support", label: "At least one qualifying joint-fluid laboratory finding", minimumRequiredCount: 1, anyOf: Object.freeze([
        jntItem("jnt-elevated-joint-wbc", "Elevated joint fluid white blood cell count (per reporting laboratory's reference range)"),
        jntItem("jnt-positive-leukocyte-esterase", "Positive leukocyte esterase test strip of joint fluid"),
        jntItem("jnt-gram-stain-organisms-wbc", "Organism(s) and white blood cells seen on Gram stain of joint fluid")
      ]) })
    ]) }),
    Object.freeze({ id: "JNT-3c", label: "Criterion 3c — suspected infection, findings, and blood organism", source: jntCriterionSource, allOf: Object.freeze([
      jntItem("jnt-suspected-infection", "Suspected joint or bursa infection"),
      jntItem("jnt-blood-organism", "Organism(s) identified from blood by culture or non-culture based microbiologic testing performed for purposes of clinical diagnosis and treatment (not ASC/AST)")
    ]), groups: Object.freeze([jntFindingsGroup]) }),
    Object.freeze({ id: "JNT-3d-definitive", label: "Criterion 3d — suspected infection, findings, and definitive imaging", source: jntCriterionSource, allOf: Object.freeze([
      jntItem("jnt-suspected-infection", "Suspected joint or bursa infection"),
      jntItem("jnt-definitive-imaging", "Imaging test evidence definitive for infection (for example, x-ray, CT scan, MRI, or radiolabel scan [gallium, technetium, etc.])")
    ]), groups: Object.freeze([jntFindingsGroup]) }),
    Object.freeze({ id: "JNT-3d-equivocal", label: "Criterion 3d — suspected infection, findings, and clinically correlated equivocal imaging", source: jntCriterionSource, allOf: Object.freeze([
      jntItem("jnt-suspected-infection", "Suspected joint or bursa infection"),
      jntItem("jnt-equivocal-imaging", "Imaging test evidence for infection is equivocal"),
      jntItem("jnt-antimicrobial-treatment", "Physician or physician-designee documentation of antimicrobial treatment for joint or bursa infection")
    ]), groups: Object.freeze([jntFindingsGroup]) })
  ]),
  exclusions: Object.freeze([
    jntItem("other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" }),
    jntItem("jnt-hpro-kpro-organ-space", "Use as Organ/Space SSI after HPRO or KPRO procedures", { type: "exclusion", blocksPathway: true })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "JNT-note-restriction", text: "JNT — Joint or bursa infection (not for use as Organ/Space SSI after HPRO or KPRO procedures).", source: jntCriterionSource }),
    Object.freeze({ id: "JNT-note-equivocal-imaging", text: "Equivocal imaging qualifies only when supported by clinical correlation, specifically physician or physician-designee documentation of antimicrobial treatment for joint or bursa infection.", source: jntCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "JNT-report-bone", text: "If a patient meets both organ space JNT and BONE report the SSI as BONE.", source: jntInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: jntAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete JNT definition is met", source: jntAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the JNT criterion", source: jntAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the JNT secondary BSI attribution period (or in the infection window when used as a criterion element)", source: jntAttributionSource })
  ]) })
});

const cardItem = (id, label, options = {}) => Object.freeze({ id, label, source: cardCriterionSource, ...options });
const cardFindings = Object.freeze([
  cardItem("card-fever", "Fever (>38.0°C)"),
  cardItem("card-chest-pain", "Chest pain, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  cardItem("card-paradoxical-pulse", "Paradoxical pulse, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  cardItem("card-increased-heart-size", "Increased heart size, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const cardInfantFindings = Object.freeze([
  cardItem("card-fever", "Fever (>38.0°C)"),
  cardItem("card-hypothermia", "Hypothermia (<36.0°C)"),
  cardItem("card-apnea", "Apnea, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  cardItem("card-bradycardia", "Bradycardia, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  cardItem("card-paradoxical-pulse", "Paradoxical pulse, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  cardItem("card-increased-heart-size", "Increased heart size, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const cardSupport = Object.freeze([
  cardItem("card-abnormal-ekg", "Abnormal EKG consistent with myocarditis or pericarditis"),
  cardItem("card-histologic-heart-tissue", "Histologic examination of heart tissue shows evidence of myocarditis or pericarditis"),
  cardItem("card-igg-rise", "4-fold rise in paired sera from IgG antibody titer"),
  cardItem("card-pericardial-effusion", "Pericardial effusion identified by echocardiogram, CT scan, MRI, or angiography")
]);
const cardGroup = (id, label, minimumRequiredCount, anyOf) => Object.freeze({ id, label, minimumRequiredCount, anyOf });

export const cardDefinition = Object.freeze({
  majorCategoryCode: "CVS", majorCategoryName: "Cardiovascular System Infection", siteCode: "CARD", siteName: "Myocarditis or pericarditis",
  source: cardCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "CARD-1", label: "Criterion 1 — organism from pericardial tissue or fluid", source: cardCriterionSource, allOf: Object.freeze([
      cardItem("card-pericardial-organism", "Organism(s) identified from pericardial tissue or fluid by a culture or non-culture based microbiologic testing method performed for purposes of clinical diagnosis or treatment (not ASC/AST)")
    ]) }),
    Object.freeze({ id: "CARD-2", label: "Criterion 2 — findings and supporting evidence", source: cardCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      cardGroup("CARD-2-findings", "At least two signs or symptoms", 2, cardFindings),
      cardGroup("CARD-2-support", "At least one supporting test", 1, cardSupport)
    ]) }),
    Object.freeze({ id: "CARD-3", label: "Criterion 3 — patient ≤1 year of age", source: cardCriterionSource, allOf: Object.freeze([
      cardItem("card-age-one-or-younger", "Patient ≤1 year of age")
    ]), groups: Object.freeze([
      cardGroup("CARD-3-findings", "At least two age-specific signs or symptoms", 2, cardInfantFindings),
      cardGroup("CARD-3-support", "At least one supporting test", 1, cardSupport)
    ]) })
  ]),
  exclusions: Object.freeze([cardItem("other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "CARD-note-asterisk", text: "Chest pain, paradoxical pulse, increased heart size, apnea, and bradycardia qualify only when there is no other recognized cause.", source: cardCriterionSource })
  ]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: cardAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete CARD definition is met", source: cardAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the CARD criterion", source: cardAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the CARD secondary BSI attribution period (or in the infection window when used as a criterion element)", source: cardAttributionSource })
  ]) })
});

const vascRestrictionId = "vasc-access-device-blood-organism";
const vascItem = (id, label, options = {}) => Object.freeze({ id, label, source: vascCriterionSource, ...options });
const vascFindings = Object.freeze([
  vascItem("vasc-fever", "Fever (>38.0°C)"),
  vascItem("vasc-pain", "Pain at the involved vascular site, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" }),
  vascItem("vasc-erythema", "Erythema at the involved vascular site, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" }),
  vascItem("vasc-heat", "Heat at the involved vascular site, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" })
]);
const vascInfantFindings = Object.freeze([
  vascFindings[0], vascItem("vasc-hypothermia", "Hypothermia (<36.0°C)"),
  vascItem("vasc-apnea", "Apnea, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" }),
  vascItem("vasc-bradycardia", "Bradycardia, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" }),
  vascItem("vasc-lethargy", "Lethargy, with no other recognized cause", { exclusionId: "vasc-other-recognized-cause" }), ...vascFindings.slice(1)
]);
const vascFindingGroup = (id, findings) => Object.freeze({ id, label: "At least one qualifying sign or symptom", minimumRequiredCount: 1, anyOf: findings });
const vascCannulaCulture = vascItem("vasc-cannula-tip-colonies", "More than 15 colonies cultured from an intravascular cannula tip using a semi-quantitative culture method");

export const vascDefinition = Object.freeze({
  majorCategoryCode: "CVS", majorCategoryName: "Cardiovascular System Infection", siteCode: "VASC", siteName: "Arterial or venous infection excluding infections involving vascular access devices with organisms identified in the blood",
  source: vascCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "VASC-1", label: "Criterion 1 — organism from extracted artery or vein", source: vascCriterionSource, allOf: Object.freeze([vascItem("vasc-extracted-vessel-organism", "Organism(s) identified from extracted arteries or veins by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")]) }),
    Object.freeze({ id: "VASC-2", label: "Criterion 2 — gross anatomic or histopathologic evidence", source: vascCriterionSource, allOf: Object.freeze([vascItem("vasc-gross-histopathologic-evidence", "Evidence of arterial or venous infection on gross anatomic or histopathologic examination")]) }),
    Object.freeze({ id: "VASC-3", label: "Criterion 3 — vascular-site finding and cannula-tip culture", source: vascCriterionSource, allOf: Object.freeze([vascCannulaCulture]), groups: Object.freeze([vascFindingGroup("VASC-3-findings", vascFindings)]) }),
    Object.freeze({ id: "VASC-4", label: "Criterion 4 — purulent drainage", source: vascCriterionSource, allOf: Object.freeze([vascItem("vasc-purulent-drainage", "Purulent drainage at the involved vascular site")]) }),
    Object.freeze({ id: "VASC-5", label: "Criterion 5 — patient ≤1 year, age-specific finding, and cannula-tip culture", source: vascCriterionSource, allOf: Object.freeze([vascItem("vasc-age-one-or-younger", "Patient ≤1 year of age"), vascCannulaCulture]), groups: Object.freeze([vascFindingGroup("VASC-5-findings", vascInfantFindings)]) })
  ]),
  exclusions: Object.freeze([
    Object.freeze({ id: vascRestrictionId, label: "The infection involves a vascular access device and organism(s) are identified in the blood (excluded from VASC)", source: vascCriterionSource, type: "exclusion" }),
    Object.freeze({ id: "vasc-other-recognized-cause", label: "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", source: vascCriterionSource, type: "exclusion" })
  ]),
  hardExclusionIds: Object.freeze([vascRestrictionId]),
  notes: Object.freeze([
    Object.freeze({ id: "VASC-note-imaging", text: "The VASC definition lists no imaging criterion or physician-diagnosis criterion.", source: vascCriterionSource }),
    Object.freeze({ id: "VASC-note-lcbi", text: "If LCBI criteria are met in the presence of an arterial or vascular infection, report LCBI rather than VASC.", source: vascCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "VASC-report-device-no-blood", text: "Report infection of an arteriovenous graft, shunt, fistula, or intravascular cannulation site without organism(s) identified from blood as CVS-VASC.", source: vascInstructionSource }),
    Object.freeze({ id: "VASC-report-ssi", text: "Report an Organ/Space VASC infection as an SSI, not an LCBI, when an SSI has a secondary BSI.", source: vascInstructionSource }),
    Object.freeze({ id: "VASC-report-lcbi", text: "Report intravascular infection with organism(s) identified from blood that meets LCBI criteria as BSI-LCBI.", source: vascInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: vascAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete VASC definition is met", source: vascAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the VASC criterion", source: vascAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the VASC secondary BSI attribution period (or in the infection window when used as a criterion element)", source: vascAttributionSource })
  ]) })
});

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
      ])
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
export const geDefinition = placeholders.find(([siteCode]) => siteCode === "GE")[1];
export const secondarySiteDefinitions = Object.freeze({
  ...Object.fromEntries(placeholders),
  BONE: boneDefinition,
  CARD: cardDefinition,
  CDI: cdiDefinition,
  DISC: discDefinition,
  EMET: emetDefinition,
  GE: geDefinition,
  ENDO: endoDefinition,
  EPIS: episDefinition,
  IC: icDefinition,
  JNT: jntDefinition,
  MED: medDefinition,
  MEN: menDefinition,
  NEC: necDefinition,
  OREP: orepDefinition,
  PJI: pjiDefinition,
  SA: saDefinition,
  USI: usiDefinition,
  VASC: vascDefinition,
  VCUF: vcufDefinition
});

export const implementedSecondaryPathways = Object.freeze([
  "BONE",
  "CARD",
  "CDI",
  "DISC",
  "EMET",
  "ENDO",
  "EPIS",
  "IC",
  "JNT",
  "MED",
  "MEN",
  "NEC",
  "OREP",
  "PJI",
  "SA",
  "USI",
  "VASC",
  "VCUF"
]);

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
export function evaluateSecondarySite({ siteCode = "", evidence = {}, organismRelationship = "", attributionTiming = "", patientAge = "" } = {}) {
  const definition = secondarySiteDefinitions[siteCode];
  if (!definition) return { status: "siteNotSelected", siteDefinitionMet: false, secondaryAttributionMet: false };
  const schemaIsRenderable = Array.isArray(definition.criteria) && Array.isArray(definition.exclusions) && Array.isArray(definition.notes)
    && definition.criteria.every(criterion => Array.isArray(criterion.allOf) && (!criterion.groups || criterion.groups.every(group => Array.isArray(group.anyOf) && Number.isFinite(group.minimumRequiredCount))));
  if (definition.implementationStatus !== "validated" || !schemaIsRenderable) return { status: "siteNotValidated", siteDefinitionMet: false, secondaryAttributionMet: false, definition, message: warning };
  const started = Object.values(evidence).some(Boolean);
  if (definition.patientAgeApplicability === "infant" && patientAge !== "infant") return { status: started ? "exclusionApplies" : "notStarted", siteDefinitionMet: false, secondaryAttributionMet: false, definition, message: "This definition is restricted to patients ≤1 year of age." };
  const hardExclusionApplies = definition.exclusions.some(item => (item.disqualifiesSite || item.blocksPathway) && answer(evidence, item.id) === "met")
    || (definition.hardExclusionIds || []).some(id => answer(evidence, id) === "met");
  const metCriterion = hardExclusionApplies ? undefined : definition.criteria.find(criterion => criterionMet(criterion, evidence));
  const exclusionApplies = definition.exclusions.some(item => answer(evidence, item.id) === "met");
  if (!metCriterion) return { status: exclusionApplies || hardExclusionApplies ? "exclusionApplies" : started ? "siteDefinitionIncomplete" : "notStarted", siteDefinitionMet: false, secondaryAttributionMet: false, definition, branches: definition.criteria.map(criterion => ({ id: criterion.id, missing: requiredMessages(criterion, evidence) })) };
  const secondaryAttributionMet = organismRelationship === "yes" && attributionTiming === "yes";
  return { status: secondaryAttributionMet ? "secondaryAttributionMet" : "siteDefinitionMet", siteDefinitionMet: true, secondaryAttributionMet, metCriterion: metCriterion.id, definition, attributionMissing: [!organismRelationship && "Organism/specimen relationship is unknown", organismRelationship === "no" && "Organism/specimen relationship is not met", !attributionTiming && "Attribution timing is unknown", attributionTiming === "no" && "Attribution timing is not met"].filter(Boolean) };
}
export function selectSecondarySite(state, siteCode) { if (state.siteCode === siteCode) return state; return { ...state, siteCode, evidence: {}, organismRelationship: "", attributionTiming: "" }; }
