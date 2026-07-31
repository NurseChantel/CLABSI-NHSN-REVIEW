import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { endoDefinition, evaluateSecondarySite } from "./secondary-rules.js";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "ENDO", evidence, ...extra });

test("ENDO specimen, pathology, and operative pathways qualify independently", () => {
  assert.equal(evaluate({ "endo-site-organism": "met" }).metCriterion, "ENDO-1");
  assert.equal(evaluate({ "endo-histopathology": "met" }).metCriterion, "ENDO-2");
  assert.equal(evaluate({ "endo-operative": "met" }).metCriterion, "ENDO-3");
});

test("ENDO 4 requires both qualifying imaging and major microbiology", () => {
  assert.equal(evaluate({ "endo-echo-ct-vegetation": "met", "endo-major-typical": "met" }).metCriterion, "ENDO-4");
  assert.equal(evaluate({ "endo-echo-ct-vegetation": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "endo-major-typical": "met" }).siteDefinitionMet, false);
});

test("ENDO 5 counts three distinct clinical elements plus major microbiology", () => {
  assert.equal(evaluate({ "endo-risk": "met", "endo-fever": "met", "endo-vascular": "met", "endo-coxiella": "met" }).metCriterion, "ENDO-5");
  assert.equal(evaluate({ "endo-risk": "met", "endo-fever": "met", "endo-coxiella": "met" }).siteDefinitionMet, false);
});

test("ENDO 6 requires imaging plus three of five minor elements", () => {
  const complete = { "endo-pet-late-activity": "met", "endo-risk": "met", "endo-fever": "met", "endo-minor-recognized": "met" };
  assert.equal(evaluate(complete).metCriterion, "ENDO-6");
  assert.equal(evaluate({ ...complete, "endo-minor-recognized": "notMet" }).siteDefinitionMet, false);
});

test("ENDO 7 requires all six distinct elements", () => {
  const complete = { "endo-risk": "met", "endo-fever": "met", "endo-auscultation-regurgitation": "met", "endo-vascular": "met", "endo-immunologic": "met", "endo-minor-commensal": "met" };
  assert.equal(evaluate(complete).metCriterion, "ENDO-7");
  assert.equal(evaluate({ ...complete, "endo-immunologic": "notMet" }).siteDefinitionMet, false);
});

test("ENDO negative, incomplete, and attribution boundary cases do not overqualify", () => {
  assert.equal(evaluate({}).status, "notStarted");
  assert.equal(evaluate({ "endo-operative": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "endo-operative": "met" }, { organismRelationship: "yes", attributionTiming: "no" }).secondaryAttributionMet, false);
  assert.equal(evaluate({ "endo-operative": "met" }, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("ENDO metadata traces criteria, footnotes, and extended attribution timing", () => {
  assert.equal(endoDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(endoDefinition.source.printedPage, "17-30–17-33");
  assert.deepEqual(endoDefinition.criteria.map(({ id }) => id), ["ENDO-1", "ENDO-2", "ENDO-3", "ENDO-4", "ENDO-5", "ENDO-6", "ENDO-7"]);
  assert.equal(endoDefinition.secondaryBsi.source.printedPage, "17-29");
  assert.ok(endoDefinition.notes.some(({ source }) => source.sourceDataId === "ENDO.footnotes"));
});

test("ENDO uses the existing compact MEN evidence-review renderer", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /definition\?\.siteCode === "ENDO"/);
  const markup = renderCompactMenEvidence({ definition: endoDefinition, evaluation: evaluate({}), patientAge: "adult", evidence: {} });
  assert.match(markup, /data-men-renderer="compact-v3"/);
  assert.match(markup, /Exclusion review/);
  assert.match(markup, /NHSN Reference/);
  assert.match(markup, /data-evidence-id="endo-operative"/);
});
