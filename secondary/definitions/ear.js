import { source } from "../source.js";

const earCriterionSource = source("17-15–17-16", "15–16", "EAR — Ear, mastoid infection", "EAR");
const earAttributionSource = source("17-1–17-3", "2–4", "Secondary bloodstream infection and matching organisms", "EAR.secondary-bsi");
const earItem = (id, label, options = {}) => Object.freeze({ id, label, source: earCriterionSource, ...options });
const otherCause = { exclusionId: "ear-other-recognized-cause" };
const group = (id, label, minimumRequiredCount, anyOf) => Object.freeze({ id, label, minimumRequiredCount, anyOf: Object.freeze(anyOf) });
const criterion = (id, label, allOf = [], groups = []) => Object.freeze({ id, label, source: earCriterionSource, allOf: Object.freeze(allOf), groups: Object.freeze(groups) });

const mastoidFindings = Object.freeze([
  earItem("ear-mastoid-fever", "Fever (>38.0°C)"),
  earItem("ear-mastoid-pain-tenderness", "Pain or tenderness, with no other recognized cause", otherCause),
  earItem("ear-mastoid-post-auricular-swelling", "Post auricular swelling, with no other recognized cause", otherCause),
  earItem("ear-mastoid-erythema", "Erythema, with no other recognized cause", otherCause),
  earItem("ear-mastoid-headache", "Headache, with no other recognized cause", otherCause),
  earItem("ear-mastoid-facial-paralysis", "Facial paralysis, with no other recognized cause", otherCause)
]);
const mastoidFindingGroup = () => group("EAR-8-findings", "At least two qualifying mastoiditis signs or symptoms", 2, mastoidFindings);

export const earDefinition = Object.freeze({
  majorCategoryCode: "EENT",
  majorCategoryName: "Eye, Ear, Nose, Throat, or Mouth Infection",
  siteCode: "EAR",
  siteName: "Ear, mastoid infection",
  source: earCriterionSource,
  implementationStatus: "validated",
  logic: "anyOf",
  minimumRequiredCount: 1,
  criteria: Object.freeze([
    criterion("EAR-1", "Criterion 1 — otitis externa: organism from purulent ear-canal drainage", [
      earItem("ear-externa-drainage-organism", "Organism(s) identified from purulent drainage from the ear canal by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]),
    criterion("EAR-2", "Criterion 2 — otitis externa: clinical finding and Gram stain", [
      earItem("ear-externa-drainage-gram-stain", "Organism(s) seen on Gram stain of purulent drainage from the ear canal")
    ], [group("EAR-2-findings", "At least one qualifying otitis externa sign or symptom", 1, [
      earItem("ear-externa-fever", "Fever (>38.0°C)"),
      earItem("ear-externa-pain", "Pain, with no other recognized cause", otherCause),
      earItem("ear-externa-erythema", "Erythema, with no other recognized cause", otherCause)
    ])]),
    criterion("EAR-3", "Criterion 3 — otitis media: organism from invasively obtained middle-ear fluid", [
      earItem("ear-media-fluid-organism", "Organism(s) identified from middle-ear fluid obtained during an invasive procedure (for example, tympanocentesis) by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]),
    criterion("EAR-4", "Criterion 4 — otitis media: at least two clinical findings", [], [
      group("EAR-4-findings", "At least two qualifying otitis media signs or symptoms", 2, [
        earItem("ear-media-fever", "Fever (>38.0°C)"),
        earItem("ear-media-pain", "Pain, with no other recognized cause", otherCause),
        earItem("ear-media-inflammation", "Inflammation, with no other recognized cause", otherCause),
        earItem("ear-media-eardrum-retraction", "Retraction of eardrum, with no other recognized cause", otherCause),
        earItem("ear-media-eardrum-decreased-mobility", "Decreased mobility of eardrum, with no other recognized cause", otherCause),
        earItem("ear-media-fluid-behind-eardrum", "Fluid behind eardrum, with no other recognized cause", otherCause)
      ])
    ]),
    criterion("EAR-5", "Criterion 5 — otitis interna: organism from invasively obtained inner-ear fluid", [
      earItem("ear-interna-fluid-organism", "Organism(s) identified from inner-ear fluid obtained during an invasive procedure by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]),
    criterion("EAR-6", "Criterion 6 — otitis interna: physician or physician-designee diagnosis", [
      earItem("ear-interna-diagnosis", "Physician or physician designee diagnosis of inner ear infection")
    ]),
    criterion("EAR-7", "Criterion 7 — mastoiditis: organism from mastoid fluid or tissue", [
      earItem("ear-mastoid-fluid-tissue-organism", "Organism(s) identified from mastoid fluid or tissue by a culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST)")
    ]),
    criterion("EAR-8a", "Criterion 8a — mastoiditis: clinical findings and Gram stain", [
      earItem("ear-mastoid-gram-stain", "Organism(s) seen on Gram stain of fluid or tissue from mastoid")
    ], [mastoidFindingGroup()]),
    criterion("EAR-8b", "Criterion 8b — mastoiditis: clinical findings and definitive imaging", [
      earItem("ear-mastoid-definitive-imaging", "Imaging test evidence definitive for mastoid infection (for example, CT scan)")
    ], [mastoidFindingGroup()]),
    criterion("EAR-8c", "Criterion 8c — mastoiditis: clinical findings and clinically correlated equivocal imaging", [
      earItem("ear-mastoid-equivocal-imaging", "Equivocal imaging test evidence for mastoid infection"),
      earItem("ear-mastoid-equivocal-imaging-treatment", "Physician or physician designee documentation of antimicrobial treatment for mastoid infection supports the equivocal imaging finding")
    ], [mastoidFindingGroup()])
  ]),
  exclusions: Object.freeze([
    earItem("ear-other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" })
  ]),
  notes: Object.freeze([
    Object.freeze({ id: "EAR-note-subsites", text: "The EAR pathways remain separated as otitis externa, otitis media, otitis interna (labyrinthitis), and mastoiditis criteria.", source: earCriterionSource }),
    Object.freeze({ id: "EAR-note-asterisk", text: "Asterisked signs and symptoms qualify only when there is no other recognized cause.", source: earCriterionSource }),
    Object.freeze({ id: "EAR-note-imaging", text: "Equivocal mastoid imaging qualifies only with clinical correlation documented as antimicrobial treatment for mastoid infection by a physician or physician designee.", source: earCriterionSource })
  ]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: earAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete EAR definition is met", source: earAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism has the required NHSN relationship to an organism identified from the EAR site specimen", source: earAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the EAR secondary BSI attribution period", source: earAttributionSource })
  ]) })
});
