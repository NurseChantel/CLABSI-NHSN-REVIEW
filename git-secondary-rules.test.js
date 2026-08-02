import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, gitDefinition, implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "GIT", evidence, ...extra });
const symptoms = { "git-fever-over-38": "met", "git-dysphagia": "met" };

test("every NHSN GIT branch qualifies independently", () => {
  assert.equal(evaluate({ "git-gross-or-histopath-evidence": "met" }).metCriterion, "GIT-1a");
  for (const [criterion, evidence] of [
    ["GIT-2a", { ...symptoms, "git-invasive-specimen-organism": "met" }],
    ["GIT-2b", { ...symptoms, "git-invasive-specimen-microscopy": "met" }],
    ["GIT-2c-definitive", { ...symptoms, "git-blood-mbi-organism": "met", "git-definitive-imaging": "met" }],
    ["GIT-2c-equivocal", { ...symptoms, "git-blood-mbi-organism": "met", "git-equivocal-imaging": "met", "git-equivocal-imaging-antimicrobial-treatment": "met" }],
    ["GIT-2d-definitive", { ...symptoms, "git-definitive-imaging": "met" }],
    ["GIT-2d-equivocal", { ...symptoms, "git-equivocal-imaging": "met", "git-equivocal-imaging-antimicrobial-treatment": "met" }]
  ]) assert.equal(evaluate(evidence).metCriterion, criterion);
});

test("GIT 1b preserves its required AND relationship", () => {
  const criterion = gitDefinition.criteria.find(({ id }) => id === "GIT-1b");
  assert.deepEqual(criterion.allOf.map(({ id }) => id), ["git-gross-or-histopath-evidence", "git-blood-mbi-organism"]);
  assert.equal(criterion.allOf.every(({ id }) => evaluate({ [id]: "met" }).metCriterion === "GIT-1b"), false);
});

test("GIT criterion 2 requires two clinical findings and its complete evidence alternative", () => {
  assert.equal(evaluate({ "git-fever-over-38": "met", "git-invasive-specimen-organism": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate(symptoms).siteDefinitionMet, false);
  assert.equal(evaluate({ ...symptoms, "git-equivocal-imaging": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...symptoms, "git-equivocal-imaging-antimicrobial-treatment": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...symptoms, "git-invasive-specimen-organism": "notMet" }).siteDefinitionMet, false);
});

test("GIT symptom alternatives and no-other-recognized-cause requirement are explicit", () => {
  for (const pair of [["git-nausea", "git-vomiting"], ["git-pain-or-tenderness", "git-odynophagia"], ["git-fever-over-38", "git-dysphagia"]])
    assert.equal(evaluate({ [pair[0]]: "met", [pair[1]]: "met", "git-definitive-imaging": "met" }).siteDefinitionMet, true);
  assert.equal(evaluate({ "git-nausea": "met", "git-vomiting": "met", "git-definitive-imaging": "met", "git-selected-symptom-other-recognized-cause": "met" }).siteDefinitionMet, false);
});

test("excluded and alternate gastrointestinal pathway evidence cannot qualify GIT", () => {
  for (const evidence of [
    { "cdi-positive-toxin-producing-test": "met", "git-cdi-evidence-only": "met" },
    { "ge-acute-onset-diarrhea-over-12-hours": "met", "ge-no-likely-noninfectious-cause": "met", "git-ge-evidence-only": "met" },
    { "iab-abscess": "met", "git-iab-evidence-only": "met" },
    { "nec-age-one-or-younger": "met", "nec-definitive-portal-venous-gas": "met", "git-nec-evidence-only": "met" },
    { "appendicitis-diagnosis": "met", "git-appendicitis-evidence-only": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("unchecked evidence does not count and GIT does not automatically establish secondary BSI attribution", () => {
  assert.equal(evaluate({}).siteDefinitionMet, false);
  const evidence = { ...symptoms, "git-definitive-imaging": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "no" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "no", attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("GIT source, reporting, boundary, and attribution metadata are preserved", () => {
  assert.deepEqual({ document: gitDefinition.source.document, printedPage: gitDefinition.source.printedPage, pdfPage: gitDefinition.source.pdfPage, sectionHeading: gitDefinition.source.sectionHeading }, { document: "Secondary BSI Chapter.pdf", printedPage: "17-20", pdfPage: 21, sectionHeading: "GIT — Gastrointestinal tract infection" });
  assert.ok(gitDefinition.criteria.every(({ source }) => source.sourceDataId === "GIT"));
  assert.equal(gitDefinition.reportingInstructions[0].source.sourceDataId, "GIT.reporting-instructions");
  assert.equal(gitDefinition.secondaryBsi.source.sourceDataId, "GIT.secondary-bsi");
  assert.equal(gitDefinition.secondaryBsi.lockedUntilSiteDefinitionMet, true);
});

test("GIT is registered once and uses the canonical compact renderer", () => {
  assert.equal(secondarySiteDefinitions.GIT, gitDefinition);
  assert.equal(implementedSecondaryPathways.filter(code => code === "GIT").length, 1);
  const html = renderCompactMenEvidence({ definition: gitDefinition, evaluation: evaluate({}), patientAge: "adult", evidence: {} });
  assert.match(html, /data-men-renderer="compact-v3"/);
  assert.match(html, /🟡 GIT Site Definition Not Met/);
  assert.doesNotMatch(html, /Site definition not yet validated/);
});

test("GIT adds no pathway-specific renderer and protected application files remain GIT-free", () => {
  assert.equal(readFileSync(new URL("./secondary/definitions/git.js", import.meta.url), "utf8").includes("render"), false);
  for (const file of ["app.js", "style.css", "index.html", "secondary-evidence-ui.js", "secondary/evaluator.js"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("gitDefinition"), false);
});
