import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { urDefinition } from "./secondary/definitions/ur.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "UR", evidence, ...extra });
const adultSupport = "ur-1-support-upper-respiratory-organism";
const infantSupport = "ur-3-support-upper-respiratory-organism";

test("every independent UR criterion qualifies without merging branches", () => {
  assert.equal(evaluate({ "ur-1-fever": "met", "ur-1-sore-throat": "met", [adultSupport]: "met" }).metCriterion, "UR-1");
  for (const abscess of ["ur-2-gross-anatomic-abscess", "ur-2-histopathologic-abscess", "ur-2-imaging-abscess"])
    assert.equal(evaluate({ [abscess]: "met" }).metCriterion, "UR-2");
  assert.equal(evaluate({ "ur-3-age-one-or-younger": "met", "ur-3-fever": "met", "ur-3-apnea": "met", [infantSupport]: "met" }).metCriterion, "UR-3");
});

test("UR-1 requires two clinical findings and one complete supporting alternative", () => {
  const findings = ["ur-1-fever", "ur-1-pharynx-erythema", "ur-1-sore-throat", "ur-1-cough", "ur-1-hoarseness", "ur-1-tachypnea", "ur-1-nasal-discharge", "ur-1-purulent-throat-exudate"];
  const supports = [adultSupport, "ur-1-support-diagnostic-antibody", "ur-1-support-physician-diagnosis"];
  for (const support of supports) assert.equal(evaluate({ "ur-1-fever": "met", "ur-1-cough": "met", [support]: "met" }).metCriterion, "UR-1");
  for (const finding of findings) assert.equal(evaluate({ [finding]: "met", [adultSupport]: "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ur-1-fever": "met", "ur-1-cough": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ [adultSupport]: "met" }).siteDefinitionMet, false);
});

test("UR-3 preserves infant age, AND requirements, findings, and supporting OR alternatives", () => {
  const findings = ["ur-3-fever", "ur-3-hypothermia", "ur-3-apnea", "ur-3-bradycardia", "ur-3-nasal-discharge", "ur-3-purulent-throat-exudate"];
  const supports = [infantSupport, "ur-3-support-diagnostic-antibody", "ur-3-support-physician-diagnosis"];
  for (const support of supports) assert.equal(evaluate({ "ur-3-age-one-or-younger": "met", "ur-3-fever": "met", "ur-3-bradycardia": "met", [support]: "met" }).metCriterion, "UR-3");
  for (const finding of findings) assert.equal(evaluate({ "ur-3-age-one-or-younger": "met", [finding]: "met", [infantSupport]: "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ur-3-fever": "met", "ur-3-apnea": "met", [infantSupport]: "met" }).siteDefinitionMet, false);
});

test("another recognized cause blocks only NHSN-asterisked findings", () => {
  for (const finding of ["ur-1-pharynx-erythema", "ur-1-sore-throat", "ur-1-cough", "ur-1-hoarseness", "ur-1-tachypnea", "ur-1-nasal-discharge", "ur-1-purulent-throat-exudate"])
    assert.equal(evaluate({ "ur-1-fever": "met", [finding]: "met", [adultSupport]: "met", "ur-other-recognized-cause": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ur-1-fever": "met", "ur-1-sore-throat": "met", "ur-1-cough": "met", [adultSupport]: "met", "ur-other-recognized-cause": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ur-3-fever": "met", "ur-3-hypothermia": "met", "ur-3-age-one-or-younger": "met", [infantSupport]: "met", "ur-other-recognized-cause": "met" }).siteDefinitionMet, true);
});

test("excluded specimens, shortcuts, and evidence from other sites cannot qualify UR", () => {
  for (const evidence of [
    { "ur-sputum-or-tracheal-aspirate": "met", "ur-1-fever": "met", "ur-1-cough": "met" },
    { "ur-1-sore-throat": "met" }, { "ur-1-hoarseness": "met" }, { [adultSupport]: "met" },
    { "sinu-imaging-evidence": "met", "sinu-fever": "met" },
    { "oral-abscess-purulent-material-organism": "met" },
    { "ear-media-fluid-organism": "met" }, { "eye-chamber-vitreous-organism": "met" },
    { "conj-purulent-exudate": "met" }, { "lung-imaging": "met", "lung-culture": "met" }
  ]) assert.equal(evaluate(evidence).siteDefinitionMet, false);
});

test("unchecked or explicitly unmet UR evidence does not count", () => {
  assert.equal(evaluate({ "ur-1-fever": "", "ur-1-cough": "met", [adultSupport]: "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ur-1-fever": "notMet", "ur-1-cough": "met", [adultSupport]: "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "ur-2-imaging-abscess": "" }).siteDefinitionMet, false);
});

test("meeting UR unlocks but does not automatically establish Secondary BSI attribution", () => {
  // Table B1 (clabsi nhsn.pdf 4-34) admits UR criteria 1a or 3a for a secondary BSI.
  const complete = { "ur-1-fever": "met", "ur-1-cough": "met", "ur-1-support-upper-respiratory-organism": "met" };
  assert.equal(evaluate(complete).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(complete, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("UR source, criteria, boundaries, and attribution metadata are preserved", () => {
  assert.deepEqual({ document: urDefinition.source.document, printedPage: urDefinition.source.printedPage, pdfPage: urDefinition.source.pdfPage, sectionHeading: urDefinition.source.sectionHeading, sourceDataId: urDefinition.source.sourceDataId },
    { document: "Secondary BSI Chapter.pdf", printedPage: "17-18", pdfPage: 19, sectionHeading: "UR — Upper respiratory tract infection, pharyngitis, laryngitis, epiglottitis", sourceDataId: "UR" });
  assert.deepEqual(urDefinition.criteria.map(({ id }) => id), ["UR-1", "UR-2", "UR-3"]);
  assert.deepEqual(urDefinition.secondaryBsi.eligibleScenario1Criteria, ["UR-1a", "UR-3a"]);
  assert.deepEqual(urDefinition.secondaryBsi.eligibleScenario2Criteria, []);
  assert.ok(urDefinition.criteria.flatMap((entry) => [entry, ...entry.allOf, ...entry.groups.flatMap(({ anyOf }) => anyOf)]).every(({ source }) => source === urDefinition.source));
  assert.equal(urDefinition.secondaryBsi.source.sourceDataId, "UR.secondary-bsi");
});

test("registry contains UR exactly once and preserves EENT ordering", () => {
  assert.equal(secondarySiteDefinitions.UR, urDefinition);
  assert.equal(implementedSecondaryPathways.filter((code) => code === "UR").length, 1);
  assert.deepEqual(Object.keys(secondarySiteDefinitions).filter((code) => ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"].includes(code)), ["CONJ", "EAR", "EYE", "ORAL", "SINU", "UR"]);
});

test("canonical compact renderer shows UR incomplete/met status and all criteria", () => {
  const incomplete = renderCompactMenEvidence({ definition: urDefinition, evaluation: evaluate({}), patientAge: "adult", evidence: {} });
  assert.match(incomplete, /🟡 UR Site Definition Not Met/);
  assert.match(incomplete, /Still needed:/);
  const evidence = { "ur-2-imaging-abscess": "met" };
  const met = renderCompactMenEvidence({ definition: urDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence });
  assert.match(met, /🟢 UR Site Definition Met/);
  assert.match(met, /data-men-renderer="compact-v3"/);
  for (const file of ["app.js", "secondary-evidence-ui.js", "secondary/evaluator.js", "style.css", "index.html"])
    assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("UR-specific"), false);
});
