import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { earDefinition } from "./secondary/definitions/ear.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "EAR", evidence, ...extra });
const mastoidFindings = ["ear-mastoid-fever", "ear-mastoid-pain-tenderness"];

test("each independent EAR microbiology or diagnosis criterion qualifies only its NHSN subsite branch", () => {
  const branches = [
    ["ear-externa-drainage-organism", "EAR-1"],
    ["ear-media-fluid-organism", "EAR-3"],
    ["ear-interna-fluid-organism", "EAR-5"],
    ["ear-interna-diagnosis", "EAR-6"],
    ["ear-mastoid-fluid-tissue-organism", "EAR-7"]
  ];
  for (const [id, expected] of branches) assert.equal(evaluate({ [id]: "met" }).metCriterion, expected, id);
});

test("EAR-2 requires both an otitis externa clinical OR alternative and the drainage Gram stain", () => {
  for (const finding of ["ear-externa-fever", "ear-externa-pain", "ear-externa-erythema"])
    assert.equal(evaluate({ [finding]: "met", "ear-externa-drainage-gram-stain": "met" }).metCriterion, "EAR-2");
  assert.equal(evaluate({ "ear-externa-fever": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ear-externa-drainage-gram-stain": "met" }).siteDefinitionMet, false);
});

test("EAR-4 requires any two distinct otitis media findings and preserves its OR alternatives", () => {
  const findings = ["ear-media-fever", "ear-media-pain", "ear-media-inflammation", "ear-media-eardrum-retraction", "ear-media-eardrum-decreased-mobility", "ear-media-fluid-behind-eardrum"];
  for (let index = 1; index < findings.length; index++)
    assert.equal(evaluate({ [findings[0]]: "met", [findings[index]]: "met" }).metCriterion, "EAR-4");
  for (const finding of findings) assert.equal(evaluate({ [finding]: "met" }).siteDefinitionMet, false);
});

test("mastoiditis criterion 8 preserves Gram-stain, definitive-imaging, and equivocal-imaging branches", () => {
  assert.equal(evaluate({ [mastoidFindings[0]]: "met", [mastoidFindings[1]]: "met", "ear-mastoid-gram-stain": "met" }).metCriterion, "EAR-8a");
  assert.equal(evaluate({ [mastoidFindings[0]]: "met", [mastoidFindings[1]]: "met", "ear-mastoid-definitive-imaging": "met" }).metCriterion, "EAR-8b");
  const equivocal = { [mastoidFindings[0]]: "met", [mastoidFindings[1]]: "met", "ear-mastoid-equivocal-imaging": "met" };
  assert.equal(evaluate(equivocal).siteDefinitionMet, false);
  assert.equal(evaluate({ ...equivocal, "ear-mastoid-equivocal-imaging-treatment": "met" }).metCriterion, "EAR-8c");
  assert.equal(evaluate({ "ear-mastoid-fever": "met", "ear-mastoid-gram-stain": "met" }).siteDefinitionMet, false);
});

test("another recognized cause prevents asterisked EAR findings from counting", () => {
  const excluded = { "ear-media-pain": "met", "ear-media-inflammation": "met", "ear-other-recognized-cause": "met" };
  assert.equal(evaluate(excluded).status, "exclusionApplies");
  assert.equal(evaluate(excluded).siteDefinitionMet, false);
  assert.equal(evaluate({ "ear-media-fever": "met", "ear-media-pain": "met", "ear-other-recognized-cause": "met" }).siteDefinitionMet, false);
});

test("EAR branches do not combine evidence across subsites", () => {
  for (const evidence of [
    { "ear-externa-fever": "met", "ear-mastoid-gram-stain": "met" },
    { "ear-media-pain": "met", "ear-externa-drainage-gram-stain": "met" },
    { "ear-mastoid-fever": "met", "ear-media-inflammation": "met", "ear-mastoid-definitive-imaging": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("CONJ, EYE, unchecked, and unsupported generic ear evidence cannot qualify EAR", () => {
  for (const evidence of [
    { "conj-pain": "met", "conj-purulent-exudate": "met" },
    { "eye-site-organism": "met", "eye-physician-diagnosis": "met" },
    { "ear-externa-drainage-organism": "notMet" },
    { "ear-externa-pain": "met", "ear-externa-drainage-gram-stain": "" },
    { "ear-pain-alone": "met" }, { "ear-otorrhea-alone": "met" }, { "ear-generic-positive-culture": "met" }, { "ear-generic-physician-diagnosis": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("meeting EAR unlocks but does not automatically establish Secondary BSI attribution", () => {
  const complete = { "ear-media-fluid-organism": "met" };
  assert.equal(evaluate(complete).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("EAR preserves complete criteria and Secondary BSI source metadata", () => {
  assert.deepEqual({ document: earDefinition.source.document, printedPage: earDefinition.source.printedPage, pdfPage: earDefinition.source.pdfPage, sectionHeading: earDefinition.source.sectionHeading, sourceDataId: earDefinition.source.sourceDataId },
    { document: "Secondary BSI Chapter.pdf", printedPage: "17-15–17-16", pdfPage: "15–16", sectionHeading: "EAR — Ear, mastoid infection", sourceDataId: "EAR" });
  assert.deepEqual(earDefinition.criteria.map(({ id }) => id), ["EAR-1", "EAR-2", "EAR-3", "EAR-4", "EAR-5", "EAR-6", "EAR-7", "EAR-8a", "EAR-8b", "EAR-8c"]);
  assert.ok(earDefinition.criteria.flatMap((criterion) => [...criterion.allOf, ...criterion.groups.flatMap(({ anyOf }) => anyOf)]).every(({ source }) => source === earDefinition.source));
  assert.equal(earDefinition.secondaryBsi.source.sourceDataId, "EAR.secondary-bsi");
});

test("registry contains EAR exactly once and preserves the EENT order", () => {
  assert.equal(secondarySiteDefinitions.EAR, earDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "EAR").length, 1);
  assert.deepEqual(Object.keys(secondarySiteDefinitions).filter((code) => ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"].includes(code)), ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"]);
});

test("canonical compact renderer displays incomplete and met EAR states", () => {
  const incomplete = renderCompactMenEvidence({ definition: earDefinition, evaluation: evaluate({}), patientAge: "adult", evidence: {} });
  assert.match(incomplete, /🟡 EAR Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  const evidence = { "ear-interna-diagnosis": "met" };
  const met = renderCompactMenEvidence({ definition: earDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence });
  assert.match(met, /🟢 EAR Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("EAR-specific"), false);
});
