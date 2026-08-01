import { source } from "../source.js";

const brstCriterionSource = source("17-24–17-25", "25–26", "BRST — Breast infection or mastitis", "BRST");
const brstInstructionSource = source("17-25", 26, "BRST — Reporting Instructions", "BRST.reporting-instructions");
const brstAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "BRST.secondary-bsi");
const brstItem = (id, label) => Object.freeze({ id, label, source: brstCriterionSource });

export const brstDefinition = Object.freeze({
  majorCategoryCode: "SST",
  majorCategoryName: "Skin and Soft Tissue Infection",
  siteCode: "BRST",
  siteName: "Breast infection or mastitis",
  source: brstCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({
      id: "BRST-1",
      label: "Criterion 1 — organism identified from a qualifying affected-breast specimen",
      source: brstCriterionSource,
      allOf: Object.freeze([]),
      groups: Object.freeze([
        Object.freeze({
          id: "BRST-1-specimen",
          label: "Organism identification from one qualifying affected-breast specimen source",
          minimumRequiredCount: 1,
          anyOf: Object.freeze([
            brstItem("brst-invasive-tissue-or-fluid-organism", "Organism(s) identified from affected breast tissue or fluid obtained by invasive procedure by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)"),
            brstItem("brst-aseptic-drain-organism", "Organism(s) identified from drainage from an aseptically placed drain in the affected breast by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
          ])
        })
      ])
    }),
    Object.freeze({
      id: "BRST-2",
      label: "Criterion 2 — abscess or other evidence of infection on examination",
      source: brstCriterionSource,
      allOf: Object.freeze([]),
      groups: Object.freeze([
        Object.freeze({
          id: "BRST-2-exam",
          label: "At least one qualifying examination finding",
          minimumRequiredCount: 1,
          anyOf: Object.freeze([
            brstItem("brst-gross-anatomic-evidence", "Breast abscess or other evidence of infection on gross anatomic exam"),
            brstItem("brst-histopathologic-evidence", "Breast abscess or other evidence of infection on histopathologic exam")
          ])
        })
      ])
    }),
    Object.freeze({
      id: "BRST-3",
      label: "Criterion 3 — fever, local breast inflammation, and timely antimicrobial therapy",
      source: brstCriterionSource,
      allOf: Object.freeze([
        brstItem("brst-fever", "Fever (>38.0°C)"),
        brstItem("brst-local-inflammation", "Local inflammation of the breast"),
        brstItem("brst-timely-antimicrobial-therapy", "Physician or physician designee initiates antimicrobial therapy within 2 days of onset or worsening of symptoms")
      ]),
      groups: Object.freeze([])
    })
  ]),
  exclusions: Object.freeze([]),
  notes: Object.freeze([
    Object.freeze({ id: "BRST-note-branches", text: "Mastitis or the words breast abscess do not independently meet BRST: the evidence must satisfy one complete numbered criterion.", source: brstCriterionSource }),
    Object.freeze({ id: "BRST-note-boundary", text: "BRST remains distinct from SKIN and ST; a breast infection identified after an NHSN operative procedure must also be assessed under the NHSN SSI reporting instructions.", source: brstInstructionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "BRST-report-superficial-ssi", text: "For SSI after a BRST procedure, report infection in the subcutaneous region as a superficial incisional SSI.", source: brstInstructionSource }),
    Object.freeze({ id: "BRST-report-deep-ssi", text: "For SSI after a BRST procedure, report infection involving the muscle/fascial level as a deep incisional SSI.", source: brstInstructionSource }),
    Object.freeze({ id: "BRST-report-organ-space", text: "BRST Criterion 3 is not eligible as an Organ/Space SSI following a BRST procedure.", source: brstInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: brstAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete BRST definition is met", source: brstAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism satisfies the applicable NHSN organism relationship for the BRST criterion used", source: brstAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the BRST secondary BSI attribution period", source: brstAttributionSource })
  ]) })
});
