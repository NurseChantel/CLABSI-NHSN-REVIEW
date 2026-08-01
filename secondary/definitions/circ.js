import { source } from "../source.js";

const circCriterionSource = source("17-25", 26, "CIRC — Newborn circumcision infection", "CIRC");
const circBoundarySource = source("17-27", 28, "SKIN — Reporting Instructions", "CIRC.alternate-site-boundary");
const circUsiInstructionSource = source("17-29", 30, "USI — Reporting Instructions", "CIRC.reporting-instructions");
const circAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "CIRC.secondary-bsi");
const otherCauseId = "circ-other-recognized-cause";
const circItem = (id, label, options = {}) => Object.freeze({ id, label, source: circCriterionSource, ...options });
const finding = (id, label) => circItem(id, `${label}, with no other recognized cause`, { exclusionId: otherCauseId });
const age = () => circItem("circ-age-30-days-or-younger", "Newborn is ≤30 days old");
const clinicalFindings = (id) => Object.freeze({
  id,
  label: "At least one qualifying sign or symptom at the circumcision site",
  minimumRequiredCount: 1,
  anyOf: Object.freeze([
    finding("circ-site-erythema", "Erythema at the circumcision site"),
    finding("circ-site-swelling", "Swelling at the circumcision site"),
    finding("circ-site-tenderness", "Tenderness at the circumcision site")
  ])
});

export const circDefinition = Object.freeze({
  majorCategoryCode: "SST",
  majorCategoryName: "Skin and Soft Tissue Infection",
  siteCode: "CIRC",
  siteName: "Newborn circumcision infection",
  source: circCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({
      id: "CIRC-1",
      label: "Criterion 1 — purulent drainage from the circumcision site",
      source: circCriterionSource,
      allOf: Object.freeze([age(), circItem("circ-site-purulent-drainage", "Purulent drainage from the circumcision site")]),
      groups: Object.freeze([])
    }),
    Object.freeze({
      id: "CIRC-2",
      label: "Criterion 2 — local finding and pathogen from the circumcision site",
      source: circCriterionSource,
      allOf: Object.freeze([
        age(),
        circItem("circ-site-pathogen", "Pathogen identified from the circumcision site by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
      ]),
      groups: Object.freeze([clinicalFindings("CIRC-2-findings")])
    }),
    Object.freeze({
      id: "CIRC-3",
      label: "Criterion 3 — local finding, common commensal, and timely antimicrobial therapy",
      source: circCriterionSource,
      allOf: Object.freeze([
        age(),
        circItem("circ-site-common-commensal", "Common commensal identified from the circumcision site by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)"),
        circItem("circ-timely-antimicrobial-therapy", "Physician or physician designee initiates antimicrobial therapy within two days of onset or worsening of symptoms")
      ]),
      groups: Object.freeze([clinicalFindings("CIRC-3-findings")])
    })
  ]),
  exclusions: Object.freeze([
    Object.freeze({ id: otherCauseId, label: "Another recognized cause applies to an asterisked circumcision-site sign or symptom", source: circCriterionSource, type: "exclusion" })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "CIRC-note-branches", text: "Purulent drainage qualifies only through Criterion 1. A pathogen qualifies only with a Criterion 2 local finding. A common commensal qualifies only with both a Criterion 3 local finding and timely antimicrobial therapy.", source: circCriterionSource }),
    Object.freeze({ id: "CIRC-note-boundary", text: "NHSN directs infection of the circumcision site in a newborn to CIRC rather than SKIN; CIRC remains distinct from UMB and ST.", source: circBoundarySource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "CIRC-report-skin-boundary", text: "Report infection of the circumcision site in a newborn as CIRC rather than SKIN.", source: circBoundarySource }),
    Object.freeze({ id: "CIRC-report-usi-boundary", text: "Report infections following circumcision in newborns as SST-CIRC.", source: circUsiInstructionSource })
  ]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: circAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete CIRC definition is met", source: circAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism satisfies the applicable NHSN organism relationship for the CIRC criterion used", source: circAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the CIRC secondary BSI attribution period", source: circAttributionSource })
  ]) })
});
