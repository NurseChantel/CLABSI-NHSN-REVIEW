import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { brstDefinition } from "./secondary/definitions/brst.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "BRST", evidence, ...extra });

test("each BRST microbiology specimen alternative independently meets criterion 1", () => {
  assert.equal(evaluate({ "brst-invasive-tissue-or-fluid-organism": "met" }).metCriterion, "BRST-1");
  assert.equal(evaluate({ "brst-aseptic-drain-organism": "met" }).metCriterion, "BRST-1");
});

test("criterion 1 rejects positive cultures from unlisted breast specimen sources", () => {
  for (const id of ["brst-superficial-swab-organism", "brst-nonaseptic-drain-organism", "brst-blood-organism"])
    assert.equal(evaluate({ [id]: "met" }).siteDefinitionMet, false, id);
});

test("gross anatomic and histopathologic examination remain separate criterion 2 alternatives", () => {
  assert.equal(evaluate({ "brst-gross-anatomic-evidence": "met" }).metCriterion, "BRST-2");
  assert.equal(evaluate({ "brst-histopathologic-evidence": "met" }).metCriterion, "BRST-2");
  assert.equal(evaluate({ "brst-abscess-label-only": "met" }).siteDefinitionMet, false);
});

test("criterion 3 requires fever, local breast inflammation, and timely therapy", () => {
  const complete = { "brst-fever": "met", "brst-local-inflammation": "met", "brst-timely-antimicrobial-therapy": "met" };
  assert.equal(evaluate(complete).metCriterion, "BRST-3");
  for (const id of Object.keys(complete)) assert.equal(evaluate({ ...complete, [id]: "notMet" }).siteDefinitionMet, false, id);
  assert.equal(evaluate({ ...complete, "brst-timely-antimicrobial-therapy": "unknown" }).siteDefinitionMet, false);
});

test("mastitis, breast abscess, diagnosis, or therapy alone cannot qualify", () => {
  for (const id of ["brst-mastitis", "brst-breast-abscess", "brst-provider-diagnosis", "brst-timely-antimicrobial-therapy"])
    assert.equal(evaluate({ [id]: "met" }).siteDefinitionMet, false, id);
});

test("BRST branches cannot be combined from incomplete evidence", () => {
  assert.deepEqual(brstDefinition.criteria.map(({ id }) => id), ["BRST-1", "BRST-2", "BRST-3"]);
  assert.equal(evaluate({ "brst-fever": "met", "brst-local-inflammation": "met", "brst-superficial-swab-organism": "met" }).siteDefinitionMet, false);
});

test("the manual states reporting boundaries rather than a BRST site-definition exclusion", () => {
  assert.deepEqual(brstDefinition.exclusions, []);
  assert.deepEqual(brstDefinition.reportingInstructions.map(({ id }) => id), ["BRST-report-superficial-ssi", "BRST-report-deep-ssi", "BRST-report-organ-space"]);
  assert.match(brstDefinition.reportingInstructions[2].text, /Criterion 3 is not eligible as an Organ\/Space SSI/);
});

test("meeting BRST unlocks but does not automatically establish Secondary BSI attribution", () => {
  const evidence = { "brst-gross-anatomic-evidence": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
  assert.equal(brstDefinition.secondaryBsi.lockedUntilSiteDefinitionMet, true);
});

test("BRST source metadata covers criteria, reporting, and attribution", () => {
  assert.deepEqual({ document: brstDefinition.source.document, printedPage: brstDefinition.source.printedPage, pdfPage: brstDefinition.source.pdfPage, sectionHeading: brstDefinition.source.sectionHeading, sourceDataId: brstDefinition.source.sourceDataId },
    { document: "Secondary BSI Chapter.pdf", printedPage: "17-24–17-25", pdfPage: "25–26", sectionHeading: "BRST — Breast infection or mastitis", sourceDataId: "BRST" });
  brstDefinition.criteria.forEach((criterion) => assert.equal(criterion.source.sourceDataId, "BRST"));
  assert.equal(brstDefinition.reportingInstructions[0].source.sourceDataId, "BRST.reporting-instructions");
  assert.equal(brstDefinition.secondaryBsi.source.sourceDataId, "BRST.secondary-bsi");
});

test("registry implements BRST exactly once under the unchanged SST category", () => {
  assert.equal(secondarySiteDefinitions.BRST, brstDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "BRST").length, 1);
  assert.deepEqual(Object.keys(secondarySiteDefinitions).filter((code) => ["BRST", "BURN", "CIRC", "DECU", "SKIN", "ST", "UMB"].includes(code)), ["BRST", "BURN", "CIRC", "DECU", "SKIN", "ST", "UMB"]);
});

test("the canonical compact renderer shows incomplete and met BRST states", () => {
  const incompleteEvidence = { "brst-fever": "met", "brst-local-inflammation": "met" };
  const incomplete = renderCompactMenEvidence({ definition: brstDefinition, evaluation: evaluate(incompleteEvidence), patientAge: "adult", evidence: incompleteEvidence });
  assert.match(incomplete, /🟡 BRST Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  const metEvidence = { "brst-gross-anatomic-evidence": "met" };
  const met = renderCompactMenEvidence({ definition: brstDefinition, evaluation: evaluate(metEvidence), patientAge: "adult", evidence: metEvidence });
  assert.match(met, /🟢 BRST Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("BRST-specific"), false);
});
