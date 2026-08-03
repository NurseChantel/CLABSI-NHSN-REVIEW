import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { evaluatePnu1, PNU1_PROTOCOL, renderCompactPnu1, renderPnu1Safely } from "./protocol/index.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { implementedSecondaryPathways } from "./secondary/registry.js";

const context = dateOfBirth => ({ dateOfBirth, hostStatus: { status: "notMet", reasons: [] }, ventilator: { inPlace: false, periods: [] } });
const image = (id, date = "2026-01-10", findings = ["infiltrate"]) => ({ id, date, modality: "chest-xray", findings, interpretation: "definitive", attributedToOtherCondition: false });
const finding = (id, kind, date = "2026-01-10") => ({ id, kind, date });
const measurement = (id, kind, value, unit, date = "2026-01-10") => ({ id, kind, value, unit, date });
const relationship = (fromStudyId = "image-1", toStudyId = "image-2", type = "persistent") => ({ fromStudyId, toStudyId, type });

function base(overrides = {}) {
  return {
    patientContext: context("1980-01-01"), admissionDate: "2026-01-01", underlyingPulmonaryOrCardiacDisease: false, soleAvailableImage: false,
    imagingStudies: [image("image-1"), image("image-2", "2026-01-12")], imagingRelationships: [relationship()],
    measurements: [measurement("temp", "temperature", 38.1, "C")],
    clinicalFindings: [finding("sputum", "sputum-change"), finding("cough", "new-or-worsening-cough")],
    ...overrides
  };
}

test("PNU1 any-patient branch requires systemic evidence and two distinct respiratory bullets", () => {
  const result = evaluatePnu1(base());
  assert.equal(result.value.met, true);
  assert.equal(result.value.branch, "PNU1-any-patient");
  assert.equal(evaluatePnu1(base({ clinicalFindings: [finding("dyspnea", "dyspnea"), finding("cough", "new-or-worsening-cough")] })).value.met, false, "alternatives in one respiratory bullet must not be flattened");
});

test("any-patient systemic thresholds and the age-70 mental-status alternative use exact boundaries", () => {
  assert.equal(evaluatePnu1(base({ measurements: [measurement("temp", "temperature", 38, "C")] })).value.met, false);
  assert.equal(evaluatePnu1(base({ measurements: [measurement("wbc", "wbc", 4000, "cells/mm3")] })).value.met, true);
  assert.equal(evaluatePnu1(base({ patientContext: context("1956-01-10"), measurements: [], clinicalFindings: [...base().clinicalFindings, finding("ams", "altered-mental-status-no-other-cause")] })).value.met, true);
});

test("infant branch requires worsening gas exchange plus three separate infant groups", () => {
  const infant = base({ patientContext: context("2025-01-10"), measurements: [measurement("hr", "heart-rate", 171, "beats/min")], clinicalFindings: [finding("gas", "worsening-gas-exchange"), finding("temp", "temperature-instability"), finding("cough", "cough")] });
  assert.equal(evaluatePnu1(infant).value.branch, "PNU1-infant");
  assert.equal(evaluatePnu1({ ...infant, clinicalFindings: infant.clinicalFindings.filter(item => item.kind !== "worsening-gas-exchange") }).value.met, false);
});

test("child branch applies only after age 1 through age 12 and counts three child groups", () => {
  const child = base({ patientContext: context("2014-01-10"), measurements: [measurement("cold", "temperature", 36.4, "C")], clinicalFindings: [finding("cough", "cough"), finding("rales", "rales")] });
  const result = evaluatePnu1(child).value;
  assert.equal(result.met, true);
  assert.equal(result.branch, "PNU1-child");
  assert.equal(evaluatePnu1({ ...child, patientContext: context("2013-01-09") }).value.met, false);
});

test("tachypnea is calculated from typed respiratory rate and age rather than a checkbox", () => {
  const child = base({ patientContext: context("2022-01-10"), measurements: [measurement("temp", "temperature", 38.1, "C"), measurement("rr", "respiratory-rate", 41, "breaths/min")], clinicalFindings: [finding("rales", "rales")] });
  assert.equal(evaluatePnu1(child).value.met, true);
  child.measurements[1] = measurement("rr", "respiratory-rate", 40, "breaths/min");
  assert.equal(evaluatePnu1(child).value.met, false);
});

test("premature infant tachypnea remains a distinct gestational-age branch through 40 weeks", () => {
  const prematureContext = { ...context("2025-12-20"), gestationalAgeWeeksAtBirth: 35 };
  const infant = base({ patientContext: prematureContext, measurements: [measurement("rr", "respiratory-rate", 76, "breaths/min")], clinicalFindings: [finding("gas", "worsening-gas-exchange"), finding("temp", "temperature-instability"), finding("cough", "cough")] });
  assert.equal(evaluatePnu1(infant).value.met, true);
  infant.measurements[0] = measurement("rr", "respiratory-rate", 75, "breaths/min");
  assert.equal(evaluatePnu1(infant).value.met, false);
  assert.equal(evaluatePnu1({ ...infant, patientContext: context("2025-12-20") }).status, "validationError");
});

test("serial imaging requires distinct studies, eligible findings, persistence/progression, and at most seven calendar days", () => {
  assert.equal(evaluatePnu1(base()).value.imaging.met, true);
  assert.equal(evaluatePnu1(base({ imagingStudies: [image("image-1"), image("image-2", "2026-01-17", ["cavitation"])], imagingRelationships: [relationship("image-1", "image-2", "progressive")] })).value.met, true);
  assert.equal(evaluatePnu1(base({ imagingStudies: [image("image-1"), image("image-2", "2026-01-18")], imagingRelationships: [relationship()] })).value.met, false);
  assert.equal(evaluatePnu1(base({ imagingStudies: [image("image-1", "2026-01-10", ["pneumatoceles"]), image("image-2", "2026-01-12", ["pneumatoceles"])] })).value.met, false);
});

test("one-image POA and sole-image HAI exceptions remain separate from underlying-disease cases", () => {
  assert.equal(evaluatePnu1(base({ admissionDate: "2026-01-10", imagingStudies: [image("image-1")], imagingRelationships: [], soleAvailableImage: false, underlyingPulmonaryOrCardiacDisease: true })).value.met, true);
  assert.equal(evaluatePnu1(base({ imagingStudies: [image("image-1")], imagingRelationships: [], soleAvailableImage: true })).value.met, true);
  assert.equal(evaluatePnu1(base({ imagingStudies: [image("image-1")], imagingRelationships: [], soleAvailableImage: true, underlyingPulmonaryOrCardiacDisease: true })).value.met, false);
});

test("equivocal and alternatively worded images require explicit NHSN-supported qualification", () => {
  const equivocal = image("image-1"); equivocal.interpretation = "equivocal"; equivocal.clinicalCorrelation = true;
  assert.equal(evaluatePnu1(base({ imagingStudies: [equivocal], imagingRelationships: [], soleAvailableImage: true })).value.met, true);
  const attributed = image("image-1", "2026-01-10", ["focal-opacification"]); attributed.attributedToOtherCondition = true;
  assert.equal(evaluatePnu1(base({ imagingStudies: [attributed], imagingRelationships: [], soleAvailableImage: true })).value.met, false);
});

test("IWP endpoints are inclusive, outside clinical evidence is rejected, and DOE/RIT are derived", () => {
  const boundary = base({ clinicalFindings: [finding("sputum", "sputum-change", "2026-01-07"), finding("cough", "new-or-worsening-cough", "2026-01-13")], measurements: [measurement("temp", "temperature", 38.1, "C", "2026-01-07")] });
  const result = evaluatePnu1(boundary).value;
  assert.equal(result.met, true);
  assert.deepEqual([result.infectionWindow.start, result.infectionWindow.end], ["2026-01-07", "2026-01-13"]);
  assert.equal(result.dateOfEvent, "2026-01-07");
  assert.deepEqual([result.repeatInfectionTimeframe.start, result.repeatInfectionTimeframe.end], ["2026-01-07", "2026-01-20"]);
  boundary.clinicalFindings[0] = finding("sputum", "sputum-change", "2026-01-06");
  assert.equal(evaluatePnu1(boundary).value.met, false);
});

test("PNU1 has no microbiology path and can never independently support secondary BSI", () => {
  const result = evaluatePnu1(base({ microbiologyResults: [{ specimenType: "sputum", organism: "excluded-or-eligible-is-irrelevant" }], bloodResults: [{ collectionDate: "2026-01-10" }] })).value;
  assert.equal(result.met, true);
  assert.deepEqual(result.laboratoryEvidence, { applicable: false, message: "PNU1 has no laboratory criterion." });
  assert.equal(result.secondaryBsi.met, false);
  assert.equal(result.secondaryBsi.organismRelationshipMet, false);
  assert.equal(result.secondaryBsi.timingMet, false);
  assert.deepEqual([result.secondaryBsiAttributionPeriod.start, result.secondaryBsiAttributionPeriod.end], ["2026-01-07", "2026-01-23"]);
});

test("malformed PNU1 data returns validation errors without approximating", () => {
  assert.equal(evaluatePnu1({}).status, "validationError");
  assert.equal(evaluatePnu1(base({ imagingStudies: [{ ...image("image-1"), date: "bad" }] })).status, "validationError");
  assert.equal(evaluatePnu1(base({ clinicalFindings: [finding("x", "provider-diagnosed-pneumonia")] })).status, "validationError");
  assert.equal(evaluatePnu1(base({ microbiologyResults: "not-an-array" })).status, "validationError");
});

test("compact renderer loads every requested section and reports only remaining requirements", () => {
  const incomplete = evaluatePnu1(base({ clinicalFindings: [] })).value;
  const html = renderCompactPnu1({ evaluation: incomplete, patientContext: base().patientContext });
  for (const heading of ["Patient Context", "Timeline", "Imaging", "Clinical Criteria", "Laboratory Evidence", "Exclusions", "PNU1 Status", "Secondary BSI Attribution"]) assert.match(html, new RegExp(heading));
  assert.match(html, /PNU1 Not Met/); assert.match(html, /Still needed:/);
  assert.match(renderCompactPnu1({ evaluation: evaluatePnu1(base()).value, patientContext: base().patientContext }), /PNU1 Met/);
  assert.match(renderPnu1Safely({}), /could not be loaded/);
});

test("PNU1 remains separate from every Chapter 17 pathway and adds no VAE/LUNG definition", () => {
  assert.deepEqual(PNU1_PROTOCOL.branches, ["PNU1-any-patient", "PNU1-infant", "PNU1-child"]);
  for (const code of implementedSecondaryPathways) assert.notEqual(evaluateSecondarySite({ siteCode: code }).siteCode, "PNU1");
  const files = fs.readdirSync(new URL("./protocol/", import.meta.url));
  assert.equal(files.some(name => /vae|lung/i.test(name)), false);
});
