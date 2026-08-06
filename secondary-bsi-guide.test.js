import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateSecondaryBsiGuide, NEC_EXCEPTION, PROHIBITED_SITES, SCENARIO_DEFINITIONS,
  TABLE_B1_ENTRIES, TABLE_B1_SOURCE, UNIMPLEMENTED_TABLE_B1_SITES
} from "./secondary/secondary-bsi-guide.js";
import { evaluateSecondarySite, secondarySiteDefinitions } from "./secondary-rules.js";

// Source: clabsi nhsn.pdf, Chapter 4, "Appendix: Secondary BSI Guide", Table B1 on printed
// page 4-34 and the Secondary BSI Reporting Instructions on printed page 4-35.

test("Table B1 is cited to Chapter 4 page 4-34", () => {
  assert.equal(TABLE_B1_SOURCE.document, "clabsi nhsn.pdf");
  assert.equal(TABLE_B1_SOURCE.printedPage, "4-34");
  assert.ok(TABLE_B1_ENTRIES.every((entry) => entry.source === TABLE_B1_SOURCE));
});

test("both scenarios carry the three requirements the table states", () => {
  assert.equal(SCENARIO_DEFINITIONS[1].requirements.length, 3);
  assert.equal(SCENARIO_DEFINITIONS[2].requirements.length, 3);
  assert.match(SCENARIO_DEFINITIONS[1].requirements[2], /identified from the site-specific specimen/);
  assert.match(SCENARIO_DEFINITIONS[2].requirements[0], /is an element of the site-specific definition/);
});

// Transcribed verbatim from Table B1, left column.
test("Scenario 1 lists exactly the sites and criteria the table gives", () => {
  const actual = {};
  for (const entry of TABLE_B1_ENTRIES.filter((item) => item.scenario === 1)) {
    (actual[entry.siteCode] ||= []).push(entry.label);
  }
  assert.deepEqual(actual, {
    BONE: ["1"], BRST: ["1"], CARD: ["1"], CIRC: ["2 or 3"], CONJ: ["1a"], DECU: ["1"], DISC: ["1"],
    EAR: ["1, 3, 5 or 7"], EMET: ["1"], ENDO: ["1"], EYE: ["1"], GE: ["2a"], GIT: ["2a", "2b (only yeast)"],
    IAB: ["1 or 3a"], IC: ["1"], JNT: ["1"], LUNG: ["1"], MED: ["1"], MEN: ["1"],
    ORAL: ["1", "3a", "3d (only yeast)"], OREP: ["1"], PJI: ["1", "3e"], SA: ["1"], SINU: ["1"],
    SKIN: ["2a"], ST: ["1"], UMB: ["1a"], UR: ["1a", "3a"], USI: ["1"], VASC: ["1 (only as SSI)"], VCUF: ["3"]
  });
});

// Transcribed verbatim from Table B1, right column.
test("Scenario 2 lists exactly the sites and criteria the table gives", () => {
  const actual = {};
  for (const entry of TABLE_B1_ENTRIES.filter((item) => item.scenario === 2)) {
    (actual[entry.siteCode] ||= []).push(entry.label);
  }
  assert.deepEqual(actual.BONE, ["3a"]);
  assert.deepEqual(actual.BURN, ["1"]);
  assert.deepEqual(actual.DISC, ["3a"]);
  assert.deepEqual(actual.GIT, ["1b", "2c"]);
  assert.deepEqual(actual.IAB, ["2b", "3b"]);
  assert.deepEqual(actual.JNT, ["3c"]);
  assert.deepEqual(actual.MEN, ["2c", "3c"]);
  assert.deepEqual(actual.OREP, ["3a"]);
  assert.deepEqual(actual.SA, ["3a"]);
  assert.deepEqual(actual.UMB, ["1b"]);
  assert.deepEqual(actual.USI, ["3b", "4b"]);
  assert.deepEqual(actual.ENDO, ["4a", "4b", "4c", "4d (titer excluded)", "4f", "5a", "5b", "5c", "5d (titer excluded)", "5f", "6e", "6e", "7f", "7f"]);
  // 4e and 5e (Bartonella indirect immunofluorescence) are absent from Table B1.
  assert.equal(actual.ENDO.some((label) => label.startsWith("4e") || label.startsWith("5e")), false);
});

test("every criterion id referenced by Table B1 exists in its site definition", () => {
  for (const entry of TABLE_B1_ENTRIES) {
    const definition = secondarySiteDefinitions[entry.siteCode];
    assert.ok(definition, entry.siteCode);
    const ids = definition.criteria.map((criterion) => criterion.id);
    for (const id of entry.criterionIds) assert.ok(ids.includes(id), `${entry.siteCode} ${entry.label}: ${id}`);
  }
});

test("every evidence id referenced by Table B1 exists in its site definition", () => {
  const evidenceIds = (definition) => new Set(definition.criteria.flatMap((criterion) =>
    [criterion, ...(criterion.alternatives ?? [])].flatMap((branch) =>
      [...branch.allOf, ...(branch.groups ?? []).flatMap((group) => group.anyOf.flatMap((option) => option.anyOf ?? [option]))])).map((item) => item.id));
  for (const entry of TABLE_B1_ENTRIES) {
    const ids = evidenceIds(secondarySiteDefinitions[entry.siteCode]);
    for (const id of entry.requiredEvidenceIds) assert.ok(ids.has(id), `${entry.siteCode} ${entry.label}: ${id}`);
  }
});

// Page 4-35: "Do not report secondary bloodstream infection for vascular (VASC)
// infections, ventilator-associated conditions (VAC), infection-related
// ventilator-associated complications (IVAC), or pneumonia 1 (PNU1)."
test("the four prohibited sites are recorded with the Chapter 4 citation", () => {
  assert.deepEqual(Object.keys(PROHIBITED_SITES).sort(), ["IVAC", "PNU1", "VAC", "VASC"]);
  for (const value of Object.values(PROHIBITED_SITES)) assert.equal(value.source.printedPage, "4-35");
  assert.match(PROHIBITED_SITES.VASC.exception, /organ\/space SSI-VASC meeting criterion 1/);
});

test("VASC cannot carry a secondary BSI through the site evaluator", () => {
  const result = evaluateSecondarySite({ siteCode: "VASC", evidence: { "vasc-extracted-vessel-organism": "met" }, organismRelationship: "yes", attributionTiming: "yes" });
  assert.equal(result.siteDefinitionMet, true);
  assert.equal(result.secondaryAttributionMet, false);
  assert.equal(result.status, "secondaryAttributionNotPermitted");
});

test("a criterion Table B1 admits carries the attribution; one it omits does not", () => {
  const met = evaluateSecondarySite({ siteCode: "BONE", evidence: { "bone-site-organism": "met" }, organismRelationship: "yes", attributionTiming: "yes" });
  assert.equal(met.secondaryAttributionMet, true);
  assert.deepEqual(met.secondaryBsiGuide.scenarios, [1]);

  // BONE 2 (gross anatomic or histopathologic evidence) is absent from both columns.
  const omitted = evaluateSecondarySite({ siteCode: "BONE", evidence: { "bone-gross-histopathologic-evidence": "met" }, organismRelationship: "yes", attributionTiming: "yes" });
  assert.equal(omitted.siteDefinitionMet, true);
  assert.equal(omitted.secondaryAttributionMet, false);
  assert.equal(omitted.status, "secondaryAttributionCriterionNotEligible");
  assert.match(omitted.message, /Table B1 does not list BONE-2/);
});

// Table B1 names lettered sub-options for several sites; the evidence actually recorded
// decides whether the qualifying option was the one used.
test("lettered sub-criteria resolve against the recorded evidence", () => {
  const base = { suspected: "met", fever: "met", "meningeal-signs": "met" };
  const viaBlood = evaluateSecondaryBsiGuide({ siteCode: "MEN", metCriterion: "MEN-2", evidence: { ...base, "blood-organism": "met" } });
  assert.equal(viaBlood.eligible, true);
  assert.deepEqual(viaBlood.scenarios, [2]);

  const viaGramStain = evaluateSecondaryBsiGuide({ siteCode: "MEN", metCriterion: "MEN-2", evidence: { ...base, "csf-gram-stain": "met" } });
  assert.equal(viaGramStain.eligible, false);

  // USI 3 met through purulent drainage is sub-criterion 3a, which Table B1 omits.
  assert.equal(evaluateSecondaryBsiGuide({ siteCode: "USI", metCriterion: "USI-3", evidence: { "usi-fever": "met", "usi-purulent-drainage": "met" } }).eligible, false);
  assert.equal(evaluateSecondaryBsiGuide({ siteCode: "USI", metCriterion: "USI-3", evidence: { "usi-fever": "met", "usi-blood-organism": "met", "usi-definitive-imaging": "met" } }).eligible, true);
});

test("both BONE scenarios are reachable from their own criteria", () => {
  assert.deepEqual(evaluateSecondaryBsiGuide({ siteCode: "BONE", metCriterion: "BONE-1" }).scenarios, [1]);
  assert.deepEqual(evaluateSecondaryBsiGuide({ siteCode: "BONE", metCriterion: "BONE-3a-definitive" }).scenarios, [2]);
  assert.deepEqual(evaluateSecondaryBsiGuide({ siteCode: "BONE", metCriterion: "BONE-3b-definitive" }).scenarios, []);
});

// Figure B1 footnote, printed page 4-45. NEC sits outside Scenarios 1 and 2.
test("the NEC exception is carried separately from Table B1", () => {
  assert.equal(NEC_EXCEPTION.siteCode, "NEC");
  assert.equal(NEC_EXCEPTION.source.printedPage, "4-45");
  assert.match(NEC_EXCEPTION.message, /LCBI pathogen or the same common commensal is identified from 2 or more blood specimens/);
  assert.equal(TABLE_B1_ENTRIES.some((entry) => entry.siteCode === "NEC"), false);
  assert.equal(evaluateSecondaryBsiGuide({ siteCode: "NEC", metCriterion: "NEC-2" }).necException, NEC_EXCEPTION);
});

// CDI is absent from Table B1 entirely, which is the source for the organism-eligibility
// engine reporting CDI as unable to carry a secondary BSI.
test("CDI is absent from Table B1", () => {
  assert.equal(TABLE_B1_ENTRIES.some((entry) => entry.siteCode === "CDI"), false);
  assert.equal(evaluateSecondaryBsiGuide({ siteCode: "CDI", metCriterion: "CDI-1" }).listedInTableB1, false);
});

test("Table B1 sites defined in chapters this app does not carry are recorded as gaps", () => {
  assert.deepEqual(UNIMPLEMENTED_TABLE_B1_SITES.map((item) => item.siteCode).sort(), ["ABUTI", "PNEU", "SSI", "SUTI"]);
  for (const item of UNIMPLEMENTED_TABLE_B1_SITES) assert.ok(item.chapter);
});
