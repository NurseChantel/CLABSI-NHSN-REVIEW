import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { addLabAlternative, addPneuRecord, createPneuState, evaluatePneuSubtype, PNEU_UI_REGISTRY, removePneuRecord, renderPneuAbstraction, selectLabAlternative, toggleClinicalFinding, toggleImageFinding } from "./protocol/pneu-ui.js";
import { evaluatePnu1 } from "./protocol/pnu1.js";
import { evaluatePnu2 } from "./protocol/pnu2.js";
import { secondarySiteDefinitions } from "./secondary/registry.js";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const normalUi = rendered => rendered.split("<details><summary>Developer diagnostics</summary>")[0];
function dateContext(input, dob = "1980-01-01") { input.patientContext.dateOfBirth = dob; input.admissionDate = "2026-01-01"; input.imagingStudies[0].date = "2026-01-10"; }

 test("PNEU navigation is grouped with the secondary BSI categories and exposes each subtype", () => {
  assert.match(html, /1\. Secondary BSI categories/);
  assert.match(html, /id="siteButtons"[^>]*aria-label="Secondary BSI categories"/);
  assert.match(app, /data-review-family="pneu"/);
  assert.doesNotMatch(html, /Site-specific infection definitions/);
  assert.match(html, /data-pneu-subtype="PNU1"/); assert.match(html, /data-pneu-subtype="PNU2"/);
  assert.match(html, /data-pneu-subtype="PNU3" aria-disabled="true" disabled/);
  assert.equal(PNEU_UI_REGISTRY.PNU3.implemented, false);
});

test("PNU1 renders any-patient and only the applicable age-specific OR criterion", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU1, "2025-06-01");
  let rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /Criterion: PNU1 — Any patient/); assert.match(rendered, /Criterion: PNU1 — Infant ≤1 year/); assert.doesNotMatch(rendered, /Child &gt;1/);
  dateContext(state.inputs.PNU1, "2020-01-01"); rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /Child >1 through ≤12 years/); assert.doesNotMatch(rendered, /Infant ≤1 year/);
  dateContext(state.inputs.PNU1, "1980-01-01"); rendered = renderPneuAbstraction(state, "PNU1");
  assert.equal((rendered.match(/data-pneu-criterion=/g) || []).length, 1);
});

test("PNU1 respiratory alternatives are visibly grouped and count once per bullet", () => {
  const state = createPneuState(); const input = state.inputs.PNU1; dateContext(input);
  toggleClinicalFinding(input, "sputum-change", true); toggleClinicalFinding(input, "secretions-change", true); toggleClinicalFinding(input, "increased-suctioning", true);
  let rendered = renderPneuAbstraction(state, "PNU1"); assert.match(rendered, /1 of 4 respiratory groups selected/);
  toggleClinicalFinding(input, "new-or-worsening-cough", true); rendered = renderPneuAbstraction(state, "PNU1"); assert.match(rendered, /2 of 4 respiratory groups selected/);
  assert.match(rendered, /select at least TWO separate groups/);
});

test("infant and child criteria present their exact group minima", () => {
  const infant = createPneuState(); dateContext(infant.inputs.PNU1, "2025-06-01");
  let rendered = renderPneuAbstraction(infant, "PNU1"); assert.match(rendered, /Required clinical evidence/); assert.match(rendered, /select at least THREE separate groups/); assert.match(rendered, /of 7 groups selected/);
  const child = createPneuState(); dateContext(child.inputs.PNU1, "2020-01-01"); rendered = renderPneuAbstraction(child, "PNU1"); assert.match(rendered, /of 6 groups selected/);
});

test("guided imaging distinguishes sole available study from one entered study", () => {
  const state = createPneuState(); const input = state.inputs.PNU1; dateContext(input);
  assert.equal(input.soleAvailableImage, false); let rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /This is the only available chest imaging study/); assert.match(rendered, /One additional serial imaging study/);
  addPneuRecord(input, "imagingStudies"); rendered = renderPneuAbstraction(state, "PNU1");
  assert.doesNotMatch(rendered, /This is the only available chest imaging study/); assert.match(rendered, /Persistence\/progression/);
});

test("PNU2 renders exactly two coherent top-level OR algorithms", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU2); const rendered = renderPneuAbstraction(state, "PNU2");
  assert.equal((rendered.match(/class="pneu-main-criterion"/g) || []).length, 2);
  assert.match(rendered, /Common bacterial or filamentous fungal pathogens/); assert.match(rendered, /Viral, Legionella, and other bacterial pneumonias/);
  assert.match(rendered, /Meeting either complete PNU2 algorithm qualifies PNU2/);
  assert.equal((rendered.match(/class="pneu-main-criterion"[^>]* open/g) || []).length, 1);
});

test("each PNU2 algorithm visibly requires imaging AND systemic AND respiratory AND laboratory", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU2); const rendered = renderPneuAbstraction(state, "PNU2");
  for (const phrase of ["Imaging — required", "Systemic findings — select at least ONE", "Respiratory findings — select at least ONE", "qualifying laboratory pathway", "qualifying definitive laboratory finding"]) assert.match(rendered, new RegExp(phrase));
  assert.ok((rendered.match(/class="pneu-and"/g) || []).length >= 6);
});

test("laboratory alternatives reveal only fields relevant to the selected algorithm", () => {
  const state = createPneuState(); const input = state.inputs.PNU2; dateContext(input);
  selectLabAlternative(state, input, "common", "lrt"); addLabAlternative(input, "lrt"); let rendered = renderPneuAbstraction(state, "PNU2");
  assert.match(rendered, /Artificial airway eligibility documented/); assert.match(rendered, /Required threshold/); assert.doesNotMatch(rendered, /fold-rise/);
  rendered = renderPneuAbstraction(state, "PNU2"); assert.match(rendered, /Quantitative result/);
  selectLabAlternative(state, input, "definitive", "legionella-urine-antigen"); rendered = renderPneuAbstraction(state, "PNU2");
  assert.doesNotMatch(rendered, /Artificial airway eligibility documented/); assert.doesNotMatch(rendered, /Required threshold/);
});

test("normal UI uses field-level human validation and hides technical paths", () => {
  const state = createPneuState(); const input = state.inputs.PNU2; dateContext(input); selectLabAlternative(state, input, "common", "blood"); addLabAlternative(input, "blood");
  input.microbiologyResults[0].collectionDate = "not-a-date"; const rendered = renderPneuAbstraction(state, "PNU2"); const normal = normalUi(rendered);
  assert.match(normal, /Enter a valid collection date/); assert.doesNotMatch(normal, /microbiologyResults\[0\]/); assert.doesNotMatch(normal, /ISO calendar date/);
  assert.match(rendered, /Developer diagnostics/);
});

test("status reports the closest viable criterion without emphasizing all alternatives", () => {
  const state = createPneuState(); const input = state.inputs.PNU1; dateContext(input); const rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /PNU1 Not Met/); assert.match(rendered, /Closest viable criterion/); assert.match(rendered, /Still needed/);
  assert.equal((rendered.match(/class="pneu-main-criterion"[^>]* open/g) || []).length, 1);
});

test("no raw JSON is in normal UI and no evidence dates are preloaded or invented", () => {
  const state = createPneuState(); for (const subtype of ["PNU1", "PNU2"]) {
    const input = state.inputs[subtype]; assert.equal(input.admissionDate, ""); assert.equal(input.imagingStudies[0].date, "");
    assert.doesNotMatch(normalUi(renderPneuAbstraction(state, subtype)), /Evaluator input|\{\s*&quot;/);
  }
  toggleClinicalFinding(state.inputs.PNU1, "cough", true); assert.equal(state.inputs.PNU1.clinicalFindings[0].date, "");
  addPneuRecord(state.inputs.PNU2, "microbiologyResults"); assert.equal(state.inputs.PNU2.microbiologyResults[0].collectionDate, "");
});

test("rendering and adapter-only state preserve evaluator results", () => {
  const state = createPneuState(); for (const [subtype, evaluator] of [["PNU1", evaluatePnu1], ["PNU2", evaluatePnu2]]) {
    const input = state.inputs[subtype]; dateContext(input); const before = evaluator(structuredClone(input)); renderPneuAbstraction(state, subtype); const after = evaluator(structuredClone(input)); assert.deepEqual(after, before);
  }
});

test("PNU1 has only its compact no-laboratory note", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU1); const rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /does not independently report a pathogen/); assert.doesNotMatch(rendered, /data-add-lab-alternative/);
});

test("PNEU remains isolated from Chapter 17 LRI-LUNG and PNU3 stays unavailable", () => {
  assert.equal(secondarySiteDefinitions.LUNG.siteCode, "LUNG"); assert.doesNotMatch(app, /secondarySiteDefinitions[^\n]*PNU[12]/);
  assert.match(app, /if \(!PNEU_UI_REGISTRY\[button\.dataset\.pneuSubtype\]\?\.implemented\) return/);
  assert.match(html, /id="chapter17Pathways"/); assert.match(html, /id="chapter17AttributionPanel"/);
});

test("repeatable records remain isolated by subtype", () => {
  const state = createPneuState(); addPneuRecord(state.inputs.PNU1, "imagingStudies"); assert.equal(state.inputs.PNU2.imagingStudies.length, 1);
  removePneuRecord(state.inputs.PNU1, "imagingStudies", 1); assert.equal(state.inputs.PNU1.imagingStudies.length, 1);
});
