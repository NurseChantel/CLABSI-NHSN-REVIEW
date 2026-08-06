import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { cdiDefinition, evaluateSecondarySite, implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "CDI", evidence, ...extra });

test("each NHSN CDI branch qualifies independently", () => {
  assert.equal(evaluate({ "cdi-positive-toxin-producing-test": "met", "cdi-unformed-stool-specimen": "met" }).metCriterion, "CDI-1");
  assert.equal(evaluate({ "cdi-pseudomembranous-colitis-gross": "met" }).metCriterion, "CDI-2");
  assert.equal(evaluate({ "cdi-pseudomembranous-colitis-histopathology": "met" }).metCriterion, "CDI-2");
});

test("CDI 1 requires both a toxin-producing test and an unformed stool specimen", () => {
  assert.equal(evaluate({ "cdi-positive-toxin-producing-test": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "cdi-unformed-stool-specimen": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "cdi-positive-toxin-producing-test": "notMet", "cdi-unformed-stool-specimen": "met" }).siteDefinitionMet, false);
});

// Manual 17-18 lists exactly two CDI criteria. The Repeat Infection Timeframe appears
// under "Reporting Instructions" ("Report each new GI-CDI according to the Repeat
// Infection Timeframe (RIT) rule for HAIs"), not as an element of either criterion, so
// it must not gate qualification.
test("the RIT rule is carried as a reporting instruction, not a criterion element", () => {
  const criterion1 = { "cdi-positive-toxin-producing-test": "met", "cdi-unformed-stool-specimen": "met" };
  const criterion2 = { "cdi-pseudomembranous-colitis-gross": "met" };
  for (const evidence of [criterion1, criterion2]) assert.equal(evaluate(evidence).siteDefinitionMet, true);
  const elementIds = cdiDefinition.criteria.flatMap(criterion => [...criterion.allOf, ...(criterion.groups ?? []).flatMap(group => group.anyOf)]).map(item => item.id);
  assert.equal(elementIds.includes("cdi-new-event-rit-eligible"), false);
  assert.ok(cdiDefinition.reportingInstructions.some(instruction => /Repeat Infection Timeframe/.test(instruction.text)));
});

test("GE evidence cannot qualify or be combined into an incomplete CDI branch", () => {
  const geEvidence = { "ge-acute-diarrhea": "met", "ge-vomiting": "met", "ge-enteric-pathogen": "met" };
  assert.equal(evaluate(geEvidence).siteDefinitionMet, false);
  assert.equal(evaluate({ ...geEvidence, "cdi-positive-toxin-producing-test": "met" }).siteDefinitionMet, false);
});

test("meeting CDI never automatically establishes Secondary BSI attribution", () => {
  const evidence = { "cdi-positive-toxin-producing-test": "met", "cdi-unformed-stool-specimen": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("CDI source metadata covers criteria, instructions, timing, and attribution", () => {
  assert.deepEqual({ document: cdiDefinition.source.document, printedPage: cdiDefinition.source.printedPage, pdfPage: cdiDefinition.source.pdfPage, sectionHeading: cdiDefinition.source.sectionHeading }, {
    document: "Secondary BSI Chapter.pdf", printedPage: "17-18–17-19", pdfPage: "19–20", sectionHeading: "CDI — Clostridioides difficile Infection"
  });
  assert.deepEqual(cdiDefinition.criteria.map(({ id }) => id), ["CDI-1", "CDI-2"]);
  assert.ok(cdiDefinition.criteria.every(({ source }) => source.sourceDataId === "CDI"));
  assert.ok(cdiDefinition.reportingInstructions.every(({ source }) => source.sourceDataId === "CDI.reporting-instructions"));
  assert.equal(cdiDefinition.secondaryBsi.source.sourceDataId, "CDI.secondary-bsi");
});

test("CDI and all previously implemented pathways render through the unchanged compact renderer", () => {
  const evidence = { "cdi-positive-toxin-producing-test": "met", "cdi-unformed-stool-specimen": "met" };
  const html = renderCompactMenEvidence({ definition: cdiDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence }).replaceAll("MEN Site Definition", "CDI Site Definition");
  assert.match(html, /🟢 CDI Site Definition Met/);
  assert.match(html, /data-men-renderer="compact-v3"/);
  assert.ok(implementedSecondaryPathways.includes("CDI"));
  for (const code of implementedSecondaryPathways) {
    assert.equal(secondarySiteDefinitions[code].implementationStatus, "validated");
    assert.doesNotThrow(() => renderCompactMenEvidence({ definition: secondarySiteDefinitions[code], evaluation: evaluateSecondarySite({ siteCode: code }), patientAge: "adult", evidence: {} }));
  }
  for (const file of ["app.js", "secondary-evidence-ui.js", "style.css", "index.html"]) assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("<<<<<<<"), false);
});
