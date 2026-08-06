import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { circDefinition } from "./secondary/definitions/circ.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const age = { "circ-age-30-days-or-younger": "met" };
const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "CIRC", evidence, ...extra });

test("each complete CIRC branch qualifies independently", () => {
  assert.equal(evaluate({ ...age, "circ-site-purulent-drainage": "met" }).metCriterion, "CIRC-1");
  assert.equal(evaluate({ ...age, "circ-site-erythema": "met", "circ-site-pathogen": "met" }).metCriterion, "CIRC-2");
  assert.equal(evaluate({ ...age, "circ-site-swelling": "met", "circ-site-common-commensal": "met", "circ-timely-antimicrobial-therapy": "met" }).metCriterion, "CIRC-3");
});

test("CIRC local findings are OR alternatives and every branch-specific AND element is required", () => {
  for (const id of ["circ-site-erythema", "circ-site-swelling", "circ-site-tenderness"])
    assert.equal(evaluate({ ...age, [id]: "met", "circ-site-pathogen": "met" }).metCriterion, "CIRC-2");
  assert.equal(evaluate({ "circ-site-purulent-drainage": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...age, "circ-site-erythema": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...age, "circ-site-pathogen": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...age, "circ-site-tenderness": "met", "circ-site-common-commensal": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...age, "circ-site-tenderness": "met", "circ-timely-antimicrobial-therapy": "met" }).siteDefinitionMet, false);
});

test("CIRC branches remain separate and unsupported evidence cannot be substituted", () => {
  assert.equal(evaluate({ ...age, "circ-site-common-commensal": "met", "circ-site-erythema": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...age, "circ-site-pathogen": "met", "circ-timely-antimicrobial-therapy": "met" }).siteDefinitionMet, false);
  for (const id of ["circ-provider-diagnosis", "circ-operative-finding", "circ-pathology-finding", "circ-nonpurulent-drainage"])
    assert.equal(evaluate({ ...age, [id]: "met" }).siteDefinitionMet, false, id);
});

test("another recognized cause invalidates only NHSN-asterisked findings", () => {
  const exclusion = { "circ-other-recognized-cause": "met" };
  assert.equal(evaluate({ ...age, "circ-site-erythema": "met", "circ-site-pathogen": "met", ...exclusion }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...age, "circ-site-purulent-drainage": "met", ...exclusion }).metCriterion, "CIRC-1");
});

test("UMB, SKIN, and ST evidence cannot qualify CIRC, and unchecked evidence does not count", () => {
  for (const evidence of [
    { "umb-age-30-days-or-younger": "met", "umb-erythema": "met", "umb-purulence": "met" },
    { "skin-purulent-drainage": "met" },
    { "st-purulent-drainage": "met" },
    { ...age, "circ-site-purulent-drainage": "notMet" },
    { ...age, "circ-site-purulent-drainage": "" },
    {}
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("meeting CIRC unlocks but does not automatically establish Secondary BSI attribution", () => {
  // Table B1 (clabsi nhsn.pdf 4-34) admits CIRC criteria 2 or 3 for a secondary BSI.
  const evidence = { ...age, "circ-site-erythema": "met", "circ-site-pathogen": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("CIRC source metadata preserves criteria, routing, reporting, and attribution sources", () => {
  assert.deepEqual({ document: circDefinition.source.document, printedPage: circDefinition.source.printedPage, pdfPage: circDefinition.source.pdfPage, sectionHeading: circDefinition.source.sectionHeading, sourceDataId: circDefinition.source.sourceDataId },
    { document: "Secondary BSI Chapter.pdf", printedPage: "17-25", pdfPage: 26, sectionHeading: "CIRC — Newborn circumcision infection", sourceDataId: "CIRC" });
  assert.deepEqual(circDefinition.criteria.map(({ id }) => id), ["CIRC-1", "CIRC-2", "CIRC-3"]);
  assert.equal(circDefinition.reportingInstructions[0].source.printedPage, "17-27");
  assert.equal(circDefinition.reportingInstructions[1].source.printedPage, "17-29");
  assert.equal(circDefinition.secondaryBsi.source.sourceDataId, "CIRC.secondary-bsi");
});

test("registry contains CIRC exactly once without disturbing SST ordering", () => {
  assert.equal(secondarySiteDefinitions.CIRC, circDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "CIRC").length, 1);
  assert.deepEqual(Object.keys(secondarySiteDefinitions).filter((code) => ["BRST", "BURN", "CIRC", "DECU", "SKIN", "ST", "UMB"].includes(code)), ["BRST", "BURN", "CIRC", "DECU", "SKIN", "ST", "UMB"]);
});

test("canonical compact renderer renders incomplete and met CIRC states", () => {
  const incomplete = renderCompactMenEvidence({ definition: circDefinition, evaluation: evaluate(age), patientAge: "infant", evidence: age });
  assert.match(incomplete, /🟡 CIRC Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  const evidence = { ...age, "circ-site-purulent-drainage": "met" };
  const met = renderCompactMenEvidence({ definition: circDefinition, evaluation: evaluate(evidence), patientAge: "infant", evidence });
  assert.match(met, /🟢 CIRC Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("CIRC-specific"), false);
});
