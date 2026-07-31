import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, usiDefinition } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "USI", evidence, ...extra });
const criterion3 = { "usi-fever": "met", "usi-purulent-drainage": "met", "usi-definitive-imaging": "met" };
const criterion4 = { "usi-age-under-one": "met", "usi-hypothermia": "met", "usi-blood-organism": "met", "usi-definitive-imaging": "met" };

test("every USI criterion branch qualifies independently", () => {
  assert.equal(evaluate({ "usi-site-organism": "met" }).metCriterion, "USI-1");
  assert.equal(evaluate({ "usi-anatomic-pathology-evidence": "met" }).metCriterion, "USI-2");
  assert.equal(evaluate(criterion3).metCriterion, "USI-3");
  assert.equal(evaluate(criterion4).metCriterion, "USI-4");
});

test("USI 3 and USI 4 require every nested element", () => {
  for (const id of Object.keys(criterion3)) assert.equal(evaluate({ ...criterion3, [id]: "notMet" }).siteDefinitionMet, false, `USI-3 requires ${id}`);
  for (const id of Object.keys(criterion4)) assert.equal(evaluate({ ...criterion4, [id]: "notMet" }).siteDefinitionMet, false, `USI-4 requires ${id}`);
  assert.equal(evaluate({ ...criterion3, "usi-purulent-drainage": "notMet", "usi-blood-organism": "met" }).metCriterion, "USI-3");
});

test("asterisked findings are excluded only when another recognized cause applies", () => {
  assert.equal(evaluate({ "usi-localized-pain-tenderness": "met", "usi-purulent-drainage": "met", "usi-definitive-imaging": "met", "usi-other-recognized-cause": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...criterion3, "usi-other-recognized-cause": "met" }).metCriterion, "USI-3");
});

test("Chapter 7 UTI evidence never qualifies USI and explicitly blocks an otherwise complete branch", () => {
  assert.equal(evaluate({ "uti-urine-culture": "met", "uti-symptom": "met" }).siteDefinitionMet, false);
  const excluded = evaluate({ ...criterion3, "usi-chapter-7-uti": "met" });
  assert.equal(excluded.siteDefinitionMet, false);
  assert.equal(excluded.status, "exclusionApplies");
});

test("meeting USI unlocks but does not infer secondary BSI attribution", () => {
  assert.equal(evaluate(criterion3).secondaryAttributionMet, false);
  assert.equal(evaluate(criterion3, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("USI source metadata remains attached to every criterion and evidence atom", () => {
  assert.equal(usiDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(usiDefinition.source.printedPage, "17-28–17-29");
  assert.deepEqual(usiDefinition.criteria.map(({ id }) => id), ["USI-1", "USI-2", "USI-3", "USI-4"]);
  for (const criterion of usiDefinition.criteria) {
    assert.equal(criterion.source.sourceDataId, "USI");
    const atoms = [...criterion.allOf, ...(criterion.groups || []).flatMap((group) => group.anyOf.flatMap((entry) => entry.anyOf || [entry]))];
    assert.ok(atoms.every((atom) => atom.source?.sourceDataId === "USI"));
  }
});

test("USI uses the existing compact MEN renderer with status, criteria, exclusions, and hidden references", () => {
  const evaluation = evaluate(criterion3);
  const html = renderCompactMenEvidence({ definition: usiDefinition, evaluation, patientAge: "adult", evidence: criterion3 }).replaceAll("MEN Site Definition", "USI Site Definition");
  assert.match(html, /🟢 USI Site Definition Met/);
  assert.match(html, /data-men-renderer="compact-v3"/);
  assert.match(html, /Exclusion review/);
  assert.match(html, /<details class="secondary-references">/);
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /definition\?\.siteCode === "USI"/);
  assert.match(app, /renderCompactMenEvidence\(\{ definition, evaluation/);
});
