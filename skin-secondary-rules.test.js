import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { secondarySiteDefinitions } from "./secondary/registry.js";
import { skinDefinition } from "./secondary/definitions/skin.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "SKIN", evidence, ...extra });

test("every SKIN criterion 1 alternative qualifies independently", () => {
  for (const id of ["skin-purulent-drainage", "skin-pustules", "skin-vesicles", "skin-boils-not-acne"])
    assert.equal(evaluate({ [id]: "met" }).metCriterion, "SKIN-1");
});

test("every SKIN criterion 2 supporting branch qualifies with two localized findings", () => {
  for (const id of ["skin-site-organism", "skin-tissue-multinucleated-giant-cells", "skin-diagnostic-antibody"])
    assert.equal(evaluate({ "skin-localized-pain": "met", "skin-erythema": "met", [id]: "met" }).metCriterion, "SKIN-2");
});

test("SKIN criterion 2 requires two findings and one supporting result without cross-branch mixing", () => {
  assert.equal(evaluate({ "skin-localized-pain": "met", "skin-site-organism": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "skin-localized-pain": "met", "skin-erythema": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "skin-localized-pain": "met", "skin-tissue-multinucleated-giant-cells": "met", "skin-diagnostic-antibody": "met" }).siteDefinitionMet, false);
});

test("DECU, BURN, vascular-access, and other directed sites cannot qualify SKIN", () => {
  for (const id of ["skin-decubitus-ulcer", "skin-burn-infection", "skin-vascular-access-site", "skin-omphalitis", "skin-circumcision-site", "skin-breast-infection", "skin-acne"])
    assert.equal(evaluate({ "skin-purulent-drainage": "met", [id]: "met" }).siteDefinitionMet, false, id);
});

test("asterisked no-other-recognized-cause condition is enforced only on marked findings", () => {
  const excluded = { "skin-localized-pain": "met", "skin-erythema": "met", "skin-site-organism": "met", "skin-other-recognized-cause": "met" };
  assert.equal(evaluate(excluded).siteDefinitionMet, false);
  assert.equal(evaluate({ ...excluded, "skin-pustules": "met" }).metCriterion, "SKIN-1");
});

test("unchecked and unknown SKIN evidence never count as met", () => {
  assert.equal(evaluate({ "skin-pustules": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "skin-pustules": "" }).siteDefinitionMet, false);
  assert.equal(evaluate({}).siteDefinitionMet, false);
});

test("meeting SKIN unlocks but does not automatically establish Secondary BSI attribution", () => {
  const evidence = { "skin-vesicles": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("SKIN source metadata identifies criteria, instructions, and attribution pages", () => {
  assert.equal(skinDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(skinDefinition.source.printedPage, "17-26");
  assert.equal(skinDefinition.source.pdfPage, 27);
  assert.equal(skinDefinition.source.sectionHeading, "SKIN — Skin infection");
  assert.deepEqual(skinDefinition.criteria.map(({ id }) => id), ["SKIN-1", "SKIN-2"]);
  assert.ok(skinDefinition.criteria.every((criterion) => criterion.source.sourceDataId === "SKIN"));
  assert.equal(skinDefinition.reportingInstructions[0].source.printedPage, "17-26–17-27");
  assert.equal(skinDefinition.secondaryBsi.source.sourceDataId, "SKIN.secondary-bsi");
});

test("the actual compact renderer renders met and incomplete SKIN states", () => {
  const incompleteEvidence = { "skin-localized-pain": "met" };
  const incomplete = renderCompactMenEvidence({ definition: skinDefinition, evaluation: evaluate(incompleteEvidence), patientAge: "adult", evidence: incompleteEvidence }).replaceAll("MEN Site Definition", "SKIN Site Definition");
  assert.match(incomplete, /🟡 SKIN Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  const metEvidence = { "skin-purulent-drainage": "met" };
  const met = renderCompactMenEvidence({ definition: skinDefinition, evaluation: evaluate(metEvidence), patientAge: "adult", evidence: metEvidence }).replaceAll("MEN Site Definition", "SKIN Site Definition");
  assert.match(met, /🟢 SKIN Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const definition of Object.values(secondarySiteDefinitions))
    if (definition.implementationStatus === "validated") assert.doesNotThrow(() => renderCompactMenEvidence({ definition, evaluation: evaluateSecondarySite({ siteCode: definition.siteCode }), patientAge: "adult", evidence: {} }));
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("<<<<<<<"), false);
});
