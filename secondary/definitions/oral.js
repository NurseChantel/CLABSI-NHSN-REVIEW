import { source } from "../source.js";

const oralCriterionSource = source("17-17", 17, "ORAL — Oral cavity infection (mouth, tongue, or gums)", "ORAL");
const oralInstructionSource = source("17-17", 17, "ORAL — Reporting Instruction", "ORAL.reporting-instruction");
const oralAttributionSource = Object.freeze({
  document: "clabsi nhsn.pdf",
  chapter: "Chapter 4 — Bloodstream Infection Event (Central Line-Associated Bloodstream Infection and Non-central Line Associated Bloodstream Infection)",
  printedPage: "4-30–4-36",
  pdfPage: "30–36",
  sectionHeading: "Appendix: Secondary BSI Guide — Scenarios 1 and 2, Table B1, and matching organisms",
  sourceDataId: "ORAL.secondary-bsi"
});
const oralItem = (id, label, options = {}) => Object.freeze({ id, label, source: oralCriterionSource, ...options });
const criterion = (id, label, allOf = [], groups = []) => Object.freeze({ id, label, source: oralCriterionSource, allOf: Object.freeze(allOf), groups: Object.freeze(groups) });

export const oralDefinition = Object.freeze({
  majorCategoryCode: "EENT",
  majorCategoryName: "Eye, Ear, Nose, Throat, or Mouth Infection",
  siteCode: "ORAL",
  siteName: "Oral cavity infection (mouth, tongue, or gums)",
  source: oralCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    criterion("ORAL-1", "Criterion 1 — organism from abscess or purulent oral-cavity material", [
      oralItem("oral-abscess-purulent-material-organism", "Organism(s) identified from abscess or purulent material from tissues of the oral cavity by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]),
    criterion("ORAL-2", "Criterion 2 — abscess or other evidence on examination", [], [
      Object.freeze({
        id: "ORAL-2-evidence",
        label: "At least one qualifying examination finding",
        minimumRequiredCount: 1,
        anyOf: Object.freeze([
          oralItem("oral-invasive-procedure-evidence", "Abscess or other evidence of oral cavity infection found on invasive procedure"),
          oralItem("oral-gross-anatomic-evidence", "Abscess or other evidence of oral cavity infection found on gross anatomic exam"),
          oralItem("oral-histopathologic-evidence", "Abscess or other evidence of oral cavity infection found on histopathologic exam")
        ])
      })
    ]),
    criterion("ORAL-3", "Criterion 3 — qualifying clinical finding and supporting evidence", [], [
      Object.freeze({
        id: "ORAL-3-findings",
        label: "At least one qualifying oral sign or symptom, with no other recognized cause",
        minimumRequiredCount: 1,
        anyOf: Object.freeze([
          oralItem("oral-ulceration", "Ulceration, with no other recognized cause", { exclusionId: "oral-other-recognized-cause" }),
          oralItem("oral-raised-white-patches", "Raised white patches on inflamed mucosa, with no other recognized cause", { exclusionId: "oral-other-recognized-cause" }),
          oralItem("oral-mucosal-plaques", "Plaques on oral mucosa, with no other recognized cause", { exclusionId: "oral-other-recognized-cause" })
        ])
      }),
      Object.freeze({
        id: "ORAL-3-support",
        label: "At least one qualifying laboratory or treatment finding",
        minimumRequiredCount: 1,
        anyOf: Object.freeze([
          oralItem("oral-3a-virus", "3a — Virus identified from mucosal scrapings or exudate by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)", { exclusionId: "oral-recurrent-herpes" }),
          oralItem("oral-3b-multinucleated-giant-cells", "3b — Multinucleated giant cells seen on microscopic examination of mucosal scrapings or exudate"),
          oralItem("oral-3c-diagnostic-antibody", "3c — Diagnostic single antibody titer (IgM) or fourfold increase in paired sera (IgG) for organism"),
          oralItem("oral-3d-fungal-elements", "3d — Fungal elements seen on microscopic exam of mucosal scrapings or exudate (for example, Gram stain or KOH)"),
          oralItem("oral-3e-antimicrobial-therapy-within-two-days", "3e — Physician or physician designee initiates antimicrobial therapy within two days of onset or worsening of symptoms")
        ])
      })
    ])
  ]),
  exclusions: Object.freeze([
    oralItem("oral-other-recognized-cause", "Another recognized cause applies to the selected Criterion 3 sign or symptom", { type: "exclusion" }),
    Object.freeze({ id: "oral-recurrent-herpes", label: "The oral finding is a recurrent herpes infection; recurrent herpes infections are not healthcare associated", type: "exclusion", source: oralInstructionSource })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "ORAL-note-cavity", text: "ORAL is limited to infection of the mouth, tongue, or gums.", source: oralCriterionSource }),
    Object.freeze({ id: "ORAL-note-cause", text: "Criterion 3 signs and symptoms qualify only when there is no other recognized cause.", source: oralCriterionSource }),
    Object.freeze({ id: "ORAL-note-herpes", text: "Report healthcare-associated primary herpes simplex infections of the oral cavity as ORAL; recurrent herpes infections are not healthcare associated.", source: oralInstructionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "ORAL-report-herpes", text: "Report healthcare-associated primary herpes simplex infections of the oral cavity as ORAL; do not report recurrent herpes infections as healthcare associated.", source: oralInstructionSource })
  ]),
  secondaryBsi: Object.freeze({
    lockedUntilSiteDefinitionMet: true,
    source: oralAttributionSource,
    eligibleScenario1Criteria: Object.freeze(["ORAL-1", "ORAL-3a", "ORAL-3d-yeast-only"]),
    eligibleScenario2Criteria: Object.freeze([]),
    requirements: Object.freeze([
      Object.freeze({ id: "site-definition", label: "A complete ORAL definition is met", source: oralAttributionSource }),
      Object.freeze({ id: "organism-relationship", label: "The blood organism matches an eligible organism used to meet ORAL 1, ORAL 3a, or ORAL 3d (yeast only)", source: oralAttributionSource }),
      Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the ORAL secondary BSI attribution period", source: oralAttributionSource })
    ])
  })
});
