import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateSecondarySite, jntDefinition } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "JNT", evidence, ...extra });
const findings = { "jnt-swelling": "met", "jnt-pain-tenderness": "met" };
const suspected = { "jnt-suspected-infection": "met", ...findings };

test("JNT criteria 1 and 2 qualify independently", () => {
  assert.equal(evaluate({ "jnt-site-organism": "met" }).metCriterion, "JNT-1");
  assert.equal(evaluate({ "jnt-gross-histopathologic-evidence": "met" }).metCriterion, "JNT-2");
});

test("JNT 3 preserves suspected infection AND two findings AND one supporting alternative", () => {
  assert.equal(evaluate({ ...suspected, "jnt-elevated-joint-wbc": "met" }).metCriterion, "JNT-3a");
  assert.equal(evaluate({ ...suspected, "jnt-positive-leukocyte-esterase": "met" }).metCriterion, "JNT-3a");
  assert.equal(evaluate({ ...suspected, "jnt-gram-stain-organisms-wbc": "met" }).metCriterion, "JNT-3a");
  assert.equal(evaluate({ ...findings, "jnt-elevated-joint-wbc": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "jnt-suspected-infection": "met", "jnt-swelling": "met", "jnt-elevated-joint-wbc": "met" }).siteDefinitionMet, false);
});

test("JNT blood and imaging alternatives preserve their distinct requirements", () => {
  assert.equal(evaluate({ ...suspected, "jnt-blood-organism": "met" }).metCriterion, "JNT-3c");
  assert.equal(evaluate({ ...suspected, "jnt-definitive-imaging": "met" }).metCriterion, "JNT-3d-definitive");
  assert.equal(evaluate({ ...suspected, "jnt-equivocal-imaging": "met", "jnt-antimicrobial-treatment": "met" }).metCriterion, "JNT-3d-equivocal");
  assert.equal(evaluate({ ...suspected, "jnt-equivocal-imaging": "met" }).siteDefinitionMet, false);
});

test("marked JNT findings require no other recognized cause", () => {
  assert.equal(evaluate({ ...suspected, "jnt-definitive-imaging": "met", "other-recognized-cause": "met" }).status, "exclusionApplies");
});

test("JNT cannot be used as Organ/Space SSI after HPRO or KPRO procedures", () => {
  const restricted = evaluate({ "jnt-site-organism": "met", "jnt-hpro-kpro-organ-space": "met" });
  assert.equal(restricted.siteDefinitionMet, false);
  assert.equal(restricted.status, "exclusionApplies");
});

test("JNT attribution remains locked behind site, organism, and timing review", () => {
  const evidence = { "jnt-site-organism": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "no" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("JNT metadata traces criteria, restriction, reporting, and attribution", () => {
  assert.equal(jntDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(jntDefinition.source.printedPage, "17-9");
  assert.equal(jntDefinition.source.pdfPage, 10);
  assert.match(jntDefinition.siteName, /not for use as Organ\/Space SSI after HPRO or KPRO procedures/);
  assert.equal(jntDefinition.reportingInstructions[0].source.sourceDataId, "JNT.reporting-instruction");
  assert.equal(jntDefinition.secondaryBsi.source.sourceDataId, "JNT.secondary-bsi");
});

test("JNT is wired to the existing compact MEN evidence renderer", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /definition\?\.siteCode === "JNT"/);
  assert.match(app, /renderCompactMenEvidence\(\{ definition, evaluation/);
});
