import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { discDefinition, evaluateSecondarySite } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "DISC", evidence, ...extra });

test("DISC criteria 1 and 2 qualify independently", () => {
  assert.equal(evaluate({ "disc-site-organism": "met" }).metCriterion, "DISC-1");
  assert.equal(evaluate({ "disc-gross-histopathologic-evidence": "met" }).metCriterion, "DISC-2");
});

test("DISC 3a requires a finding, blood organism, and imaging", () => {
  const definitive = { "disc-fever": "met", "disc-blood-organism": "met", "disc-definitive-imaging": "met" };
  assert.equal(evaluate(definitive).metCriterion, "DISC-3a-definitive");
  assert.equal(evaluate({ ...definitive, "disc-fever": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...definitive, "disc-blood-organism": "notMet" }).metCriterion, "DISC-3b-definitive");
  assert.equal(evaluate({ "disc-fever": "met", "disc-blood-organism": "met" }).siteDefinitionMet, false);
});

test("DISC 3b requires a finding and imaging", () => {
  assert.equal(evaluate({ "disc-pain": "met", "disc-definitive-imaging": "met" }).metCriterion, "DISC-3b-definitive");
  assert.equal(evaluate({ "disc-pain": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "disc-definitive-imaging": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "disc-fever": "unknown", "disc-definitive-imaging": "met" }).siteDefinitionMet, false);
});

test("equivocal DISC imaging requires documented antimicrobial treatment", () => {
  assert.equal(evaluate({ "disc-fever": "met", "disc-equivocal-imaging": "met", "disc-antimicrobial-treatment": "met" }).metCriterion, "DISC-3b-equivocal");
  assert.equal(evaluate({ "disc-fever": "met", "disc-blood-organism": "met", "disc-equivocal-imaging": "met", "disc-antimicrobial-treatment": "met" }).metCriterion, "DISC-3a-equivocal");
  assert.equal(evaluate({ "disc-fever": "met", "disc-equivocal-imaging": "met" }).siteDefinitionMet, false);
});

test("the other-recognized-cause exclusion applies only to DISC pain", () => {
  const excluded = evaluate({ "disc-pain": "met", "disc-definitive-imaging": "met", "other-recognized-cause": "met" });
  assert.equal(excluded.siteDefinitionMet, false);
  assert.equal(excluded.status, "exclusionApplies");
  assert.equal(evaluate({ "disc-fever": "met", "disc-definitive-imaging": "met", "other-recognized-cause": "met" }).metCriterion, "DISC-3b-definitive");
});

test("DISC has no age-specific boundary and accepts either listed finding", () => {
  assert.equal(evaluate({ "disc-fever": "met", "disc-definitive-imaging": "met" }, { patientAge: "infant" }).metCriterion, "DISC-3b-definitive");
  assert.equal(evaluate({ "disc-pain": "met", "disc-definitive-imaging": "met" }, { patientAge: "adult" }).metCriterion, "DISC-3b-definitive");
});

test("DISC attribution remains locked behind site, organism, and timing review", () => {
  const evidence = { "disc-site-organism": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "no" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("DISC metadata traces every pathway to the approved manual", () => {
  assert.equal(discDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(discDefinition.source.printedPage, "17-8");
  assert.equal(discDefinition.source.pdfPage, 9);
  assert.deepEqual(discDefinition.criteria.map(({ id }) => id), ["DISC-1", "DISC-2", "DISC-3a-definitive", "DISC-3a-equivocal", "DISC-3b-definitive", "DISC-3b-equivocal"]);
  discDefinition.criteria.forEach((criterion) => assert.equal(criterion.source.sourceDataId, "DISC"));
  assert.equal(discDefinition.secondaryBsi.source.sourceDataId, "DISC.secondary-bsi");
});

test("DISC is wired to the unchanged compact MEN evidence renderer", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /definition\?\.implementationStatus === "validated"/);
  assert.match(app, /renderCompactMenEvidence\(\{ definition, evaluation/);
});
