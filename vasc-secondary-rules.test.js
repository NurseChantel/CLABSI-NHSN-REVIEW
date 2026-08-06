import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateSecondarySite, vascDefinition } from "./secondary-rules.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "VASC", evidence, ...extra });

test("VASC definitive microbiology, examination, and drainage pathways qualify independently", () => {
  assert.equal(evaluate({ "vasc-extracted-vessel-organism": "met" }).metCriterion, "VASC-1");
  assert.equal(evaluate({ "vasc-gross-histopathologic-evidence": "met" }).metCriterion, "VASC-2");
  assert.equal(evaluate({ "vasc-purulent-drainage": "met" }).metCriterion, "VASC-4");
});

test("VASC criterion 3 preserves finding AND semi-quantitative cannula culture", () => {
  assert.equal(evaluate({ "vasc-fever": "met", "vasc-cannula-tip-colonies": "met" }).metCriterion, "VASC-3");
  assert.equal(evaluate({ "vasc-fever": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "vasc-cannula-tip-colonies": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "vasc-pain": "met", "vasc-cannula-tip-colonies": "met", "vasc-other-recognized-cause": "met" }).siteDefinitionMet, false);
});

test("VASC criterion 5 explicitly enforces the one-year age boundary", () => {
  const complete = { "vasc-age-one-or-younger": "met", "vasc-hypothermia": "met", "vasc-cannula-tip-colonies": "met" };
  assert.equal(evaluate(complete).metCriterion, "VASC-5");
  assert.equal(evaluate({ ...complete, "vasc-age-one-or-younger": "notMet" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...complete, "vasc-age-one-or-younger": "unknown" }).siteDefinitionMet, false);
});

test("vascular access device plus blood organism is a hard VASC exclusion", () => {
  for (const qualifying of [
    { "vasc-extracted-vessel-organism": "met" },
    { "vasc-gross-histopathologic-evidence": "met" },
    { "vasc-fever": "met", "vasc-cannula-tip-colonies": "met" },
    { "vasc-purulent-drainage": "met" }
  ]) {
    const result = evaluate({ ...qualifying, "vasc-access-device-blood-organism": "met" });
    assert.equal(result.status, "exclusionApplies");
    assert.equal(result.siteDefinitionMet, false);
  }
  assert.equal(evaluate({ "vasc-purulent-drainage": "met", "vasc-access-device-blood-organism": "notMet" }).metCriterion, "VASC-4");
});

// clabsi nhsn.pdf 4-35: "Do not report secondary bloodstream infection for vascular (VASC)
// infections, ventilator-associated conditions (VAC), infection-related
// ventilator-associated complications (IVAC), or pneumonia 1 (PNU1)." Table B1 (4-34)
// admits VASC only as an organ/space SSI, criterion 1.
test("VASC never carries a secondary BSI, even with relationship and timing confirmed", () => {
  for (const evidence of [{ "vasc-purulent-drainage": "met" }, { "vasc-extracted-vessel-organism": "met" }]) {
    const result = evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" });
    assert.equal(result.siteDefinitionMet, true);
    assert.equal(result.secondaryAttributionMet, false);
    assert.equal(result.status, "secondaryAttributionNotPermitted");
    assert.match(result.message, /Do not report a secondary bloodstream infection for a vascular \(VASC\) infection/);
  }
  assert.equal(vascDefinition.secondaryBsi.reportable, false);
  assert.match(vascDefinition.secondaryBsi.exception.label, /organ\/space surgical site infection/);
});

test("VASC metadata traces criteria, reporting instructions, and attribution", () => {
  assert.equal(vascDefinition.source.document, "Secondary BSI Chapter.pdf");
  assert.equal(vascDefinition.source.printedPage, "17-14");
  assert.equal(vascDefinition.source.pdfPage, 15);
  assert.deepEqual(vascDefinition.criteria.map(({ id }) => id), ["VASC-1", "VASC-2", "VASC-3", "VASC-4", "VASC-5"]);
  assert.ok(vascDefinition.reportingInstructions.filter(({ id }) => id !== "VASC-report-no-secondary-bsi").every(({ source }) => source.sourceDataId === "VASC.reporting-instructions"));
  assert.equal(vascDefinition.reportingInstructions.find(({ id }) => id === "VASC-report-no-secondary-bsi").source.sourceDataId, "VASC.secondary-bsi-prohibited");
  assert.equal(vascDefinition.secondaryBsi.source.sourceDataId, "VASC.secondary-bsi-prohibited");
  assert.equal(vascDefinition.secondaryBsi.source.document, "clabsi nhsn.pdf");
});

test("VASC reuses the existing compact evidence renderer", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /definition\?\.implementationStatus === "validated"/);
  assert.match(app, /renderCompactMenEvidence\(\{ definition, evaluation/);
});
