import test from "node:test";
import assert from "node:assert/strict";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, implementedSecondaryPathways, lungDefinition, secondarySiteDefinitions } from "./secondary-rules.js";

// Source: Secondary BSI Chapter.pdf, Chapter 17, printed page 17-22 (LUNG criteria and
// reporting instructions) with the pleural-fluid eligibility footnote on 17-23.
const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "LUNG", evidence, ...extra });

test("LUNG is a validated pathway registered under LRI", () => {
  assert.equal(lungDefinition.implementationStatus, "validated");
  assert.equal(lungDefinition.majorCategoryCode, "LRI");
  assert.ok(implementedSecondaryPathways.includes("LUNG"));
  assert.equal(secondarySiteDefinitions.LUNG, lungDefinition);
});

test("LUNG source metadata cites Chapter 17 page 17-22", () => {
  assert.equal(lungDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(lungDefinition.source.printedPage, "17-22");
  assert.equal(lungDefinition.source.sourceDataId, "LUNG");
  assert.deepEqual(lungDefinition.criteria.map(({ id }) => id), ["LUNG-1", "LUNG-2", "LUNG-3"]);
});

// Criterion 1: "organism(s) seen on Gram stain of lung tissue or pleural fluid or
// identified from lung tissue or pleural fluid*"
test("LUNG 1 is met by a Gram stain or an identification from lung tissue", () => {
  assert.equal(evaluate({ "lung-tissue-gram-stain": "met" }).metCriterion, "LUNG-1");
  assert.equal(evaluate({ "lung-tissue-organism": "met" }).metCriterion, "LUNG-1");
});

test("LUNG 1 is met by an eligible pleural fluid specimen", () => {
  assert.equal(evaluate({ "lung-pleural-fluid-gram-stain": "met" }).metCriterion, "LUNG-1");
  assert.equal(evaluate({ "lung-pleural-fluid-organism": "met" }).metCriterion, "LUNG-1");
});

// 17-23: "If a pleural fluid specimen is collected after a chest tube is repositioned OR
// after 24 hours of chest tube placement, this pleural fluid specimen is not eligible for
// LUNG 1." Lung tissue is unaffected by that restriction.
test("an ineligible pleural fluid specimen cannot meet LUNG 1 but does not disqualify lung tissue", () => {
  assert.equal(evaluate({ "lung-pleural-fluid-organism": "met", "lung-ineligible-pleural-fluid": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "lung-tissue-organism": "met", "lung-ineligible-pleural-fluid": "met" }).metCriterion, "LUNG-1");
});

// Criterion 2: "a lung abscess or other evidence of infection (for example, empyema) on
// gross anatomic or histopathologic exam"
test("LUNG 2 accepts either gross anatomic or histopathologic evidence", () => {
  assert.equal(evaluate({ "lung-abscess-gross-anatomic": "met" }).metCriterion, "LUNG-2");
  assert.equal(evaluate({ "lung-abscess-histopathologic": "met" }).metCriterion, "LUNG-2");
});

// Criterion 3: "imaging test evidence of abscess or infection (excludes imaging test
// evidence of pneumonia) which if equivocal is supported by clinical correlation,
// specifically, physician or physician designee documentation of antimicrobial treatment
// for lung infection"
test("LUNG 3 is met by definitive imaging alone", () => {
  assert.equal(evaluate({ "lung-definitive-imaging": "met" }).metCriterion, "LUNG-3");
});

test("equivocal LUNG imaging qualifies only with documented antimicrobial treatment", () => {
  assert.equal(evaluate({ "lung-equivocal-imaging": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "lung-equivocal-imaging": "met", "lung-antimicrobial-treatment": "met" }).metCriterion, "LUNG-3");
});

test("no LUNG criterion is met by an empty or unrelated evidence set", () => {
  assert.equal(evaluate({}).status, "notStarted");
  assert.equal(evaluate({ "lung-definitive-imaging": "notMet" }).status, "siteDefinitionIncomplete");
  assert.equal(evaluate({ "pnu2-blood-organism": "met" }).siteDefinitionMet, false);
});

// Reporting instruction, 17-22: "If patient meets LUNG and PNEU report as PNEU only,
// unless the LUNG is a surgical site organ/space infection."
test("meeting PNEU without an organ/space SSI blocks the LUNG pathway", () => {
  const blocked = evaluate({ "lung-tissue-organism": "met", "lung-pneu-met-not-organ-space-ssi": "met" });
  assert.equal(blocked.siteDefinitionMet, false);
  assert.equal(blocked.status, "exclusionApplies");
  assert.ok(lungDefinition.reportingInstructions.some(({ text }) => /report PNEU only/i.test(text)));
});

// "Lower respiratory tract secretions (such as sputum, endotracheal/tracheal aspirate,
// bronchoalveolar lavage) are not eligible for LUNG."
test("lower respiratory secretions are recorded as ineligible specimens", () => {
  const ids = lungDefinition.criteria.flatMap(criterion => [criterion, ...(criterion.alternatives ?? [])].flatMap(branch => [...branch.allOf, ...(branch.groups ?? []).flatMap(group => group.anyOf)])).map(item => item.id);
  for (const forbidden of ["sputum", "endotracheal", "tracheal", "bronchoalveolar", "lavage"]) {
    assert.equal(ids.some(id => id.includes(forbidden)), false, `no LUNG criterion element may accept ${forbidden}`);
  }
  assert.ok(lungDefinition.exclusions.some(({ id }) => id === "lung-lower-respiratory-secretions-only"));
  assert.ok(lungDefinition.notes.some(({ text }) => /not eligible/i.test(text) && /sputum/i.test(text)));
});

test("meeting LUNG never automatically establishes secondary BSI attribution", () => {
  const evidence = { "lung-tissue-organism": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("LUNG renders through the shared compact renderer", () => {
  const evidence = { "lung-tissue-organism": "met" };
  const html = renderCompactMenEvidence({ definition: lungDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence });
  assert.match(html, /data-men-renderer="compact-v3"/);
  assert.match(html, /LUNG-1/);
});
