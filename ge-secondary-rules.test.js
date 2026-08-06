import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, geDefinition, implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "GE", evidence, ...extra });
const symptoms = { "ge-nausea": "met", "ge-fever-over-38": "met" };

test("every NHSN GE branch qualifies independently", () => {
  assert.equal(evaluate({ "ge-acute-onset-diarrhea-over-12-hours": "met", "ge-no-likely-noninfectious-cause": "met" }).metCriterion, "GE-1");
  for (const [criterion, laboratoryEvidence] of [
    ["GE-2a", "ge-enteric-pathogen-stool-or-rectal-swab"],
    ["GE-2b", "ge-enteric-pathogen-stool-microscopy"],
    ["GE-2c", "ge-enteric-pathogen-antibody"]
  ]) assert.equal(evaluate({ ...symptoms, [laboratoryEvidence]: "met" }).metCriterion, criterion);
});

test("GE criterion 1 requires acute-onset liquid diarrhea for more than 12 hours and no likely noninfectious cause", () => {
  assert.equal(evaluate({ "ge-acute-onset-diarrhea-over-12-hours": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ge-no-likely-noninfectious-cause": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ge-acute-onset-diarrhea-over-12-hours": "met", "ge-no-likely-noninfectious-cause": "met", "ge-likely-noninfectious-cause": "met" }).siteDefinitionMet, false);
});

test("GE criterion 2 requires two qualifying clinical findings and one laboratory alternative", () => {
  const lab = { "ge-enteric-pathogen-stool-or-rectal-swab": "met" };
  for (const symptom of ["ge-nausea", "ge-vomiting", "ge-abdominal-pain", "ge-fever-over-38", "ge-headache"])
    assert.equal(evaluate({ [symptom]: "met", ...lab }).siteDefinitionMet, false);
  assert.equal(evaluate(symptoms).siteDefinitionMet, false);
  assert.equal(evaluate({ ...symptoms, ...lab }).siteDefinitionMet, true);
  assert.equal(evaluate({ "ge-vomiting": "met", "ge-headache": "met", ...lab, "ge-selected-symptom-other-recognized-cause": "met" }).siteDefinitionMet, false);
});

test("independent GE laboratory alternatives cannot be combined into a complete branch", () => {
  assert.equal(evaluate({ ...symptoms, "ge-enteric-pathogen-stool-or-rectal-swab": "notMet", "ge-enteric-pathogen-stool-microscopy": "notMet", "ge-enteric-pathogen-antibody": "notMet" }).siteDefinitionMet, false);
  assert.deepEqual(geDefinition.criteria.map(({ id }) => id), ["GE-1", "GE-2a", "GE-2b", "GE-2c"]);
});

test("CDI and other gastrointestinal-site evidence cannot qualify GE", () => {
  for (const evidence of [
    { "cdi-positive-toxin-producing-test": "met", "cdi-unformed-stool-specimen": "met", "cdi-new-event-rit-eligible": "met" },
    { "cdi-pseudomembranous-colitis-gross": "met", "ge-cdi-evidence-only": "met" },
    { "git-abscess": "met", "git-blood-organism": "met" },
    { "nec-age-one-or-younger": "met", "nec-vomiting": "met", "nec-definitive-portal-venous-gas": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("unchecked and explicitly unmet evidence do not count", () => {
  assert.equal(evaluate({}).siteDefinitionMet, false);
  assert.equal(evaluate({ ...symptoms, "ge-enteric-pathogen-stool-microscopy": "notMet" }).siteDefinitionMet, false);
});

test("meeting GE does not automatically establish Secondary BSI attribution", () => {
  // Table B1 (clabsi nhsn.pdf 4-34) admits GE criterion 2a only for a secondary BSI.
  const evidence = { ...symptoms, "ge-enteric-pathogen-stool-or-rectal-swab": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "no" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "no", attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("GE preserves NHSN source, boundary, reporting, and attribution metadata", () => {
  assert.deepEqual({ document: geDefinition.source.document, printedPage: geDefinition.source.printedPage, pdfPage: geDefinition.source.pdfPage, sectionHeading: geDefinition.source.sectionHeading }, {
    document: "Secondary BSI Chapter.pdf", printedPage: "17-19", pdfPage: 20, sectionHeading: "GE — Gastroenteritis (excluding C. difficile infections)"
  });
  assert.ok(geDefinition.criteria.every(({ source }) => source.sourceDataId === "GE"));
  assert.equal(geDefinition.reportingInstructions[0].source.sourceDataId, "GE.reporting-instruction");
  assert.equal(geDefinition.secondaryBsi.source.sourceDataId, "GE.secondary-bsi");
  assert.equal(geDefinition.secondaryBsi.lockedUntilSiteDefinitionMet, true);
});

test("GE is registered once and renders with the canonical compact renderer", () => {
  assert.equal(secondarySiteDefinitions.GE, geDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "GE").length, 1);
  const html = renderCompactMenEvidence({ definition: geDefinition, evaluation: evaluate({}), patientAge: "adult", evidence: {} });
  assert.match(html, /data-men-renderer="compact-v3"/);
  assert.match(html, /🟡 GE Site Definition Not Met/);
  assert.doesNotMatch(html, /Site definition not yet validated/);
});

test("GE implementation does not add pathway-specific UI or alter protected application files", () => {
  const definitionSource = readFileSync(new URL("./secondary/definitions/ge.js", import.meta.url), "utf8");
  assert.equal(definitionSource.includes("render"), false);
  for (const file of ["app.js", "style.css", "index.html", "secondary-evidence-ui.js", "secondary/evaluator.js"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("geDefinition"), false);
});
