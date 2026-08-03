import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePnu1, evaluatePnu2, evaluatePnu3, PNU3_PROTOCOL, renderCompactPnu3, renderPnu3Safely } from "./protocol/index.js";
import { implementedSecondaryPathways } from "./secondary/registry.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";

const context = () => ({ dateOfBirth: "1980-01-01", hostStatus: { status: "notMet", reasons: [] }, ventilator: { inPlace: false, periods: [] } });
const image = (id, date = "2026-01-16") => ({ id, date, modality: "chest-xray", findings: ["infiltrate"], interpretation: "definitive", attributedToOtherCondition: false });
const organism = (id = "aspergillus", tags = ["fungus"]) => ({ id, tags });
const lab = (overrides = {}) => ({ id: "lab", specimenType: "bronchoscopic-bal", collectionDate: "2026-01-16", testMethod: "culture", organism: organism(), resultType: "qualitative", positive: true, contaminated: false, excluded: false, minimallyContaminated: true, ...overrides });
const host = (type = "leukemia", overrides = {}) => ({ id: type, type, present: true, ...overrides });
const base = overrides => ({ patientContext: context(), admissionDate: "2026-01-01", underlyingPulmonaryOrCardiacDisease: false, soleAvailableImage: false,
  imagingStudies: [image("i1"), image("i2", "2026-01-18")], imagingRelationships: [{ fromStudyId: "i1", toStudyId: "i2", type: "persistent" }],
  measurements: [{ id: "t", kind: "temperature", value: 38.1, unit: "C", date: "2026-01-16" }], clinicalFindings: [], hostEvidence: [host()], microbiologyResults: [lab()], histopathologyResults: [], bloodResults: [], ...overrides });

test("every Footnote 10 host branch is independent and boundary exact", () => {
  const cases = [
    { id: "anc", type: "neutropenia-anc", value: 499, unit: "cells/mm3", date: "2026-01-16" },
    { id: "wbc", type: "neutropenia-wbc", value: 499, unit: "cells/mm3", date: "2026-01-16" }, host("leukemia"), host("lymphoma"),
    { id: "hiv", type: "hiv-cd4", hivPositive: true, cd4Count: 199, unit: "cells/mm3" }, host("splenectomy"), host("solid-organ-transplant"), host("hematopoietic-stem-cell-transplant"),
    { id: "chemo", type: "cytotoxic-chemotherapy", activeOnDate: "2026-01-16" }, { id: "steroid", type: "systemic-steroids", route: "enteral", daily: true, startDate: "2026-01-02", endDate: "2026-01-16" }
  ];
  for (const evidence of cases) assert.equal(evaluatePnu3(base({ hostEvidence: [evidence] })).value.met, true, evidence.type);
  assert.equal(evaluatePnu3(base({ hostEvidence: [{ ...cases[0], value: 500 }] })).value.met, false);
  assert.equal(evaluatePnu3(base({ hostEvidence: [{ ...cases[4], cd4Count: 200 }] })).value.met, false);
  assert.equal(evaluatePnu3(base({ hostEvidence: [{ ...cases.at(-1), startDate: "2026-01-03" }] })).value.met, false);
  assert.equal(evaluatePnu3(base({ hostEvidence: [{ ...cases.at(-1), route: "inhaled" }] })).value.met, false);
});

test("PNU3 native Candida and three non-Candida fungal laboratory routes remain separate", () => {
  const candida = organism("candida-albicans", ["fungus", "candida"]); const blood = lab({ id: "blood", specimenType: "blood", organism: candida }); const respiratory = lab({ id: "resp", specimenType: "sputum", organism: candida, minimallyContaminated: undefined });
  assert.equal(evaluatePnu3(base({ microbiologyResults: [blood, respiratory], bloodResults: [blood] })).value.met, true);
  assert.equal(evaluatePnu3(base({ microbiologyResults: [blood, { ...respiratory, organism: organism("candida-glabrata", ["fungus", "candida"]) }] })).value.met, false);
  for (const method of ["direct-microscopy", "culture", "non-culture-diagnostic-test"]) assert.equal(evaluatePnu3(base({ microbiologyResults: [lab({ testMethod: method })] })).value.met, true, method);
  assert.equal(evaluatePnu3(base({ microbiologyResults: [lab({ minimallyContaminated: false })] })).value.met, false);
  assert.equal(evaluatePnu3(base({ microbiologyResults: [lab({ organism: candida })] })).value.met, false);
});

test("all PNU2 laboratory families are available without making PNU2 a prerequisite", () => {
  const bacterialBlood = lab({ specimenType: "blood", organism: organism("bacterium", ["bacterium"]) });
  const result = evaluatePnu3(base({ clinicalFindings: [{ id: "pain", kind: "pleuritic-chest-pain", date: "2026-01-16" }], measurements: [], microbiologyResults: [bacterialBlood] })).value;
  assert.equal(result.met, true); assert.equal(result.laboratoryEvidence.branches.find(item => item.id === "pnu2-laboratory").met, true);
});

test("imaging, IWP, DOE, RIT, and SBAP endpoints are calculated separately", () => {
  const result = evaluatePnu3(base()).value; assert.equal(result.met, true); assert.equal(result.dateOfEvent, "2026-01-16");
  assert.deepEqual([result.infectionWindow.start, result.infectionWindow.end], ["2026-01-13", "2026-01-19"]); assert.deepEqual([result.repeatInfectionTimeframe.start, result.repeatInfectionTimeframe.end], ["2026-01-16", "2026-01-29"]);
  assert.equal(evaluatePnu3(base({ microbiologyResults: [lab({ collectionDate: "2026-01-12" })] })).value.met, false);
  assert.equal(evaluatePnu3(base({ imagingStudies: [image("i1")], imagingRelationships: [], soleAvailableImage: true })).value.met, true);
});

test("secondary BSI requires site qualification, matching organism, and attribution timing", () => {
  const candida = organism("candida-albicans", ["fungus", "candida"]); const blood = lab({ id: "blood", specimenType: "blood", organism: candida, collectionDate: "2026-01-13" }); const respiratory = lab({ id: "resp", specimenType: "sputum", organism: candida });
  assert.equal(evaluatePnu3(base({ microbiologyResults: [blood, respiratory], bloodResults: [blood] })).value.secondaryBsi.met, true);
  assert.equal(evaluatePnu3(base({ microbiologyResults: [blood, respiratory], bloodResults: [{ ...blood, collectionDate: "2025-12-31" }] })).value.secondaryBsi.timingMet, false);
  assert.equal(evaluatePnu3(base({ bloodResults: [lab({ specimenType: "blood", organism: organism("other", ["bacterium"]) })] })).value.secondaryBsi.met, false);
});

test("malformed host and laboratory data fail closed", () => {
  assert.equal(evaluatePnu3(base({ hostEvidence: [{}] })).status, "validationError");
  assert.equal(evaluatePnu3(base({ hostEvidence: [{ id: "h", type: "hiv-cd4", hivPositive: "yes", cd4Count: 1, unit: "cells/mm3" }] })).status, "validationError");
  assert.equal(evaluatePnu3(base({ microbiologyResults: [{}] })).status, "validationError");
});

test("compact renderer loads required sections and shows only applicable hosts", () => {
  const evaluation = evaluatePnu3(base()).value; const html = renderCompactPnu3({ evaluation, patientContext: context() });
  for (const heading of ["Patient Context", "Host Eligibility", "Timeline", "Imaging", "Clinical Criteria", "Laboratory Evidence", "Specimen Eligibility", "Exclusions", "PNU3 Status", "Secondary BSI Attribution"]) assert.match(html, new RegExp(heading));
  assert.match(html, /leukemia/); assert.doesNotMatch(html, /splenectomy/); assert.match(renderPnu3Safely({}), /could not be loaded/);
});

test("PNU1, PNU2, and every Chapter 17 pathway remain independent", () => {
  assert.equal(evaluatePnu1({ ...base(), hostEvidence: undefined, microbiologyResults: [] }).value.siteCode, "PNU1"); assert.equal(evaluatePnu2(base()).value.siteCode, "PNU2");
  assert.equal(PNU3_PROTOCOL.laboratoryBranches.includes("PNU1"), false); for (const code of implementedSecondaryPathways) assert.notEqual(evaluateSecondarySite({ siteCode: code }).siteCode, "PNU3");
});
