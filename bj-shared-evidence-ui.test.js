import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
function render(siteCode, evidence = {}) {
  const definition = secondarySiteDefinitions[siteCode];
  return renderCompactMenEvidence({ definition, evaluation: evaluateSecondarySite({ siteCode, evidence }), evidence });
}
function checkboxIds(html) { return [...html.matchAll(/<input\b[^>]*data-evidence-id="([^"]+)"[^>]*>/g)].map((match) => match[1]); }

test("every BJ evidence fact renders exactly once and no rendered IDs are duplicated", () => {
  for (const siteCode of sites) {
    const definition = secondarySiteDefinitions[siteCode];
    const expected = new Set([...atoms(definition).map(({ id }) => id), ...definition.exclusions.map(({ id }) => id)]);
    const ids = checkboxIds(render(siteCode));
    assert.equal(ids.length, expected.size, siteCode);
    assert.deepEqual(new Set(ids), expected, siteCode);
  }
});

test("shared evidence IDs explicitly map to every legitimate criterion reference", () => {
  const expected = {
    "bone-fever": ["BONE-3a-definitive", "BONE-3a-equivocal", "BONE-3b-definitive", "BONE-3b-equivocal", "BONE-3c"],
    "disc-fever": ["DISC-3a-definitive", "DISC-3a-equivocal", "DISC-3b-definitive", "DISC-3b-equivocal"],
    "jnt-suspected-infection": ["JNT-3a", "JNT-3c", "JNT-3d-definitive", "JNT-3d-equivocal"],
    "pji-organ-space-after-hpro-kpro": ["PJI-1", "PJI-2", "PJI-3"]
  };
  for (const [id, criterionIds] of Object.entries(expected)) {
    const definition = Object.values(secondarySiteDefinitions).find((entry) => atoms(entry).some((atom) => atom.id === id));
    const actual = definition.criteria.filter((criterion) => atoms({ criteria: [criterion] }).some((atom) => atom.id === id)).map(({ id: criterionId }) => criterionId);
    assert.deepEqual(actual, criterionIds, id);
    assert.equal(checkboxIds(render(definition.siteCode)).filter((renderedId) => renderedId === id).length, 1);
  }
});

test("one finding is shared across branches but cannot satisfy a two-finding group twice", () => {
  const oneFinding = { "bone-fever": "met", "bone-definitive-imaging": "met" };
  assert.equal(evaluateSecondarySite({ siteCode: "BONE", evidence: oneFinding }).siteDefinitionMet, false);
  assert.match(render("BONE", oneFinding), /One qualifying finding from/);
  const twoFindings = { ...oneFinding, "bone-swelling": "met" };
  assert.equal(evaluateSecondarySite({ siteCode: "BONE", evidence: twoFindings }).metCriterion, "BONE-3b-definitive");
});

test("branch-specific imaging, diagnosis, and treatment evidence remains separate", () => {
  const boneIds = checkboxIds(render("BONE"));
  for (const id of ["bone-definitive-imaging", "bone-equivocal-imaging", "bone-physician-diagnosis", "bone-antimicrobial-treatment"]) assert.equal(boneIds.filter((entry) => entry === id).length, 1);
  assert.equal(evaluateSecondarySite({ siteCode: "BONE", evidence: { "bone-fever": "met", "bone-swelling": "met", "bone-equivocal-imaging": "met" } }).siteDefinitionMet, false);
});

test("completed BJ criteria collapse and expose compact logic summaries", () => {
  const html = render("BONE", { "bone-site-organism": "met" });
  assert.match(html, /✓ Criterion 1 — organism identified from bone met/);
  assert.doesNotMatch(html, /data-men-criterion="BONE-1" open/);
  assert.match(html, /Still needed:/);
  assert.equal((html.match(/bone-fever/g) || []).length, 1);
});

test("site switching clears BJ evidence and does not retain stale selections", () => {
  const state = { siteCode: "BONE", evidence: { "bone-fever": "met" }, organismRelationship: "yes", attributionTiming: "yes" };
  assert.deepEqual(selectSecondarySite(state, "DISC"), { ...state, siteCode: "DISC", evidence: {}, organismRelationship: "", attributionTiming: "" });
});

test("exhaustive before-and-after evaluator snapshots remain identical", () => {
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

test("non-BJ rendering retains criterion-local evidence presentation", () => {
  const html = render("MEN");
  assert.doesNotMatch(html, /data-evidence-section=/);
  assert.match(html, /Select findings from TWO different groups/);
  assert.match(html, /Select ONE qualifying supporting test/);
});
