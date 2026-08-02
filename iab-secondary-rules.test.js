import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, iabDefinition, implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "IAB", evidence, ...extra });
const clinical = { "iab-fever-over-38": "met", "iab-hypotension": "met" };

test("every NHSN IAB pathway qualifies independently", () => {
  for (const [criterion, evidence] of [
    ["IAB-1", { "iab-abscess-or-purulent-material-organism": "met" }],
    ["IAB-2a", { "iab-gross-or-histopath-evidence": "met" }],
    ["IAB-3a", { ...clinical, "iab-invasive-specimen-gram-stain": "met" }],
    ["IAB-3b-definitive", { ...clinical, "iab-blood-mbi-organism": "met", "iab-definitive-imaging": "met" }],
    ["IAB-3b-equivocal", { ...clinical, "iab-blood-mbi-organism": "met", "iab-equivocal-imaging": "met", "iab-equivocal-imaging-antimicrobial-treatment": "met" }]
  ]) assert.equal(evaluate(evidence).metCriterion, criterion);
});

test("IAB 2b preserves its NHSN AND relationship", () => {
  const criterion = iabDefinition.criteria.find(({ id }) => id === "IAB-2b");
  assert.deepEqual(criterion.allOf.map(({ id }) => id), ["iab-gross-or-histopath-evidence", "iab-blood-mbi-organism"]);
  assert.equal(evaluate({ "iab-gross-or-histopath-evidence": "met", "iab-blood-mbi-organism": "met" }).metCriterion, "IAB-2a");
  assert.equal(criterion.allOf.length, 2);
});

test("IAB 3a preserves Gram-stain and organism-identification alternatives", () => {
  assert.equal(evaluate({ ...clinical, "iab-invasive-specimen-gram-stain": "met" }).siteDefinitionMet, true);
  assert.equal(evaluate({ ...clinical, "iab-invasive-specimen-organism": "met" }).siteDefinitionMet, true);
  assert.equal(evaluate(clinical).siteDefinitionMet, false);
});

test("IAB criterion 3 requires two clinical findings and complete nested evidence", () => {
  assert.equal(evaluate({ "iab-fever-over-38": "met", "iab-invasive-specimen-organism": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...clinical, "iab-definitive-imaging": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...clinical, "iab-blood-mbi-organism": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...clinical, "iab-blood-mbi-organism": "met", "iab-equivocal-imaging": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...clinical, "iab-blood-mbi-organism": "met", "iab-equivocal-imaging-antimicrobial-treatment": "met" }).siteDefinitionMet, false);
});

test("IAB clinical OR alternatives and no-other-recognized-cause requirement are explicit", () => {
  for (const pair of [["iab-nausea", "iab-vomiting"], ["iab-abdominal-pain-or-tenderness", "iab-elevated-transaminase"], ["iab-fever-over-38", "iab-jaundice"]])
    assert.equal(evaluate({ [pair[0]]: "met", [pair[1]]: "met", "iab-invasive-specimen-organism": "met" }).siteDefinitionMet, true);
  assert.equal(evaluate({ "iab-nausea": "met", "iab-vomiting": "met", "iab-invasive-specimen-organism": "met", "iab-selected-finding-other-recognized-cause": "met" }).siteDefinitionMet, false);
});

test("alternate-site, SSI, viral-hepatitis, and noninfectious-pancreatitis evidence cannot qualify IAB", () => {
  for (const evidence of [
    { "cdi-positive-toxin-producing-test": "met", "iab-cdi-evidence-only": "met" },
    { "ge-acute-onset-diarrhea-over-12-hours": "met", "iab-ge-evidence-only": "met" },
    { "git-gross-or-histopath-evidence": "met", "iab-git-evidence-only": "met" },
    { "nec-age-one-or-younger": "met", "nec-definitive-portal-venous-gas": "met", "iab-nec-evidence-only": "met" },
    { "appendicitis-diagnosis": "met", "iab-appendicitis-evidence-only": "met" },
    { "ssi-organ-space": "met", "iab-ssi-evidence-only": "met" },
    { "viral-hepatitis": "met", "iab-viral-hepatitis-only": "met" },
    { "pancreatitis": "met", "iab-noninfectious-pancreatitis-only": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("unchecked evidence does not count and IAB does not automatically establish secondary BSI attribution", () => {
  assert.equal(evaluate({}).siteDefinitionMet, false);
  const evidence = { "iab-abscess-or-purulent-material-organism": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "no" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "no", attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("IAB source, reporting, boundary, and attribution metadata are preserved", () => {
  assert.deepEqual({ document: iabDefinition.source.document, printedPage: iabDefinition.source.printedPage, pdfPage: iabDefinition.source.pdfPage, sectionHeading: iabDefinition.source.sectionHeading }, { document: "Secondary BSI Chapter.pdf", printedPage: "17-21–17-22", pdfPage: "22–23", sectionHeading: "IAB — Intraabdominal infection" });
  assert.ok(iabDefinition.criteria.every(({ source }) => source.sourceDataId === "IAB"));
  assert.equal(iabDefinition.reportingInstructions[0].source.sourceDataId, "IAB.reporting-instructions");
  assert.equal(iabDefinition.secondaryBsi.source.sourceDataId, "IAB.secondary-bsi");
  assert.equal(iabDefinition.secondaryBsi.lockedUntilSiteDefinitionMet, true);
});

test("IAB is registered once and uses the canonical compact renderer", () => {
  assert.equal(secondarySiteDefinitions.IAB, iabDefinition);
  assert.equal(implementedSecondaryPathways.filter(code => code === "IAB").length, 1);
  const html = renderCompactMenEvidence({ definition: iabDefinition, evaluation: evaluate({}), patientAge: "adult", evidence: {} });
  assert.match(html, /data-men-renderer="compact-v3"/);
  assert.match(html, /🟡 IAB Site Definition Not Met/);
  assert.doesNotMatch(html, /Site definition not yet validated/);
});

test("IAB adds no pathway-specific renderer and protected application files remain IAB-definition-free", () => {
  assert.equal(readFileSync(new URL("./secondary/definitions/iab.js", import.meta.url), "utf8").includes("render"), false);
  for (const file of ["app.js", "style.css", "index.html", "secondary-evidence-ui.js", "secondary/evaluator.js"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("iabDefinition"), false);
});
