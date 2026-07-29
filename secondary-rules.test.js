import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSecondarySite, secondarySiteCategories, secondarySiteDefinitions, selectSecondarySite } from "./secondary-rules.js";

const expected = {
  BJ: ["BONE", "DISC", "JNT", "PJI"], CNS: ["IC", "MEN", "SA"], CVS: ["CARD", "ENDO", "MED", "VASC"],
  EENT: ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"], GI: ["CDI", "GE", "GIT", "IAB", "NEC"], LRI: ["LUNG"],
  REPR: ["EMET", "EPIS", "OREP", "VCUF"], SST: ["BRST", "BURN", "CIRC", "DECU", "SKIN", "ST", "UMB"], USI: ["USI"]
};

test("every verified Chapter 17 site code is independently registered", () => assert.deepEqual(Object.keys(secondarySiteDefinitions).sort(), Object.values(expected).flat().sort()));
test("the correct site list appears under every major category", () => assert.deepEqual(Object.fromEntries(secondarySiteCategories.map(item => [item.majorCategoryCode, [...item.siteCodes]])), expected));
test("selecting only a major category cannot qualify a site", () => assert.deepEqual(evaluateSecondarySite({ majorCategoryCode: "GI" }), { status: "siteNotSelected", siteDefinitionMet: false, secondaryAttributionMet: false }));
test("every placeholder remains empty and cannot meet a site definition", () => Object.values(secondarySiteDefinitions).forEach(site => { assert.equal(site.implementationStatus, "placeholder"); assert.deepEqual(site.criteria, []); assert.equal(evaluateSecondarySite({ siteCode: site.siteCode }).siteDefinitionMet, false); }));
test("a placeholder cannot produce secondary attribution", () => Object.keys(secondarySiteDefinitions).forEach(siteCode => assert.equal(evaluateSecondarySite({ siteCode, organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, false)));
test("switching site codes clears stale site evidence and attribution answers", () => { const before = { siteCode: "BONE", evidence: new Set(["stale"]), organismRelationship: "yes", attributionTiming: "yes" }; const after = selectSecondarySite(before, "DISC"); assert.equal(after.siteCode, "DISC"); assert.deepEqual(after.evidence, new Set()); assert.equal(after.organismRelationship, ""); assert.equal(after.attributionTiming, ""); });
