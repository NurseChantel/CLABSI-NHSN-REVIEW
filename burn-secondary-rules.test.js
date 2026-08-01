import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { burnDefinition } from "./secondary/definitions/burn.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const complete = Object.freeze({ "burn-wound-appearance-change": "met", "burn-blood-organism": "met" });
const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "BURN", evidence, ...extra });

test("the single complete BURN branch qualifies and every AND element is required", () => {
  assert.equal(evaluate(complete).metCriterion, "BURN-1");
  assert.equal(evaluate({ "burn-wound-appearance-change": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "burn-blood-organism": "met" }).siteDefinitionMet, false);
});

test("BURN wound-change examples are examples within one required finding, not mixable branches", () => {
  assert.deepEqual(burnDefinition.criteria.map(({ id }) => id), ["BURN-1"]);
  assert.equal(burnDefinition.criteria[0].groups.length, 0);
  assert.equal(evaluate({ "burn-rapid-eschar-separation": "met", "burn-blood-organism": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "burn-eschar-discoloration": "met", "burn-blood-organism": "met" }).siteDefinitionMet, false);
});

test("only eligible blood microbiology can satisfy the BURN microbiology element", () => {
  for (const id of ["burn-wound-culture", "burn-wound-non-culture-test", "burn-purulent-drainage", "burn-fever", "burn-provider-diagnosis", "burn-operative-finding", "burn-pathology-finding"])
    assert.equal(evaluate({ "burn-wound-appearance-change": "met", [id]: "met" }).siteDefinitionMet, false, id);
});

test("SKIN, ST, and DECU evidence cannot qualify BURN", () => {
  for (const evidence of [
    { "skin-purulent-drainage": "met", "skin-site-organism": "met" },
    { "st-purulent-drainage": "met", "st-site-organism": "met" },
    { "decu-edge-erythema": "met", "decu-edge-tenderness": "met", "decu-margin-aspirate-or-biopsy-culture": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("the permanent-autograft alternate-site boundary excludes BURN", () => {
  assert.equal(evaluate({ ...complete, "burn-permanent-autograft": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...complete, "burn-temporary-graft-or-dressing": "met" }).siteDefinitionMet, true);
});

test("BURN has no asterisked findings and unchecked evidence never counts", () => {
  assert.equal(burnDefinition.criteria.flatMap((criterion) => criterion.allOf).some((item) => item.exclusionId), false);
  assert.equal(evaluate({ ...complete, "burn-blood-organism": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...complete, "burn-blood-organism": "" }).siteDefinitionMet, false);
  assert.equal(evaluate({}).siteDefinitionMet, false);
});

test("meeting BURN unlocks but does not automatically establish Secondary BSI attribution", () => {
  assert.equal(evaluate(complete).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("BURN source metadata identifies the exact criteria, instructions, and attribution pages", () => {
  assert.deepEqual({ document: burnDefinition.source.document, printedPage: burnDefinition.source.printedPage, pdfPage: burnDefinition.source.pdfPage, sectionHeading: burnDefinition.source.sectionHeading, sourceDataId: burnDefinition.source.sourceDataId },
    { document: "Secondary BSI Chapter.pdf", printedPage: "17-25", pdfPage: 26, sectionHeading: "BURN — Burn infection", sourceDataId: "BURN" });
  assert.equal(burnDefinition.reportingInstructions[0].source.sourceDataId, "BURN.reporting-instructions");
  assert.equal(burnDefinition.secondaryBsi.source.sourceDataId, "BURN.secondary-bsi");
});

test("registry contains BURN once and retains every SST site", () => {
  assert.equal(secondarySiteDefinitions.BURN, burnDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "BURN").length, 1);
  assert.deepEqual(Object.keys(secondarySiteDefinitions).filter((code) => ["BRST", "BURN", "CIRC", "DECU", "SKIN", "ST", "UMB"].includes(code)), ["BRST", "BURN", "CIRC", "DECU", "SKIN", "ST", "UMB"]);
});

test("the actual compact renderer renders incomplete and met BURN states", () => {
  const incomplete = renderCompactMenEvidence({ definition: burnDefinition, evaluation: evaluate({ "burn-wound-appearance-change": "met" }), patientAge: "adult", evidence: { "burn-wound-appearance-change": "met" } });
  assert.match(incomplete, /🟡 BURN Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  assert.match(incomplete, /Organism\(s\) identified from blood/);
  const met = renderCompactMenEvidence({ definition: burnDefinition, evaluation: evaluate(complete), patientAge: "adult", evidence: complete });
  assert.match(met, /🟢 BURN Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("BURN-specific"), false);
});
