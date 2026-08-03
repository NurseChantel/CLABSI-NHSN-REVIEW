import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePnu1, evaluatePnu2, PNU2_PROTOCOL, renderCompactPnu2, renderPnu2Safely } from "./protocol/index.js";
import { implementedSecondaryPathways } from "./secondary/registry.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";

const context = () => ({ dateOfBirth: "1980-01-01", hostStatus: { status: "notMet", reasons: [] }, ventilator: { inPlace: false, periods: [] } });
const image = (id, date = "2026-01-10") => ({ id, date, modality: "chest-xray", findings: ["infiltrate"], interpretation: "definitive", attributedToOtherCondition: false });
const organism = (id = "eligible-bacterium", tags = ["bacterium"]) => ({ id, tags });
const lab = (overrides = {}) => ({ id: "lab", specimenType: "blood", collectionDate: "2026-01-10", testMethod: "culture", organism: organism(), resultType: "qualitative", positive: true, contaminated: false, excluded: false, ...overrides });
const base = overrides => ({ patientContext: context(), admissionDate: "2026-01-01", underlyingPulmonaryOrCardiacDisease: false, soleAvailableImage: false,
  imagingStudies: [image("i1"), image("i2", "2026-01-12")], imagingRelationships: [{ fromStudyId: "i1", toStudyId: "i2", type: "persistent" }],
  measurements: [{ id: "t", kind: "temperature", value: 38.1, unit: "C", date: "2026-01-10" }], clinicalFindings: [{ id: "s", kind: "sputum-change", date: "2026-01-10" }],
  microbiologyResults: [lab()], histopathologyResults: [], bloodResults: [], ...overrides });

test("common bacterial PNU2 identification branches preserve specimen eligibility", () => {
  assert.equal(evaluatePnu2(base()).value.met, true);
  assert.equal(evaluatePnu2(base({ microbiologyResults: [lab({ specimenType: "pleural-fluid", collectionTechnique: "thoracentesis" })] })).value.met, true);
  assert.equal(evaluatePnu2(base({ microbiologyResults: [lab({ specimenType: "pleural-fluid", collectionTechnique: "chest-tube-after-24-hours" })] })).value.met, false);
});

test("every Table 5 culture branch enforces exact quantitative boundaries and explicit units", () => {
  for (const [specimenType, value, unit] of [["lung-tissue", 1e4, "CFU/g"], ["bronchoscopic-bal", 1e4, "CFU/ml"], ["protected-specimen-brushing", 1e3, "CFU/ml"], ["nonbronchoscopic-bal", 1e4, "CFU/ml"], ["endotracheal-aspirate", 1e5, "CFU/ml"]]) {
    const at = lab({ specimenType, resultType: "quantitative", value, unit, positive: undefined });
    assert.equal(evaluatePnu2(base({ microbiologyResults: [at] })).value.met, true, specimenType);
    assert.equal(evaluatePnu2(base({ microbiologyResults: [{ ...at, value: value - 1 }] })).value.met, false, `${specimenType} below threshold`);
  }
});

test("semiquantitative fallback remains conditional and has exact lower boundary", () => {
  const result = lab({ specimenType: "bronchoscopic-bal", resultType: "semiquantitative", category: "2+", positive: undefined, laboratoryUnableToProvideQuantitativeCorrespondence: true });
  assert.equal(evaluatePnu2(base({ microbiologyResults: [result] })).value.met, true);
  assert.equal(evaluatePnu2(base({ microbiologyResults: [{ ...result, category: "1+" }] })).value.met, false);
  assert.equal(evaluatePnu2(base({ microbiologyResults: [{ ...result, laboratoryUnableToProvideQuantitativeCorrespondence: false }] })).value.met, false);
});

test("BAL intracellular bacteria and both histopathology alternatives are independent", () => {
  const bal = lab({ specimenType: "bronchoscopic-bal", testMethod: "direct-microscopy", resultType: "quantitative", value: 5, unit: "percent-cells", positive: undefined });
  assert.equal(evaluatePnu2(base({ microbiologyResults: [bal] })).value.met, true);
  assert.equal(evaluatePnu2(base({ microbiologyResults: [{ ...bal, value: 4.99 }] })).value.met, false);
  for (const finding of ["abscess-or-consolidation-with-intense-pmn", "fungal-hyphae-or-pseudohyphae-invading-parenchyma"]) assert.equal(evaluatePnu2(base({ microbiologyResults: [], histopathologyResults: [{ id: finding, date: "2026-01-10", finding }] })).value.met, true);
});

test("Table 3 branches remain independently evaluable and reject ASC/AST", () => {
  const legionella = organism("legionella-pneumophila-serogroup-1", ["legionella"]);
  const cases = [lab({ specimenType: "respiratory-secretions", testMethod: "non-culture-diagnostic-test", organism: organism("virus", ["virus"]) }),
    lab({ specimenType: "paired-sera", testMethod: "igg", organism: organism("mycoplasma", ["mycoplasma"]), resultType: "quantitative", value: 4, unit: "fold-rise", positive: undefined }),
    lab({ specimenType: "paired-sera", testMethod: "ifa", organism: legionella, resultType: "quantitative", value: 4, unit: "fold-rise", positive: undefined }),
    lab({ specimenType: "urine", testMethod: "eia", organism: legionella })];
  for (const result of cases) assert.equal(evaluatePnu2(base({ microbiologyResults: [result] })).value.met, true, result.testMethod);
  assert.equal(evaluatePnu2(base({ microbiologyResults: [lab({ specimenType: "respiratory-secretions", testMethod: "ast", organism: organism("virus", ["virus"]) })] })).value.met, false);
});

test("organism exclusions and restricted-organism specimen rules are enforced", () => {
  assert.equal(evaluatePnu2(base({ microbiologyResults: [lab({ organism: organism("flora", ["oral-flora"]) })] })).value.met, false);
  assert.equal(evaluatePnu2(base({ microbiologyResults: [lab({ organism: organism("candida", ["candida"]) })] })).value.met, false);
  assert.equal(evaluatePnu2(base({ microbiologyResults: [lab({ specimenType: "pleural-fluid", collectionTechnique: "thoracentesis", organism: organism("candida", ["candida"]) })] })).value.met, true);
});

test("IWP, DOE, RIT, imaging, and Secondary BSI attribution are separately reported", () => {
  const blood = lab({ collectionDate: "2026-01-07" }); const result = evaluatePnu2(base({ microbiologyResults: [blood], bloodResults: [blood] })).value;
  assert.equal(result.met, true); assert.equal(result.dateOfEvent, "2026-01-07"); assert.deepEqual([result.infectionWindow.start, result.infectionWindow.end], ["2026-01-07", "2026-01-13"]); assert.deepEqual([result.repeatInfectionTimeframe.start, result.repeatInfectionTimeframe.end], ["2026-01-07", "2026-01-20"]); assert.equal(result.secondaryBsi.met, true);
  assert.equal(evaluatePnu2(base({ microbiologyResults: [{ ...blood, collectionDate: "2026-01-06" }] })).value.met, false);
  assert.equal(evaluatePnu2(base({ imagingStudies: [image("i1")], imagingRelationships: [], soleAvailableImage: true })).value.met, true);
});

test("malformed laboratory, specimen, and organism records fail closed", () => {
  assert.equal(evaluatePnu2(base({ microbiologyResults: [{}] })).status, "validationError");
  assert.equal(evaluatePnu2(base({ microbiologyResults: [lab({ specimenType: "" })] })).status, "validationError");
  assert.equal(evaluatePnu2(base({ microbiologyResults: [lab({ organism: { id: "x" } })] })).status, "validationError");
});

test("compact renderer loads all required sections and hides unmet laboratory branches", () => {
  const evaluation = evaluatePnu2(base()).value; const html = renderCompactPnu2({ evaluation, patientContext: context() });
  for (const heading of ["Patient Context", "Timeline", "Imaging", "Clinical Criteria", "Laboratory Evidence", "Specimen Eligibility", "Exclusions", "PNU2 Status", "Secondary BSI Attribution"]) assert.match(html, new RegExp(heading));
  assert.match(html, /PNU2 Met/); assert.doesNotMatch(html, /legionella-urine-antigen/); assert.match(renderPnu2Safely({}), /could not be loaded/);
});

test("PNU1 and Chapter 17 remain independent and backward compatible", () => {
  assert.equal(evaluatePnu1({ ...base(), microbiologyResults: [] }).value.siteCode, "PNU1");
  assert.equal(PNU2_PROTOCOL.branches.includes("PNU3"), false);
  for (const code of implementedSecondaryPathways) assert.notEqual(evaluateSecondarySite({ siteCode: code }).siteCode, "PNU2");
});
