import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { oralDefinition } from "./secondary/definitions/oral.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "ORAL", evidence, ...extra });
const clinicalFindings = ["oral-ulceration", "oral-raised-white-patches", "oral-mucosal-plaques"];
const supportingFindings = ["oral-3a-virus", "oral-3b-multinucleated-giant-cells", "oral-3c-diagnostic-antibody", "oral-3d-fungal-elements", "oral-3e-antimicrobial-therapy-within-two-days"];

test("each independent ORAL criterion qualifies its NHSN branch", () => {
  assert.equal(evaluate({ "oral-abscess-purulent-material-organism": "met" }).metCriterion, "ORAL-1");
  for (const id of ["oral-invasive-procedure-evidence", "oral-gross-anatomic-evidence", "oral-histopathologic-evidence"])
    assert.equal(evaluate({ [id]: "met" }).metCriterion, "ORAL-2");
  assert.equal(evaluate({ "oral-ulceration": "met", "oral-3a-virus": "met" }).metCriterion, "ORAL-3");
});

test("ORAL-3 preserves all clinical and supporting OR alternatives", () => {
  for (const clinical of clinicalFindings) for (const support of supportingFindings)
    assert.equal(evaluate({ [clinical]: "met", [support]: "met" }).metCriterion, "ORAL-3", `${clinical} plus ${support}`);
});

test("ORAL-3 requires both a clinical finding and a supporting finding", () => {
  for (const clinical of clinicalFindings) assert.equal(evaluate({ [clinical]: "met" }).siteDefinitionMet, false);
  for (const support of supportingFindings) assert.equal(evaluate({ [support]: "met" }).siteDefinitionMet, false);
});

test("another recognized cause prevents Criterion 3 findings from counting", () => {
  const result = evaluate({ "oral-ulceration": "met", "oral-3a-virus": "met", "oral-other-recognized-cause": "met" });
  assert.equal(result.status, "exclusionApplies");
  assert.equal(result.siteDefinitionMet, false);
});

test("recurrent herpes cannot qualify the viral ORAL pathway but does not erase an independent ORAL criterion", () => {
  const recurrent = { "oral-ulceration": "met", "oral-3a-virus": "met", "oral-recurrent-herpes": "met" };
  assert.equal(evaluate(recurrent).siteDefinitionMet, false);
  assert.equal(evaluate({ ...recurrent, "oral-abscess-purulent-material-organism": "met" }).metCriterion, "ORAL-1");
});

test("ORAL branches remain separate and partial evidence cannot be combined", () => {
  assert.equal(evaluate({ "oral-abscess-purulent-material-organism": "notMet", "oral-ulceration": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "oral-invasive-procedure-evidence": "notMet", "oral-3d-fungal-elements": "met" }).siteDefinitionMet, false);
});

test("neighboring EENT evidence, unchecked evidence, and unsupported shortcuts cannot qualify ORAL", () => {
  for (const evidence of [
    { "conj-conjunctival-organism": "met" },
    { "eye-chamber-vitreous-organism": "met" },
    { "ear-media-fluid-organism": "met" },
    { "oral-abscess-purulent-material-organism": "notMet" },
    { "oral-abscess-purulent-material-organism": "" },
    { "oral-ulceration": "met" },
    { "oral-gingivitis-alone": "met" },
    { "oral-dental-abscess-alone": "met" },
    { "oral-generic-positive-culture": "met" },
    { "oral-physician-diagnosis": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("meeting ORAL unlocks but does not automatically establish Secondary BSI attribution", () => {
  const complete = { "oral-abscess-purulent-material-organism": "met" };
  assert.equal(evaluate(complete).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("ORAL preserves criteria, reporting instructions, attribution limits, and source metadata", () => {
  assert.deepEqual({ document: oralDefinition.source.document, printedPage: oralDefinition.source.printedPage, pdfPage: oralDefinition.source.pdfPage, sectionHeading: oralDefinition.source.sectionHeading, sourceDataId: oralDefinition.source.sourceDataId },
    { document: "Secondary BSI Chapter.pdf", printedPage: "17-17", pdfPage: 17, sectionHeading: "ORAL — Oral cavity infection (mouth, tongue, or gums)", sourceDataId: "ORAL" });
  assert.deepEqual(oralDefinition.criteria.map(({ id }) => id), ["ORAL-1", "ORAL-2", "ORAL-3"]);
  assert.deepEqual(oralDefinition.secondaryBsi.eligibleScenario1Criteria, ["ORAL-1", "ORAL-3a", "ORAL-3d-yeast-only"]);
  assert.deepEqual(oralDefinition.secondaryBsi.eligibleScenario2Criteria, []);
  assert.equal(oralDefinition.secondaryBsi.source.document, "clabsi nhsn.pdf");
  assert.equal(oralDefinition.secondaryBsi.source.printedPage, "4-30–4-36");
  assert.equal(oralDefinition.reportingInstructions[0].source.sourceDataId, "ORAL.reporting-instruction");
});

test("registry contains ORAL exactly once and preserves EENT order", () => {
  assert.equal(secondarySiteDefinitions.ORAL, oralDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "ORAL").length, 1);
  assert.deepEqual(Object.keys(secondarySiteDefinitions).filter((code) => ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"].includes(code)), ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"]);
});

test("canonical compact renderer displays incomplete and met ORAL states", () => {
  const incomplete = renderCompactMenEvidence({ definition: oralDefinition, evaluation: evaluate({}), patientAge: "adult", evidence: {} });
  assert.match(incomplete, /🟡 ORAL Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  assert.match(incomplete, /data-men-renderer="compact-v3"/);
  const evidence = { "oral-abscess-purulent-material-organism": "met" };
  const met = renderCompactMenEvidence({ definition: oralDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence });
  assert.match(met, /🟢 ORAL Site Definition Met/);
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("ORAL-specific"), false);
});
