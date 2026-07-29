import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSecondaryPathway } from "./secondary-rules.js";

const evaluate = (pathway, selected = [], relationship = "", timing = "") => evaluateSecondaryPathway({ pathway, evidence: new Set(selected), organismRelationship: relationship, attributionTiming: timing });

test("no evidence selected provides initial guidance", () => { const result = evaluate("cardiovascular"); assert.equal(result.status, "incomplete"); assert.match(result.guidanceMessage, /Review the evidence combinations/); });
test("partial evidence identifies the closest route", () => { const result = evaluate("cardiovascular", ["echo"]); assert.equal(result.status, "possible"); assert.equal(result.candidateRoutes[0].id, "cardio-imaging"); assert.deepEqual(result.missingRequirements, ["Required culture pattern and organism eligibility", "Required clinical findings"]); });
test("alternative branches stay visible and a qualifying branch completes", () => { const partial = evaluate("cardiovascular", ["echo", "siteSpecimen"]); assert.equal(partial.candidateRoutes.length, 2); const complete = evaluate("cardiovascular", ["siteSpecimen", "culturePattern"]); assert.equal(complete.siteDefinitionComplete, true); assert.equal(complete.status, "site-definition-complete"); });
test("site completion remains separate from relationship and timing", () => { const evidence = ["siteSpecimen", "culturePattern", "reviewComplete"]; assert.equal(evaluate("cardiovascular", evidence).remainingAttributionChecks.length, 2); assert.match(evaluate("cardiovascular", evidence, "yes").remainingAttributionChecks[0], /timing/); assert.equal(evaluate("cardiovascular", evidence, "yes", "yes").status, "complete"); });
test("review completion cannot satisfy missing clinical evidence", () => assert.equal(evaluate("uti", ["reviewComplete"], "yes", "yes").siteDefinitionComplete, false));
test("switching pathways evaluates only the active pathway", () => { const evidence = ["siteSpecimen", "culturePattern"]; assert.equal(evaluate("cardiovascular", evidence).siteDefinitionComplete, true); assert.equal(evaluate("uti", evidence).siteDefinitionComplete, false); });
test("unchecking a required item returns a route to incomplete", () => { assert.equal(evaluate("cardiovascular", ["siteSpecimen", "culturePattern"]).siteDefinitionComplete, true); assert.equal(evaluate("cardiovascular", ["siteSpecimen"]).siteDefinitionComplete, false); });
test("organism count is not evidence", () => { const result = evaluateSecondaryPathway({ pathway: "uti", evidence: new Set(), organismRelationship: "yes", attributionTiming: "yes", organismNames: ["a", "b"] }); assert.equal(result.siteDefinitionComplete, false); });
test("all pathways expose explicit routes", () => { for (const pathway of ["pneu", "uti", "ssi", "gi", "skin", "boneJoint", "cardiovascular", "cns", "other"]) assert.ok(evaluate(pathway).candidateRoutes.length, pathway); });
