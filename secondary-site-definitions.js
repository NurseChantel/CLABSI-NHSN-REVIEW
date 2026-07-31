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
const jntCriterionSource = source("17-9", 10, "JNT — Joint or bursa infection (not for use as Organ/Space SSI after HPRO or KPRO procedures)", "JNT");
const jntInstructionSource = source("17-9", 10, "JNT — Reporting Instruction", "JNT.reporting-instruction");
const jntAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "JNT.secondary-bsi");
const cardCriterionSource = source("17-13", 14, "CARD — Myocarditis or pericarditis", "CARD");
const cardAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "CARD.secondary-bsi");
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
export const secondarySiteDefinitions = Object.freeze({ ...Object.fromEntries(placeholders), BONE: boneDefinition, CARD: cardDefinition, DISC: discDefinition, JNT: jntDefinition, IC: icDefinition, MEN: menDefinition, SA: saDefinition });
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
  const pathwayBlocked = definition.exclusions.some(exclusion => exclusion.blocksPathway && answer(evidence, exclusion.id) === "met");
  const metCriterion = pathwayBlocked ? undefined : definition.criteria.find(criterion => criterionMet(criterion, evidence));
  const exclusionApplies = pathwayBlocked || answer(evidence, "other-recognized-cause") === "met";
  if (!metCriterion) return { status: exclusionApplies ? "exclusionApplies" : started ? "siteDefinitionIncomplete" : "notStarted", siteDefinitionMet: false, secondaryAttributionMet: false, definition, branches: definition.criteria.map(criterion => ({ id: criterion.id, missing: requiredMessages(criterion, evidence) })) };
  const secondaryAttributionMet = organismRelationship === "yes" && attributionTiming === "yes";
  return { status: secondaryAttributionMet ? "secondaryAttributionMet" : "siteDefinitionMet", siteDefinitionMet: true, secondaryAttributionMet, metCriterion: metCriterion.id, definition, attributionMissing: [!organismRelationship && "Organism/specimen relationship is unknown", organismRelationship === "no" && "Organism/specimen relationship is not met", !attributionTiming && "Attribution timing is unknown", attributionTiming === "no" && "Attribution timing is not met"].filter(Boolean) };
}
export function selectSecondarySite(state, siteCode) { if (state.siteCode === siteCode) return state; return { ...state, siteCode, evidence: {}, organismRelationship: "", attributionTiming: "" }; }
