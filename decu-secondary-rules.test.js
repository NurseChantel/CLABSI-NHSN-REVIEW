import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";
import { decuDefinition } from "./secondary/definitions/decu.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "DECU", evidence, ...extra });
const findings = { "decu-edge-erythema": "met", "decu-edge-tenderness": "met" };

test("each eligible DECU microbiology alternative qualifies independently", () => {
  for (const id of ["decu-margin-aspirate-or-biopsy-culture", "decu-margin-aspirate-or-biopsy-non-culture"])
    assert.equal(evaluate({ ...findings, [id]: "met" }).metCriterion, "DECU-1");
});

test("DECU requires two wound-edge findings and qualifying margin microbiology", () => {
  assert.equal(evaluate({ "decu-edge-erythema": "met", "decu-margin-aspirate-or-biopsy-culture": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate(findings).siteDefinitionMet, false);
  assert.equal(evaluate({ "decu-margin-aspirate-or-biopsy-culture": "met" }).siteDefinitionMet, false);
});

test("DECU symptom and microbiology alternatives work without incompatible evidence mixing", () => {
  assert.equal(evaluate({ "decu-edge-tenderness": "met", "decu-edge-swelling": "met", "decu-margin-aspirate-or-biopsy-non-culture": "met" }).siteDefinitionMet, true);
  assert.equal(evaluate({ "decu-edge-erythema": "met", "decu-margin-aspirate-or-biopsy-culture": "met", "decu-margin-aspirate-or-biopsy-non-culture": "met" }).siteDefinitionMet, false);
});

test("ineligible wound specimens, pressure-injury stage, and drainage alone cannot qualify DECU", () => {
  for (const id of ["decu-positive-wound-culture", "decu-superficial-swab", "decu-pressure-injury-stage", "decu-purulent-drainage"])
    assert.equal(evaluate({ ...findings, [id]: "met" }).siteDefinitionMet, false, id);
});

test("SKIN, ST, and BURN evidence cannot qualify DECU", () => {
  for (const evidence of [
    { "skin-purulent-drainage": "met" },
    { "st-abscess": "met", "st-purulent-drainage": "met" },
    { "burn-purulent-drainage": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("asterisked no-other-recognized-cause restrictions apply to the affected finding", () => {
  const evidence = { ...findings, "decu-edge-erythema-other-cause": "met", "decu-margin-aspirate-or-biopsy-culture": "met" };
  assert.equal(evaluate(evidence).siteDefinitionMet, false);
  assert.equal(evaluate({ ...evidence, "decu-edge-swelling": "met" }).siteDefinitionMet, true);
});

test("unchecked and unknown DECU evidence does not count as met", () => {
  assert.equal(evaluate({ ...findings, "decu-margin-aspirate-or-biopsy-culture": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...findings, "decu-margin-aspirate-or-biopsy-culture": "" }).siteDefinitionMet, false);
  assert.equal(evaluate({}).siteDefinitionMet, false);
});

test("meeting DECU unlocks but does not automatically establish Secondary BSI attribution", () => {
  const evidence = { ...findings, "decu-margin-aspirate-or-biopsy-culture": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("DECU source metadata and registry entries are exact", () => {
  assert.equal(decuDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(decuDefinition.source.printedPage, "17-26");
  assert.equal(decuDefinition.source.pdfPage, 27);
  assert.equal(decuDefinition.source.sectionHeading, "DECU — Decubitus ulcer infection (also known as pressure injury infection), including both superficial and deep infections");
  assert.equal(decuDefinition.source.sourceDataId, "DECU");
  assert.equal(decuDefinition.secondaryBsi.source.printedPage, "17-1–17-3");
  assert.equal(secondarySiteDefinitions.DECU, decuDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "DECU").length, 1);
});

test("the actual compact renderer renders incomplete and met DECU states", () => {
  const incomplete = renderCompactMenEvidence({ definition: decuDefinition, evaluation: evaluate({ "decu-edge-erythema": "met" }), patientAge: "adult", evidence: { "decu-edge-erythema": "met" } }).replaceAll("MEN Site Definition", "DECU Site Definition");
  assert.match(incomplete, /🟡 DECU Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  const metEvidence = { ...findings, "decu-margin-aspirate-or-biopsy-culture": "met" };
  const met = renderCompactMenEvidence({ definition: decuDefinition, evaluation: evaluate(metEvidence), patientAge: "adult", evidence: metEvidence }).replaceAll("MEN Site Definition", "DECU Site Definition");
  assert.match(met, /🟢 DECU Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const definition of Object.values(secondarySiteDefinitions))
    if (definition.implementationStatus === "validated") assert.doesNotThrow(() => renderCompactMenEvidence({ definition, evaluation: evaluateSecondarySite({ siteCode: definition.siteCode }), patientAge: "adult", evidence: {} }));
});

test("shared evaluator, renderer, application, layout, and completed SST pathway remain untouched", () => {
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "secondary/definitions/skin.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("<<<<<<<"), false);
});
