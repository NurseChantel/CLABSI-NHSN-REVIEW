import test from "node:test";
import assert from "node:assert/strict";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { discDefinition } from "./secondary/definitions/disc.js";
import { jntDefinition } from "./secondary/definitions/jnt.js";

const countCriteria = (definition, id) => definition.criteria.filter((criterion) => criterion.id === id).length;
const render = (siteCode, definition, evidence = {}) => renderCompactMenEvidence({ definition, evaluation: evaluateSecondarySite({ siteCode, evidence }), evidence });
const legacyIds = ["DISC-3b-definitive", "DISC-3b-equivocal", "JNT-3d-definitive", "JNT-3d-equivocal"];

test("DISC and JNT active definitions contain one retained criterion object for the target criteria", () => {
  assert.equal(countCriteria(discDefinition, "DISC-3b"), 1);
  assert.equal(countCriteria(jntDefinition, "JNT-3d"), 1);
  assert.deepEqual(discDefinition.criteria.map(({ id }) => id), ["DISC-1", "DISC-2", "DISC-3a-definitive", "DISC-3a-equivocal", "DISC-3b"]);
  assert.deepEqual(jntDefinition.criteria.map(({ id }) => id), ["JNT-1", "JNT-2", "JNT-3a", "JNT-3c", "JNT-3d"]);
});

test("legacy duplicate criterion IDs do not remain in active definitions", () => {
  const serialized = JSON.stringify([discDefinition, jntDefinition]);
  for (const id of legacyIds) assert.doesNotMatch(serialized, new RegExp(id));
});

test("DISC 3b and JNT 3d render and report status exactly once", () => {
  const disc = render("DISC", discDefinition);
  const jnt = render("JNT", jntDefinition);
  assert.equal((disc.match(/data-men-criterion="DISC-3b"/g) || []).length, 1);
  assert.equal((jnt.match(/data-men-criterion="JNT-3d"/g) || []).length, 1);
  assert.equal(evaluateSecondarySite({ siteCode: "DISC", evidence: {} }).branches.filter(({ id }) => id === "DISC-3b").length, 1);
  assert.equal(evaluateSecondarySite({ siteCode: "JNT", evidence: {} }).branches.filter(({ id }) => id === "JNT-3d").length, 1);
});

test("each valid internal OR alternative remains selectable under the single criterion", () => {
  const disc = render("DISC", discDefinition);
  const jnt = render("JNT", jntDefinition);
  for (const id of ["DISC-3b:definitive-imaging", "DISC-3b:equivocal-imaging"]) assert.match(disc, new RegExp(`data-criterion-branch="${id}"`));
  for (const id of ["JNT-3d:definitive-imaging", "JNT-3d:equivocal-imaging"]) assert.match(jnt, new RegExp(`data-criterion-branch="${id}"`));
});

test("either complete imaging alternative satisfies the single retained DISC 3b criterion", () => {
  assert.equal(evaluateSecondarySite({ siteCode: "DISC", evidence: { "disc-fever": "met", "disc-definitive-imaging": "met" } }).metCriterion, "DISC-3b");
  assert.equal(evaluateSecondarySite({ siteCode: "DISC", evidence: { "disc-fever": "met", "disc-equivocal-imaging": "met", "disc-antimicrobial-treatment": "met" } }).metCriterion, "DISC-3b");
  assert.equal(evaluateSecondarySite({ siteCode: "DISC", evidence: { "disc-fever": "met", "disc-equivocal-imaging": "met" } }).siteDefinitionMet, false);
});

test("either complete imaging alternative satisfies the single retained JNT 3d criterion", () => {
  const base = { "jnt-suspected-infection": "met", "jnt-swelling": "met", "jnt-pain-tenderness": "met" };
  assert.equal(evaluateSecondarySite({ siteCode: "JNT", evidence: { ...base, "jnt-definitive-imaging": "met" } }).metCriterion, "JNT-3d");
  assert.equal(evaluateSecondarySite({ siteCode: "JNT", evidence: { ...base, "jnt-equivocal-imaging": "met", "jnt-antimicrobial-treatment": "met" } }).metCriterion, "JNT-3d");
  assert.equal(evaluateSecondarySite({ siteCode: "JNT", evidence: { ...base, "jnt-equivocal-imaging": "met" } }).siteDefinitionMet, false);
});
