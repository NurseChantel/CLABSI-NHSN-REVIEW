import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, implementedSecondaryPathways, orepDefinition, secondarySiteDefinitions } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "OREP", evidence, ...extra });
const site = "orep-site-ovaries";

test("each OREP criterion qualifies independently at an eligible anatomical site", () => {
  assert.equal(evaluate({ [site]: "met", "orep-site-specimen-organism": "met" }).metCriterion, "OREP-1");
  assert.equal(evaluate({ [site]: "met", "orep-gross-anatomic-evidence": "met" }).metCriterion, "OREP-2");
  assert.equal(evaluate({ [site]: "met", "orep-histopathologic-evidence": "met" }).metCriterion, "OREP-2");
  assert.equal(evaluate({ [site]: "met", "orep-suspected-infection": "met", "orep-fever": "met", "orep-dysuria": "met", "orep-blood-organism": "met" }).metCriterion, "OREP-3");
});

test("all source-listed OREP anatomical alternatives can anchor a complete branch", () => {
  const siteIds = ["orep-site-deep-pelvic", "orep-site-epididymis", "orep-site-testes", "orep-site-prostate", "orep-site-vagina", "orep-site-ovaries", "orep-site-uterus", "orep-site-chorioamnionitis"];
  for (const siteId of siteIds) assert.equal(evaluate({ [siteId]: "met", "orep-site-specimen-organism": "met" }).metCriterion, "OREP-1", siteId);
});

test("OREP requires an eligible site and preserves each criterion's required AND elements", () => {
  assert.equal(evaluate({ "orep-site-specimen-organism": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ [site]: "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ [site]: "met", "orep-suspected-infection": "met", "orep-fever": "met", "orep-dysuria": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ [site]: "met", "orep-fever": "met", "orep-dysuria": "met", "orep-blood-organism": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ [site]: "met", "orep-suspected-infection": "met", "orep-fever": "met", "orep-blood-organism": "met" }).siteDefinitionMet, false);
});

test("OREP 3 accepts each valid support OR alternative", () => {
  const base = { [site]: "met", "orep-suspected-infection": "met", "orep-fever": "met", "orep-pain-tenderness": "met" };
  assert.equal(evaluate({ ...base, "orep-blood-organism": "met" }).metCriterion, "OREP-3");
  assert.equal(evaluate({ ...base, "orep-antimicrobial-within-two-days": "met" }).metCriterion, "OREP-3");
});

test("OREP evidence cannot mix incomplete branches", () => {
  assert.equal(evaluate({ [site]: "met", "orep-site-specimen-organism": "notMet", "orep-suspected-infection": "met", "orep-fever": "met", "orep-gross-anatomic-evidence": "notMet" }).siteDefinitionMet, false);
});

test("another recognized cause removes only the affected asterisked OREP findings", () => {
  const evidence = { [site]: "met", "orep-suspected-infection": "met", "orep-nausea": "met", "orep-dysuria": "met", "orep-blood-organism": "met", "orep-other-recognized-cause": "met" };
  assert.equal(evaluate(evidence).siteDefinitionMet, false);
  assert.equal(evaluate({ ...evidence, "orep-fever": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...evidence, "orep-other-recognized-cause": "notMet" }).metCriterion, "OREP-3");
});

test("vaginitis and separately defined REPR sites hard-block OREP and retain routing metadata", () => {
  const qualifying = { [site]: "met", "orep-site-specimen-organism": "met" };
  const routes = { "orep-vaginitis": "Not OREP", "orep-endometritis": "EMET", "orep-vaginal-cuff-infection": "VCUF", "orep-episiotomy-infection": "EPIS" };
  for (const [id, routeTo] of Object.entries(routes)) {
    const result = evaluate({ ...qualifying, [id]: "met" });
    assert.equal(result.status, "exclusionApplies", id);
    assert.equal(result.siteDefinitionMet, false, id);
    assert.equal(orepDefinition.exclusions.find((exclusion) => exclusion.id === id).routeTo, routeTo);
  }
});

test("urinary coexistence is a reporting instruction, not an OREP exclusion", () => {
  assert.match(orepDefinition.reportingInstructions.find(({ id }) => id === "OREP-report-uti").text, /report both events/i);
  assert.equal(evaluate({ [site]: "met", "orep-site-specimen-organism": "met", "uti-criterion-met": "met" }).siteDefinitionMet, true);
});

test("meeting OREP unlocks but never automatically establishes Secondary BSI attribution", () => {
  const evidence = { [site]: "met", "orep-site-specimen-organism": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("OREP source metadata covers criteria, alternate sites, instructions, and attribution", () => {
  assert.deepEqual({ document: orepDefinition.source.document, printedPage: orepDefinition.source.printedPage, pdfPage: orepDefinition.source.pdfPage, sectionHeading: orepDefinition.source.sectionHeading }, {
    document: "Secondary BSI Chapter.pdf", printedPage: "17-23–17-24", pdfPage: "24–25", sectionHeading: "OREP — Pelvic tissue/space infection or other infection of the male or female reproductive tract"
  });
  assert.deepEqual(orepDefinition.criteria.map(({ id }) => id), ["OREP-1", "OREP-2", "OREP-3"]);
  assert.ok(orepDefinition.criteria.every(({ source }) => source.sourceDataId === "OREP"));
  assert.ok(orepDefinition.reportingInstructions.every(({ source }) => source.sourceDataId === "OREP.reporting-instructions"));
  assert.equal(orepDefinition.secondaryBsi.source.sourceDataId, "OREP.secondary-bsi");
});

test("OREP and every existing pathway render with the unchanged compact renderer", () => {
  const evidence = { [site]: "met", "orep-site-specimen-organism": "met" };
  const html = renderCompactMenEvidence({ definition: orepDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence }).replaceAll("MEN Site Definition", "OREP Site Definition");
  assert.match(html, /🟢 OREP Site Definition Met/);
  assert.match(html, /data-men-renderer="compact-v3"/);
  assert.ok(implementedSecondaryPathways.includes("OREP"));
  for (const code of implementedSecondaryPathways) {
    assert.equal(secondarySiteDefinitions[code].implementationStatus, "validated");
    assert.doesNotThrow(() => renderCompactMenEvidence({ definition: secondarySiteDefinitions[code], evaluation: evaluateSecondarySite({ siteCode: code }), patientAge: "adult", evidence: {} }));
  }
  for (const file of ["app.js", "secondary-evidence-ui.js", "style.css", "index.html"]) assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("<<<<<<<"), false);
});
