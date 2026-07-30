import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkboxEvidenceValue, COMPACT_MEN_RENDERER_VERSION, getMenProgress, getVisibleMenCriteria, renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, menDefinition } from "./secondary-rules.js";

class RenderedContainer {
  constructor(html) { this.innerHTML = html; }
  get textContent() { return this.innerHTML.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
  querySelectorAll(selector) {
    if (selector === 'input[type="checkbox"]') return this.innerHTML.match(/<input\b(?=[^>]*type="checkbox")[^>]*>/g) || [];
    if (selector === "details[data-men-criterion]") return this.innerHTML.match(/<details\b(?=[^>]*data-men-criterion)[^>]*>/g) || [];
    if (selector === "details[data-men-criterion][open]") return this.innerHTML.match(/<details\b(?=[^>]*data-men-criterion)(?=[^>]*\sopen(?:\s|>))[^>]*>/g) || [];
    if (selector === ".secondary-references") return this.innerHTML.match(/<details\b[^>]*class="[^"]*secondary-references[^"]*"[^>]*>/g) || [];
    if (selector === ".secondary-note-button") return this.innerHTML.match(/<button\b[^>]*class="[^"]*secondary-note-button[^"]*"[^>]*>/g) || [];
    if (selector === ".secondary-qualification-note[hidden]") return this.innerHTML.match(/<span\b(?=[^>]*class="[^"]*secondary-qualification-note[^"]*")(?=[^>]*hidden)[^>]*>/g) || [];
    return [];
  }
}

function renderMen(patientAge = "adult", evidence = {}) {
  const evaluation = evaluateSecondarySite({ siteCode: "MEN", evidence });
  return new RenderedContainer(renderCompactMenEvidence({ definition: menDefinition, evaluation, patientAge, evidence }));
}

test("MEN evidence uses checked and unchecked checkbox values only", () => {
  assert.equal(checkboxEvidenceValue(true), "met");
  assert.equal(checkboxEvidenceValue(false), "notMet");
});

test("age selection hides only the age-inappropriate MEN clinical pathway", () => {
  assert.deepEqual(getVisibleMenCriteria(menDefinition.criteria, "adult").map(({ id }) => id), ["MEN-1", "MEN-2"]);
  assert.deepEqual(getVisibleMenCriteria(menDefinition.criteria, "infant").map(({ id }) => id), ["MEN-1", "MEN-3"]);
});

test("compact progress reflects the existing MEN evaluator without changing criteria", () => {
  const evidence = { "csf-organism": "met" };
  const evaluation = evaluateSecondarySite({ siteCode: "MEN", evidence });
  assert.deepEqual(getMenProgress(evaluation, getVisibleMenCriteria(menDefinition.criteria, "adult"), evidence), { completed: 1, missing: 0, met: true });
});

test("the actual compact MEN renderer has checkboxes and no old evidence controls", () => {
  const container = renderMen("adult");
  assert.equal(container.textContent.includes("Unknown / not documented"), false);
  assert.equal(container.textContent.includes("Not met"), false);
  assert.ok(container.querySelectorAll('input[type="checkbox"]').length > 0);
  assert.ok(container.querySelectorAll("details[data-men-criterion]").length > 0);
  assert.equal(container.querySelectorAll("details[data-men-criterion][open]").length, 2);
  assert.equal(container.textContent.includes("Criterion 3"), false);
  assert.equal(container.textContent.includes("🟡 MEN Site Definition Not Met"), true);
  assert.equal(container.textContent.includes("Still needed:"), true);
  assert.equal(container.textContent.includes("CSF organism"), true);
  assert.equal(container.textContent.includes("completed requirements"), false);
  assert.equal(container.innerHTML.includes('data-men-renderer="compact-v3"'), true);
});

test("the actual infant MEN render excludes MEN-2 and uses styled compact DOM classes", () => {
  const container = renderMen("infant");
  const stylesheet = readFileSync(new URL("./style.css", import.meta.url), "utf8");
  assert.equal(container.textContent.includes("Criterion 2"), false);
  for (const selector of [".secondary-evidence-review", ".secondary-site-status", ".secondary-criterion", ".secondary-evidence-item", ".secondary-references"]) {
    assert.equal(container.innerHTML.includes(selector.slice(1)), true);
    assert.equal(stylesheet.includes(selector), true);
  }
  assert.equal(COMPACT_MEN_RENDERER_VERSION, "Rendering compact MEN evidence UI v3");
});


test("routine MEN abstraction shows one consolidated reference and only qualification notes", () => {
  const container = renderMen("adult");
  assert.equal(container.querySelectorAll(".secondary-references").length, 1);
  assert.ok(container.querySelectorAll(".secondary-note-button").length > 0);
  assert.equal(container.querySelectorAll(".secondary-note-button").length, container.querySelectorAll(".secondary-qualification-note[hidden]").length);
  assert.equal(container.textContent.includes("NHSN notes and reporting instructions"), false);
  assert.equal(container.textContent.includes("Secondary BSI attribution source"), false);
  assert.equal(container.textContent.includes("Source ID"), false);
  assert.equal(container.textContent.includes("Report CSF shunt infection as SSI-MEN"), false);
  for (const label of ["Chapter", "Section", "Printed page(s)", "PDF page(s)", "Source document"]) assert.equal(container.textContent.includes(label), true);
});


test("live requirement presentation derives group and supporting-test progress from structured criteria", () => {
  const evidence = { suspected: "met", fever: "met", "meningeal-signs": "met", "csf-gram-stain": "met" };
  const container = renderMen("adult", evidence);
  assert.equal(container.textContent.includes("Select findings from TWO different groups."), true);
  assert.equal(container.textContent.includes("Select ONE qualifying supporting test."), true);
  assert.equal(container.textContent.includes("✓ Group I"), true);
  assert.equal(container.textContent.includes("✓ Group II"), true);
  assert.equal(container.textContent.includes("☐ Group III"), true);
  assert.equal(container.textContent.includes("✓ Requirement satisfied"), true);
});

test("completed criterion collapses while incomplete criteria remain expanded and exclusion opens only when selected", () => {
  const complete = renderMen("adult", { "csf-organism": "met" });
  assert.equal(complete.textContent.includes("🟢 MEN Site Definition Met"), true);
  assert.equal(complete.innerHTML.includes('data-men-criterion="MEN-1" open'), false);
  assert.equal(complete.innerHTML.includes('data-men-criterion="MEN-2" open'), true);
  assert.equal(complete.innerHTML.includes('class="secondary-criterion exclusion" open'), false);
  const excluded = renderMen("adult", { "other-recognized-cause": "met" });
  assert.equal(excluded.innerHTML.includes('class="secondary-criterion exclusion" open'), true);
});
