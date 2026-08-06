import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { blockStatus, pathwayApplicable, PNU1_PATHWAYS, PNU2_SIGN_PATHWAY, PNU3_SIGN_PATHWAY, SPECIMEN_THRESHOLDS } from "./protocol/pneu-manual-view.js";
import { createPneuState, toggleManualBullet } from "./protocol/pneu-ui.js";
import { evaluatePnu1 } from "./protocol/pnu1.js";

// Source: NHSN pneumonia.pdf, Chapter 6 (PNEU), Tables 1-5 and footnotes 1-13,
// printed pages 6-6 – 6-16.
const style = readFileSync(new URL("./style.css", import.meta.url), "utf8");

const dated = (input, dob = "1950-03-02") => {
  input.patientContext.dateOfBirth = dob; input.admissionDate = "2026-01-01";
  input.imagingStudies[0].date = "2026-01-10"; input.imagingStudies[0].findings = ["infiltrate"];
  return input;
};

test("Table 1 exposes all three age pathways with the manual's group minima", () => {
  assert.deepEqual(PNU1_PATHWAYS.map(pathway => pathway.id), ["PNU1-any-patient", "PNU1-infant", "PNU1-child"]);
  const [any, infant, child] = PNU1_PATHWAYS;
  assert.deepEqual(any.blocks.map(block => block.required), [1, 2]);
  assert.deepEqual(infant.blocks.map(block => block.required), [1, 3]);
  assert.deepEqual(child.blocks.map(block => block.required), [3]);
  assert.equal(infant.blocks[1].bullets.length, 7, "infant alternate criteria list seven bullets");
  assert.equal(child.blocks[0].bullets.length, 6, "child alternate criteria list six bullets");
});

test("Tables 2 and 4 sign requirements match the manual", () => {
  // Table 2/3: "At least one of the following" AND "And at least one of the following".
  assert.deepEqual(PNU2_SIGN_PATHWAY.blocks.map(block => block.required), [1, 1]);
  // Table 4: a single "at least one of the following" list for the immunocompromised patient.
  assert.deepEqual(PNU3_SIGN_PATHWAY.blocks.map(block => block.required), [1]);
  assert.equal(PNU3_SIGN_PATHWAY.blocks[0].bullets.length, 8);
});

test("age applicability follows the manual's own pathway wording", () => {
  assert.equal(pathwayApplicable("PNU1-infant", 1), true);
  assert.equal(pathwayApplicable("PNU1-infant", 1.5), false);
  assert.equal(pathwayApplicable("PNU1-child", 1), false);
  assert.equal(pathwayApplicable("PNU1-child", 12), true);
  assert.equal(pathwayApplicable("PNU1-child", 12.5), false);
  assert.equal(pathwayApplicable("PNU1-any-patient", 40), true);
  // With no date of birth recorded, only the any-patient pathway can be active.
  assert.equal(pathwayApplicable("PNU1-any-patient", null), true);
  assert.equal(pathwayApplicable("PNU1-infant", null), false);
});

// The manual counts bullets, not findings: two findings from the same bullet are one
// element ("from separate bullets"). The presentation layer and the evaluator must agree
// on that count, otherwise the checklist tells the reviewer something the result denies.
test("the displayed bullet count matches the evaluator's qualifying group count", () => {
  const state = createPneuState(); const input = dated(state.inputs.PNU1);
  const respiratory = PNU1_PATHWAYS[0].blocks[1];
  const count = () => blockStatus(input, respiratory, 76).selectedCount;

  assert.equal(count(), 0);
  assert.equal(evaluatePnu1(input).value.clinical.qualifyingGroupCount, 0);

  toggleManualBullet(input, "PNU1-any-patient:respiratory:sputum", true);
  assert.equal(count(), 1);
  assert.equal(evaluatePnu1(input).value.clinical.qualifyingGroupCount, 1);

  // A second finding inside the same bullet must not advance either count.
  input.clinicalFindings.push({ id: "finding-increased-suctioning", kind: "increased-suctioning", date: "2026-01-10" });
  assert.equal(count(), 1);
  assert.equal(evaluatePnu1(input).value.clinical.qualifyingGroupCount, 1);

  toggleManualBullet(input, "PNU1-any-patient:respiratory:rales", true);
  assert.equal(count(), 2);
  assert.equal(evaluatePnu1(input).value.clinical.qualifyingGroupCount, 2);
});

test("the altered mental status bullet is only offered to adults 70 and over", () => {
  const state = createPneuState(); const input = dated(state.inputs.PNU1);
  const systemic = PNU1_PATHWAYS[0].blocks[0];
  assert.equal(blockStatus(input, systemic, 76).applicable.length, 3);
  assert.equal(blockStatus(input, systemic, 40).applicable.length, 2);
});

test("checking a bullet produces evidence the evaluator accepts, and unchecking removes it", () => {
  const state = createPneuState(); const input = dated(state.inputs.PNU1);
  input.soleAvailableImage = true;
  toggleManualBullet(input, "PNU1-any-patient:systemic:fever", true);
  toggleManualBullet(input, "PNU1-any-patient:respiratory:sputum", true);
  toggleManualBullet(input, "PNU1-any-patient:respiratory:rales", true);
  assert.equal(evaluatePnu1(input).value.met, true);

  toggleManualBullet(input, "PNU1-any-patient:systemic:fever", false);
  assert.equal(evaluatePnu1(input).value.met, false);
  assert.deepEqual(input.measurements, []);
});

// Table 5, printed page 6-15.
test("Table 5 lists a threshold for every specimen collection technique in the manual", () => {
  assert.deepEqual(SPECIMEN_THRESHOLDS, {
    "lung-tissue": "≥ 10⁴ CFU/g tissue",
    "bronchoscopic-bal": "≥ 10⁴ CFU/ml",
    "protected-bal": "≥ 10⁴ CFU/ml",
    "protected-specimen-brushing": "≥ 10³ CFU/ml",
    "nonbronchoscopic-bal": "≥ 10⁴ CFU/ml",
    "nonbronchoscopic-protected-specimen-brushing": "≥ 10³ CFU/ml",
    "endotracheal-aspirate": "≥ 10⁵ CFU/ml"
  });
});

// The manual table is a fixed-column grid, so every level of the cell needs min-width:0
// or long bullet text and select controls push past the column rule.
test("the manual table constrains its cell contents so nothing escapes a column", () => {
  assert.match(style, /\.pneu-manual-grid>\*\{[^}]*min-width:0/);
  assert.match(style, /\.pneu-manual-td \*\{[^}]*min-width:0[^}]*max-width:100%/);
  assert.match(style, /\.pneu-manual-td,\.pneu-manual-th\{[^}]*overflow-wrap:break-word/);
  assert.match(style, /\.pneu-block-counter\{[^}]*white-space:nowrap/);
  assert.match(style, /@media \(max-width:900px\)\{[^}]*\.pneu-manual-grid\.cols-2,\.pneu-manual-grid\.cols-3\{grid-template-columns:1fr\}/);
});
