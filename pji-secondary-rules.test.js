import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateSecondarySite, pjiDefinition } from "./secondary-rules.js";

const restriction = { "pji-organ-space-after-hpro-kpro": "met" };
const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "PJI", evidence, ...extra });

test("PJI is restricted to Organ/Space SSI following HPRO and KPRO only", () => {
  assert.equal(evaluate({ "pji-two-positive-specimens": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...restriction, "pji-two-positive-specimens": "met" }).metCriterion, "PJI-1");
  assert.match(pjiDefinition.siteName, /for use as Organ\/Space SSI following HPRO and KPRO only/);
});

test("PJI criterion 1 requires two positive specimens with a matching organism", () => {
  assert.equal(evaluate({ ...restriction, "pji-two-positive-specimens": "unknown" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...restriction, "pji-single-specimen-organism": "met" }).siteDefinitionMet, false);
});

test("PJI criterion 2 accepts each listed operative or gross anatomic alternative", () => {
  for (const id of ["pji-sinus-tract", "pji-purulence", "pji-other-gross-evidence"])
    assert.equal(evaluate({ ...restriction, [id]: "met" }).metCriterion, "PJI-2");
  assert.equal(evaluate(restriction).siteDefinitionMet, false);
});

test("PJI criterion 3 requires three distinct minor-criterion groups", () => {
  const three = { ...restriction, "pji-elevated-crp-and-esr": "met", "pji-elevated-synovial-pmn": "met", "pji-positive-histology": "met" };
  assert.equal(evaluate(three).metCriterion, "PJI-3");
  assert.equal(evaluate({ ...three, "pji-positive-histology": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...restriction, "pji-elevated-crp-and-esr": "met", "pji-leukocyte-esterase": "met", "pji-alpha-defensin": "met" }).siteDefinitionMet, false);
});

test("PJI criterion 3 supports specimen microbiology, alpha-defensin, and physician diagnosis", () => {
  const evidence = { ...restriction, "pji-single-specimen-organism": "met", "pji-alpha-defensin": "met", "pji-physician-diagnosis": "met" };
  assert.equal(evaluate(evidence).metCriterion, "PJI-3");
});

test("PJI secondary BSI attribution remains locked behind site, organism, and timing", () => {
  const evidence = { ...restriction, "pji-two-positive-specimens": "met" };
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "no" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("PJI metadata traces criteria, reporting, and attribution to NHSN pages", () => {
  assert.equal(pjiDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(pjiDefinition.source.printedPage, "17-9–17-10");
  assert.equal(pjiDefinition.source.pdfPage, "10–11");
  assert.deepEqual(pjiDefinition.criteria.map(({ id }) => id), ["PJI-1", "PJI-2", "PJI-3"]);
  assert.equal(pjiDefinition.reportingInstructions[0].source.sourceDataId, "PJI.reporting-instruction");
  assert.equal(pjiDefinition.secondaryBsi.source.sourceDataId, "PJI.secondary-bsi");
});

test("PJI reuses the existing compact evidence renderer", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /definition\?\.siteCode === "PJI"/);
  assert.match(app, /renderCompactMenEvidence\(\{ definition, evaluation/);
});
