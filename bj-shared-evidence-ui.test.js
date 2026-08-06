import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, selectSecondarySite } from "./secondary/evaluator.js";
import { secondarySiteDefinitions } from "./secondary/registry.js";

const sites = ["BONE", "DISC", "JNT", "PJI"];
// Behaviour-lock hashes over every evidence combination. Rebaselined 2026-08-05 for the
// Chapter 17 fidelity corrections documented in
// docs/audits/2026-secondary-bsi-and-pneu-fidelity-audit.md: BONE 3b no longer demands a
// physician diagnosis (17-8), JNT 3a/3b are separate sub-criteria (17-9), and PJI
// criterion 3 exposes all seven minor criteria including elevated synovial fluid WBC
// (17-9–17-10). DISC is unchanged. Only change these with a manual citation.
const expectedSnapshots = Object.freeze({
  BONE: "293b47d662227666bdd594c57b1ef5e65ff0fb8c5ebdb4357272a352ec31e3ad",
  DISC: "94d2cb6ad525edd8c9d0c4e575af9ef40a07bdd0fd82bba5f3cb2c4300eea885",
  JNT: "f61e362964bed9113477e6c72cc3b920774db53d0c787b031fe51a1cc34ac97e",
  PJI: "b031a12e52c4aab36e59194b91399945b229bcb79547048b591e0d9fdaad31eb"
});

function atoms(definition) {
  return definition.criteria.flatMap((criterion) => [...criterion.allOf, ...(criterion.groups || []).flatMap((group) => group.anyOf.flatMap((entry) => entry.anyOf || [entry]))]);
}
function render(siteCode, evidence = {}, openCriterion = "", openCriteria) {
  const definition = secondarySiteDefinitions[siteCode];
  return renderCompactMenEvidence({ definition, evaluation: evaluateSecondarySite({ siteCode, evidence }), evidence, openCriterion, openCriteria });
}
function criterionHtml(html, criterionId) {
  const presentationId = criterionId
    .replace(/^(BONE-3[ab])-.+$/, "$1")
    .replace(/^(DISC-3b):.+$/, "$1")
    .replace(/^(JNT-3d):.+$/, "$1");
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

test("DISC 3b and JNT 3d each render once with explicit imaging alternatives", () => {
  for (const [siteCode, criterionNumber] of [["DISC", "3b"], ["JNT", "3d"]]) {
    const html = render(siteCode);
    assert.equal((html.match(new RegExp(`data-men-criterion="${siteCode}-${criterionNumber}"`, "g")) || []).length, 1);
    assert.equal((html.match(new RegExp(`>Criterion ${criterionNumber} —`, "g")) || []).length, 1);
    for (const branch of ["definitive-imaging", "equivocal-imaging"]) assert.match(html, new RegExp(`data-criterion-branch="${siteCode}-${criterionNumber}:${branch}"`));
    assert.match(html, /Meet ONE complete pathway below\./);
  }
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

// The requirement instruction is derived from the requirement itself. It must not name a
// specific kind of evidence, because these groups hold signs, symptoms, laboratory
// results, imaging findings or minor criteria depending on the site.
test("requirement instructions state the count without mislabelling the evidence type", () => {
  assert.match(render("BONE"), /Select TWO of the following, from separate options\./);
  assert.doesNotMatch(render("BONE"), /qualifying supporting test/);
  assert.doesNotMatch(render("USI"), /qualifying supporting test/);
  assert.match(render("USI"), /Select ONE of the following\./);
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
  assert.match(html, /Select ONE of the following\./);
  assert.doesNotMatch(html, /Closest pathway:/);
});

test("safe BJ renders produce no console errors", () => {
  const original = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try { for (const siteCode of sites) render(siteCode); } finally { console.error = original; }
  assert.deepEqual(errors, []);
});
