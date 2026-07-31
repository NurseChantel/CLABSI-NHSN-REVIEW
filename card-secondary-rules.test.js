import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cardDefinition, evaluateSecondarySite } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "CARD", evidence, ...extra });

test("CARD criterion 1 qualifies only with eligible pericardial microbiology", () => {
  assert.equal(evaluate({ "card-pericardial-organism": "met" }).metCriterion, "CARD-1");
  assert.equal(evaluate({ "card-pericardial-organism": "notMet" }).siteDefinitionMet, false);
});

test("CARD criterion 2 requires two findings and one complete support alternative", () => {
  const complete = { "card-fever": "met", "card-chest-pain": "met", "card-abnormal-ekg": "met" };
  assert.equal(evaluate(complete).metCriterion, "CARD-2");
  assert.equal(evaluate({ ...complete, "card-chest-pain": "unknown" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...complete, "card-abnormal-ekg": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "card-fever": "met", "card-paradoxical-pulse": "met", "card-pericardial-effusion": "met" }).metCriterion, "CARD-2");
});

test("CARD criterion 3 explicitly enforces the one-year age boundary", () => {
  const infant = { "card-age-one-or-younger": "met", "card-hypothermia": "met", "card-bradycardia": "met", "card-igg-rise": "met" };
  assert.equal(evaluate(infant).metCriterion, "CARD-3");
  assert.equal(evaluate({ ...infant, "card-age-one-or-younger": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...infant, "card-age-one-or-younger": "unknown" }).siteDefinitionMet, false);
});

test("CARD asterisk exclusion invalidates only marked findings", () => {
  assert.equal(evaluate({ "card-chest-pain": "met", "card-paradoxical-pulse": "met", "card-abnormal-ekg": "met", "other-recognized-cause": "met" }).status, "exclusionApplies");
  assert.equal(evaluate({ "card-fever": "met", "card-hypothermia": "met", "card-pericardial-effusion": "met", "card-age-one-or-younger": "met", "other-recognized-cause": "met" }).metCriterion, "CARD-3");
});

test("each CARD supporting alternative independently satisfies the support OR", () => {
  for (const support of ["card-abnormal-ekg", "card-histologic-heart-tissue", "card-igg-rise", "card-pericardial-effusion"]) {
    assert.equal(evaluate({ "card-fever": "met", "card-chest-pain": "met", [support]: "met" }).metCriterion, "CARD-2");
  }
});

test("CARD secondary BSI attribution remains locked behind site, relationship, and timing", () => {
  const evidence = { "card-pericardial-organism": "met" };
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "no" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "no", attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("CARD metadata cites the approved NHSN manual", () => {
  assert.equal(cardDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(cardDefinition.source.printedPage, "17-13");
  assert.equal(cardDefinition.source.pdfPage, 14);
  assert.deepEqual(cardDefinition.criteria.map(({ id }) => id), ["CARD-1", "CARD-2", "CARD-3"]);
  cardDefinition.criteria.forEach((criterion) => assert.equal(criterion.source.sourceDataId, "CARD"));
  assert.equal(cardDefinition.secondaryBsi.source.sourceDataId, "CARD.secondary-bsi");
});

test("CARD is wired to the unchanged compact evidence renderer", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /definition\?\.siteCode === "CARD"/);
  assert.match(app, /renderCompactMenEvidence\(\{ definition, evaluation/);
});
