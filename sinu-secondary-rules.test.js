import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { sinuDefinition } from "./secondary/definitions/sinu.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "SINU", evidence, ...extra });
const imaging = { "sinu-imaging-evidence": "met" };

test("each independent SINU criterion qualifies its NHSN branch", () => {
  assert.equal(evaluate({ "sinu-invasive-fluid-tissue-organism": "met" }).metCriterion, "SINU-1");
  assert.equal(evaluate({ ...imaging, "sinu-fever": "met" }).metCriterion, "SINU-2");
});

test("SINU-2 preserves every clinical OR alternative and requires imaging", () => {
  for (const finding of ["sinu-fever", "sinu-pain-tenderness", "sinu-headache", "sinu-purulent-exudate", "sinu-nasal-obstruction"]) {
    assert.equal(evaluate({ ...imaging, [finding]: "met" }).metCriterion, "SINU-2");
    assert.equal(evaluate({ [finding]: "met" }).siteDefinitionMet, false);
  }
  assert.equal(evaluate(imaging).siteDefinitionMet, false);
});

test("another recognized cause prevents asterisked SINU findings but not fever from counting", () => {
  for (const finding of ["sinu-pain-tenderness", "sinu-headache", "sinu-purulent-exudate", "sinu-nasal-obstruction"])
    assert.equal(evaluate({ ...imaging, [finding]: "met", "sinu-other-recognized-cause": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...imaging, "sinu-fever": "met", "sinu-other-recognized-cause": "met" }).siteDefinitionMet, true);
});

test("SINU branches stay separate and unsupported shortcuts cannot qualify", () => {
  for (const evidence of [
    { "sinu-invasive-fluid-tissue-organism": "notMet", ...imaging },
    { "sinu-invasive-fluid-tissue-organism": "", "sinu-headache": "met" },
    { "sinu-imaging-evidence": "notMet", "sinu-fever": "met" },
    { "sinu-sinus-tenderness-alone": "met" },
    { "sinu-positive-culture-not-invasively-obtained": "met" },
    { "sinu-physician-diagnosis": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("UR, ORAL, EAR, and EYE evidence cannot qualify SINU", () => {
  for (const evidence of [
    { "ur-fever": "met", "ur-pharyngeal-erythema": "met" },
    { "oral-abscess-purulent-material-organism": "met" },
    { "ear-media-fluid-organism": "met" },
    { "eye-chamber-vitreous-organism": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("unchecked SINU evidence does not count", () => {
  assert.equal(evaluate({ "sinu-invasive-fluid-tissue-organism": "" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...imaging, "sinu-fever": "notMet" }).siteDefinitionMet, false);
});

test("meeting SINU unlocks but does not automatically establish Secondary BSI attribution", () => {
  const complete = { "sinu-invasive-fluid-tissue-organism": "met" };
  assert.equal(evaluate(complete).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("SINU preserves criteria, attribution eligibility, and complete source metadata", () => {
  assert.deepEqual({ document: sinuDefinition.source.document, printedPage: sinuDefinition.source.printedPage, pdfPage: sinuDefinition.source.pdfPage, sectionHeading: sinuDefinition.source.sectionHeading, sourceDataId: sinuDefinition.source.sourceDataId },
    { document: "Secondary BSI Chapter.pdf", printedPage: "17-17", pdfPage: 18, sectionHeading: "SINU — Sinusitis", sourceDataId: "SINU" });
  assert.deepEqual(sinuDefinition.criteria.map(({ id }) => id), ["SINU-1", "SINU-2"]);
  assert.deepEqual(sinuDefinition.secondaryBsi.eligibleScenario1Criteria, ["SINU-1"]);
  assert.deepEqual(sinuDefinition.secondaryBsi.eligibleScenario2Criteria, []);
  assert.ok(sinuDefinition.criteria.flatMap((criterion) => [...criterion.allOf, ...criterion.groups.flatMap(({ anyOf }) => anyOf)]).every(({ source }) => source === sinuDefinition.source));
  assert.equal(sinuDefinition.secondaryBsi.source.sourceDataId, "SINU.secondary-bsi");
});

test("registry contains SINU exactly once and preserves EENT order", () => {
  assert.equal(secondarySiteDefinitions.SINU, sinuDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "SINU").length, 1);
  assert.deepEqual(Object.keys(secondarySiteDefinitions).filter((code) => ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"].includes(code)), ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"]);
});

test("canonical compact renderer displays incomplete and met SINU states", () => {
  const incomplete = renderCompactMenEvidence({ definition: sinuDefinition, evaluation: evaluate({}), patientAge: "adult", evidence: {} });
  assert.match(incomplete, /🟡 SINU Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  const evidence = { "sinu-invasive-fluid-tissue-organism": "met" };
  const met = renderCompactMenEvidence({ definition: sinuDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence });
  assert.match(met, /🟢 SINU Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("SINU-specific"), false);
});
