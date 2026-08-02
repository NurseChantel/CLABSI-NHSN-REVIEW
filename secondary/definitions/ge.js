import { geAttributionSource, geCriterionSource, geInstructionSource } from "../source.js";

const geItem = (id, label, options = {}) => Object.freeze({ id, label, source: geCriterionSource, ...options });
const symptomCauseExclusionId = "ge-selected-symptom-other-recognized-cause";
const qualifyingSymptoms = Object.freeze([
  geItem("ge-nausea", "Nausea, with no other recognized cause", { exclusionId: symptomCauseExclusionId }),
  geItem("ge-vomiting", "Vomiting, with no other recognized cause", { exclusionId: symptomCauseExclusionId }),
  geItem("ge-abdominal-pain", "Abdominal pain, with no other recognized cause", { exclusionId: symptomCauseExclusionId }),
  geItem("ge-fever-over-38", "Fever (>38.0°C)"),
  geItem("ge-headache", "Headache, with no other recognized cause", { exclusionId: symptomCauseExclusionId })
]);
const symptomGroup = (id) => Object.freeze({
  id,
  label: "At least two qualifying signs or symptoms",
  minimumRequiredCount: 2,
  anyOf: qualifyingSymptoms
});
const laboratoryCriterion = (id, label, laboratoryEvidence) => Object.freeze({
  id,
  label,
  source: geCriterionSource,
  allOf: Object.freeze([laboratoryEvidence]),
  groups: Object.freeze([symptomGroup(`${id}-symptoms`)])
});

export const geDefinition = Object.freeze({
  majorCategoryCode: "GI",
  majorCategoryName: "Gastrointestinal System Infection",
  siteCode: "GE",
  siteName: "Gastroenteritis (excluding C. difficile infections)",
  source: geCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({
      id: "GE-1",
      label: "Criterion 1 — acute-onset diarrhea without a likely noninfectious cause",
      source: geCriterionSource,
      allOf: Object.freeze([
        geItem("ge-acute-onset-diarrhea-over-12-hours", "Acute onset of diarrhea (liquid stools for >12 hours)"),
        geItem("ge-no-likely-noninfectious-cause", "No likely noninfectious cause", { exclusionId: "ge-likely-noninfectious-cause" })
      ])
    }),
    laboratoryCriterion("GE-2a", "Criterion 2a — clinical findings and an enteric pathogen from stool or rectal swab", geItem(
      "ge-enteric-pathogen-stool-or-rectal-swab",
      "An enteric pathogen other than C. difficile is identified from stool or rectal swab by culture or a non-culture-based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)"
    )),
    laboratoryCriterion("GE-2b", "Criterion 2b — clinical findings and stool microscopy", geItem(
      "ge-enteric-pathogen-stool-microscopy",
      "An enteric pathogen other than C. difficile is detected by microscopy on stool"
    )),
    laboratoryCriterion("GE-2c", "Criterion 2c — clinical findings and diagnostic antibody evidence", geItem(
      "ge-enteric-pathogen-antibody",
      "Diagnostic single antibody titer (IgM) or fourfold increase in paired sera (IgG) for an enteric pathogen other than C. difficile"
    ))
  ]),
  exclusions: Object.freeze([
    geItem("ge-likely-noninfectious-cause", "Diarrhea has a likely noninfectious cause (for example, diagnostic tests, a therapeutic regimen other than antimicrobial agents, acute exacerbation of a chronic condition, or psychological stress information)", { type: "exclusion" }),
    geItem(symptomCauseExclusionId, "A selected nausea, vomiting, abdominal pain, or headache finding has another recognized cause", { type: "exclusion" }),
    geItem("ge-cdi-evidence-only", "C. difficile evidence is present; it cannot satisfy a GE criterion", { type: "boundary" })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "GE-note-enteric-pathogen", text: "For GE, enteric pathogens are pathogens not considered normal flora of the intestinal tract. The manual lists Salmonella, Shigella, Yersinia, Campylobacter, Listeria, Vibrio, STEC, ETEC, EPEC, EIEC, EAEC, DAEC, and Giardia as examples.", source: geInstructionSource }),
    Object.freeze({ id: "GE-note-cdi-boundary", text: "The GE definition excludes C. difficile infections. C. difficile evidence does not satisfy any GE microbiology branch.", source: geCriterionSource })
  ]),
  reportingInstructions: Object.freeze([
    Object.freeze({ id: "GE-report-git-precedence", text: "If the patient meets criteria for both GI-GE and GI-GIT, report only GI-GIT and use the GI-GIT event date.", source: geInstructionSource }),
    Object.freeze({ id: "GE-report-with-cdi", text: "Report CDI and GE when an additional enteric organism is identified and the GE criteria are also met.", source: geInstructionSource })
  ]),
  secondaryBsi: Object.freeze({
    lockedUntilSiteDefinitionMet: true,
    source: geAttributionSource,
    requirements: Object.freeze([
      Object.freeze({ id: "site-definition", label: "One complete GE criterion is met", source: geAttributionSource }),
      Object.freeze({ id: "organism-relationship", label: "The blood organism has the required NHSN relationship to the GE site criterion", source: geAttributionSource }),
      Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the GE secondary BSI attribution period", source: geAttributionSource })
    ])
  })
});
