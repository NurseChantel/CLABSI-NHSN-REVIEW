import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { eyeDefinition } from "./secondary/definitions/eye.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "EYE", evidence, ...extra });
const therapy = { "eye-antimicrobial-therapy-within-two-days": "met" };

test("each independent EYE criterion qualifies its NHSN branch", () => {
  assert.equal(evaluate({ "eye-chamber-vitreous-organism": "met" }).metCriterion, "EYE-1");
  assert.equal(evaluate({ ...therapy, "eye-pain": "met", "eye-visual-disturbance": "met" }).metCriterion, "EYE-2");
});

test("EYE-2 preserves every two-of-three clinical OR alternative with timely therapy", () => {
  const findings = ["eye-pain", "eye-visual-disturbance", "eye-hypopyon"];
  for (let first = 0; first < findings.length; first++) for (let second = first + 1; second < findings.length; second++)
    assert.equal(evaluate({ ...therapy, [findings[first]]: "met", [findings[second]]: "met" }).metCriterion, "EYE-2");
  for (const finding of findings) assert.equal(evaluate({ ...therapy, [finding]: "met" }).siteDefinitionMet, false);
});

test("EYE-2 requires both clinical findings and antimicrobial initiation within the NHSN limit", () => {
  const findings = { "eye-pain": "met", "eye-hypopyon": "met" };
  assert.equal(evaluate(findings).siteDefinitionMet, false);
  assert.equal(evaluate({ ...findings, "eye-antimicrobial-therapy-within-two-days": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...therapy, "eye-pain": "met" }).siteDefinitionMet, false);
});

test("another recognized cause prevents asterisked EYE findings from counting", () => {
  const excluded = { ...therapy, "eye-pain": "met", "eye-visual-disturbance": "met", "eye-other-recognized-cause": "met" };
  assert.equal(evaluate(excluded).status, "exclusionApplies");
  assert.equal(evaluate(excluded).siteDefinitionMet, false);
});

test("EYE branches remain separate and cannot combine partial evidence", () => {
  assert.equal(evaluate({ "eye-chamber-vitreous-organism": "notMet", ...therapy, "eye-pain": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "eye-chamber-vitreous-organism": "", "eye-visual-disturbance": "met", "eye-hypopyon": "notMet", ...therapy }).siteDefinitionMet, false);
});

test("CONJ and EAR evidence, unchecked evidence, and unsupported shortcuts cannot qualify EYE", () => {
  for (const evidence of [
    { "conj-pain": "met", "conj-purulent-exudate": "met" },
    { "ear-media-fluid-organism": "met" },
    { "eye-chamber-vitreous-organism": "notMet" },
    { "eye-chamber-vitreous-organism": "" },
    { "eye-pain": "met" },
    { "eye-drainage-alone": "met" },
    { "eye-generic-positive-culture": "met" },
    { "eye-physician-diagnosis": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("the explicit conjunctivitis boundary disqualifies EYE", () => {
  assert.equal(evaluate({ "eye-chamber-vitreous-organism": "met", "eye-conjunctivitis": "met" }).status, "exclusionApplies");
  assert.equal(evaluate({ "eye-chamber-vitreous-organism": "met", "eye-conjunctivitis": "met" }).siteDefinitionMet, false);
});

test("meeting EYE unlocks but does not automatically establish Secondary BSI attribution", () => {
  const complete = { "eye-chamber-vitreous-organism": "met" };
  assert.equal(evaluate(complete).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("EYE preserves complete criteria and source metadata", () => {
  assert.deepEqual({ document: eyeDefinition.source.document, printedPage: eyeDefinition.source.printedPage, pdfPage: eyeDefinition.source.pdfPage, sectionHeading: eyeDefinition.source.sectionHeading, sourceDataId: eyeDefinition.source.sourceDataId },
    { document: "Secondary BSI Chapter.pdf", printedPage: "17-16", pdfPage: 17, sectionHeading: "EYE — Eye infection, other than conjunctivitis", sourceDataId: "EYE" });
  assert.deepEqual(eyeDefinition.criteria.map(({ id }) => id), ["EYE-1", "EYE-2"]);
  assert.ok(eyeDefinition.criteria.flatMap((criterion) => [...criterion.allOf, ...criterion.groups.flatMap(({ anyOf }) => anyOf)]).every(({ source }) => source === eyeDefinition.source));
  assert.equal(eyeDefinition.secondaryBsi.source.sourceDataId, "EYE.secondary-bsi");
});

test("registry contains EYE exactly once and preserves EENT order", () => {
  assert.equal(secondarySiteDefinitions.EYE, eyeDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "EYE").length, 1);
  assert.deepEqual(Object.keys(secondarySiteDefinitions).filter((code) => ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"].includes(code)), ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"]);
});

test("canonical compact renderer displays incomplete and met EYE states", () => {
  const incomplete = renderCompactMenEvidence({ definition: eyeDefinition, evaluation: evaluate({}), patientAge: "adult", evidence: {} });
  assert.match(incomplete, /🟡 EYE Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  const evidence = { "eye-chamber-vitreous-organism": "met" };
  const met = renderCompactMenEvidence({ definition: eyeDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence });
  assert.match(met, /🟢 EYE Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("EYE-specific"), false);
});
