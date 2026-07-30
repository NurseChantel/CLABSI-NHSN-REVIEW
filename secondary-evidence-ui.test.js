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
    return [];
  }
}

function renderMen(patientAge = "adult") {
  const evidence = {};
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
  assert.equal(container.textContent.includes(" Met "), false);
  assert.ok(container.querySelectorAll('input[type="checkbox"]').length > 0);
  assert.ok(container.querySelectorAll("details[data-men-criterion]").length > 0);
  assert.equal(container.querySelectorAll("details[data-men-criterion][open]").length, 1);
  assert.equal(container.textContent.includes("Criterion 3"), false);
  assert.equal(container.innerHTML.includes('data-men-renderer="compact-v2"'), true);
});

test("the actual infant MEN render excludes MEN-2 and uses styled compact DOM classes", () => {
  const container = renderMen("infant");
  const stylesheet = readFileSync(new URL("./style.css", import.meta.url), "utf8");
  assert.equal(container.textContent.includes("Criterion 2"), false);
  for (const selector of [".men-review", ".men-progress", ".men-criterion", ".men-evidence-item", ".men-source"]) {
    assert.equal(container.innerHTML.includes(selector.slice(1)), true);
    assert.equal(stylesheet.includes(selector), true);
  }
  assert.equal(COMPACT_MEN_RENDERER_VERSION, "Rendering compact MEN evidence UI v2");
});
