import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, implementedSecondaryPathways, secondarySiteDefinitions, vcufDefinition } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "VCUF", evidence, ...extra });

test("each VCUF qualifying criterion independently meets the site definition", () => {
  assert.equal(evaluate({ "vcuf-purulent-drainage": "met" }).metCriterion, "VCUF-1");
  assert.equal(evaluate({ "vcuf-abscess-or-infection-evidence": "met" }).metCriterion, "VCUF-2");
  assert.equal(evaluate({ "vcuf-cuff-fluid-tissue-organism": "met" }).metCriterion, "VCUF-3");
});

test("missing and explicitly unmet VCUF elements prevent qualification and report actual remaining elements", () => {
  assert.equal(evaluate({}).siteDefinitionMet, false);
  const result = evaluate({ "vcuf-purulent-drainage": "notMet" });
  assert.equal(result.status, "siteDefinitionIncomplete");
  assert.deepEqual(result.branches, [
    { id: "VCUF-1", missing: ["Purulent drainage from the vaginal cuff: not met"] },
    { id: "VCUF-2", missing: ["Abscess or other evidence of infection at the vaginal cuff on gross anatomic examination or invasive procedure: unknown or not documented"] },
    { id: "VCUF-3", missing: ["Organism(s) identified from fluid or tissue from the vaginal cuff by an eligible culture or non-culture based microbiologic testing method performed for clinical diagnosis or treatment (not ASC/AST): unknown or not documented"] }
  ]);
});

test("hysterectomy and 30-day surveillance timing are SSI reporting instructions, not VCUF qualifiers", () => {
  assert.equal(vcufDefinition.criteria.flatMap(({ allOf }) => allOf).some(({ id }) => /hysterectomy|30-day/.test(id)), false);
  assert.match(vcufDefinition.reportingInstructions[0].text, /within the 30-day surveillance period following a hysterectomy procedure/i);
  assert.equal(evaluate({ "vcuf-purulent-drainage": "met" }).siteDefinitionMet, true);
});

test("VCUF has no source-defined exclusion and retains its separate-site reporting boundary", () => {
  assert.deepEqual(vcufDefinition.exclusions, []);
  assert.match(secondarySiteDefinitions.OREP.reportingInstructions.find(({ id }) => id === "OREP-report-vcuf").text, /VCUF/);
});

test("EMET and OREP evidence cannot improperly qualify VCUF", () => {
  assert.equal(evaluate({ "emet-endometrial-organism": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "orep-site-deep-pelvic": "met", "orep-site-specimen-organism": "met" }).siteDefinitionMet, false);
});

test("meeting VCUF never automatically establishes Secondary BSI attribution", () => {
  const evidence = { "vcuf-cuff-fluid-tissue-organism": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("VCUF source metadata identifies criteria, reporting, and Secondary BSI sources", () => {
  assert.deepEqual(vcufDefinition.source, {
    document: "Secondary BSI Chapter.pdf", chapter: "Chapter 17 — Surveillance Definitions for Specific Types of Infections", printedPage: "17-24", pdfPage: 25,
    sectionHeading: "VCUF — Vaginal cuff infection", sourceDataId: "VCUF"
  });
  assert.deepEqual(vcufDefinition.criteria.map(({ id }) => id), ["VCUF-1", "VCUF-2", "VCUF-3"]);
  assert.ok(vcufDefinition.criteria.every(({ source, allOf }) => source.sourceDataId === "VCUF" && allOf.every((atom) => atom.source.sourceDataId === "VCUF")));
  assert.equal(vcufDefinition.reportingInstructions[0].source.sourceDataId, "VCUF.reporting-instruction");
  assert.equal(vcufDefinition.secondaryBsi.source.sourceDataId, "VCUF.secondary-bsi");
});

test("VCUF and every existing pathway render with the unchanged compact renderer", () => {
  const evidence = { "vcuf-purulent-drainage": "met" };
  const html = renderCompactMenEvidence({ definition: vcufDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence }).replaceAll("MEN Site Definition", "VCUF Site Definition");
  assert.match(html, /🟢 VCUF Site Definition Met/);
  assert.match(html, /data-men-renderer="compact-v3"/);
  assert.ok(implementedSecondaryPathways.includes("VCUF"));
  for (const code of implementedSecondaryPathways) {
    assert.equal(secondarySiteDefinitions[code].implementationStatus, "validated");
    assert.doesNotThrow(() => renderCompactMenEvidence({ definition: secondarySiteDefinitions[code], evaluation: evaluateSecondarySite({ siteCode: code }), patientAge: "adult", evidence: {} }));
  }
  for (const file of ["app.js", "secondary-evidence-ui.js", "style.css", "index.html"]) assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("<<<<<<<"), false);
});
