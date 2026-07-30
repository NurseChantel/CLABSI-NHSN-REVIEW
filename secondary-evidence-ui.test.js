import test from "node:test";
import assert from "node:assert/strict";
import { checkboxEvidenceValue, getMenProgress, getVisibleMenCriteria } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, menDefinition } from "./secondary-rules.js";

test("MEN evidence uses checked and unchecked checkbox values only", () => {
  assert.equal(checkboxEvidenceValue(true), "met");
  assert.equal(checkboxEvidenceValue(false), "notMet");
});

test("age selection hides only the age-inappropriate MEN clinical pathway", () => {
  assert.deepEqual(getVisibleMenCriteria(menDefinition.criteria, "adult").map(({ id }) => id), ["MEN-1", "MEN-2"]);
  assert.deepEqual(getVisibleMenCriteria(menDefinition.criteria, "infant").map(({ id }) => id), ["MEN-1", "MEN-3"]);
});

test("compact progress reflects the existing MEN evaluator without changing criteria", () => {
  const evidence = { "csf-organism": "met" };
  const evaluation = evaluateSecondarySite({ siteCode: "MEN", evidence });
  assert.deepEqual(getMenProgress(evaluation, getVisibleMenCriteria(menDefinition.criteria, "adult"), evidence), { completed: 1, missing: 0, met: true });
});
