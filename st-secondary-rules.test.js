import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { stDefinition } from "./secondary/definitions/st.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "ST", evidence, ...extra });

test("each of the three independent ST criteria qualifies", () => {
  assert.equal(evaluate({ "st-site-organism": "met" }).metCriterion, "ST-1");
  assert.equal(evaluate({ "st-purulent-drainage": "met" }).metCriterion, "ST-2");
  assert.equal(evaluate({ "st-gross-anatomic-evidence": "met" }).metCriterion, "ST-3");
  assert.equal(evaluate({ "st-histopathologic-evidence": "met" }).metCriterion, "ST-3");
});

test("ST examination alternatives remain nested in criterion 3", () => {
  const criterion = stDefinition.criteria[2];
  assert.equal(criterion.allOf.length, 0);
  assert.equal(criterion.groups.length, 1);
  assert.equal(criterion.groups[0].minimumRequiredCount, 1);
  assert.deepEqual(criterion.groups[0].anyOf.map(({ id }) => id), ["st-gross-anatomic-evidence", "st-histopathologic-evidence"]);
});

test("unsupported and incompatible evidence cannot qualify ST", () => {
  for (const id of ["st-imaging", "st-physician-diagnosis", "st-cellulitis", "st-localized-pain", "st-positive-blood-culture", "skin-purulent-drainage", "decu-purulent-drainage", "burn-wound-appearance-change"])
    assert.equal(evaluate({ [id]: "met" }).siteDefinitionMet, false, id);
});

test("SKIN, DECU, and BURN pathways cannot qualify ST", () => {
  for (const evidence of [
    { "skin-purulent-drainage": "met", "skin-site-organism": "met" },
    { "decu-purulent-drainage": "met", "decu-margin-aspirate-or-biopsy-culture": "met" },
    { "burn-wound-appearance-change": "met", "burn-blood-organism": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("each alternate-site boundary disqualifies an otherwise complete ST pathway", () => {
  for (const id of stDefinition.hardExclusionIds)
    assert.equal(evaluate({ "st-purulent-drainage": "met", [id]: "met" }).siteDefinitionMet, false, id);
  assert.equal(evaluate({ "st-purulent-drainage": "met", "st-permanent-autograft": "met" }).siteDefinitionMet, true);
});

test("unchecked, negative, and unknown evidence never count", () => {
  assert.equal(evaluate({}).siteDefinitionMet, false);
  assert.equal(evaluate({ "st-purulent-drainage": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "st-purulent-drainage": "" }).siteDefinitionMet, false);
});

test("meeting ST unlocks but does not automatically establish Secondary BSI attribution", () => {
  const complete = { "st-purulent-drainage": "met" };
  assert.equal(evaluate(complete).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("ST preserves criteria, reporting, and attribution source metadata", () => {
  assert.deepEqual({ document: stDefinition.source.document, printedPage: stDefinition.source.printedPage, pdfPage: stDefinition.source.pdfPage, sectionHeading: stDefinition.source.sectionHeading, sourceDataId: stDefinition.source.sourceDataId },
    { document: "Secondary BSI Chapter.pdf", printedPage: "17-27", pdfPage: 28, sectionHeading: "ST — Soft tissue infection", sourceDataId: "ST" });
  assert.equal(stDefinition.reportingInstructions[0].source.sourceDataId, "ST.reporting-instructions");
  assert.equal(stDefinition.secondaryBsi.source.sourceDataId, "ST.secondary-bsi");
});

test("registry contains ST exactly once without losing SST pathways", () => {
  assert.equal(secondarySiteDefinitions.ST, stDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "ST").length, 1);
  assert.deepEqual(Object.keys(secondarySiteDefinitions).filter((code) => ["BRST", "BURN", "CIRC", "DECU", "SKIN", "ST", "UMB"].includes(code)), ["BRST", "BURN", "CIRC", "DECU", "SKIN", "ST", "UMB"]);
});

test("canonical compact renderer shows exact incomplete and met ST statuses", () => {
  const incomplete = renderCompactMenEvidence({ definition: stDefinition, evaluation: evaluate({}), patientAge: "adult", evidence: {} });
  assert.match(incomplete, /🟡 ST Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  const complete = { "st-purulent-drainage": "met" };
  const met = renderCompactMenEvidence({ definition: stDefinition, evaluation: evaluate(complete), patientAge: "adult", evidence: complete });
  assert.match(met, /🟢 ST Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("ST-specific"), false);
});
