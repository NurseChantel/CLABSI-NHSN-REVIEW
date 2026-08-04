import { evaluatePnu1, PNU1_SOURCES } from "./pnu1.js";
import { renderPnu1Safely } from "./pnu1-renderer.js";
import { evaluatePnu2, PNU2_PROTOCOL, PNU2_SOURCES } from "./pnu2.js";
import { renderPnu2Safely } from "./pnu2-renderer.js";
import { evaluatePnu3, PNU3_SOURCES } from "./pnu3.js";
import { renderPnu3Safely } from "./pnu3-renderer.js";

const host = () => ({ status: "notMet", reasons: [] });
const ventilator = () => ({ inPlace: false, periods: [] });
const baseInput = () => ({
  patientContext: { dateOfBirth: "", hostStatus: host(), ventilator: ventilator() },
  admissionDate: "", underlyingPulmonaryOrCardiacDisease: false, soleAvailableImage: false,
  imagingStudies: [{ id: "image-1", date: "", modality: "chest-xray", findings: [], interpretation: "definitive", attributedToOtherCondition: false }],
  imagingRelationships: [], measurements: [], clinicalFindings: []
});

export const PNEU_UI_REGISTRY = Object.freeze({
  PNU1: Object.freeze({ label: "PNU1 — Clinically defined pneumonia", implemented: true, evaluate: evaluatePnu1, render: renderPnu1Safely }),
  PNU2: Object.freeze({ label: "PNU2 — Pneumonia with specific laboratory findings", implemented: true, evaluate: evaluatePnu2, render: renderPnu2Safely }),
  PNU3: Object.freeze({ label: "PNU3 — Pneumonia in immunocompromised patients", implemented: true, evaluate: evaluatePnu3, render: renderPnu3Safely })
});

export function createPneuState() {
  return { selectedSubtype: "", inputs: { PNU1: baseInput(), PNU2: { ...baseInput(), microbiologyResults: [], histopathologyResults: [], bloodResults: [] }, PNU3: { ...baseInput(), hostEvidence: [], microbiologyResults: [], histopathologyResults: [], bloodResults: [] } }, openCriterion: { PNU1: "", PNU2: "", PNU3: "" }, selectedLabAlternative: { common: "", definitive: "", pnu3: "" }, selectedHostAlternative: "" };
}

export function evaluatePneuSubtype(subtype, input) {
  const entry = PNEU_UI_REGISTRY[subtype];
  if (!entry?.implemented) return { ok: false, error: "This PNEU subtype is not yet implemented." };
  const result = entry.evaluate(input);
  if (!result.ok) return { ok: false, errors: result.errors };
  return { ok: true, evaluation: result.value, html: entry.render({ evaluation: result.value, patientContext: input.patientContext }) };
}

const esc = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const checked = value => value ? " checked" : "";
const selected = (a, b) => a === b ? " selected" : "";
const field = (label, name, value, type = "text", attrs = "", error = "") => `<label class="pneu-field"><span>${label}</span><input type="${type}" data-pneu-field="${name}" value="${esc(value)}" ${attrs}>${error ? `<small class="pneu-field-error">${esc(error)}</small>` : ""}</label>`;
const findingLabels = {
  "altered-mental-status-no-other-cause": "Altered mental status (patient ≥70 years), no other recognized cause", "sputum-change": "New onset purulent sputum or change in sputum character", "secretions-change": "Increased respiratory secretions", "increased-suctioning": "Increased suctioning requirements", dyspnea: "Dyspnea", "new-or-worsening-cough": "New or worsening cough", rales: "Rales", crackles: "Crackles", "bronchial-breath-sounds": "Bronchial breath sounds", "worsening-gas-exchange": "Worsening gas exchange", "temperature-instability": "Temperature instability", "nasal-flaring": "Nasal flaring", wheezing: "Wheezing", rhonchi: "Rhonchi", cough: "Cough", apnea: "Apnea", hemoptysis: "Hemoptysis", "pleuritic-chest-pain": "Pleuritic chest pain"
};
const measurementSpecs = { temperature: ["Temperature", "C"], wbc: ["WBC", "cells/mm3"], bands: ["Bands", "percent"], "respiratory-rate": ["Respiratory rate", "breaths/min"], "heart-rate": ["Heart rate", "beats/min"] };
const imageFindings = [["infiltrate", "Infiltrate"], ["consolidation", "Consolidation"], ["cavitation", "Cavitation"], ["air-space-disease", "Eligible alternative descriptor: air-space disease"], ["focal-opacification", "Eligible alternative descriptor: focal opacification"], ["patchy-increased-density", "Eligible alternative descriptor: patchy increased density"]];
const COMMON_BRANCHES = new Set(["blood", "pleural-fluid", "bronchoscopic-bal", "protected-specimen-brushing", "nonbronchoscopic-bal", "endotracheal-aspirate", "lung-tissue", "bal-intracellular-bacteria", "histopathology-abscess", "histopathology-invasive-fungus"]);
const DEFINITIVE_BRANCHES = new Set(PNU2_PROTOCOL.branches.filter(id => !COMMON_BRANCHES.has(id)));

function ageYears(input) {
  const dob = Date.parse(`${input.patientContext.dateOfBirth}T00:00:00Z`); const event = Date.parse(`${input.imagingStudies[0]?.date}T00:00:00Z`);
  return Number.isFinite(dob) && Number.isFinite(event) ? (event - dob) / 31557600000 : null;
}
function inputValue(input, kind) { return input.measurements.find(x => x.kind === kind)?.value ?? ""; }
function evidenceDate(input, kind) { return input.measurements.find(x => x.kind === kind)?.date ?? ""; }
function findings(input) { return new Set(input.clinicalFindings.map(x => x.kind)); }
function findingDate(input, kind) { return input.clinicalFindings.find(x => x.kind === kind)?.date ?? ""; }
function groupMet(input, kinds) { const active = findings(input); return kinds.some(kind => active.has(kind)) || (kinds.includes("tachypnea") && inputValue(input, "respiratory-rate") !== ""); }

export function addPneuRecord(input, collection, seed = {}) {
  const list = input[collection]; const prefix = collection === "imagingStudies" ? "image" : "lab";
  list.push(collection === "imagingStudies" ? { id: `${prefix}-${Date.now()}-${list.length}`, date: "", modality: "chest-xray", findings: [], interpretation: "definitive", attributedToOtherCondition: false, ...seed }
    : { id: `${prefix}-${Date.now()}-${list.length}`, specimenType: "blood", collectionDate: "", testMethod: "culture", organism: { id: "eligible-bacterium", tags: ["bacterium"] }, resultType: "qualitative", positive: true, contaminated: false, excluded: false, ...seed });
  syncImagingRelationships(input); return list.length;
}
export function removePneuRecord(input, collection, index) { input[collection].splice(index, 1); syncImagingRelationships(input); }
function syncImagingRelationships(input) { input.imagingRelationships = input.imagingStudies.slice(1).map((study, i) => ({ fromStudyId: input.imagingStudies[i].id, toStudyId: study.id, type: study.relationshipType || "persistent" })); }

function friendlyErrors(result) {
  const errors = result.errors || [];
  return errors.map(raw => {
    if (/microbiologyResults\[\d+\]\.collectionDate/.test(raw)) return { key: raw.match(/microbiologyResults\[(\d+)\]/)?.[1] ? `lab-date-${raw.match(/\[(\d+)\]/)[1]}` : "lab-date", message: raw.includes("ISO") ? "Enter a valid collection date." : "Enter the laboratory specimen collection date." };
    if (/microbiologyResults\[\d+\]\.specimenType/.test(raw)) return { key: `lab-specimen-${raw.match(/\[(\d+)\]/)[1]}`, message: "Select a specimen type." };
    if (/microbiologyResults\[\d+\]\.organism/.test(raw)) return { key: `lab-organism-${raw.match(/\[(\d+)\]/)[1]}`, message: "Enter the organism result." };
    if (/imagingStudies\[\d+\]\.date/.test(raw)) return { key: `image-date-${raw.match(/\[(\d+)\]/)[1]}`, message: raw.includes("ISO") ? "Enter a valid imaging date." : "Enter the imaging study date." };
    if (/patientContext\.dateOfBirth/.test(raw)) return { key: "dob", message: "Enter the patient's date of birth." };
    if (/admissionDate/.test(raw)) return { key: "admission", message: "Enter the admission date." };
    return null;
  }).filter(Boolean);
}
function errorFor(errors, key) { return errors.find(error => error.key === key)?.message || ""; }
function conciseNeeded(evaluation, subtype) {
  if (!evaluation) return [];
  return evaluation.remainingRequirements.map(item => item.id === "imaging" ? "Imaging requirement" : item.id.includes("systemic") ? "One systemic finding" : item.id.includes("respiratory") ? (subtype === "PNU1" ? item.message : "One respiratory finding group") : item.id === "laboratory" ? "One qualifying laboratory finding" : item.id === "host" ? "One qualifying immunocompromised-host condition" : item.message);
}
function criterionName(subtype, evaluation) {
  if (subtype === "PNU3") return "PNU3 — Immunocompromised patient";
  if (subtype === "PNU1") return ({ "PNU1-any-patient": "PNU1 — Any patient", "PNU1-infant": "PNU1 — Infant ≤1 year", "PNU1-child": "PNU1 — Child >1 through ≤12 years" })[evaluation?.clinical?.branch] || "PNU1 — Any patient";
  const met = evaluation?.laboratoryEvidence?.branches?.find(branch => branch.met);
  return met && DEFINITIVE_BRANCHES.has(met.id) ? "Viral, Legionella, and other bacterial pathway" : "Common bacterial/fungal pathway";
}
function statusHtml(subtype, result) {
  const evaluation = result.ok ? result.evaluation : null; const met = evaluation?.met; const needed = conciseNeeded(evaluation, subtype);
  return `<div class="pneu-status ${met ? "met" : "warning"}" role="status"><strong>${subtype} ${met ? "Met" : "Not Met"}</strong>${evaluation ? `<div>${met ? "Criterion met" : "Closest viable criterion"}: <b>${esc(criterionName(subtype, evaluation))}</b></div>` : '<div>Complete the dated patient and imaging fields to begin the checklist.</div>'}${needed.length ? `<div>Still needed:</div><ul>${needed.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${met ? `<div class="pneu-window-summary"><span>DOE <b>${esc(evaluation.dateOfEvent || "—")}</b></span><span>IWP <b>${esc(evaluation.infectionWindow?.start || "—")} – ${esc(evaluation.infectionWindow?.end || "—")}</b></span><span>RIT <b>${esc(evaluation.repeatInfectionTimeframe?.start || "—")} – ${esc(evaluation.repeatInfectionTimeframe?.end || "—")}</b></span><span>Secondary BSI <b>${esc(evaluation.secondaryBsi?.status || "Not applicable")}</b></span></div>` : ""}</div>`;
}

function patientSection(input, errors) {
  const age = ageYears(input); const veryYoung = age !== null && age < 2 / 12;
  return `<section class="pneu-context"><h4>Patient context</h4><div class="pneu-grid">${field("Date of birth", "patientContext.dateOfBirth", input.patientContext.dateOfBirth, "date", "", errorFor(errors, "dob"))}${field("Admission date", "admissionDate", input.admissionDate, "date", "", errorFor(errors, "admission"))}${veryYoung ? field("Gestational age at birth (weeks)", "patientContext.gestationalAgeWeeksAtBirth", input.patientContext.gestationalAgeWeeksAtBirth ?? "", "number", 'min="20" max="45"') : ""}</div></section>`;
}
function imagingSection(input, evaluation, errors, source) {
  const age = ageYears(input); const infant = age !== null && age <= 1; const rows = input.imagingStudies.map((study, i) => `<div class="pneu-repeat-row" data-image-row="${i}"><div class="pneu-row-title"><strong>Study ${i + 1}</strong>${input.imagingStudies.length > 1 ? `<button type="button" class="link-button" data-pneu-remove="imagingStudies" data-index="${i}">Remove</button>` : ""}</div><div class="pneu-grid">${field("Date", `imagingStudies.${i}.date`, study.date, "date", "", errorFor(errors, `image-date-${i}`))}<label class="pneu-field"><span>Finding</span><select data-image-select data-index="${i}"><option value="">Select finding</option>${[...imageFindings, ...(infant ? [["pneumatoceles", "Pneumatoceles (age eligible)"]] : [])].map(([value, label]) => `<option value="${value}"${selected(study.findings[0], value)}>${label}</option>`).join("")}</select></label><label class="pneu-field"><span>Interpretation</span><select data-pneu-field="imagingStudies.${i}.interpretation"><option value="definitive"${selected(study.interpretation, "definitive")}>Definitive</option><option value="equivocal"${selected(study.interpretation, "equivocal")}>Equivocal</option></select></label>${i > 0 ? `<label class="pneu-field"><span>Persistence/progression</span><select data-pneu-field="imagingStudies.${i}.relationshipType"><option value="persistent"${selected(study.relationshipType, "persistent")}>Persistent</option><option value="progressive"${selected(study.relationshipType, "progressive")}>Progressive</option></select></label>` : ""}</div><div class="pneu-check-grid"><label><input type="checkbox" data-pneu-field="imagingStudies.${i}.attributedToOtherCondition"${checked(study.attributedToOtherCondition)}> Attributed to another condition</label>${study.interpretation === "equivocal" ? `<label><input type="checkbox" data-pneu-field="imagingStudies.${i}.clinicalCorrelation"${checked(study.clinicalCorrelation)}> Later evidence/clinical correlation clarifies this result</label>` : ""}</div></div>`).join("");
  const imageMet = evaluation?.imaging?.met; return `<details class="pneu-subaccordion" open><summary>Imaging — required <span class="criterion-chip ${imageMet ? "met" : ""}">${imageMet ? "Met" : "Needed"}</span></summary><div class="pneu-subaccordion-body"><fieldset class="pneu-choice"><legend>Does the patient have underlying pulmonary or cardiac disease?</legend><label><input type="radio" name="underlying" data-pneu-field="underlyingPulmonaryOrCardiacDisease" value="true"${checked(input.underlyingPulmonaryOrCardiacDisease)}> Yes</label><label><input type="radio" name="underlying" data-pneu-field="underlyingPulmonaryOrCardiacDisease" value="false"${checked(!input.underlyingPulmonaryOrCardiacDisease)}> No</label></fieldset><p class="pneu-requirement">${input.underlyingPulmonaryOrCardiacDisease ? "Two or more serial eligible studies must demonstrate persistence or progression." : "Two serial eligible studies demonstrating persistence/progression, OR the qualifying one-definitive-study exception."}</p>${!input.underlyingPulmonaryOrCardiacDisease && input.imagingStudies.length === 1 ? `<label class="pneu-check"><input type="checkbox" data-pneu-field="soleAvailableImage"${checked(input.soleAvailableImage)}> This is the only available chest imaging study.</label>` : ""}<div class="pneu-live-summary"><strong>${imageMet ? "Imaging requirement met" : "Still needed:"}</strong>${imageMet ? "" : `<span>${input.imagingStudies.length < 2 && !input.soleAvailableImage ? "One additional serial imaging study demonstrating persistence/progression" : "Qualifying imaging evidence"}</span>`}</div>${rows}<button type="button" data-pneu-add="imagingStudies">Add imaging study</button><details class="pneu-guidance"><summary>NHSN guidance and footnotes</summary><p>${esc(source.document)}, ${esc(source.section)}, pages ${esc(source.printedPage)}.</p></details></div></details>`;
}
const and = () => '<div class="pneu-and" aria-label="and">AND</div>';
function measurementControl(input, kind, label, threshold) { const [name, unit] = measurementSpecs[kind]; return `<div class="pneu-evidence-item"><label><input type="checkbox" data-measurement-confirm="${kind}"${checked(inputValue(input, kind) !== "")}> ${label} <span>${threshold}</span></label><div class="pneu-inline-fields">${field("Optional value", `measurement.${kind}.value`, inputValue(input, kind), "number", 'step="any"')}${field(unit, `measurement.${kind}.date`, evidenceDate(input, kind), "date")}</div></div>`; }
function findingOption(input, kind) {
  const active = findings(input).has(kind);
  return `<div class="pneu-finding-option"><label><input type="checkbox" data-clinical-finding="${kind}"${checked(active)}> ${findingLabels[kind]}</label>${active ? field("Evidence date", `clinicalFinding.${kind}.date`, findingDate(input, kind), "date") : ""}</div>`;
}
function respiratoryGroup(input, number, kinds, extra = "") { const count = groupMet(input, kinds); return `<fieldset class="pneu-finding-group ${count ? "selected" : ""}"><legend>Group ${number} ${count ? "✓" : ""}</legend>${kinds.filter(k => k !== "tachypnea").map(kind => findingOption(input, kind)).join("")}${kinds.includes("tachypnea") ? measurementControl(input, "respiratory-rate", "Tachypnea", "age-specific threshold") : ""}${extra}</fieldset>`; }
function purulentPanel(input) { if (!findings(input).has("sputum-change")) return ""; return `<div class="pneu-nested-evidence"><strong>Purulent sputum evidence</strong><label>Reporting basis <select data-ui-only="purulentMode"><option>Quantitative neutrophils and squamous epithelial cells</option><option>Semiquantitative results</option><option>Neutrophils-only reporting</option><option>Laboratory-specific threshold</option><option>Cytospin/nonquantitated WBC reporting</option></select></label><p class="guide-intro">Record the supporting chart result; the evaluator continues to use the established sputum finding.</p></div>`; }
function anyClinical(input, pnu2 = false) { const age = ageYears(input); const groups = [["sputum-change", "secretions-change", "increased-suctioning"], ["dyspnea", "tachypnea", "new-or-worsening-cough"], ["rales", "crackles", "bronchial-breath-sounds"], ["worsening-gas-exchange"]]; const count = groups.filter(k => groupMet(input, k)).length; return `<section class="pneu-checklist-block"><h5>Systemic findings — select at least ONE</h5>${measurementControl(input, "temperature", "Fever", ">38.0°C")}${measurementControl(input, "wbc", "Leukopenia ≤4,000 OR leukocytosis ≥12,000", "WBC/mm³")}${age !== null && age >= 70 ? `<div class="pneu-evidence-item">${findingOption(input, "altered-mental-status-no-other-cause")}</div>` : ""}</section>${and()}<section class="pneu-checklist-block"><div class="pneu-block-title"><h5>Respiratory findings — select at least ${pnu2 ? "ONE" : "TWO"} separate groups</h5><strong>${count} of 4 respiratory groups selected</strong></div>${groups.map((k, i) => respiratoryGroup(input, i + 1, k, i === 0 ? purulentPanel(input) : "")).join("")}</section>`; }
function infantClinical(input) { const groups = [["temperature-instability"], ["wbc-infant"], ["sputum-change", "secretions-change", "increased-suctioning"], ["apnea", "nasal-flaring", "tachypnea"], ["wheezing", "rales", "rhonchi"], ["cough"], ["heart-rate"]]; const count = groups.filter(k => k[0] === "wbc-infant" ? inputValue(input, "wbc") !== "" : k[0] === "heart-rate" ? inputValue(input, "heart-rate") !== "" : groupMet(input, k)).length; return `<section class="pneu-checklist-block"><h5>Required clinical evidence</h5><div class="pneu-required-item">${findingOption(input, "worsening-gas-exchange")}</div></section>${and()}<section class="pneu-checklist-block"><div class="pneu-block-title"><h5>Infant findings — select at least THREE separate groups</h5><strong>${count} of 7 groups selected</strong></div>${respiratoryGroup(input, 1, groups[0])}<fieldset class="pneu-finding-group"><legend>Group 2</legend>${measurementControl(input, "wbc", "Leukopenia or leukocytosis with left shift", "infant thresholds")}${measurementControl(input, "bands", "Band forms", "≥10% when required")}</fieldset>${respiratoryGroup(input, 3, groups[2], purulentPanel(input))}${respiratoryGroup(input, 4, groups[3])}${respiratoryGroup(input, 5, groups[4])}${respiratoryGroup(input, 6, groups[5])}<fieldset class="pneu-finding-group"><legend>Group 7</legend>${measurementControl(input, "heart-rate", "Bradycardia or tachycardia", "infant thresholds")}</fieldset></section>`; }
function childClinical(input) { const groups = [["temperature-child"], ["wbc-child"], ["sputum-change", "secretions-change", "increased-suctioning"], ["dyspnea", "apnea", "cough", "tachypnea"], ["rales", "bronchial-breath-sounds"], ["worsening-gas-exchange"]]; const count = groups.filter(k => k[0].includes("temperature") ? inputValue(input, "temperature") !== "" : k[0].includes("wbc") ? inputValue(input, "wbc") !== "" : groupMet(input, k)).length; return `<section class="pneu-checklist-block"><div class="pneu-block-title"><h5>Child findings — select at least THREE separate groups</h5><strong>${count} of 6 groups selected</strong></div><fieldset class="pneu-finding-group"><legend>Group 1</legend>${measurementControl(input, "temperature", "Fever or hypothermia", ">38.0°C or <36.5°C")}</fieldset><fieldset class="pneu-finding-group"><legend>Group 2</legend>${measurementControl(input, "wbc", "Leukopenia or leukocytosis", "≤4,000 or ≥15,000 WBC/mm³")}</fieldset>${respiratoryGroup(input, 3, groups[2], purulentPanel(input))}${respiratoryGroup(input, 4, groups[3])}${respiratoryGroup(input, 5, groups[4])}${respiratoryGroup(input, 6, groups[5])}</section>`; }
function sourceDetails(source) { return `<details class="pneu-guidance"><summary>NHSN guidance and footnotes</summary><p>${esc(source.document)} — ${esc(source.section)}; ${esc(source.printedPage)}.</p></details>`; }
function mainAccordion(id, title, open, body, source) { return `<details class="pneu-main-criterion" data-pneu-criterion="${id}"${open ? " open" : ""}><summary><span>${esc(title)}</span><span class="criterion-chip">OR pathway</span></summary><div class="pneu-criterion-body">${body}${sourceDetails(source)}</div></details>`; }

function pnu1Criteria(state, input, evaluation, errors) {
  const age = ageYears(input); const branches = [{ id: "PNU1-any-patient", title: "Criterion: PNU1 — Any patient", clinical: () => anyClinical(input) }];
  if (age !== null && age <= 1) branches.push({ id: "PNU1-infant", title: "Criterion: PNU1 — Infant ≤1 year", clinical: () => infantClinical(input) });
  else if (age !== null && age > 1 && age <= 12) branches.push({ id: "PNU1-child", title: "Criterion: PNU1 — Child >1 through ≤12 years", clinical: () => childClinical(input) });
  const preferred = state.openCriterion.PNU1 || evaluation?.clinical?.branch || branches[0].id;
  return `<p class="pneu-or-intro">Meeting any one complete PNU1 criterion qualifies PNU1.</p>${branches.map(branch => mainAccordion(branch.id, branch.title, branch.id === preferred, `${imagingSection(input, evaluation, errors, PNU1_SOURCES.imaging)}${and()}${branch.clinical()}`, PNU1_SOURCES.checklist)).join('<div class="pneu-or">OR</div>')}<aside class="pneu-note">PNU1 has no laboratory criterion and does not independently report a pathogen.</aside>`;
}

const labOptions = {
  common: [["blood", "Organism from blood"], ["pleural-fluid", "Organism from eligible pleural fluid"], ["lrt", "Qualifying minimally contaminated LRT culture"], ["lung-tissue", "Qualifying lung tissue culture"], ["bal-intracellular-bacteria", "≥5% BAL cells with intracellular bacteria"], ["histopathology", "Qualifying histopathology"]],
  definitive: [["respiratory-or-tissue-identification", "Eligible organism identified from respiratory secretions or tissue"], ["paired-sera-fourfold-igg", "Fourfold rise in paired IgG sera"], ["legionella-paired-sera-ifa", "Qualifying Legionella pneumophila serogroup 1 paired-sera IFA"], ["legionella-urine-antigen", "Legionella pneumophila serogroup 1 urine antigen by RIA/EIA"]]
};
function thresholdText(specimen) { return ({ "bronchoscopic-bal": "≥10⁴ CFU/ml", "protected-specimen-brushing": "≥10³ CFU/ml", "nonbronchoscopic-bal": "≥10⁴ CFU/ml", "endotracheal-aspirate": "≥10⁵ CFU/ml", "lung-tissue": "≥10⁴ CFU/g" })[specimen] || "Select a specimen to see its threshold"; }
function labRecordFields(input, errors, algorithm, alternative) {
  const lab = input.microbiologyResults[0]; if (!alternative) return "";
  if (alternative === "histopathology") return `<div class="pneu-nested-evidence"><p>Record one qualifying histopathology finding.</p><button type="button" data-add-histopathology>Add histopathology evidence</button>${input.histopathologyResults.map((x, i) => `${field("Evidence date", `histopathologyResults.${i}.date`, x.date, "date")}<label class="pneu-field"><span>Finding</span><select data-pneu-field="histopathologyResults.${i}.finding"><option value="abscess-or-consolidation-with-intense-pmn">Abscess/consolidation with intense PMN accumulation</option><option value="fungal-hyphae-or-pseudohyphae-invading-parenchyma">Fungal invasion of lung parenchyma</option></select></label>`).join("")}</div>`;
  if (!lab) return `<button type="button" data-add-lab-alternative="${alternative}" data-algorithm="${algorithm}">Add evidence for this pathway</button>`;
  const lrt = alternative === "lrt"; const specimenChoices = lrt ? ["bronchoscopic-bal", "protected-specimen-brushing", "nonbronchoscopic-bal", "endotracheal-aspirate"] : alternative === "lung-tissue" ? ["lung-tissue"] : alternative === "blood" ? ["blood"] : alternative === "pleural-fluid" ? ["pleural-fluid"] : alternative === "bal-intracellular-bacteria" ? ["bronchoscopic-bal"] : alternative === "respiratory-or-tissue-identification" ? ["respiratory-secretions", "bronchoscopic-bal", "protected-specimen-brushing", "nonbronchoscopic-bal", "endotracheal-aspirate", "lung-tissue"] : alternative === "legionella-urine-antigen" ? ["urine"] : ["paired-sera"];
  return `<div class="pneu-nested-evidence"><div class="pneu-grid">${field("Collection date", "microbiologyResults.0.collectionDate", lab.collectionDate, "date", "", errorFor(errors, "lab-date-0"))}<label class="pneu-field"><span>Specimen type</span><select data-pneu-field="microbiologyResults.0.specimenType">${specimenChoices.map(x => `<option value="${x}"${selected(lab.specimenType, x)}>${x.replaceAll("-", " ")}</option>`).join("")}</select>${errorFor(errors, "lab-specimen-0") ? `<small class="pneu-field-error">${errorFor(errors, "lab-specimen-0")}</small>` : ""}</label><label class="pneu-field"><span>Organism result</span><select data-lab-organism data-index="0"><option value="eligible-bacterium">Eligible bacterium</option><option value="virus">Virus</option><option value="legionella-pneumophila-serogroup-1">Legionella pneumophila serogroup 1</option><option value="candida">Candida</option></select></label>${lrt ? `<label class="pneu-check"><input type="checkbox" data-pneu-field="microbiologyResults.0.artificialAirwayEligible"${checked(lab.artificialAirwayEligible)}> Artificial airway eligibility documented</label>` : ""}<label class="pneu-field"><span>Result format</span><select data-pneu-field="microbiologyResults.0.resultType"><option value="qualitative"${selected(lab.resultType, "qualitative")}>Qualitative</option><option value="quantitative"${selected(lab.resultType, "quantitative")}>Quantitative</option><option value="semiquantitative"${selected(lab.resultType, "semiquantitative")}>Semiquantitative</option></select></label>${lab.resultType === "quantitative" ? field(alternative === "bal-intracellular-bacteria" ? "Percent BAL cells" : "Quantitative result", "microbiologyResults.0.value", lab.value ?? "", "number", 'step="any"') : ""}${lab.resultType === "semiquantitative" ? field("Semiquantitative result", "microbiologyResults.0.category", lab.category ?? "") : ""}</div>${lrt || alternative === "lung-tissue" ? `<p class="pneu-threshold"><strong>Required threshold:</strong> ${thresholdText(lab.specimenType)}</p>` : ""}<div class="pneu-check-grid"><label><input type="checkbox" data-pneu-field="microbiologyResults.0.contaminated"${checked(lab.contaminated)}> Contaminated</label><label><input type="checkbox" data-pneu-field="microbiologyResults.0.excluded"${checked(lab.excluded)}> Exclusion applies</label></div><button type="button" class="link-button" data-pneu-remove="microbiologyResults" data-index="0">Remove laboratory evidence</button></div>`;
}
function labSelector(state, input, errors, algorithm) { const active = state.selectedLabAlternative[algorithm]; return `<section class="pneu-checklist-block"><h5>${algorithm === "common" ? "Select at least ONE qualifying laboratory pathway" : "Select at least ONE qualifying definitive laboratory finding"}</h5><div class="pneu-lab-options">${labOptions[algorithm].map(([id, label]) => `<label><input type="radio" name="lab-${algorithm}" data-lab-alternative="${id}" data-algorithm="${algorithm}"${checked(active === id)}> ${label}</label>`).join("")}</div>${labRecordFields(input, errors, algorithm, active)}</section>`; }
function pnu2Criteria(state, input, evaluation, errors) {
  const metBranch = evaluation?.laboratoryEvidence?.branches?.find(x => x.met)?.id; const metAlgorithm = metBranch && DEFINITIVE_BRANCHES.has(metBranch) ? "definitive" : metBranch ? "common" : ""; const preferred = state.openCriterion.PNU2 || metAlgorithm || "common";
  const shared = algorithm => `${imagingSection(input, evaluation, errors, PNU2_SOURCES.imaging)}${and()}${anyClinical(input, true)}${and()}${labSelector(state, input, errors, algorithm)}`;
  return `<p class="pneu-or-intro">Meeting either complete PNU2 algorithm qualifies PNU2.</p>${mainAccordion("common", "Common bacterial or filamentous fungal pathogens with specific laboratory findings", preferred === "common", shared("common"), PNU2_SOURCES.common)}<div class="pneu-or">OR</div>${mainAccordion("definitive", "Viral, Legionella, and other bacterial pneumonias with definitive laboratory findings", preferred === "definitive", shared("definitive"), PNU2_SOURCES.other)}`;
}

const hostOptions = [
  ["neutropenia-anc", "ANC <500 cells/mm³"], ["neutropenia-wbc", "WBC <500 cells/mm³"], ["leukemia", "Leukemia"], ["lymphoma", "Lymphoma"], ["hiv-cd4", "HIV with CD4 <200 cells/mm³"], ["splenectomy", "Splenectomy"], ["solid-organ-transplant", "Solid-organ transplant"], ["hematopoietic-stem-cell-transplant", "Hematopoietic stem-cell transplant"], ["cytotoxic-chemotherapy", "Cytotoxic chemotherapy"], ["systemic-steroids", "Daily enteral/parenteral steroids for >14 consecutive days"]
];
function hostFields(state, input) {
  const type = state.selectedHostAlternative; const item = input.hostEvidence[0];
  const options = hostOptions.map(([id, label]) => `<label><input type="radio" name="pnu3-host" data-host-alternative="${id}"${checked(type === id)}> ${label}</label>`).join("");
  let fields = "";
  if (item && ["neutropenia-anc", "neutropenia-wbc"].includes(type)) fields = `${field("Result", "hostEvidence.0.value", item.value ?? "", "number")}${field("Evidence date", "hostEvidence.0.date", item.date ?? "", "date")}`;
  else if (item && type === "hiv-cd4") fields = `${field("CD4 count", "hostEvidence.0.cd4Count", item.cd4Count ?? "", "number")}<label class="pneu-check"><input type="checkbox" data-pneu-field="hostEvidence.0.hivPositive"${checked(item.hivPositive)}> HIV-positive status documented</label>`;
  else if (item && type === "cytotoxic-chemotherapy") fields = field("Active on date", "hostEvidence.0.activeOnDate", item.activeOnDate ?? "", "date");
  else if (item && type === "systemic-steroids") fields = `<label class="pneu-field"><span>Route</span><select data-pneu-field="hostEvidence.0.route"><option value="enteral"${selected(item.route, "enteral")}>Enteral</option><option value="parenteral"${selected(item.route, "parenteral")}>Parenteral</option></select></label>${field("Start date", "hostEvidence.0.startDate", item.startDate ?? "", "date")}${field("Through date", "hostEvidence.0.endDate", item.endDate ?? "", "date")}`;
  return `<section class="pneu-checklist-block"><div class="pneu-block-title"><h5>Immunocompromised host eligibility — select ONE</h5></div><div class="pneu-lab-options">${options}</div>${fields ? `<div class="pneu-nested-evidence pneu-grid">${fields}</div>` : ""}${sourceDetails(PNU3_SOURCES.host)}</section>`;
}
function pnu3Clinical(input) {
  const groups = [["sputum-change", "secretions-change", "increased-suctioning"], ["dyspnea", "new-or-worsening-cough"], ["rales", "crackles", "bronchial-breath-sounds"], ["worsening-gas-exchange"], ["hemoptysis"], ["pleuritic-chest-pain"]];
  return `<section class="pneu-checklist-block"><h5>Clinical findings — select at least ONE</h5>${measurementControl(input, "temperature", "Fever", ">38.0°C")}${ageYears(input) >= 70 ? `<div class="pneu-evidence-item">${findingOption(input, "altered-mental-status-no-other-cause")}</div>` : ""}${groups.map((k, i) => respiratoryGroup(input, i + 1, k, i === 0 ? purulentPanel(input) : "")).join("")}${measurementControl(input, "respiratory-rate", "Tachypnea", "age-specific threshold")}</section>`;
}
function pnu3Laboratory(state, input, errors) {
  const active = state.selectedLabAlternative.pnu3;
  const options = [["pnu3-fungus", "Fungus from a minimally contaminated LRT specimen"], ["pnu3-candida", "Matching Candida species from blood and respiratory specimen"], ["pnu3-pnu2", "Any qualifying PNU2 laboratory finding"]];
  let controls = "";
  if (active === "pnu3-fungus") controls = input.microbiologyResults.length ? labRecordFields(input, errors, "pnu3", "lrt") : '<button type="button" data-add-pnu3-fungus>Add fungal LRT evidence</button>';
  else if (active === "pnu3-candida") controls = `<p class="pneu-requirement">Add two results: blood and an eligible respiratory specimen, with the same Candida species and dates in the IWP.</p><button type="button" data-add-pnu3-candida>Add matching Candida pair</button>`;
  else if (active === "pnu3-pnu2") controls = labSelector(state, input, errors, "common");
  return `<section class="pneu-checklist-block"><h5>Laboratory evidence — select at least ONE pathway</h5><div class="pneu-lab-options">${options.map(([id, label]) => `<label><input type="radio" name="lab-pnu3" data-lab-alternative="${id}" data-algorithm="pnu3"${checked(active === id)}> ${label}</label>`).join("")}</div>${controls}${sourceDetails(PNU3_SOURCES.laboratory)}</section>`;
}
function pnu3Criteria(state, input, evaluation, errors) {
  return `<div class="pneu-manual-grid pnu3"><div class="pneu-manual-column">${imagingSection(input, evaluation, errors, PNU3_SOURCES.imaging)}</div><div class="pneu-manual-column">${hostFields(state, input)}${and()}${pnu3Clinical(input)}</div><div class="pneu-manual-column">${pnu3Laboratory(state, input, errors)}</div></div>`;
}

export function renderPneuAbstraction(state, subtype) {
  const input = state.inputs[subtype]; const result = evaluatePneuSubtype(subtype, input); const evaluation = result.ok ? result.evaluation : null; const errors = friendlyErrors(result);
  const criteria = subtype === "PNU1" ? pnu1Criteria(state, input, evaluation, errors) : subtype === "PNU2" ? pnu2Criteria(state, input, evaluation, errors) : pnu3Criteria(state, input, evaluation, errors);
  return `${statusHtml(subtype, result)}<form class="pneu-form" data-subtype="${subtype}">${patientSection(input, errors)}${criteria}<div class="pneu-actions"><button type="button" data-pneu-reset>Reset ${subtype}</button></div><details><summary>NHSN References</summary><p>NHSN pneumonia checklist.pdf, PNU1 worksheets PDF pages 2–4, PNU2 worksheets PDF pages 5–8, and PNU3 worksheet PDF pages 9–10. Qualification source: NHSN pneumonia.pdf, Tables 1–4, printed pages 6-6–6-9 and footnotes on 6-12–6-16.</p></details><details><summary>Developer diagnostics</summary><pre>Evaluator input\n${esc(JSON.stringify(input, null, 2))}\n\nEvaluator output\n${esc(JSON.stringify(evaluation || result, null, 2))}</pre></details></form>`;
}

export function selectHostAlternative(state, input, type) {
  state.selectedHostAlternative = type;
  const item = { id: `host-${type}`, type };
  if (["leukemia", "lymphoma", "splenectomy", "solid-organ-transplant", "hematopoietic-stem-cell-transplant"].includes(type)) item.present = true;
  else if (["neutropenia-anc", "neutropenia-wbc"].includes(type)) Object.assign(item, { value: 0, unit: "cells/mm3", date: "" });
  else if (type === "hiv-cd4") Object.assign(item, { hivPositive: false, cd4Count: 0, unit: "cells/mm3" });
  else if (type === "cytotoxic-chemotherapy") item.activeOnDate = "";
  else Object.assign(item, { route: "enteral", daily: true, startDate: "", endDate: "" });
  input.hostEvidence = [item];
}
export function addPnu3CandidaPair(input) {
  input.microbiologyResults = ["blood", "sputum"].map((specimenType, index) => ({ id: `candida-${index}-${Date.now()}`, specimenType, collectionDate: "", testMethod: "culture", organism: { id: "candida-albicans", tags: ["fungus", "candida"] }, resultType: "qualitative", positive: true, contaminated: false, excluded: false }));
}
export function addPnu3Fungus(input) {
  addPneuRecord(input, "microbiologyResults", { specimenType: "bronchoscopic-bal", testMethod: "culture", resultType: "qualitative", minimallyContaminated: true, organism: { id: "fungus", tags: ["fungus"] } });
}

function setPath(object, path, value) { const keys = path.split("."); const last = keys.pop(); const target = keys.reduce((o, key) => o[Number.isInteger(+key) ? +key : key], object); target[last] = value; }
export function applyPneuControl(input, element) {
  const path = element.dataset.pneuField;
  if (path?.startsWith("clinicalFinding.")) { const [, kind] = path.split("."); const item = input.clinicalFindings.find(finding => finding.kind === kind); if (item) item.date = element.value; return; }
  if (path?.startsWith("measurement.")) { const [, kind, property] = path.split("."); let item = input.measurements.find(x => x.kind === kind); if (!item && element.value !== "") { item = { id: `measurement-${kind}`, kind, value: 0, unit: measurementSpecs[kind][1], date: "" }; input.measurements.push(item); } if (item) { if (property === "value" && element.value === "") input.measurements.splice(input.measurements.indexOf(item), 1); else item[property] = property === "value" ? Number(element.value) : element.value; } return; }
  if (!path) return; let value = element.type === "checkbox" ? element.checked : (element.type === "number" ? Number(element.value) : element.value); if (element.type === "radio" && ["true", "false"].includes(element.value)) value = element.value === "true"; setPath(input, path, value); syncImagingRelationships(input);
}
export function toggleClinicalFinding(input, kind, enabled) { const i = input.clinicalFindings.findIndex(x => x.kind === kind); if (enabled && i < 0) input.clinicalFindings.push({ id: `finding-${kind}`, kind, date: "" }); if (!enabled && i >= 0) input.clinicalFindings.splice(i, 1); }
export function toggleImageFinding(input, index, finding, enabled) { input.imagingStudies[index].findings = enabled && finding ? [finding] : []; }
export function setLabOrganism(input, index, id) { const tags = id === "virus" ? ["virus"] : id.startsWith("legionella") ? ["legionella"] : id === "candida" ? ["candida"] : ["bacterium"]; input.microbiologyResults[index].organism = { id, tags }; }
export function selectLabAlternative(state, input, algorithm, alternative) {
  state.selectedLabAlternative[algorithm] = alternative; input.microbiologyResults = []; input.histopathologyResults = [];
}
export function addLabAlternative(input, alternative) {
  const mapping = { blood: ["blood", "culture", "qualitative"], "pleural-fluid": ["pleural-fluid", "culture", "qualitative"], lrt: ["bronchoscopic-bal", "culture", "quantitative"], "lung-tissue": ["lung-tissue", "culture", "quantitative"], "bal-intracellular-bacteria": ["bronchoscopic-bal", "direct-microscopy", "quantitative"], "respiratory-or-tissue-identification": ["respiratory-secretions", "non-culture-diagnostic-test", "qualitative"], "paired-sera-fourfold-igg": ["paired-sera", "igg", "quantitative"], "legionella-paired-sera-ifa": ["paired-sera", "ifa", "quantitative"], "legionella-urine-antigen": ["urine", "eia", "qualitative"] };
  const [specimenType, testMethod, resultType] = mapping[alternative]; addPneuRecord(input, "microbiologyResults", { specimenType, testMethod, resultType, unit: alternative.includes("paired") ? "fold-rise" : alternative === "bal-intracellular-bacteria" ? "percent-cells" : undefined, organism: { id: alternative.startsWith("legionella") ? "legionella-pneumophila-serogroup-1" : alternative === "respiratory-or-tissue-identification" ? "virus" : "eligible-bacterium", tags: alternative.startsWith("legionella") ? ["legionella"] : alternative === "respiratory-or-tissue-identification" ? ["virus"] : ["bacterium"] } });
}
