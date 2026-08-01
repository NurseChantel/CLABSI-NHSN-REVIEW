import { cdiCriterionSource, cdiInstructionSource, cdiAttributionSource } from "../source.js";

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
