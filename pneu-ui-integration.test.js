import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { addPneuRecord, createPneuState, evaluatePneuSubtype, PNEU_UI_REGISTRY, removePneuRecord, renderPneuAbstraction, toggleClinicalFinding, toggleImageFinding } from "./protocol/pneu-ui.js";
import { secondarySiteDefinitions } from "./secondary/registry.js";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");

test("PNEU navigation exposes PNU1, PNU2, and an unavailable PNU3", () => {
  assert.match(html, /PNEU[\s\S]*Pneumonia Event/);
  assert.match(html, /data-pneu-subtype="PNU1"/);
  assert.match(html, /data-pneu-subtype="PNU2"/);
  assert.match(html, /data-pneu-subtype="PNU3"[\s\S]*Not yet implemented/);
  assert.equal(PNEU_UI_REGISTRY.PNU1.implemented, true);
  assert.equal(PNEU_UI_REGISTRY.PNU2.implemented, true);
  assert.equal(PNEU_UI_REGISTRY.PNU3.implemented, false);
});

test("PNU1 and PNU2 evaluators and completed renderers load through the UI registry", () => {
  const state = createPneuState();
  const pnu1 = evaluatePneuSubtype("PNU1", state.inputs.PNU1);
  const pnu2 = evaluatePneuSubtype("PNU2", state.inputs.PNU2);
  assert.equal(pnu1.ok, true);
  assert.equal(pnu2.ok, true);
  assert.match(pnu1.html, /data-protocol="PNU1"/);
  assert.match(pnu2.html, /data-protocol="PNU2"/);
});

test("PNU subtype state is isolated", () => {
  const state = createPneuState();
  state.inputs.PNU1.clinicalFindings.push({ id: "pnu1-only", kind: "cough", date: "2026-01-10" });
  assert.deepEqual(state.inputs.PNU2.clinicalFindings, []);
  assert.notEqual(state.inputs.PNU1.patientContext, state.inputs.PNU2.patientContext);
});

test("PNEU remains separate from Chapter 17 LRI-LUNG and its state", () => {
  assert.equal(secondarySiteDefinitions.LUNG.siteCode, "LUNG");
  assert.doesNotMatch(app, /secondarySiteDefinitions[^\n]*PNU[12]/);
  assert.match(html, /id="chapter17Pathways"/);
  assert.match(html, /id="chapter17AttributionPanel"/);
  assert.match(html, /does not use Chapter 17 LRI-LUNG evidence/);
  assert.match(app, /siteEvidence: \{\}[\s\S]*pneu: createPneuState\(\)/);
});

test("guided PNEU forms replace the normal raw JSON editor", () => {
  const state = createPneuState();
  for (const subtype of ["PNU1", "PNU2"]) {
    const rendered = renderPneuAbstraction(state, subtype);
    assert.match(rendered, /Patient Context/);
    assert.match(rendered, /Timeline/);
    assert.match(rendered, /Clinical Evidence/);
    assert.doesNotMatch(rendered, /<textarea|Protocol evidence JSON/);
    assert.match(rendered, /<details><summary>Developer diagnostics/);
  }
});

test("form record helpers build evaluator-compatible PNU1 and PNU2 inputs", () => {
  const state = createPneuState();
  for (const subtype of ["PNU1", "PNU2"]) {
    const input = state.inputs[subtype];
    toggleImageFinding(input, 0, "infiltrate", true);
    toggleClinicalFinding(input, "sputum-change", true);
    assert.equal(evaluatePneuSubtype(subtype, input).ok, true);
  }
  assert.match(renderPneuAbstraction(state, "PNU1"), /PNU1 has no laboratory criterion/);
  assert.doesNotMatch(renderPneuAbstraction(state, "PNU1"), /data-pneu-add="microbiologyResults"/);
});

test("age-inapplicable clinical fields are hidden", () => {
  const state = createPneuState();
  state.inputs.PNU1.patientContext.dateOfBirth = "2025-12-20";
  const infant = renderPneuAbstraction(state, "PNU1");
  assert.match(infant, /Gestational age at birth/);
  assert.doesNotMatch(infant, /Altered mental status/);
  state.inputs.PNU1.patientContext.dateOfBirth = "1980-01-01";
  assert.doesNotMatch(renderPneuAbstraction(state, "PNU1"), /Gestational age at birth/);
});

test("PNU2 laboratory alternatives are single-open compact accordions", () => {
  const state = createPneuState(); const rendered = renderPneuAbstraction(state, "PNU2");
  assert.match(rendered, /Meeting any one complete laboratory pathway/);
  assert.equal((rendered.match(/aria-expanded="true"/g) || []).length, 1);
  assert.ok((rendered.match(/class="pneu-accordion"/g) || []).length > 1);
});

test("adding and removing repeatable evidence updates only its evaluator input", () => {
  const state = createPneuState(); const pnu1 = state.inputs.PNU1; const pnu2 = state.inputs.PNU2;
  addPneuRecord(pnu1, "imagingStudies", { date: "2026-01-12" });
  assert.equal(pnu1.imagingStudies.length, 2); assert.equal(pnu1.imagingRelationships.length, 1);
  assert.equal(pnu2.imagingStudies.length, 1);
  removePneuRecord(pnu1, "imagingStudies", 1); assert.equal(pnu1.imagingStudies.length, 1);
  addPneuRecord(pnu2, "microbiologyResults", { collectionDate: "2026-01-10" });
  assert.equal(pnu2.microbiologyResults.length, 1); assert.equal(pnu1.microbiologyResults, undefined);
  removePneuRecord(pnu2, "microbiologyResults", 0); assert.equal(pnu2.microbiologyResults.length, 0);
});

test("PNU3 is natively disabled and its handler cannot replace active state", () => {
  assert.match(html, /data-pneu-subtype="PNU3" aria-disabled="true" disabled/);
  assert.match(app, /if \(!PNEU_UI_REGISTRY\[button\.dataset\.pneuSubtype\]\?\.implemented\) return/);
  assert.match(app, /if \(!PNEU_UI_REGISTRY\[button\.dataset\.pneuSubtype\]\?\.implemented\) return;\s*state\.pneu\.selectedSubtype/);
});

test("calculated DOE, IWP, and RIT are shown by the guided form", () => {
  const state = createPneuState(); const input = state.inputs.PNU1;
  input.imagingStudies[0].findings = ["infiltrate"];
  input.measurements = [{ id: "t", kind: "temperature", value: 38.1, unit: "C", date: "2026-01-10" }];
  input.clinicalFindings = [{ id: "s", kind: "sputum-change", date: "2026-01-10" }, { id: "c", kind: "new-or-worsening-cough", date: "2026-01-10" }];
  const rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /DOE <b>2026-01-10/);
  assert.match(rendered, /2026-01-07 – 2026-01-13/);
  assert.match(rendered, /2026-01-10 – 2026-01-23/);
});
