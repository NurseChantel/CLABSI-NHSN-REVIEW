import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createPneuState, evaluatePneuSubtype, PNEU_UI_REGISTRY } from "./protocol/pneu-ui.js";
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
