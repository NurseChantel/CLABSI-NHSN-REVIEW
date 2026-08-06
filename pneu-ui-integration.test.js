import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { addLabAlternative, addPnu3CandidaPair, addPneuRecord, createPneuState, evaluatePneuSubtype, PNEU_UI_REGISTRY, removePneuRecord, renderPneuAbstraction, selectHostAlternative, selectLabAlternative, toggleClinicalFinding, toggleImageFinding, toggleManualBullet } from "./protocol/pneu-ui.js";
import { evaluatePnu1 } from "./protocol/pnu1.js";
import { evaluatePnu2 } from "./protocol/pnu2.js";
import { secondarySiteDefinitions } from "./secondary/registry.js";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const normalUi = rendered => rendered.split("<details><summary>Developer diagnostics</summary>")[0];
function dateContext(input, dob = "1980-01-01") { input.patientContext.dateOfBirth = dob; input.admissionDate = "2026-01-01"; input.imagingStudies[0].date = "2026-01-10"; }

 test("PNEU navigation is grouped with the secondary BSI categories and exposes each subtype", () => {
  assert.match(html, /1\. Secondary BSI categories/);
  assert.match(html, /id="siteButtons"[^>]*aria-label="Secondary BSI categories"/);
  assert.match(app, /data-review-family="pneu"/);
  assert.doesNotMatch(html, /Site-specific infection definitions/);
  assert.match(html, /data-pneu-subtype="PNU1"/); assert.match(html, /data-pneu-subtype="PNU2"/);
  assert.match(html, /data-pneu-subtype="PNU3" aria-pressed="false"/);
  assert.equal(PNEU_UI_REGISTRY.PNU3.implemented, true);
});

// NHSN pneumonia.pdf Table 1, printed page 6-6, prints all three age pathways stacked in
// one Signs/Symptoms cell, separated by shaded ALTERNATE CRITERIA bands. The review page
// mirrors that layout rather than hiding the pathways the patient's age does not activate.
test("PNU1 renders every manual age pathway stacked in one Signs/Symptoms cell", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU1, "1950-03-02");
  const rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /Table 1: Specific Site Algorithms for Clinically Defined Pneumonia \(PNU1\)/);
  assert.match(rendered, /For <b>ANY PATIENT<\/b>, at least <u>one<\/u> of the following:/);
  assert.match(rendered, /ALTERNATE CRITERIA, for infants ≤ 1 year old/);
  assert.match(rendered, /ALTERNATE CRITERIA, for child > 1 year old or ≤ 12 years old/);
  for (const heading of ["Imaging Test Evidence", "Signs / Symptoms"]) assert.match(rendered, new RegExp(heading));
  assert.match(rendered, /pneu-manual-grid cols-2/);
});

test("the age-applicable PNU1 pathway is marked active and the others are marked inactive", () => {
  const adult = createPneuState(); dateContext(adult.inputs.PNU1, "1950-03-02");
  let rendered = renderPneuAbstraction(adult, "PNU1");
  assert.match(rendered, /data-pathway="PNU1-any-patient"[^>]*/);
  assert.match(rendered, /<section class="pneu-pathway applicable[^"]*" data-pathway="PNU1-any-patient"/);
  assert.match(rendered, /<section class="pneu-pathway inapplicable[^"]*" data-pathway="PNU1-infant"/);

  const infant = createPneuState(); dateContext(infant.inputs.PNU1, "2025-06-01");
  rendered = renderPneuAbstraction(infant, "PNU1");
  assert.match(rendered, /<section class="pneu-pathway applicable[^"]*" data-pathway="PNU1-infant"/);
  assert.match(rendered, /<section class="pneu-pathway inapplicable[^"]*" data-pathway="PNU1-child"/);

  const child = createPneuState(); dateContext(child.inputs.PNU1, "2020-01-01");
  rendered = renderPneuAbstraction(child, "PNU1");
  assert.match(rendered, /<section class="pneu-pathway applicable[^"]*" data-pathway="PNU1-child"/);
});

test("every criterion bullet carries a checkbox and reports its group minimum", () => {
  const state = createPneuState(); const input = state.inputs.PNU1; dateContext(input, "1950-03-02");
  let rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /And at least <u>two<\/u> of the following \(from separate bullets\):/);
  assert.match(rendered, /data-manual-bullet="PNU1-any-patient:respiratory:sputum"/);
  assert.match(rendered, /<span class="pneu-block-counter ">0 of 2<\/span>/);

  toggleManualBullet(input, "PNU1-any-patient:respiratory:sputum", true);
  rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /<span class="pneu-block-counter ">1 of 2<\/span>/);

  // A second finding from the same bullet must not advance the count.
  toggleClinicalFinding(input, "increased-suctioning", true, "2026-01-10");
  rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /<span class="pneu-block-counter ">1 of 2<\/span>/);

  toggleManualBullet(input, "PNU1-any-patient:respiratory:rales", true);
  rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /<span class="pneu-block-counter met">2 of 2<\/span>/);
});

test("ticking a bullet records dated evidence the evaluator can actually use", () => {
  const state = createPneuState(); const input = state.inputs.PNU1; dateContext(input, "1950-03-02");
  toggleManualBullet(input, "PNU1-any-patient:systemic:fever", true);
  assert.deepEqual(input.measurements, [{ id: "measurement-temperature", kind: "temperature", value: 38.5, unit: "C", date: "2026-01-10" }]);
  toggleManualBullet(input, "PNU1-any-patient:respiratory:sputum", true);
  assert.equal(input.clinicalFindings[0].date, "2026-01-10");
  toggleManualBullet(input, "PNU1-any-patient:systemic:fever", false);
  assert.deepEqual(input.measurements, []);
});

test("the outstanding-requirements panel names each unmet requirement and the shortfall", () => {
  const state = createPneuState(); const input = state.inputs.PNU1; dateContext(input, "1950-03-02");
  input.imagingStudies[0].findings = ["infiltrate"];
  let rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /3 requirements outstanding/);
  assert.match(rendered, /0 of 2 required bullets selected — select 2 more from a different bullet/);

  toggleManualBullet(input, "PNU1-any-patient:systemic:fever", true);
  toggleManualBullet(input, "PNU1-any-patient:respiratory:sputum", true);
  rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /2 requirements outstanding/);
  assert.match(rendered, /1 of 2 required bullets selected — select 1 more from a different bullet/);

  toggleManualBullet(input, "PNU1-any-patient:respiratory:rales", true);
  input.soleAvailableImage = true;
  rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /PNU1 — MET/);
  assert.match(rendered, /PNU1 definition met/);
  assert.doesNotMatch(rendered, /requirements outstanding/);
});

test("infant and child pathways present their exact manual minima", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU1, "2025-06-01");
  const rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /And at least <u>three<\/u> of the following \(from separate bullets\):/);
  assert.match(rendered, /Bradycardia \(&lt; 100 beats\/min\) or tachycardia \(&gt; 170 beats\/min\)/);
  assert.match(rendered, /nasal flaring with retraction of chest wall, or nasal flaring with grunting/);
  assert.match(rendered, /hypothermia \(&lt; 36.0°C or &lt; 96.8°F\)/);
});

test("guided imaging distinguishes sole available study from one entered study", () => {
  const state = createPneuState(); const input = state.inputs.PNU1; dateContext(input);
  assert.equal(input.soleAvailableImage, false); let rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /Qualifying one-study exception/);
  addPneuRecord(input, "imagingStudies"); rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /Pattern/);
});

// Tables 2 and 3 (printed pages 6-7 and 6-8) are two separate three-column algorithms.
// Meeting either one qualifies PNU2, so both are rendered with an OR rule between them.
test("PNU2 renders Table 2 and Table 3 as separate three-column algorithms", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU2);
  const rendered = renderPneuAbstraction(state, "PNU2");
  assert.match(rendered, /Table 2: Specific Site Algorithm for Pneumonia with Common Bacterial or Filamentous Fungal Pathogens/);
  assert.match(rendered, /Table 3: Specific Site Algorithm for Viral, Legionella, and other Bacterial Pneumonias/);
  assert.equal((rendered.match(/pneu-manual-grid cols-3/g) || []).length, 2);
  assert.match(rendered, /<div class="pneu-or-rule"><span>OR<\/span><\/div>/);
  for (const heading of ["Imaging Test Evidence", "Signs / Symptoms", "Laboratory"]) assert.match(rendered, new RegExp(heading));
  assert.doesNotMatch(rendered, /class="pneu-main-criterion"/);
});

test("each PNU2 algorithm visibly requires imaging AND signs AND laboratory", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU2);
  const rendered = renderPneuAbstraction(state, "PNU2");
  assert.match(rendered, /Two or more serial chest imaging test results with at least one of the following/);
  assert.match(rendered, /At least <u>one<\/u> of the following:/);
  assert.match(rendered, /And at least <u>one<\/u> of the following:/);
  assert.match(rendered, /Organism identified from blood/);
  assert.ok((rendered.match(/class="pneu-and-rule"/g) || []).length >= 1);
});

test("PNU2 laboratory bullets reproduce the manual wording of both tables", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU2);
  const rendered = renderPneuAbstraction(state, "PNU2");
  for (const phrase of [
    "Organism identified from pleural fluid",
    "minimally contaminated LRT specimen",
    "≥ 5% BAL-obtained cells contain intracellular bacteria",
    "Histopathologic exam shows at least one of the following evidences of pneumonia",
    "Virus, Bordetella, Legionella, Chlamydia, or Mycoplasma identified from respiratory secretions or tissue",
    "Fourfold rise in paired sera (IgG) for pathogen",
    "Fourfold rise in Legionella pneumophila serogroup 1 antibody titer to ≥ 1:128",
    "Detection of Legionella pneumophila serogroup 1 antigens in urine by RIA or EIA"
  ]) assert.ok(rendered.includes(phrase), phrase);
});

test("laboratory alternatives reveal only fields relevant to the selected finding", () => {
  const state = createPneuState(); const input = state.inputs.PNU2; dateContext(input);
  selectLabAlternative(state, input, "common", "lrt"); addLabAlternative(input, "lrt");
  let rendered = renderPneuAbstraction(state, "PNU2");
  assert.match(rendered, /Obtained through an artificial airway/);
  assert.match(rendered, /<p class="pneu-threshold">/);

  // Selecting a Table 3 finding clears the Table 2 selection: one specimen record is held
  // at a time, so a stale selection must not keep rendering threshold guidance for it.
  selectLabAlternative(state, input, "definitive", "legionella-urine-antigen"); addLabAlternative(input, "legionella-urine-antigen");
  rendered = renderPneuAbstraction(state, "PNU2");
  assert.equal(state.selectedLabAlternative.common, "");
  assert.doesNotMatch(rendered, /<p class="pneu-threshold">/);
  assert.doesNotMatch(rendered, /Obtained through an artificial airway/);
});

// Table 5, printed page 6-15.
test("Table 5 thresholds cover every listed specimen collection technique", () => {
  const state = createPneuState(); const input = state.inputs.PNU2; dateContext(input);
  selectLabAlternative(state, input, "common", "lrt"); addLabAlternative(input, "lrt");
  const expected = [["bronchoscopic-bal", "≥ 10⁴ CFU/ml"], ["protected-bal", "≥ 10⁴ CFU/ml"], ["protected-specimen-brushing", "≥ 10³ CFU/ml"], ["nonbronchoscopic-bal", "≥ 10⁴ CFU/ml"], ["nonbronchoscopic-protected-specimen-brushing", "≥ 10³ CFU/ml"], ["endotracheal-aspirate", "≥ 10⁵ CFU/ml"]];
  for (const [specimenType, threshold] of expected) {
    input.microbiologyResults[0].specimenType = specimenType;
    assert.ok(renderPneuAbstraction(state, "PNU2").includes(threshold), `${specimenType} -> ${threshold}`);
  }
});

test("normal UI uses field-level human validation and hides technical paths", () => {
  const state = createPneuState(); const input = state.inputs.PNU2; dateContext(input); selectLabAlternative(state, input, "common", "blood"); addLabAlternative(input, "blood");
  input.microbiologyResults[0].collectionDate = "not-a-date"; const rendered = renderPneuAbstraction(state, "PNU2"); const normal = normalUi(rendered);
  assert.match(normal, /Enter a valid collection date/); assert.doesNotMatch(normal, /microbiologyResults\[0\]/); assert.doesNotMatch(normal, /ISO calendar date/);
  assert.match(rendered, /Developer diagnostics/);
});

test("the requirements panel replaces the terse status strip and states the shortfall", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU1, "1950-03-02");
  const rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /PNU1 — NOT MET/);
  assert.match(rendered, /requirements outstanding/);
  assert.match(rendered, /aria-live="polite"/);
  assert.match(rendered, /Record two serial studies showing persistence or progression/);
});

test("no raw JSON is in normal UI and no evidence dates are preloaded or invented", () => {
  const state = createPneuState(); for (const subtype of ["PNU1", "PNU2"]) {
    const input = state.inputs[subtype]; assert.equal(input.admissionDate, ""); assert.equal(input.imagingStudies[0].date, "");
    assert.doesNotMatch(normalUi(renderPneuAbstraction(state, subtype)), /Evaluator input|\{\s*&quot;/);
  }
  toggleClinicalFinding(state.inputs.PNU1, "new-or-worsening-cough", true); assert.equal(state.inputs.PNU1.clinicalFindings[0].date, "");
  assert.match(renderPneuAbstraction(state, "PNU1"), /clinicalFinding\.new-or-worsening-cough\.date/);
  addPneuRecord(state.inputs.PNU2, "microbiologyResults"); assert.equal(state.inputs.PNU2.microbiologyResults[0].collectionDate, "");
});

test("rendering and adapter-only state preserve evaluator results", () => {
  const state = createPneuState(); for (const [subtype, evaluator] of [["PNU1", evaluatePnu1], ["PNU2", evaluatePnu2]]) {
    const input = state.inputs[subtype]; dateContext(input); const before = evaluator(structuredClone(input)); renderPneuAbstraction(state, subtype); const after = evaluator(structuredClone(input)); assert.deepEqual(after, before);
  }
});

test("PNU1 has only its compact no-laboratory note", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU1); const rendered = renderPneuAbstraction(state, "PNU1");
  assert.match(rendered, /PNU1 has no laboratory criterion/); assert.doesNotMatch(rendered, /data-add-lab-alternative/);
});

test("PNEU remains isolated from Chapter 17 LRI-LUNG", () => {
  assert.equal(secondarySiteDefinitions.LUNG.siteCode, "LUNG"); assert.doesNotMatch(app, /secondarySiteDefinitions[^\n]*PNU[12]/);
  assert.match(app, /if \(!PNEU_UI_REGISTRY\[button\.dataset\.pneuSubtype\]\?\.implemented\) return/);
  assert.match(html, /id="chapter17Pathways"/); assert.match(html, /id="chapter17AttributionPanel"/);
});

// Table 4, printed page 6-9. Its laboratory column ends with "OR / Any of the following
// from: LABORATORY CRITERIA DEFINED UNDER PNU2", which is Table 2 *and* Table 3.
test("PNU3 renders the manual host, imaging, clinical, and laboratory columns", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU3);
  const rendered = renderPneuAbstraction(state, "PNU3");
  assert.match(rendered, /Table 4: Specific Site Algorithm for Pneumonia in Immunocompromised Patients \(PNU3\)/);
  assert.match(rendered, /pneu-manual-grid cols-3/);
  assert.match(rendered, /Patient who is immunocompromised — select <u>one<\/u> condition/);
  assert.match(rendered, /Patient who is immunocompromised \(see definition in footnote 10\) has at least <u>one<\/u> of the following:/);
  for (const heading of ["Imaging Test Evidence", "Signs / Symptoms", "Laboratory"]) assert.match(rendered, new RegExp(heading));
});

test("PNU3 clinical bullets include hemoptysis and pleuritic chest pain", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU3);
  const rendered = renderPneuAbstraction(state, "PNU3");
  assert.match(rendered, /data-manual-bullet="PNU3-signs:clinical:hemoptysis"/);
  assert.match(rendered, /data-manual-bullet="PNU3-signs:clinical:pleuritic-chest-pain"/);
});

test("PNU3 offers both PNU2 laboratory tables, not only the common-pathogen table", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU3);
  const rendered = renderPneuAbstraction(state, "PNU3");
  assert.match(rendered, /LABORATORY CRITERIA DEFINED UNDER PNU2/);
  for (const phrase of [
    "Identification of matching Candida spp. from blood",
    "Evidence of fungi (excluding any Candida and yeast not otherwise specified)",
    "Organism identified from blood",
    "Detection of Legionella pneumophila serogroup 1 antigens in urine by RIA or EIA",
    "Fourfold rise in paired sera (IgG) for pathogen"
  ]) assert.ok(rendered.includes(phrase), phrase);
});

test("PNU3 host options reproduce footnote 10 exactly", () => {
  const state = createPneuState(); dateContext(state.inputs.PNU3);
  const rendered = renderPneuAbstraction(state, "PNU3");
  for (const phrase of [
    "absolute neutrophil count &lt; 500/mm³",
    "total white blood cell count &lt; 500/mm³",
    "HIV positive with CD4 count &lt; 200 cells/mm³",
    "Splenectomy",
    "History of solid organ transplant",
    "History of hematopoietic stem cell transplant",
    "Cytotoxic chemotherapy",
    "daily for &gt; 14 consecutive days on the date of event (excludes inhaled and topical)"
  ]) assert.ok(rendered.includes(phrase), phrase);
});

test("PNU3 host alternatives and Candida pair use typed, dated evidence", () => {
  const state = createPneuState(); const input = state.inputs.PNU3; dateContext(input);
  selectHostAlternative(state, input, "systemic-steroids");
  assert.deepEqual(input.hostEvidence[0], { id: "host-systemic-steroids", type: "systemic-steroids", route: "enteral", daily: true, startDate: "", endDate: "" });
  addPnu3CandidaPair(input); assert.equal(input.microbiologyResults.length, 2);
  assert.deepEqual(input.microbiologyResults.map(item => item.specimenType), ["blood", "sputum"]);
  assert.ok(input.microbiologyResults.every(item => item.collectionDate === "" && item.organism.tags.includes("candida")));
});

test("repeatable records remain isolated by subtype", () => {
  const state = createPneuState(); addPneuRecord(state.inputs.PNU1, "imagingStudies"); assert.equal(state.inputs.PNU2.imagingStudies.length, 1);
  removePneuRecord(state.inputs.PNU1, "imagingStudies", 1); assert.equal(state.inputs.PNU1.imagingStudies.length, 1);
});
