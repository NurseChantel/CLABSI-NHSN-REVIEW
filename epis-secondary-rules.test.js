import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { episDefinition, evaluateSecondarySite, secondarySiteDefinitions } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "EPIS", evidence, ...extra });

test("each EPIS criterion qualifies independently", () => {
  assert.equal(evaluate({ "epis-postpartum-vaginal-delivery": "met", "epis-purulent-drainage": "met" }).metCriterion, "EPIS-1");
  assert.equal(evaluate({ "epis-postpartum-vaginal-delivery": "met", "epis-abscess": "met" }).metCriterion, "EPIS-2");
});

test("EPIS requires postpartum vaginal delivery in both branches", () => {
  assert.equal(evaluate({ "epis-purulent-drainage": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "epis-abscess": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "epis-postpartum-vaginal-delivery": "notMet", "epis-abscess": "met" }).siteDefinitionMet, false);
});

test("EPIS applies correct OR behavior without mixing branches", () => {
  assert.equal(evaluate({ "epis-postpartum-vaginal-delivery": "met", "epis-purulent-drainage": "met", "epis-abscess": "notMet" }).metCriterion, "EPIS-1");
  assert.equal(evaluate({ "epis-postpartum-vaginal-delivery": "met", "epis-purulent-drainage": "notMet", "epis-abscess": "met" }).metCriterion, "EPIS-2");
  assert.equal(evaluate({ "epis-postpartum-vaginal-delivery": "met" }).siteDefinitionMet, false);
});

test("EPIS has no source-defined exclusions and does not accept unrelated evidence", () => {
  assert.deepEqual(episDefinition.exclusions, []);
  assert.equal(evaluate({ "emet-endometrial-organism": "met", "epis-postpartum-vaginal-delivery": "met" }).siteDefinitionMet, false);
});

test("incomplete EPIS reports only each branch's remaining requirements", () => {
  const result = evaluate({ "epis-postpartum-vaginal-delivery": "met" });
  assert.equal(result.status, "siteDefinitionIncomplete");
  assert.deepEqual(result.branches, [
    { id: "EPIS-1", missing: ["Purulent drainage from the episiotomy site: unknown or not documented"] },
    { id: "EPIS-2", missing: ["Episiotomy abscess: unknown or not documented"] }
  ]);
});

test("meeting EPIS unlocks but never automatically establishes Secondary BSI attribution", () => {
  const evidence = { "epis-postpartum-vaginal-delivery": "met", "epis-abscess": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("EPIS has complete pathway-specific source metadata", () => {
  assert.equal(episDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(episDefinition.source.printedPage, "17-23");
  assert.equal(episDefinition.source.pdfPage, 24);
  assert.equal(episDefinition.source.sectionHeading, "EPIS — Episiotomy infection");
  assert.deepEqual(episDefinition.criteria.map(({ id }) => id), ["EPIS-1", "EPIS-2"]);
  assert.ok(episDefinition.criteria.every((criterion) => criterion.source.sourceDataId === "EPIS" && criterion.allOf.every((atom) => atom.source.sourceDataId === "EPIS")));
  assert.equal(episDefinition.secondaryBsi.source.sourceDataId, "EPIS.secondary-bsi");
});

test("EPIS and every existing pathway use the unchanged compact renderer", () => {
  const evidence = { "epis-postpartum-vaginal-delivery": "met", "epis-purulent-drainage": "met" };
  const html = renderCompactMenEvidence({ definition: episDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence }).replaceAll("MEN Site Definition", "EPIS Site Definition");
  assert.match(html, /🟢 EPIS Site Definition Met/);
  assert.match(html, /data-men-renderer="compact-v3"/);
  for (const code of ["BONE", "CARD", "DISC", "EMET", "ENDO", "IC", "JNT", "MED", "MEN", "PJI", "SA", "USI", "VASC"]) {
    assert.equal(secondarySiteDefinitions[code].implementationStatus, "validated");
    assert.doesNotThrow(() => renderCompactMenEvidence({ definition: secondarySiteDefinitions[code], evaluation: evaluateSecondarySite({ siteCode: code }), patientAge: "adult", evidence: {} }));
  }
  for (const file of ["app.js", "secondary-evidence-ui.js", "style.css", "index.html"]) assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("<<<<<<<"), false);
});
