import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSecondarySite, implementedSecondaryPathways, necDefinition, secondarySiteDefinitions } from "./secondary-rules.js";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "NEC", patientAge: "infant", evidence, ...extra });
const clinical = { "nec-age-one-or-younger": "met", "nec-vomiting": "met" };

test("NEC criterion 1 accepts every listed diagnostic branch with a clinical sign", () => {
  const branches = [
    ["NEC-1a", { "nec-pneumatosis": "met", "nec-equivocal-imaging-treatment": "met" }],
    ["NEC-1b", { "nec-definitive-portal-venous-gas": "met" }],
    ["NEC-1c", { "nec-equivocal-portal-venous-gas": "met", "nec-equivocal-imaging-treatment": "met" }],
    ["NEC-1d", { "nec-definitive-pneumoperitoneum": "met" }],
    ["NEC-1e", { "nec-equivocal-pneumoperitoneum": "met", "nec-equivocal-imaging-treatment": "met" }]
  ];
  for (const [criterion, imaging] of branches) assert.equal(evaluate({ ...clinical, ...imaging }).metCriterion, criterion);
  for (const sign of ["nec-bilious-aspirate", "nec-vomiting", "nec-abdominal-distention", "nec-blood-in-stool"])
    assert.equal(evaluate({ "nec-age-one-or-younger": "met", [sign]: "met", "nec-definitive-portal-venous-gas": "met" }).siteDefinitionMet, true);
});

test("NEC criterion 2 accepts each surgical finding without clinical or imaging evidence", () => {
  assert.equal(evaluate({ "nec-age-one-or-younger": "met", "nec-extensive-bowel-necrosis": "met" }).metCriterion, "NEC-2");
  assert.equal(evaluate({ "nec-age-one-or-younger": "met", "nec-surgical-pneumatosis": "met" }).metCriterion, "NEC-2");
});

test("NEC enforces the exact age model boundary", () => {
  const complete = { ...clinical, "nec-definitive-portal-venous-gas": "met" };
  assert.equal(evaluateSecondarySite({ siteCode: "NEC", patientAge: "infant", evidence: complete }).siteDefinitionMet, true);
  assert.equal(evaluateSecondarySite({ siteCode: "NEC", patientAge: "adult", evidence: complete }).siteDefinitionMet, false);
  assert.equal(evaluateSecondarySite({ siteCode: "NEC", evidence: complete }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...complete, "nec-age-one-or-younger": "notMet" }).siteDefinitionMet, false);
});

test("missing required elements and unsupported combinations cannot qualify", () => {
  assert.equal(evaluate({ ...clinical }).siteDefinitionMet, false);
  assert.equal(evaluate({ "nec-age-one-or-younger": "met", "nec-definitive-portal-venous-gas": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...clinical, "nec-pneumatosis": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...clinical, "nec-equivocal-pneumoperitoneum": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...clinical, "nec-equivocal-imaging-treatment": "met" }).siteDefinitionMet, false);
});

test("NEC clinical exclusions apply only to their associated findings", () => {
  const imaging = { "nec-definitive-portal-venous-gas": "met" };
  assert.equal(evaluate({ "nec-age-one-or-younger": "met", "nec-bilious-aspirate": "met", "nec-transpyloric-bilious-aspirate": "met", ...imaging }).siteDefinitionMet, false);
  assert.equal(evaluate({ "nec-age-one-or-younger": "met", "nec-blood-in-stool": "met", "nec-rectal-fissure": "met", ...imaging }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...clinical, "nec-rectal-fissure": "met", ...imaging }).siteDefinitionMet, true);
});

test("NEC evidence is isolated from GIT and IAB placeholders", () => {
  const evidence = { ...clinical, "nec-definitive-portal-venous-gas": "met" };
  for (const siteCode of ["GIT", "IAB"]) assert.equal(evaluateSecondarySite({ siteCode, patientAge: "infant", evidence }).siteDefinitionMet, false);
});

test("meeting NEC does not automatically establish its special secondary BSI exception", () => {
  const evidence = { ...clinical, "nec-definitive-portal-venous-gas": "met" };
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "no" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "no", attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("NEC metadata preserves criteria, exception, timing, and source fidelity", () => {
  assert.equal(necDefinition.source.document, "clabsi nhsn.pdf");
  assert.equal(necDefinition.source.printedPage, "4-30–4-31");
  assert.equal(necDefinition.source.pdfPage, "31–32");
  assert.equal(necDefinition.patientAgeApplicability, "infant");
  assert.equal(necDefinition.secondaryBsi.exception, "NEC");
  assert.equal(necDefinition.notes[0].source.document, "Secondary BSI Chapter.pdf");
  assert.equal(necDefinition.notes[0].source.printedPage, "17-22");
  assert.equal(implementedSecondaryPathways.includes("NEC"), true);
});

test("the canonical compact evidence renderer renders NEC without pathway-specific UI", () => {
  const evaluation = evaluate({});
  const html = renderCompactMenEvidence({ definition: necDefinition, evaluation, patientAge: "infant", evidence: {} });
  assert.equal(html.includes('data-men-renderer="compact-v3"'), true);
  assert.equal(html.includes("NEC-2"), true);
});

test("all previously completed pathways remain registered by identity", () => {
  for (const code of ["BONE", "CARD", "CDI", "DISC", "EMET", "ENDO", "EPIS", "IC", "JNT", "MED", "MEN", "OREP", "PJI", "SA", "USI", "VASC", "VCUF"])
    assert.equal(secondarySiteDefinitions[code].siteCode, code);
});
