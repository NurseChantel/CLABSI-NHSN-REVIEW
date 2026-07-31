import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { renderSecondaryEvidenceSafely } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, implementedSecondaryPathways, secondarySiteCategories, secondarySiteDefinitions } from "./secondary-rules.js";

test("the implemented pathway registry is unique, complete, and renderable", () => {
  assert.equal(new Set(implementedSecondaryPathways).size, implementedSecondaryPathways.length);
  const categoryCodes = secondarySiteCategories.flatMap(category => category.siteCodes);

  for (const siteCode of implementedSecondaryPathways) {
    const definition = secondarySiteDefinitions[siteCode];
    assert.ok(categoryCodes.includes(siteCode), `${siteCode} is missing from category navigation`);
    assert.equal(definition.siteCode, siteCode);
    assert.equal(definition.implementationStatus, "validated");

    const evaluation = evaluateSecondarySite({ siteCode });
    const markup = renderSecondaryEvidenceSafely({ definition, evaluation, patientAge: "adult", evidence: {} });
    assert.match(markup, /data-men-renderer="compact-v3"/, `${siteCode} did not render`);
    assert.match(markup, /type="checkbox"/, `${siteCode} did not render compact evidence checkboxes`);
    assert.doesNotMatch(markup, /Unknown \/ not documented|data-value="unknown"/);
  }
});

test("a malformed pathway is isolated behind the controlled guidance message", () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    const markup = renderSecondaryEvidenceSafely({ definition: { siteCode: "BROKEN" }, evaluation: {}, patientAge: "adult" });
    assert.match(markup, /Site-specific guidance could not be loaded for this pathway\./);
    assert.doesNotMatch(markup, /TypeError|stack/);
  } finally {
    console.error = originalError;
  }
});

test("the application has one renderer path and no obsolete three-state evidence renderer", () => {
  const app = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.equal((app.match(/function renderSiteGuide\(/g) || []).length, 1);
  assert.doesNotMatch(app, /function renderEvidenceChoice|function renderMenCriterion|Unknown \/ not documented/);
  assert.match(app, /renderSecondaryEvidenceSafely as renderCompactMenEvidence/);
});
