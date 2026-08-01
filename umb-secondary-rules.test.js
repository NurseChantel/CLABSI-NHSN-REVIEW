import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { umbDefinition } from "./secondary/definitions/umb.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const age = { "umb-age-30-days-or-younger": "met" };
const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "UMB", evidence, ...extra });

test("every separate UMB qualifying branch is represented", () => {
  assert.equal(evaluate({ ...age, "umb-erythema": "met", "umb-drainage-or-aspirate-organism": "met" }).metCriterion, "UMB-1a");
  assert.equal(evaluate({ ...age, "umb-drainage": "met", "umb-blood-organism": "met" }).metCriterion, "UMB-1b");
  assert.equal(evaluate({ ...age, "umb-erythema": "met", "umb-purulence": "met" }).metCriterion, "UMB-2");
});

test("UMB 1a and 1b require age, a clinical alternative, and their own microbiology", () => {
  for (const evidence of [
    { "umb-erythema": "met", "umb-drainage-or-aspirate-organism": "met" },
    { ...age, "umb-drainage-or-aspirate-organism": "met" },
    { ...age, "umb-drainage": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
  assert.equal(evaluate({ ...age, "umb-erythema": "met", "umb-drainage-or-aspirate-organism": "met" }).siteDefinitionMet, true);
  assert.equal(evaluate({ ...age, "umb-drainage": "met", "umb-drainage-or-aspirate-organism": "met" }).siteDefinitionMet, true);
});

test("UMB 2 preserves its erythema AND purulence relationship", () => {
  assert.equal(evaluate({ ...age, "umb-erythema": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...age, "umb-purulence": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...age, "umb-drainage": "met", "umb-purulence": "met" }).siteDefinitionMet, false);
});

test("unsupported evidence and evidence from neighboring sites cannot qualify UMB", () => {
  for (const id of ["umb-provider-diagnosis", "umb-pathology", "umb-imaging", "skin-purulent-drainage", "st-site-organism", "circ-purulent-drainage"])
    assert.equal(evaluate({ ...age, [id]: "met" }).siteDefinitionMet, false, id);
});

test("the umbilical-catheter vessel boundary excludes an otherwise complete UMB case", () => {
  const complete = { ...age, "umb-erythema": "met", "umb-purulence": "met" };
  assert.equal(evaluate(complete).siteDefinitionMet, true);
  assert.equal(evaluate({ ...complete, "umb-umbilical-catheter-vessel-infection": "met" }).siteDefinitionMet, false);
});

test("unchecked, negative, and unknown evidence never count", () => {
  assert.equal(evaluate({}).siteDefinitionMet, false);
  assert.equal(evaluate({ ...age, "umb-erythema": "met", "umb-purulence": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...age, "umb-erythema": "met", "umb-purulence": "" }).siteDefinitionMet, false);
});

test("meeting UMB does not automatically establish Secondary BSI attribution", () => {
  const complete = { ...age, "umb-erythema": "met", "umb-drainage-or-aspirate-organism": "met" };
  assert.equal(evaluate(complete).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("UMB retains exact source metadata", () => {
  assert.deepEqual({ document: umbDefinition.source.document, printedPage: umbDefinition.source.printedPage, pdfPage: umbDefinition.source.pdfPage, sectionHeading: umbDefinition.source.sectionHeading, sourceDataId: umbDefinition.source.sourceDataId },
    { document: "Secondary BSI Chapter.pdf", printedPage: "17-27", pdfPage: 28, sectionHeading: "UMB — Omphalitis", sourceDataId: "UMB" });
  assert.equal(umbDefinition.reportingInstructions[0].source.sourceDataId, "UMB.reporting-instructions");
  assert.equal(umbDefinition.secondaryBsi.source.sourceDataId, "UMB.secondary-bsi");
});

test("registry contains UMB exactly once and leaves all SST registrations present", () => {
  assert.equal(secondarySiteDefinitions.UMB, umbDefinition);
  assert.equal(implementedSecondaryPathways.filter(code => code === "UMB").length, 1);
  assert.deepEqual(Object.keys(secondarySiteDefinitions).filter(code => ["BRST", "BURN", "CIRC", "DECU", "SKIN", "ST", "UMB"].includes(code)), ["BRST", "BURN", "CIRC", "DECU", "SKIN", "ST", "UMB"]);
});

test("the shared compact renderer shows exact incomplete and met UMB statuses", () => {
  const incomplete = renderCompactMenEvidence({ definition: umbDefinition, evaluation: evaluate(age), patientAge: "infant", evidence: age });
  assert.match(incomplete, /🟡 UMB Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  const complete = { ...age, "umb-erythema": "met", "umb-purulence": "met" };
  const met = renderCompactMenEvidence({ definition: umbDefinition, evaluation: evaluate(complete), patientAge: "infant", evidence: complete });
  assert.match(met, /🟢 UMB Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("UMB-specific"), false);
});
