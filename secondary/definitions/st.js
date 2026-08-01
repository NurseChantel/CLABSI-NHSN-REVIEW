import { source } from "../source.js";

const stCriterionSource = source("17-27", 28, "ST — Soft tissue infection", "ST");
const stInstructionSource = source("17-27", 28, "ST — Reporting Instructions", "ST.reporting-instructions");
const stAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "ST.secondary-bsi");
const stItem = (id, label) => Object.freeze({ id, label, source: stCriterionSource });
const route = (id, label) => Object.freeze({ id, label, source: stInstructionSource, type: "alternate-site-routing", disqualifiesSite: true });

export const stDefinition = Object.freeze({
  majorCategoryCode: "SST",
  majorCategoryName: "Skin and Soft Tissue Infection",
  siteCode: "ST",
  siteName: "Soft tissue infection (muscle and/or fascia [for example, necrotizing fasciitis, infectious gangrene, necrotizing cellulitis, infectious myositis, lymphadenitis, lymphangitis, or parotitis]) excluding decubitus ulcers, burns, and infections at vascular access sites",
  source: stCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({
      id: "ST-1",
      label: "Criterion 1 — organism identified from affected tissue or drainage",
      source: stCriterionSource,
      allOf: Object.freeze([
        stItem("st-site-organism", "Organism(s) identified from tissue or drainage from the affected site by a culture or non-culture based microbiologic testing method performed for purposes of clinical diagnosis or treatment (not ASC/AST)")
      ]),
      groups: Object.freeze([])
    }),
    Object.freeze({
      id: "ST-2",
      label: "Criterion 2 — purulent drainage at the affected site",
      source: stCriterionSource,
      allOf: Object.freeze([
        stItem("st-purulent-drainage", "Purulent drainage at the affected site")
      ]),
      groups: Object.freeze([])
    }),
    Object.freeze({
      id: "ST-3",
      label: "Criterion 3 — abscess or other evidence of infection on examination",
      source: stCriterionSource,
      allOf: Object.freeze([]),
      groups: Object.freeze([
        Object.freeze({
          id: "ST-3-examination",
          label: "At least one qualifying examination finding",
          minimumRequiredCount: 1,
          anyOf: Object.freeze([
            stItem("st-gross-anatomic-evidence", "Abscess or other evidence of infection on gross anatomic exam"),
            stItem("st-histopathologic-evidence", "Abscess or other evidence of infection on histopathologic exam")
          ])
        })
      ])
    })
  ]),
  exclusions: Object.freeze([
    route("st-decubitus-ulcer", "Infection is of a decubitus ulcer; apply DECU instead of ST"),
    route("st-burn-infection", "Infection is of a burn covered with a temporary graft or dressing; apply BURN instead of ST"),
    route("st-circumcision-site", "Infection is of a newborn circumcision site; apply CIRC instead of ST"),
    route("st-breast-infection", "Infection is a breast abscess or mastitis; apply BRST instead of ST (and assess SSI when identified after an NHSN operative procedure)"),
    route("st-deep-pelvic-tissue", "Infection is of deep pelvic tissue; apply OREP instead of ST"),
    route("st-vascular-access-site", "Localized infection is at a vascular access site; apply VASC unless an organism identified from blood meets LCBI criteria, in which case report LCBI")
  ]),
  hardExclusionIds: Object.freeze(["st-decubitus-ulcer", "st-burn-infection", "st-circumcision-site", "st-breast-infection", "st-deep-pelvic-tissue", "st-vascular-access-site"]),
  notes: Object.freeze([
    Object.freeze({ id: "ST-note-anatomic-boundary", text: "ST is limited to muscle and/or fascia; the listed conditions are examples and do not replace one of the three complete ST criteria.", source: stCriterionSource }),
    Object.freeze({ id: "ST-note-evidence-boundary", text: "Imaging, physician diagnosis, clinical signs alone, and evidence belonging only to SKIN, DECU, or BURN are not listed as ST criterion elements.", source: stCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "ST-report-autograft", text: "Report SKIN or ST criteria in the setting of a permanent skin graft (autograft) over a burn wound.", source: stInstructionSource }),
    Object.freeze({ id: "ST-report-routes", text: "Use the NHSN site-specific definitions identified in the alternate-site routing exclusions for CIRC, DECU, BURN, BRST, OREP, and VASC/LCBI.", source: stInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: stAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete ST definition is met", source: stAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from an ST site-specific specimen", source: stAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the ST secondary BSI attribution period", source: stAttributionSource })
  ]) })
});
