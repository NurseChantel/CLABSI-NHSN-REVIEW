import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, geDefinition, implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "GE", evidence, ...extra });
const branchTwo = (laboratory) => ({ "ge-nausea": "met", "ge-fever": "met", [laboratory]: "met" });

test("each GE branch and each criterion 2 laboratory alternative independently qualifies", () => {
  assert.equal(evaluate({ "ge-acute-diarrhea": "met", "ge-no-likely-noninfectious-cause": "met" }).metCriterion, "GE-1");
  for (const laboratory of ["ge-stool-rectal-enteric-pathogen", "ge-stool-microscopy-enteric-pathogen", "ge-enteric-antibody"])
    assert.equal(evaluate(branchTwo(laboratory)).metCriterion, "GE-2");
});

test("required AND elements and the two-symptom threshold are enforced", () => {
  assert.equal(evaluate({ "ge-acute-diarrhea": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ge-no-likely-noninfectious-cause": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ge-nausea": "met", "ge-stool-microscopy-enteric-pathogen": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ge-nausea": "met", "ge-fever": "met" }).siteDefinitionMet, false);
});

test("GE symptom OR alternatives work independently", () => {
  for (const pair of [["ge-nausea", "ge-vomiting"], ["ge-abdominal-pain", "ge-fever"], ["ge-headache", "ge-fever"]])
    assert.equal(evaluate({ [pair[0]]: "met", [pair[1]]: "met", "ge-stool-rectal-enteric-pathogen": "met" }).metCriterion, "GE-2");
});

test("CDI evidence cannot qualify GE and the explicit CDI boundary blocks both GE branches", () => {
  assert.equal(evaluate({ "cdi-positive-toxin-test": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ge-cdi-infection": "met" }).status, "exclusionApplies");
  assert.equal(evaluate({ "ge-cdi-infection": "met", "ge-acute-diarrhea": "met", "ge-no-likely-noninfectious-cause": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ge-cdi-infection": "met", ...branchTwo("ge-stool-microscopy-enteric-pathogen") }).siteDefinitionMet, false);
});

test("other-cause exclusions apply only to marked criterion 2 symptoms", () => {
  assert.equal(evaluate({ ...branchTwo("ge-enteric-antibody"), "ge-other-recognized-cause": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ge-fever": "met", "ge-stool-microscopy-enteric-pathogen": "met", "ge-other-recognized-cause": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ge-acute-diarrhea": "met", "ge-no-likely-noninfectious-cause": "met", "ge-other-recognized-cause": "met" }).metCriterion, "GE-1");
});

test("incompatible GE branches cannot be combined", () => {
  assert.equal(evaluate({ "ge-acute-diarrhea": "met", "ge-nausea": "met", "ge-stool-rectal-enteric-pathogen": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ge-no-likely-noninfectious-cause": "met", "ge-fever": "met", "ge-headache": "met" }).siteDefinitionMet, false);
});

test("meeting GE never automatically establishes Secondary BSI attribution", () => {
  const evidence = { "ge-acute-diarrhea": "met", "ge-no-likely-noninfectious-cause": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("GE source metadata traces criteria, reporting instruction, and attribution", () => {
  assert.deepEqual(geDefinition.source, { document: "Secondary BSI Chapter.pdf", chapter: "Chapter 17 — Surveillance Definitions for Specific Types of Infections", printedPage: "17-19", pdfPage: 20, sectionHeading: "GE — Gastroenteritis (excluding C. difficile infections)", sourceDataId: "GE" });
  assert.deepEqual(geDefinition.criteria.map(({ id }) => id), ["GE-1", "GE-2"]);
  assert.equal(geDefinition.reportingInstructions[0].source.sourceDataId, "GE.reporting-instruction");
  assert.equal(geDefinition.secondaryBsi.source.sourceDataId, "GE.secondary-bsi");
});

test("GE, MEN, and all completed pathways render through the unchanged canonical renderer", () => {
  const evidence = { "ge-acute-diarrhea": "met", "ge-no-likely-noninfectious-cause": "met" };
  const html = renderCompactMenEvidence({ definition: geDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence }).replaceAll("MEN Site Definition", "GE Site Definition");
  assert.match(html, /🟢 GE Site Definition Met/);
  assert.match(html, /data-men-renderer="compact-v3"/);
  assert.ok(implementedSecondaryPathways.includes("GE"));
  assert.ok(implementedSecondaryPathways.includes("MEN"));
  for (const code of implementedSecondaryPathways) {
    assert.equal(secondarySiteDefinitions[code].implementationStatus, "validated");
    assert.doesNotThrow(() => renderCompactMenEvidence({ definition: secondarySiteDefinitions[code], evaluation: evaluateSecondarySite({ siteCode: code }), patientAge: "adult", evidence: {} }));
  }
  for (const file of ["app.js", "secondary-evidence-ui.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("<<<<<<<"), false);
});
