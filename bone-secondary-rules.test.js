import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boneDefinition, evaluateSecondarySite } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "BONE", evidence, ...extra });
const findings = { "bone-fever": "met", "bone-swelling": "met" };

test("BONE criteria 1 and 2 qualify independently", () => {
  assert.equal(evaluate({ "bone-site-organism": "met" }).metCriterion, "BONE-1");
  assert.equal(evaluate({ "bone-gross-histopathologic-evidence": "met" }).metCriterion, "BONE-2");
});

test("BONE 3 requires at least two localized findings", () => {
  assert.equal(evaluate({ ...findings, "bone-definitive-imaging": "met" }).metCriterion, "BONE-3b-definitive");
  assert.equal(evaluate({ "bone-fever": "met", "bone-definitive-imaging": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "bone-fever": "met", "bone-swelling": "unknown", "bone-definitive-imaging": "met" }).siteDefinitionMet, false);
});

test("BONE 3a requires the blood organism in addition to imaging", () => {
  const evidence = { ...findings, "bone-blood-organism": "met", "bone-definitive-imaging": "met" };
  assert.equal(evaluate(evidence).metCriterion, "BONE-3a-definitive");
  assert.equal(evaluate({ ...evidence, "bone-definitive-imaging": "notMet" }).siteDefinitionMet, false);
});

test("equivocal BONE imaging enforces the distinct clinical-correlation requirements", () => {
  assert.equal(evaluate({ ...findings, "bone-blood-organism": "met", "bone-equivocal-imaging": "met", "bone-antimicrobial-treatment": "met" }).metCriterion, "BONE-3a-equivocal");
  assert.equal(evaluate({ ...findings, "bone-equivocal-imaging": "met", "bone-physician-diagnosis": "met", "bone-antimicrobial-treatment": "met" }).metCriterion, "BONE-3b-equivocal");
  assert.equal(evaluate({ ...findings, "bone-equivocal-imaging": "met", "bone-antimicrobial-treatment": "met" }).siteDefinitionMet, false);
});

test("BONE 3c requires both physician diagnosis and documented treatment", () => {
  assert.equal(evaluate({ ...findings, "bone-physician-diagnosis": "met", "bone-antimicrobial-treatment": "met" }).metCriterion, "BONE-3c");
  assert.equal(evaluate({ ...findings, "bone-physician-diagnosis": "met" }).siteDefinitionMet, false);
});

test("another recognized cause excludes marked findings but not fever", () => {
  const excluded = evaluate({ ...findings, "bone-definitive-imaging": "met", "other-recognized-cause": "met" });
  assert.equal(excluded.siteDefinitionMet, false);
  assert.equal(excluded.status, "exclusionApplies");
  assert.equal(evaluate({ "bone-fever": "met", "bone-swelling": "met", "bone-heat": "met", "bone-definitive-imaging": "met", "other-recognized-cause": "met" }).siteDefinitionMet, false);
});

test("BONE attribution remains locked behind complete site, organism, and timing review", () => {
  const evidence = { "bone-site-organism": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "no" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("BONE metadata records criterion, timing, reporting, and attribution source pages", () => {
  assert.equal(boneDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(boneDefinition.source.printedPage, "17-7–17-8");
  assert.equal(boneDefinition.source.pdfPage, "8–9");
  assert.deepEqual(boneDefinition.criteria.map(({ id }) => id), ["BONE-1", "BONE-2", "BONE-3a-definitive", "BONE-3a-equivocal", "BONE-3b-definitive", "BONE-3b-equivocal", "BONE-3c"]);
  assert.ok(boneDefinition.notes.every(({ source }) => source.sourceDataId === "BONE.timing-and-secondary-bsi"));
  assert.ok(boneDefinition.reportingInstructions.every(({ source }) => source.sourceDataId === "BONE.reporting-instructions"));
});

test("BONE is wired to the existing compact MEN evidence renderer without renderer changes", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /definition\?\.implementationStatus === "validated"/);
  assert.match(app, /renderCompactMenEvidence\(\{ definition, evaluation/);
});
