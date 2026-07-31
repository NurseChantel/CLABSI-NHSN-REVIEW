import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { emetDefinition, evaluateSecondarySite, secondarySiteDefinitions } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "EMET", evidence, ...extra });

test("each EMET criterion qualifies independently", () => {
  assert.equal(evaluate({ "emet-endometrial-organism": "met" }).metCriterion, "EMET-1");
  assert.equal(evaluate({ "emet-suspected": "met", "emet-fever": "met", "emet-purulent-drainage": "met" }).metCriterion, "EMET-2");
});

test("EMET 2 requires suspected endometritis and two findings", () => {
  assert.equal(evaluate({ "emet-fever": "met", "emet-purulent-drainage": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "emet-suspected": "met", "emet-fever": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "emet-suspected": "met", "emet-fever": "met", "emet-purulent-drainage": "notMet" }).siteDefinitionMet, false);
});

test("each pair of EMET 2 OR alternatives works independently", () => {
  const pairs = [["emet-fever", "emet-pain-tenderness"], ["emet-fever", "emet-purulent-drainage"], ["emet-pain-tenderness", "emet-purulent-drainage"]];
  for (const pair of pairs) assert.equal(evaluate({ "emet-suspected": "met", [pair[0]]: "met", [pair[1]]: "met" }).metCriterion, "EMET-2");
});

test("evidence cannot be combined across incompatible EMET criteria", () => {
  assert.equal(evaluate({ "emet-endometrial-organism": "notMet", "emet-suspected": "met", "emet-fever": "met" }).siteDefinitionMet, false);
});

test("the asterisked pain or tenderness finding is excluded by another recognized cause", () => {
  const result = evaluate({ "emet-suspected": "met", "emet-pain-tenderness": "met", "emet-purulent-drainage": "met", "emet-other-recognized-cause": "met" });
  assert.equal(result.siteDefinitionMet, false);
});

test("unchecked EMET evidence does not count and status reports only remaining branch requirements", () => {
  const result = evaluate({ "emet-suspected": "met", "emet-fever": "met" });
  assert.equal(result.status, "siteDefinitionIncomplete");
  assert.equal(result.siteDefinitionMet, false);
  assert.deepEqual(result.branches.find(({ id }) => id === "EMET-2").missing, ["At least two qualifying signs or symptoms: 2 required; current qualifying groups do not meet the minimum"]);
});

test("meeting EMET unlocks but does not establish Secondary BSI attribution", () => {
  const evidence = { "emet-endometrial-organism": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("EMET source metadata is attached to criteria, atoms, instructions, and attribution", () => {
  assert.equal(emetDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(emetDefinition.source.printedPage, "17-23");
  assert.equal(emetDefinition.source.pdfPage, 24);
  assert.deepEqual(emetDefinition.criteria.map(({ id }) => id), ["EMET-1", "EMET-2"]);
  for (const criterion of emetDefinition.criteria) {
    assert.equal(criterion.source.sourceDataId, "EMET");
    const atoms = [...criterion.allOf, ...(criterion.groups || []).flatMap(({ anyOf }) => anyOf)];
    assert.ok(atoms.every((atom) => atom.source.sourceDataId === "EMET"));
  }
  assert.ok(emetDefinition.reportingInstructions.every(({ source }) => source.sourceDataId === "EMET.reporting-instructions"));
  assert.equal(emetDefinition.secondaryBsi.source.sourceDataId, "EMET.secondary-bsi");
});

test("EMET and every previously implemented pathway use the unchanged compact renderer", () => {
  const html = renderCompactMenEvidence({ definition: emetDefinition, evaluation: evaluate({ "emet-endometrial-organism": "met" }), patientAge: "adult", evidence: { "emet-endometrial-organism": "met" } }).replaceAll("MEN Site Definition", "EMET Site Definition");
  assert.match(html, /🟢 EMET Site Definition Met/);
  assert.match(html, /data-men-renderer="compact-v3"/);
  for (const code of ["BONE", "CARD", "DISC", "ENDO", "IC", "JNT", "MED", "MEN", "PJI", "SA", "USI", "VASC"]) {
    assert.equal(secondarySiteDefinitions[code].implementationStatus, "validated");
    assert.doesNotThrow(() => renderCompactMenEvidence({ definition: secondarySiteDefinitions[code], evaluation: evaluateSecondarySite({ siteCode: code }), patientAge: "adult", evidence: {} }));
  }
  for (const file of ["app.js", "secondary-evidence-ui.js", "style.css", "index.html"]) assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("<<<<<<<"), false);
});
