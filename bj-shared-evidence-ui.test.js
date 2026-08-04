import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, selectSecondarySite } from "./secondary/evaluator.js";
import { secondarySiteDefinitions } from "./secondary/registry.js";

const sites = ["BONE", "DISC", "JNT", "PJI"];
const expectedSnapshots = Object.freeze({
  BONE: "320d2d86a461c504fadffa8c343a4705d0ddda61b847b6a30b575b9c742e0952",
  DISC: "7f89ef3e3f6b690c87938bf6621fee7854d11cb3e09359995d43592921b9be2a",
  JNT: "31b19ae5bce89bf0c55b5d4d18d2ae42aa6cfb301dd5417f96d1d14e4726fb8c",
  PJI: "801be8b46886a40cf0318d861db70f16c4ebc5699afa2a3b096f8064cdd1555f"
});

function atoms(definition) {
  return definition.criteria.flatMap((criterion) => [...criterion.allOf, ...(criterion.groups || []).flatMap((group) => group.anyOf.flatMap((entry) => entry.anyOf || [entry]))]);
}
function render(siteCode, evidence = {}, openCriterion = "", openCriteria) {
  const definition = secondarySiteDefinitions[siteCode];
  return renderCompactMenEvidence({ definition, evaluation: evaluateSecondarySite({ siteCode, evidence }), evidence, openCriterion, openCriteria });
}
function criterionHtml(html, criterionId) {
  const presentationId = criterionId.replace(/^(BONE-3[ab])-.+$/, "$1");
  const start = html.indexOf(`data-men-criterion="${presentationId}"`);
  assert.notEqual(start, -1, criterionId);
  const end = html.indexOf("</details>", start);
  return html.slice(start, end);
}

test("BJ restores criterion-owned controls without detached evidence or pathway blocks", () => {
  for (const siteCode of sites) {
    const html = render(siteCode);
    assert.doesNotMatch(html, /data-evidence-section=|secondary-shared-evidence|secondary-criterion-pathways|Qualifying criterion pathways/);
    for (const criterion of secondarySiteDefinitions[siteCode].criteria) {
      const section = criterionHtml(html, criterion.id);
      for (const item of [...criterion.allOf, ...(criterion.groups || []).flatMap((group) => group.anyOf.flatMap((entry) => entry.anyOf || [entry]))]) {
        assert.match(section, new RegExp(`data-evidence-id="${item.id}"`), `${criterion.id}: ${item.id}`);
      }
      assert.match(section, /Status/);
      assert.doesNotMatch(section, /<h5>Source<\/h5>/);
    }
  }
});

test("every BJ criterion body contains evidence controls and only criterion review content", () => {
  for (const siteCode of sites) {
    const html = render(siteCode);
    for (const criterion of secondarySiteDefinitions[siteCode].criteria) {
      const section = criterionHtml(html, criterion.id);
      assert.match(section, /data-evidence-id=/, `${criterion.id} has no evidence controls`);
      assert.match(section, /secondary-criterion-status/, `${criterion.id} has no current status`);
      assert.doesNotMatch(section, /NHSN Reference|Shared clinical evidence|data-evidence-section=/);
    }
  }
});

test("BJ criteria do not auto-collapse and preserve multiple explicit open sections", () => {
  for (const siteCode of sites) assert.equal((render(siteCode).match(/data-men-criterion="[^"]+" open/g) || []).length, 1, siteCode);
  const html = render("BONE", {}, "", ["BONE-3a", "BONE-3b"]);
  assert.match(html, /data-men-criterion="BONE-3a" open/);
  assert.match(html, /data-men-criterion="BONE-3b" open/);
  assert.equal((html.match(/data-men-criterion="[^"]+" open/g) || []).length, 2);
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.doesNotMatch(app, /other\.open = false/);
  assert.match(app, /state\.openBjCriteria = \[\.\.\.open\]/);
});

test("BONE presents criterion 3a and 3b once with explicit imaging alternatives", () => {
  const html = render("BONE");
  assert.equal((html.match(/data-men-criterion="BONE-3a"/g) || []).length, 1);
  assert.equal((html.match(/data-men-criterion="BONE-3b"/g) || []).length, 1);
  assert.equal((html.match(/>Criterion 3a —/g) || []).length, 1);
  assert.equal((html.match(/>Criterion 3b —/g) || []).length, 1);
  for (const branch of ["BONE-3a-definitive", "BONE-3a-equivocal", "BONE-3b-definitive", "BONE-3b-equivocal"]) assert.match(html, new RegExp(`data-criterion-branch="${branch}"`));
  assert.match(html, /Meet either imaging pathway below\./);
});

test("shared facts render in each criterion and synchronize through one evidence ID", () => {
  const unchecked = render("BONE");
  const checked = render("BONE", { "bone-fever": "met" });
  assert.equal((unchecked.match(/data-evidence-id="bone-fever"/g) || []).length, 5);
  assert.equal((checked.match(/data-evidence-id="bone-fever" checked/g) || []).length, 5);
  assert.match(readFileSync(new URL("./app.js", import.meta.url), "utf8"), /state\.siteEvidence\[input\.dataset\.evidenceId\]/);
});

test("one shared finding cannot count twice inside a two-finding criterion", () => {
  const oneFinding = { "bone-fever": "met", "bone-definitive-imaging": "met" };
  assert.equal(evaluateSecondarySite({ siteCode: "BONE", evidence: oneFinding }).siteDefinitionMet, false);
  assert.match(criterionHtml(render("BONE", oneFinding), "BONE-3b-definitive"), /One still needed/);
  assert.equal(evaluateSecondarySite({ siteCode: "BONE", evidence: { ...oneFinding, "bone-swelling": "met" } }).metCriterion, "BONE-3b-definitive");
});

test("branch-specific evidence remains separate", () => {
  const evidence = { "bone-equivocal-imaging": "met", "bone-physician-diagnosis": "met", "bone-gross-histopathologic-evidence": "met" };
  const html = render("BONE", evidence);
  assert.doesNotMatch(html, /data-evidence-id="bone-definitive-imaging" checked/);
  assert.doesNotMatch(html, /data-evidence-id="bone-antimicrobial-treatment" checked/);
  assert.doesNotMatch(html, /data-evidence-id="bone-site-organism" checked|data-evidence-id="bone-blood-organism" checked/);
  assert.match(html, /data-evidence-id="bone-gross-histopathologic-evidence" checked/);
});

test("BJ status uses the closest incomplete pathway and stops listing alternatives once met", () => {
  const incomplete = render("BONE", { "bone-definitive-imaging": "met", "bone-fever": "met" });
  assert.match(incomplete, /Closest pathway: Criterion 3b — localized findings and definitive imaging/);
  assert.match(incomplete, /One qualifying finding/);
  const met = render("BONE", { "bone-site-organism": "met" });
  assert.match(met, /BONE Site Definition Met/);
  assert.doesNotMatch(met.slice(0, met.indexOf('data-men-renderer')), /Closest pathway:|Still needed:/);
});

test("two-finding groups use accurate copy", () => {
  assert.match(render("BONE"), /Select TWO qualifying findings\./);
  assert.doesNotMatch(criterionHtml(render("BONE"), "BONE-3b-definitive"), /Select ONE qualifying supporting test/);
});

test("site switching clears evidence and prevents stale synchronized selections", () => {
  const state = { siteCode: "BONE", evidence: { "bone-fever": "met" }, organismRelationship: "yes", attributionTiming: "yes" };
  assert.deepEqual(selectSecondarySite(state, "DISC"), { ...state, siteCode: "DISC", evidence: {}, organismRelationship: "", attributionTiming: "" });
});

test("exhaustive evaluator snapshots are unchanged for every BJ pathway", () => {
  for (const siteCode of sites) {
    const definition = secondarySiteDefinitions[siteCode];
    const ids = [...new Set([...atoms(definition).map(({ id }) => id), ...definition.exclusions.map(({ id }) => id)])];
    const hash = createHash("sha256");
    for (let mask = 0; mask < 2 ** ids.length; mask += 1) {
      const evidence = Object.fromEntries(ids.map((id, index) => [id, mask & 2 ** index ? "met" : "notMet"]));
      const result = evaluateSecondarySite({ siteCode, evidence });
      hash.update(JSON.stringify([result.status, result.siteDefinitionMet, result.metCriterion || null]));
    }
    assert.equal(hash.digest("hex"), expectedSnapshots[siteCode], siteCode);
  }
});

test("non-BJ rendering retains its prior multi-open presentation", () => {
  const html = render("MEN");
  assert.equal((html.match(/data-men-criterion="MEN-[^"]+" open/g) || []).length, 2);
  assert.match(html, /Select findings from TWO different groups/);
  assert.match(html, /Select ONE qualifying supporting test/);
  assert.doesNotMatch(html, /Closest pathway:/);
});

test("safe BJ renders produce no console errors", () => {
  const original = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try { for (const siteCode of sites) render(siteCode); } finally { console.error = original; }
  assert.deepEqual(errors, []);
});
