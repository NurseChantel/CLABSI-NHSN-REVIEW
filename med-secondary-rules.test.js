import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateSecondarySite, medDefinition } from "./secondary-site-definitions.js";
import { getVisibleMenCriteria, renderCompactMenEvidence } from "./secondary-evidence-ui.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "MED", evidence, ...extra });

test("MED 1 qualifies only with eligible mediastinal tissue or fluid microbiology", () => {
  assert.equal(evaluate({ "med-site-organism": "met" }).metCriterion, "MED-1");
  assert.equal(evaluate({ "med-site-organism": "unknown" }).siteDefinitionMet, false);
});

test("MED 2 preserves the gross-anatomic OR histopathology alternatives", () => {
  assert.equal(evaluate({ "med-gross-anatomic": "met" }).metCriterion, "MED-2");
  assert.equal(evaluate({ "med-histopathology": "met" }).metCriterion, "MED-2");
});

test("MED 3 requires one symptom AND either drainage or imaging", () => {
  assert.equal(evaluate({ "med-fever": "met", "med-purulent-drainage": "met" }).metCriterion, "MED-3");
  assert.equal(evaluate({ "med-chest-pain": "met", "med-mediastinal-widening": "met" }).metCriterion, "MED-3");
  assert.equal(evaluate({ "med-fever": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "med-purulent-drainage": "met" }).siteDefinitionMet, false);
});

test("MED asterisk exclusions apply only to marked findings", () => {
  const excludedPain = { "med-chest-pain": "met", "med-purulent-drainage": "met", "med-other-recognized-cause": "met" };
  assert.equal(evaluate(excludedPain).siteDefinitionMet, false);
  assert.equal(evaluate({ ...excludedPain, "med-fever": "met" }).metCriterion, "MED-3");
});

test("MED 4 requires the infant age branch, one age-specific symptom, and support", () => {
  const complete = { "med-age-one-or-younger": "met", "med-hypothermia": "met", "med-mediastinal-widening": "met" };
  assert.equal(evaluate(complete).metCriterion, "MED-4");
  assert.equal(evaluate({ ...complete, "med-age-one-or-younger": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "med-age-one-or-younger": "met", "med-hypothermia": "met" }).siteDefinitionMet, false);
});

test("MED temperature boundaries remain strict and must be abstracted as not met", () => {
  assert.equal(evaluate({ "med-fever": "notMet", "med-purulent-drainage": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "med-age-one-or-younger": "met", "med-hypothermia": "notMet", "med-purulent-drainage": "met" }).siteDefinitionMet, false);
});

test("MED site qualification does not itself establish secondary BSI attribution", () => {
  assert.equal(evaluate({ "med-site-organism": "met" }).secondaryAttributionMet, false);
  assert.equal(evaluate({ "med-site-organism": "met" }, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("MED metadata and nested logic cite the approved manual", () => {
  assert.equal(medDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(medDefinition.source.printedPage, "17-13–17-14");
  assert.equal(medDefinition.source.pdfPage, "14–15");
  assert.deepEqual(medDefinition.criteria.map(({ id }) => id), ["MED-1", "MED-2", "MED-3", "MED-4"]);
  assert.deepEqual(medDefinition.criteria[2].groups.map(({ minimumRequiredCount }) => minimumRequiredCount), [1, 1]);
  assert.equal(medDefinition.reportingInstructions[0].source.printedPage, "17-14");
  medDefinition.criteria.forEach((criterion) => assert.equal(criterion.source.sourceDataId, "MED"));
});

test("MED uses the existing evidence-review renderer and hides only MED 4 for adults", () => {
  assert.deepEqual(getVisibleMenCriteria(medDefinition.criteria, "adult").map(({ id }) => id), ["MED-1", "MED-2", "MED-3"]);
  assert.deepEqual(getVisibleMenCriteria(medDefinition.criteria, "infant").map(({ id }) => id), ["MED-1", "MED-2", "MED-3", "MED-4"]);
  const evaluation = evaluate({});
  const html = renderCompactMenEvidence({ definition: medDefinition, evaluation, patientAge: "infant", evidence: {} });
  assert.match(html, /data-men-renderer="compact-v3"/);
  assert.match(html, /data-men-criterion="MED-4"/);
  assert.match(fs.readFileSync(new URL("./app.js", import.meta.url), "utf8"), /definition\?\.siteCode === "MED"/);
});
