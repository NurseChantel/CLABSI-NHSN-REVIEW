import { evaluatePnu1 } from "./pnu1.js";
import { renderPnu1Safely } from "./pnu1-renderer.js";
import { evaluatePnu2, PNU2_PROTOCOL } from "./pnu2.js";
import { renderPnu2Safely } from "./pnu2-renderer.js";

const host = () => ({ status: "notMet", reasons: [] });
const ventilator = () => ({ inPlace: false, periods: [] });
const baseInput = () => ({
  patientContext: { dateOfBirth: "1980-01-01", hostStatus: host(), ventilator: ventilator() },
  admissionDate: "2026-01-01", underlyingPulmonaryOrCardiacDisease: false, soleAvailableImage: true,
  imagingStudies: [{ id: "image-1", date: "2026-01-10", modality: "chest-xray", findings: [], interpretation: "definitive", attributedToOtherCondition: false }],
  imagingRelationships: [], measurements: [], clinicalFindings: []
});

export const PNEU_UI_REGISTRY = Object.freeze({
  PNU1: Object.freeze({ label: "PNU1 — Clinically defined pneumonia", implemented: true, evaluate: evaluatePnu1, render: renderPnu1Safely }),
  PNU2: Object.freeze({ label: "PNU2 — Pneumonia with specific laboratory findings", implemented: true, evaluate: evaluatePnu2, render: renderPnu2Safely }),
  PNU3: Object.freeze({ label: "PNU3 — Not yet implemented", implemented: false })
});

export function createPneuState() {
  return { selectedSubtype: "", inputs: { PNU1: baseInput(), PNU2: { ...baseInput(), microbiologyResults: [], histopathologyResults: [], bloodResults: [] } }, openLabBranch: { PNU2: "" } };
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
const field = (label, name, value, type = "text", attrs = "") => `<label class="pneu-field"><span>${label}</span><input type="${type}" data-pneu-field="${name}" value="${esc(value)}" ${attrs}></label>`;
const findingLabels = {
  "altered-mental-status-no-other-cause": "Altered mental status with no other recognized cause", "sputum-change": "New onset/change in purulent sputum", "secretions-change": "Change in respiratory secretions", "increased-suctioning": "Increased suctioning requirements", dyspnea: "Dyspnea", "new-or-worsening-cough": "New or worsening cough", rales: "Rales", crackles: "Crackles", "bronchial-breath-sounds": "Bronchial breath sounds", "worsening-gas-exchange": "Worsening gas exchange", "temperature-instability": "Temperature instability", "nasal-flaring": "Nasal flaring", wheezing: "Wheezing", rhonchi: "Rhonchi", cough: "Cough", apnea: "Apnea"
};
const findingKinds = Object.keys(findingLabels);
const measurementSpecs = [["temperature", "Temperature", "C"], ["wbc", "WBC", "cells/mm3"], ["bands", "Bands", "percent"], ["respiratory-rate", "Respiratory rate", "breaths/min"], ["heart-rate", "Heart rate", "beats/min"]];
const imageFindings = [["infiltrate", "Infiltrate"], ["consolidation", "Consolidation"], ["cavitation", "Cavitation"], ["air-space-disease", "Air-space disease"], ["focal-opacification", "Focal opacification"], ["patchy-increased-density", "Patchy increased density"], ["pneumatoceles", "Pneumatoceles (infant branch)"]];

function ageYears(input) {
  const dob = Date.parse(`${input.patientContext.dateOfBirth}T00:00:00Z`); const event = Date.parse(`${input.imagingStudies[0]?.date}T00:00:00Z`);
  return Number.isFinite(dob) && Number.isFinite(event) ? (event - dob) / 31557600000 : 99;
}
function inputValue(input, kind) { return input.measurements.find(x => x.kind === kind)?.value ?? ""; }
function evidenceDate(input, kind) { return input.measurements.find(x => x.kind === kind)?.date ?? input.imagingStudies[0]?.date ?? ""; }

export function addPneuRecord(input, collection, seed = {}) {
  const list = input[collection]; const prefix = collection === "imagingStudies" ? "image" : "lab";
  list.push(collection === "imagingStudies" ? { id: `${prefix}-${Date.now()}-${list.length}`, date: "", modality: "chest-xray", findings: [], interpretation: "definitive", attributedToOtherCondition: false, ...seed }
    : { id: `${prefix}-${Date.now()}-${list.length}`, specimenType: "blood", collectionDate: "", testMethod: "culture", organism: { id: "eligible-bacterium", tags: ["bacterium"] }, resultType: "qualitative", positive: true, contaminated: false, excluded: false, ...seed });
  syncImagingRelationships(input); return list.length;
}
export function removePneuRecord(input, collection, index) { input[collection].splice(index, 1); syncImagingRelationships(input); }
function syncImagingRelationships(input) { input.imagingRelationships = input.imagingStudies.slice(1).map((study, i) => ({ fromStudyId: input.imagingStudies[i].id, toStudyId: study.id, type: study.relationshipType || "persistent" })); }

function statusHtml(subtype, result) {
  if (!result.ok) return `<div class="pneu-status warning" role="status"><strong>${subtype} input incomplete</strong><p>${esc(result.errors?.[0] || result.error)}</p></div>`;
  const e = result.evaluation; const needed = e.remainingRequirements?.map(x => `<li>${esc(x.message)}</li>`).join("") || "";
  return `<div class="pneu-status ${e.met ? "met" : "warning"}" role="status"><strong>${esc(e.status)}</strong>${needed ? `<div>Still needed:</div><ul>${needed}</ul>` : ""}<div class="pneu-window-summary"><span>DOE <b>${esc(e.dateOfEvent || "—")}</b></span><span>IWP <b>${esc(e.infectionWindow?.start || "—")} – ${esc(e.infectionWindow?.end || "—")}</b></span><span>RIT <b>${esc(e.repeatInfectionTimeframe?.start || "—")} – ${esc(e.repeatInfectionTimeframe?.end || "—")}</b></span></div></div>`;
}

function patientSection(input) {
  const infant = ageYears(input) < 2 / 12;
  return `<section class="evidence-group"><h4>Patient Context</h4><div class="pneu-grid">${field("Date of birth", "patientContext.dateOfBirth", input.patientContext.dateOfBirth, "date")}${field("Admission date", "admissionDate", input.admissionDate, "date")}<label class="pneu-check"><input type="checkbox" data-pneu-field="underlyingPulmonaryOrCardiacDisease"${checked(input.underlyingPulmonaryOrCardiacDisease)}> Underlying pulmonary or cardiac disease</label>${infant ? field("Gestational age at birth (weeks)", "patientContext.gestationalAgeWeeksAtBirth", input.patientContext.gestationalAgeWeeksAtBirth ?? "", "number", 'min="20" max="45"') : ""}</div></section>`;
}
function imagingSection(input) {
  const rows = input.imagingStudies.map((study, i) => `<div class="pneu-repeat-row" data-image-row="${i}"><div class="pneu-row-title"><strong>Study ${i + 1}</strong>${input.imagingStudies.length > 1 ? `<button type="button" class="link-button" data-pneu-remove="imagingStudies" data-index="${i}">Remove study</button>` : ""}</div><div class="pneu-grid">${field("Imaging date", `imagingStudies.${i}.date`, study.date, "date")}<label class="pneu-field"><span>Modality</span><select data-pneu-field="imagingStudies.${i}.modality"><option value="chest-xray">Chest x-ray</option><option value="ct">CT</option></select></label><label class="pneu-field"><span>Interpretation</span><select data-pneu-field="imagingStudies.${i}.interpretation"><option value="definitive"${study.interpretation === "definitive" ? " selected" : ""}>Definitive</option><option value="equivocal"${study.interpretation === "equivocal" ? " selected" : ""}>Equivocal</option></select></label>${i ? `<label class="pneu-field"><span>Relation to prior study</span><select data-pneu-field="imagingStudies.${i}.relationshipType"><option value="persistent">Persistent</option><option value="progressive">Progressive</option></select></label>` : ""}</div><div class="pneu-check-grid">${imageFindings.map(([value, label]) => `<label><input type="checkbox" data-image-finding="${value}" data-index="${i}"${checked(study.findings.includes(value))}> ${label}</label>`).join("")}</div><div class="pneu-check-grid"><label><input type="checkbox" data-pneu-field="imagingStudies.${i}.clinicalCorrelation"${checked(study.clinicalCorrelation)}> Physician correlation/clarification supports pneumonia</label><label><input type="checkbox" data-pneu-field="imagingStudies.${i}.attributedToOtherCondition"${checked(study.attributedToOtherCondition)}> Finding attributed to another condition</label></div></div>`).join("");
  return `<section class="evidence-group"><div class="pneu-section-title"><h4>Imaging</h4><button type="button" data-pneu-add="imagingStudies">Add imaging study</button></div><label class="pneu-check"><input type="checkbox" data-pneu-field="soleAvailableImage"${checked(input.soleAvailableImage)}> This is the sole available imaging study</label>${rows}</section>`;
}
function clinicalSection(input) {
  const years = ageYears(input); const allowed = years <= 1 ? ["temperature-instability", "secretions-change", "increased-suctioning", "worsening-gas-exchange", "apnea", "nasal-flaring", "wheezing", "rales", "rhonchi", "cough"] : years <= 12 ? ["sputum-change", "secretions-change", "increased-suctioning", "dyspnea", "apnea", "cough", "rales", "bronchial-breath-sounds", "worsening-gas-exchange"] : findingKinds;
  const findings = new Set(input.clinicalFindings.map(x => x.kind)); const date = input.clinicalFindings[0]?.date ?? input.imagingStudies[0]?.date ?? "";
  return `<section class="evidence-group"><h4>Clinical Evidence</h4>${field("Clinical finding date", "clinicalDate", date, "date")}<div class="pneu-measurements">${measurementSpecs.filter(([kind]) => years <= 1 || !["heart-rate"].includes(kind)).map(([kind, label, unit]) => `<div>${field(label, `measurement.${kind}.value`, inputValue(input, kind), "number", 'step="any"')}<span class="unit">${unit}</span>${field(`${label} date`, `measurement.${kind}.date`, evidenceDate(input, kind), "date")}</div>`).join("")}</div><div class="pneu-check-grid">${allowed.map(kind => `<label><input type="checkbox" data-clinical-finding="${kind}"${checked(findings.has(kind))}> ${findingLabels[kind]}</label>`).join("")}</div><p class="guide-intro">Enter one systemic finding and the applicable respiratory finding groups; the evaluator applies the age-specific threshold and grouping rules.</p></section>`;
}

const branchLabel = id => id.replaceAll("-", " ").replace(/\b\w/g, x => x.toUpperCase());
function labSection(state, input, evaluation) {
  const met = evaluation?.laboratoryEvidence?.branches?.find(x => x.met)?.id; const preferred = met || PNU2_PROTOCOL.branches[0]; const open = state.openLabBranch.PNU2 || preferred;
  const accordions = PNU2_PROTOCOL.branches.map(id => { const branch = evaluation?.laboratoryEvidence?.branches?.find(x => x.id === id); const isOpen = id === open; return `<div class="pneu-accordion"><button type="button" data-lab-branch="${id}" aria-expanded="${isOpen}"><span>${branchLabel(id)}</span><span>${branch?.met ? "Met" : "Not met · 1 missing"}</span></button>${isOpen ? `<div class="pneu-accordion-body">Use the laboratory records below to complete this pathway. Only one complete pathway is required.</div>` : ""}</div>`; }).join("");
  const rows = input.microbiologyResults.map((lab, i) => `<div class="pneu-repeat-row"><div class="pneu-row-title"><strong>Laboratory record ${i + 1}</strong><button type="button" class="link-button" data-pneu-remove="microbiologyResults" data-index="${i}">Remove record</button></div><div class="pneu-grid">${field("Collection date", `microbiologyResults.${i}.collectionDate`, lab.collectionDate, "date")}<label class="pneu-field"><span>Specimen type</span><select data-pneu-field="microbiologyResults.${i}.specimenType">${["blood","pleural-fluid","lung-tissue","bronchoscopic-bal","protected-specimen-brushing","nonbronchoscopic-bal","endotracheal-aspirate","respiratory-secretions","paired-sera","urine"].map(x => `<option value="${x}"${lab.specimenType === x ? " selected" : ""}>${branchLabel(x)}</option>`).join("")}</select></label><label class="pneu-field"><span>Test method</span><select data-pneu-field="microbiologyResults.${i}.testMethod">${["culture","non-culture-diagnostic-test","direct-microscopy","igg","ifa","ria","eia","asc","ast"].map(x => `<option value="${x}"${lab.testMethod === x ? " selected" : ""}>${x.toUpperCase()}</option>`).join("")}</select></label><label class="pneu-field"><span>Organism</span><select data-lab-organism data-index="${i}"><option value="eligible-bacterium">Eligible bacterium</option><option value="virus">Virus</option><option value="legionella-pneumophila-serogroup-1">Legionella pneumophila serogroup 1</option><option value="candida">Candida</option></select></label><label class="pneu-field"><span>Result type</span><select data-pneu-field="microbiologyResults.${i}.resultType"><option value="qualitative">Qualitative</option><option value="quantitative"${lab.resultType === "quantitative" ? " selected" : ""}>Quantitative</option><option value="semiquantitative"${lab.resultType === "semiquantitative" ? " selected" : ""}>Semiquantitative</option></select></label>${lab.resultType === "quantitative" ? field("Quantitative result", `microbiologyResults.${i}.value`, lab.value ?? "", "number", 'step="any"') + field("Result unit", `microbiologyResults.${i}.unit`, lab.unit ?? "") : ""}${lab.resultType === "semiquantitative" ? field("Semiquantitative result", `microbiologyResults.${i}.category`, lab.category ?? "") : ""}${lab.specimenType === "pleural-fluid" ? `<label class="pneu-field"><span>Collection method/timing</span><select data-pneu-field="microbiologyResults.${i}.collectionTechnique"><option value="thoracentesis">Thoracentesis</option><option value="chest-tube-within-24-hours">Chest tube within 24 hours</option></select></label>` : ""}</div><div class="pneu-check-grid"><label><input type="checkbox" data-pneu-field="microbiologyResults.${i}.contaminated"${checked(lab.contaminated)}> Contaminated</label><label><input type="checkbox" data-pneu-field="microbiologyResults.${i}.excluded"${checked(lab.excluded)}> ASC/AST-only or otherwise excluded</label></div></div>`).join("");
  const pathology = input.histopathologyResults.map((item, i) => `<div class="pneu-repeat-row"><div class="pneu-row-title"><strong>Histopathology record ${i + 1}</strong><button type="button" class="link-button" data-pneu-remove="histopathologyResults" data-index="${i}">Remove record</button></div><div class="pneu-grid">${field("Evidence date", `histopathologyResults.${i}.date`, item.date, "date")}<label class="pneu-field"><span>Finding</span><select data-pneu-field="histopathologyResults.${i}.finding"><option value="abscess-or-consolidation-with-intense-pmn"${item.finding === "abscess-or-consolidation-with-intense-pmn" ? " selected" : ""}>Abscess or consolidation with intense PMN accumulation</option><option value="fungal-hyphae-or-pseudohyphae-invading-parenchyma"${item.finding === "fungal-hyphae-or-pseudohyphae-invading-parenchyma" ? " selected" : ""}>Fungal hyphae or pseudohyphae invading lung parenchyma</option></select></label></div></div>`).join("");
  return `<section class="evidence-group pneu-laboratory"><div class="pneu-section-title"><h4>Laboratory Evidence</h4><button type="button" data-pneu-add="microbiologyResults">Add laboratory record</button></div><p><strong>Meeting any one complete laboratory pathway can satisfy the PNU2 laboratory criterion.</strong></p><div class="pneu-accordions">${accordions}</div>${rows}<div class="pneu-section-title"><h5>Histopathology</h5><button type="button" data-add-histopathology>Add histopathology record</button></div>${pathology}</section>`;
}

export function renderPneuAbstraction(state, subtype) {
  const input = state.inputs[subtype]; const result = evaluatePneuSubtype(subtype, input); const evaluation = result.ok ? result.evaluation : null;
  return `${statusHtml(subtype, result)}<form class="pneu-form" data-subtype="${subtype}">${patientSection(input)}<section class="evidence-group"><h4>Timeline</h4><p>Candidate Date of Event and surveillance windows are calculated from dated evidence.</p>${evaluation ? `<div class="pneu-window-summary"><span>Candidate DOE <b>${esc(evaluation.dateOfEvent || "Not yet available")}</b></span><span>Infection Window Period <b>${esc(evaluation.infectionWindow?.start)} – ${esc(evaluation.infectionWindow?.end)}</b></span><span>Repeat Infection Timeframe <b>${esc(evaluation.repeatInfectionTimeframe?.start || "—")} – ${esc(evaluation.repeatInfectionTimeframe?.end || "—")}</b></span>${subtype === "PNU2" ? `<span>Secondary BSI Attribution Period <b>${esc(evaluation.secondaryBsiAttributionPeriod?.start || "—")} – ${esc(evaluation.secondaryBsiAttributionPeriod?.end || "—")}</b></span>` : ""}</div>` : '<p class="validation-note">A valid dated imaging record is required to calculate surveillance windows.</p>'}</section>${imagingSection(input)}${clinicalSection(input)}${subtype === "PNU1" ? '<section class="evidence-group"><h4>Laboratory Evidence</h4><p><strong>PNU1 has no laboratory criterion.</strong></p></section>' : labSection(state, input, evaluation)}<div class="pneu-actions"><button type="button" data-pneu-reset>Reset ${subtype}</button></div><details><summary>NHSN Reference</summary><p>NHSN pneumonia.pdf, Tables 1–3, printed pages 6-6–6-8; NHSN HAI.pdf, Chapter 2, printed pages 2-3–2-19.</p></details><details><summary>Developer diagnostics</summary><pre>Evaluator input\n${esc(JSON.stringify(input, null, 2))}\n\nEvaluator output\n${esc(JSON.stringify(evaluation || result, null, 2))}</pre></details></form>`;
}

function setPath(object, path, value) { const keys = path.split("."); const last = keys.pop(); const target = keys.reduce((o, key) => o[Number.isInteger(+key) ? +key : key], object); target[last] = value; }
export function applyPneuControl(input, element) {
  const path = element.dataset.pneuField;
  if (path === "clinicalDate") { input.clinicalFindings.forEach(x => { x.date = element.value; }); return; }
  if (path?.startsWith("measurement.")) { const [, kind, property] = path.split("."); let item = input.measurements.find(x => x.kind === kind); if (!item && element.value !== "") { item = { id: `measurement-${kind}`, kind, value: 0, unit: Object.fromEntries(measurementSpecs.map(x => [x[0], x[2]]))[kind], date: input.imagingStudies[0]?.date || "" }; input.measurements.push(item); } if (item) { if (property === "value" && element.value === "") input.measurements.splice(input.measurements.indexOf(item), 1); else item[property] = property === "value" ? Number(element.value) : element.value; } return; }
  if (!path) return; const value = element.type === "checkbox" ? element.checked : (element.type === "number" ? Number(element.value) : element.value); setPath(input, path, value); syncImagingRelationships(input);
}
export function toggleClinicalFinding(input, kind, enabled) { const i = input.clinicalFindings.findIndex(x => x.kind === kind); if (enabled && i < 0) input.clinicalFindings.push({ id: `finding-${kind}`, kind, date: input.imagingStudies[0]?.date || "" }); if (!enabled && i >= 0) input.clinicalFindings.splice(i, 1); }
export function toggleImageFinding(input, index, finding, enabled) { const list = input.imagingStudies[index].findings; if (enabled && !list.includes(finding)) list.push(finding); if (!enabled) input.imagingStudies[index].findings = list.filter(x => x !== finding); }
export function setLabOrganism(input, index, id) { const tags = id === "virus" ? ["virus"] : id.startsWith("legionella") ? ["legionella"] : id === "candida" ? ["candida"] : ["bacterium"]; input.microbiologyResults[index].organism = { id, tags }; }
