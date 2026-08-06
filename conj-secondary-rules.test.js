import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { conjDefinition } from "./secondary/definitions/conj.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const findingIds = ["conj-pain", "conj-erythema", "conj-swelling"];
const supportIds = ["conj-site-organism", "conj-exudate-gram-stain", "conj-purulent-exudate", "conj-multinucleated-giant-cells", "conj-diagnostic-antibody"];
const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "CONJ", evidence, ...extra });

test("every CONJ clinical OR alternative combines with every supporting OR alternative", () => {
  for (const finding of findingIds) for (const support of supportIds)
    assert.equal(evaluate({ [finding]: "met", [support]: "met" }).metCriterion, "CONJ-1", `${finding} + ${support}`);
});

test("CONJ preserves the two required AND groups and neither group qualifies alone", () => {
  assert.deepEqual(conjDefinition.criteria.map(({ id }) => id), ["CONJ-1"]);
  assert.deepEqual(conjDefinition.criteria[0].groups.map(({ minimumRequiredCount }) => minimumRequiredCount), [1, 1]);
  for (const finding of findingIds) assert.equal(evaluate({ [finding]: "met" }).siteDefinitionMet, false, finding);
  for (const support of supportIds) assert.equal(evaluate({ [support]: "met" }).siteDefinitionMet, false, support);
});

test("unchecked evidence and unlisted physician diagnosis do not meet CONJ", () => {
  assert.equal(evaluate({ "conj-pain": "met", "conj-purulent-exudate": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "conj-pain": "met", "conj-purulent-exudate": "" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "conj-physician-diagnosis": "met" }).siteDefinitionMet, false);
});

test("chemical conjunctivitis excludes an otherwise complete CONJ pathway", () => {
  const evidence = { "conj-erythema": "met", "conj-exudate-gram-stain": "met", "conj-chemical-conjunctivitis": "met" };
  assert.equal(evaluate(evidence).status, "exclusionApplies");
  assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("conjunctivitis that is part of another viral illness is not a separate CONJ case", () => {
  const evidence = { "conj-swelling": "met", "conj-purulent-exudate": "met", "conj-part-of-other-viral-illness": "met" };
  assert.equal(evaluate(evidence).status, "exclusionApplies");
  assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("EYE and other eye evidence cannot qualify CONJ", () => {
  for (const evidence of [
    { "eye-site-organism": "met" },
    { "eye-anatomic-evidence": "met", "eye-physician-diagnosis": "met" },
    { "conjunctival-redness-alone": "met", "eye-drainage": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
  assert.match(conjDefinition.reportingInstructions.find(({ id }) => id === "CONJ-report-eye").text, /as EYE/);
  assert.match(conjDefinition.reportingInstructions.find(({ id }) => id === "CONJ-report-viral-illness").text, /for example, UR/);
});

test("meeting CONJ unlocks but does not automatically establish Secondary BSI attribution", () => {
  const complete = { "conj-pain": "met", "conj-site-organism": "met" };
  assert.equal(evaluate(complete).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("CONJ source metadata preserves criteria, reporting, and attribution sources", () => {
  assert.deepEqual({ document: conjDefinition.source.document, printedPage: conjDefinition.source.printedPage, pdfPage: conjDefinition.source.pdfPage, sectionHeading: conjDefinition.source.sectionHeading, sourceDataId: conjDefinition.source.sourceDataId },
    { document: "Secondary BSI Chapter.pdf", printedPage: "17-15", pdfPage: 16, sectionHeading: "CONJ — Conjunctivitis", sourceDataId: "CONJ" });
  assert.ok(conjDefinition.criteria[0].groups.flatMap(({ anyOf }) => anyOf).every(({ source }) => source === conjDefinition.source));
  assert.equal(conjDefinition.reportingInstructions[0].source.sourceDataId, "CONJ.reporting-instructions");
  assert.equal(conjDefinition.secondaryBsi.source.sourceDataId, "CONJ.secondary-bsi");
});

test("registry contains CONJ exactly once without changing the EENT order", () => {
  assert.equal(secondarySiteDefinitions.CONJ, conjDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "CONJ").length, 1);
  assert.deepEqual(Object.keys(secondarySiteDefinitions).filter((code) => ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"].includes(code)), ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"]);
});

test("the canonical compact renderer handles incomplete and met CONJ states", () => {
  const partial = { "conj-pain": "met" };
  const incomplete = renderCompactMenEvidence({ definition: conjDefinition, evaluation: evaluate(partial), patientAge: "adult", evidence: partial });
  assert.match(incomplete, /🟡 CONJ Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  assert.match(incomplete, /qualifying microbiologic, laboratory, or exudate finding/);
  const complete = { ...partial, "conj-purulent-exudate": "met" };
  const met = renderCompactMenEvidence({ definition: conjDefinition, evaluation: evaluate(complete), patientAge: "adult", evidence: complete });
  assert.match(met, /🟢 CONJ Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("CONJ-specific"), false);
});
