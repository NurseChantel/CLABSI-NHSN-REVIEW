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

// Manual 17-9–17-10 lists seven minor criteria, a through g. Three distinct ones are
// required; two conditions inside minor criterion b still count as a single criterion.
test("PJI criterion 3 requires three distinct minor criteria", () => {
  const three = { ...restriction, "pji-elevated-crp-and-esr": "met", "pji-elevated-synovial-pmn": "met", "pji-positive-histology": "met" };
  assert.equal(evaluate(three).metCriterion, "PJI-3");
  assert.equal(evaluate({ ...three, "pji-positive-histology": "notMet" }).siteDefinitionMet, false);
});

test("PJI minor criterion b counts elevated synovial WBC as well as leukocyte esterase", () => {
  // "elevated synovial fluid white blood cell (WBC; >10,000 cells/uL) count OR
  // '++' (or greater) change on leukocyte esterase test strip of synovial fluid"
  const viaWbc = { ...restriction, "pji-elevated-crp-and-esr": "met", "pji-elevated-synovial-wbc": "met", "pji-elevated-synovial-pmn": "met" };
  assert.equal(evaluate(viaWbc).metCriterion, "PJI-3");
  const viaEsterase = { ...restriction, "pji-elevated-crp-and-esr": "met", "pji-leukocyte-esterase": "met", "pji-elevated-synovial-pmn": "met" };
  assert.equal(evaluate(viaEsterase).metCriterion, "PJI-3");
});

test("PJI minor criteria a and b are two separate minor criteria", () => {
  // a (CRP and ESR) + b (synovial WBC) + c (PMN%) is three minor criteria.
  assert.equal(evaluate({ ...restriction, "pji-elevated-crp-and-esr": "met", "pji-leukocyte-esterase": "met", "pji-alpha-defensin": "met" }).metCriterion, "PJI-3");
  // Both halves of minor criterion b together still count only once, so b + f is two.
  assert.equal(evaluate({ ...restriction, "pji-elevated-synovial-wbc": "met", "pji-leukocyte-esterase": "met", "pji-alpha-defensin": "met" }).siteDefinitionMet, false);
});

test("PJI exposes all seven minor criteria from the manual", () => {
  const group = pjiDefinition.criteria.find(criterion => criterion.id === "PJI-3").groups[0];
  assert.equal(group.minimumRequiredCount, 3);
  assert.deepEqual(group.anyOf.map(entry => entry.id), ["PJI-3a", "PJI-3b", "PJI-3c", "PJI-3d", "PJI-3e", "PJI-3f", "PJI-3g"]);
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
  assert.match(app, /definition\?\.implementationStatus === "validated"/);
  assert.match(app, /renderCompactMenEvidence\(\{ definition, evaluation/);
});
