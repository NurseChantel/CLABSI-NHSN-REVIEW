import { evaluatePnu1, pnuTachypneaThreshold, PNU1_SOURCES } from "./pnu1.js";
import { renderPnu1Safely } from "./pnu1-renderer.js";
import { evaluatePnu2, PNU2_PROTOCOL, PNU2_SOURCES } from "./pnu2.js";
import { renderPnu2Safely } from "./pnu2-renderer.js";
import { evaluatePnu3, PNU3_SOURCES } from "./pnu3.js";
import { renderPnu3Safely } from "./pnu3-renderer.js";
import {
  blockStatus, bulletSelected, FOOTNOTE_TEXT, IMAGING_CELL, pathwayApplicable, pathwayStatus,
  PNU1_PATHWAYS, PNU2_COMMON_LAB, PNU2_DEFINITIVE_LAB, PNU2_SIGN_PATHWAY, PNU3_LAB, PNU3_SIGN_PATHWAY, SPECIMEN_THRESHOLDS
} from "./pneu-manual-view.js";

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

const FINDING_LABELS = {
  "altered-mental-status-no-other-cause": "Altered mental status, no other recognized cause", "sputum-change": "New onset purulent sputum or change in sputum character",
  "secretions-change": "Increased respiratory secretions", "increased-suctioning": "Increased suctioning requirements", dyspnea: "Dyspnea",
  "new-or-worsening-cough": "New onset or worsening cough", rales: "Rales", crackles: "Crackles", "bronchial-breath-sounds": "Bronchial breath sounds",
  "worsening-gas-exchange": "Worsening gas exchange", "temperature-instability": "Temperature instability", "nasal-flaring": "Nasal flaring with retraction of chest wall or grunting",
  wheezing: "Wheezing", rhonchi: "Rhonchi", cough: "Cough", apnea: "Apnea", hemoptysis: "Hemoptysis", "pleuritic-chest-pain": "Pleuritic chest pain"
};
const MEASUREMENT_UNITS = { temperature: "C", wbc: "cells/mm3", bands: "percent", "respiratory-rate": "breaths/min", "heart-rate": "beats/min" };
const COMMON_BRANCHES = new Set(["blood", "pleural-fluid", "bronchoscopic-bal", "protected-specimen-brushing", "nonbronchoscopic-bal", "endotracheal-aspirate", "lung-tissue", "bal-intracellular-bacteria", "histopathology-abscess", "histopathology-invasive-fungus"]);
const DEFINITIVE_BRANCHES = new Set(PNU2_PROTOCOL.branches.filter(id => !COMMON_BRANCHES.has(id)));

function ageYears(input) {
  const dob = Date.parse(`${input.patientContext.dateOfBirth}T00:00:00Z`); const event = Date.parse(`${input.imagingStudies[0]?.date}T00:00:00Z`);
  return Number.isFinite(dob) && Number.isFinite(event) ? (event - dob) / 31557600000 : null;
}
function anchorDate(input) { return input.imagingStudies.map(study => study.date).filter(Boolean).sort()[0] || ""; }
function measurementOf(input, kind) { return input.measurements.find(item => item.kind === kind); }
function findingOf(input, kinds) { return input.clinicalFindings.find(item => kinds.includes(item.kind)); }

// -------------------------------------------------------------------- status panel

function requirementLines(subtype, input, evaluation) {
  const age = ageYears(input); const lines = [];
  const imagingMet = Boolean(evaluation?.imaging?.met);
  lines.push({ label: "Imaging test evidence", met: imagingMet, detail: imagingMet ? "Requirement satisfied" : "Record two serial studies showing persistence or progression, or a single definitive study in a patient without underlying pulmonary or cardiac disease" });
  if (subtype === "PNU1") {
    for (const pathway of PNU1_PATHWAYS) {
      if (!pathwayApplicable(pathway.id, age)) continue;
      for (const { block, status } of pathwayStatus(input, pathway, age).blocks) {
        lines.push({ label: `${pathway.heading} — ${blockName(block)}`, met: status.met, detail: status.met ? "Requirement satisfied" : shortfall(block, status) });
      }
    }
  } else {
    const signs = subtype === "PNU2" ? PNU2_SIGN_PATHWAY : PNU3_SIGN_PATHWAY;
    for (const { block, status } of pathwayStatus(input, signs, age).blocks) {
      lines.push({ label: blockName(block), met: status.met, detail: status.met ? "Requirement satisfied" : shortfall(block, status) });
    }
    if (subtype === "PNU3") {
      const hostMet = Boolean(evaluation?.hostEligibility?.met);
      lines.push({ label: "Immunocompromised host", met: hostMet, detail: hostMet ? "Requirement satisfied" : "Select and evidence one condition from footnote 10" });
    }
    const labMet = Boolean(evaluation?.laboratoryEvidence?.met);
    lines.push({ label: "Laboratory", met: labMet, detail: labMet ? "Requirement satisfied" : "Record one complete, eligible laboratory finding" });
  }
  return lines;
}
function blockName(block) {
  return { systemic: "At least one systemic finding", respiratory: "Respiratory finding bullets", clinical: "At least one clinical finding", prerequisite: "Worsening gas exchange", findings: "Finding bullets" }[block.id] || block.id;
}
function shortfall(block, status) {
  if (block.required === 1) return "Select one bullet in this group";
  return `${status.selectedCount} of ${block.required} required bullets selected — select ${status.remaining} more from a different bullet`;
}

function statusPanel(subtype, result, input) {
  const evaluation = result.ok ? result.evaluation : null;
  const met = Boolean(evaluation?.met);
  const lines = requirementLines(subtype, input, evaluation);
  const outstanding = lines.filter(line => !line.met);
  const headline = met ? `${subtype} definition met` : `${outstanding.length} requirement${outstanding.length === 1 ? "" : "s"} outstanding`;
  const rows = lines.map(line => `<li class="${line.met ? "met" : "pending"}"><span class="pneu-req-mark" aria-hidden="true">${line.met ? "✓" : "○"}</span><span class="pneu-req-label">${esc(line.label)}</span><span class="pneu-req-detail">${esc(line.detail)}</span></li>`).join("");
  const timing = met ? `<p class="pneu-req-timing">Date of event <b>${esc(evaluation.dateOfEvent || "—")}</b> · Infection window <b>${esc(evaluation.infectionWindow?.start || "—")} – ${esc(evaluation.infectionWindow?.end || "—")}</b></p>` : "";
  return `<section class="pneu-requirements ${met ? "met" : "pending"}" role="status" aria-live="polite">
    <div class="pneu-requirements-head"><strong>${subtype} — ${met ? "MET" : "NOT MET"}</strong><span>${esc(headline)}</span></div>
    <ul class="pneu-requirements-list">${rows}</ul>${timing}
  </section>`;
}

// -------------------------------------------------------------------- bullets

function bulletControl(input, bullet, block, pathwayId, age) {
  if (bullet.minimumAgeYears !== undefined && !(age !== null && age >= bullet.minimumAgeYears)) {
    return `<li class="pneu-bullet inapplicable"><span class="pneu-bullet-box" aria-hidden="true"></span><span class="pneu-bullet-text">${bullet.text}<em class="pneu-bullet-note">Not applicable at this patient's age</em></span></li>`;
  }
  const key = `${pathwayId}:${block.id}:${bullet.id}`;
  const active = bulletSelected(input, bullet);
  const detail = active ? bulletDetail(input, bullet, age) : "";
  return `<li class="pneu-bullet${active ? " selected" : ""}">
    <label><input type="checkbox" data-manual-bullet="${esc(key)}"${checked(active)}><span class="pneu-bullet-text">${bullet.text}</span></label>
    ${detail}
  </li>`;
}

function bulletDetail(input, bullet, age) {
  if (bullet.kinds) {
    const usingRate = !findingOf(input, bullet.kinds) && bullet.tachypnea && measurementOf(input, "respiratory-rate");
    const current = findingOf(input, bullet.kinds);
    const options = [...bullet.kinds.map(kind => `<option value="finding:${kind}"${selected(current?.kind, kind)}>${esc(FINDING_LABELS[kind] || kind)}</option>`),
      ...(bullet.tachypnea ? [`<option value="measurement:respiratory-rate"${usingRate ? " selected" : ""}>Tachypnea (documented rate)</option>`] : [])].join("");
    const dated = usingRate ? measurementOf(input, "respiratory-rate") : current;
    const rate = usingRate ? `${field("Rate", "measurement.respiratory-rate.value", dated?.value ?? "", "number", 'step="any"')}<span class="pneu-threshold-hint">Threshold &gt; ${esc(String(tachypneaThresholdFor(input, age)))} breaths/min</span>` : "";
    return `<div class="pneu-bullet-detail">${bullet.kinds.length > 1 || bullet.tachypnea ? `<label class="pneu-field"><span>Documented finding</span><select data-bullet-variant="${esc(bullet.id)}" data-kinds="${esc(bullet.kinds.join(","))}">${options}</select></label>` : ""}${rate}${field("Evidence date", usingRate ? "measurement.respiratory-rate.date" : `clinicalFinding.${dated?.kind ?? bullet.kinds[0]}.date`, dated?.date ?? "", "date")}</div>`;
  }
  const item = measurementOf(input, bullet.kind);
  const companion = bullet.companion ? `${field(bullet.companion.text, `measurement.${bullet.companion.kind}.value`, measurementOf(input, bullet.companion.kind)?.value ?? "", "number", 'step="any"')}` : "";
  return `<div class="pneu-bullet-detail">${field("Documented result", `measurement.${bullet.kind}.value`, item?.value ?? "", "number", 'step="any"')}${companion}${field("Evidence date", `measurement.${bullet.kind}.date`, item?.date ?? "", "date")}</div>`;
}

function tachypneaThresholdFor(input, age) {
  const eventDate = anchorDate(input);
  if (!eventDate || !input.patientContext.dateOfBirth) return age === null ? 25 : 25;
  try { return pnuTachypneaThreshold(input.patientContext, eventDate); } catch { return 25; }
}

function blockHtml(input, block, pathwayId, age) {
  const status = blockStatus(input, block, age);
  const counter = `<span class="pneu-block-counter ${status.met ? "met" : ""}">${block.required > 1 ? `${status.selectedCount} of ${block.required}` : status.met ? "✓" : "0 of 1"}</span>`;
  // The shortfall is stated next to the bullets themselves so the reviewer never has to
  // scroll back to a summary to see what this group still needs.
  const hint = status.met ? "" : `<p class="pneu-block-hint">${esc(shortfall(block, status))}</p>`;
  return `<div class="pneu-block${status.met ? " met" : ""}">
    <p class="pneu-block-lead"><span class="pneu-lead-text">${block.lead}</span>${counter}</p>
    <ul class="pneu-bullets">${block.bullets.map(bullet => bulletControl(input, bullet, block, pathwayId, age)).join("")}</ul>
    ${hint}
  </div>`;
}

function pathwayHtml(input, pathway, age, { showBand = true } = {}) {
  const applicable = pathwayApplicable(pathway.id, age);
  const status = pathwayStatus(input, pathway, age);
  const band = showBand && pathway.band ? `<p class="pneu-alternate-band">${esc(pathway.band)}${applicable ? '<span class="pneu-active-chip">Applies to this patient</span>' : '<span class="pneu-inactive-chip">Age criteria not met</span>'}</p>` : "";
  return `<section class="pneu-pathway${applicable ? " applicable" : " inapplicable"}${status.met ? " met" : ""}" data-pathway="${esc(pathway.id)}">
    ${band}${pathway.blocks.map(block => blockHtml(input, block, pathway.id, age)).join('<div class="pneu-and-rule"><span>AND</span></div>')}
  </section>`;
}

// -------------------------------------------------------------------- imaging cell

function imagingCell(input, evaluation, errors) {
  const age = ageYears(input); const infant = age !== null && age <= 1;
  const findings = [...IMAGING_CELL.findings.filter(item => !item.infantOnly || infant)];
  const rows = input.imagingStudies.map((study, index) => `<div class="pneu-study-row">
    ${field("Date", `imagingStudies.${index}.date`, study.date, "date", "", errorFor(errors, `image-date-${index}`))}
    <label class="pneu-field"><span>Finding</span><select data-image-select data-index="${index}"><option value="">Select</option>${[...findings, ...IMAGING_CELL.alternativeDescriptors].map(item => `<option value="${item.id}"${selected(study.findings[0], item.id)}>${esc(item.text)}</option>`).join("")}</select></label>
    <label class="pneu-field"><span>Interpretation</span><select data-pneu-field="imagingStudies.${index}.interpretation"><option value="definitive"${selected(study.interpretation, "definitive")}>Definitive</option><option value="equivocal"${selected(study.interpretation, "equivocal")}>Equivocal</option></select></label>
    ${index > 0 ? `<label class="pneu-field"><span>Pattern</span><select data-pneu-field="imagingStudies.${index}.relationshipType"><option value="persistent"${selected(study.relationshipType, "persistent")}>Persistent</option><option value="progressive"${selected(study.relationshipType, "progressive")}>Progressive</option></select></label>` : ""}
    <label class="pneu-inline-check"><input type="checkbox" data-pneu-field="imagingStudies.${index}.attributedToOtherCondition"${checked(study.attributedToOtherCondition)}> Attributed to another condition</label>
    ${study.interpretation === "equivocal" ? `<label class="pneu-inline-check"><input type="checkbox" data-pneu-field="imagingStudies.${index}.clinicalCorrelation"${checked(study.clinicalCorrelation)}> Clinical correlation documented ⁽¹³⁾</label>` : ""}
    ${input.imagingStudies.length > 1 ? `<button type="button" class="link-button" data-pneu-remove="imagingStudies" data-index="${index}">Remove</button>` : ""}
  </div>`).join("");
  const met = Boolean(evaluation?.imaging?.met);
  return `<div class="pneu-imaging-manual">
    <p class="pneu-block-lead"><span class="pneu-lead-text">${IMAGING_CELL.lead}</span><span class="pneu-block-counter ${met ? "met" : ""}">${met ? "✓" : "Needed"}</span></p>
    <p class="pneu-imaging-pattern">${IMAGING_CELL.patterns.join("<br><span class=\"pneu-or-word\">or</span><br>")}</p>
    <ul class="pneu-bullets plain">${findings.map(item => `<li class="pneu-bullet static"><span class="pneu-bullet-text">${esc(item.text)}</span></li>`).join("")}</ul>
    <p class="pneu-imaging-note">${IMAGING_CELL.note}</p>
    <fieldset class="pneu-choice"><legend>Underlying pulmonary or cardiac disease?</legend>
      <label><input type="radio" name="underlying" data-pneu-field="underlyingPulmonaryOrCardiacDisease" value="true"${checked(input.underlyingPulmonaryOrCardiacDisease)}> Yes</label>
      <label><input type="radio" name="underlying" data-pneu-field="underlyingPulmonaryOrCardiacDisease" value="false"${checked(!input.underlyingPulmonaryOrCardiacDisease)}> No</label>
    </fieldset>
    <label class="pneu-inline-check"><input type="checkbox" data-pneu-field="soleAvailableImage"${checked(input.soleAvailableImage)}> This is the only imaging test available ⁽¹⁾</label>
    <div class="pneu-cell-subtitle">Recorded studies</div>
    ${rows}
    <button type="button" data-pneu-add="imagingStudies">+ Add imaging study</button>
  </div>`;
}

// -------------------------------------------------------------------- laboratory

function thresholdText(specimen) { return SPECIMEN_THRESHOLDS[specimen] || "Select a specimen to see its Table 5 threshold"; }

function labRecordFields(input, errors, alternative) {
  const lab = input.microbiologyResults[0];
  if (!alternative) return "";
  if (alternative === "histopathology") return `<div class="pneu-nested-evidence"><p>Record one qualifying histopathology finding.</p><button type="button" data-add-histopathology>Add histopathology evidence</button>${input.histopathologyResults.map((item, index) => `${field("Evidence date", `histopathologyResults.${index}.date`, item.date, "date")}<label class="pneu-field"><span>Finding</span><select data-pneu-field="histopathologyResults.${index}.finding"><option value="abscess-or-consolidation-with-intense-pmn"${selected(item.finding, "abscess-or-consolidation-with-intense-pmn")}>Abscess or foci of consolidation with intense PMN accumulation</option><option value="fungal-hyphae-or-pseudohyphae-invading-parenchyma"${selected(item.finding, "fungal-hyphae-or-pseudohyphae-invading-parenchyma")}>Lung parenchyma invasion by fungal hyphae or pseudohyphae</option></select></label>`).join("")}</div>`;
  if (!lab) return `<button type="button" data-add-lab-alternative="${alternative}">Add evidence for this finding</button>`;
  const lrt = alternative === "lrt";
  const specimenChoices = lrt ? ["bronchoscopic-bal", "protected-bal", "protected-specimen-brushing", "nonbronchoscopic-bal", "nonbronchoscopic-protected-specimen-brushing", "endotracheal-aspirate"]
    : alternative === "lung-tissue" ? ["lung-tissue"] : alternative === "blood" ? ["blood"] : alternative === "pleural-fluid" ? ["pleural-fluid"]
    : alternative === "bal-intracellular-bacteria" ? ["bronchoscopic-bal"]
    : alternative === "respiratory-or-tissue-identification" ? ["respiratory-secretions", "bronchoscopic-bal", "protected-specimen-brushing", "nonbronchoscopic-bal", "endotracheal-aspirate", "lung-tissue"]
    : alternative === "legionella-urine-antigen" ? ["urine"] : ["paired-sera"];
  return `<div class="pneu-nested-evidence"><div class="pneu-grid">
    ${field("Collection date", "microbiologyResults.0.collectionDate", lab.collectionDate, "date", "", errorFor(errors, "lab-date-0"))}
    <label class="pneu-field"><span>Specimen type</span><select data-pneu-field="microbiologyResults.0.specimenType">${specimenChoices.map(item => `<option value="${item}"${selected(lab.specimenType, item)}>${esc(item.replaceAll("-", " "))}</option>`).join("")}</select></label>
    <label class="pneu-field"><span>Organism result</span><select data-lab-organism data-index="0"><option value="eligible-bacterium"${selected(lab.organism?.id, "eligible-bacterium")}>Eligible bacterium</option><option value="virus"${selected(lab.organism?.id, "virus")}>Virus</option><option value="legionella-pneumophila-serogroup-1"${selected(lab.organism?.id, "legionella-pneumophila-serogroup-1")}>Legionella pneumophila serogroup 1</option><option value="candida"${selected(lab.organism?.id, "candida")}>Candida</option></select></label>
    ${lrt ? `<label class="pneu-inline-check"><input type="checkbox" data-pneu-field="microbiologyResults.0.artificialAirwayEligible"${checked(lab.artificialAirwayEligible)}> Obtained through an artificial airway ⁽⁹⁾</label>` : ""}
    <label class="pneu-field"><span>Result format</span><select data-pneu-field="microbiologyResults.0.resultType"><option value="qualitative"${selected(lab.resultType, "qualitative")}>Qualitative</option><option value="quantitative"${selected(lab.resultType, "quantitative")}>Quantitative</option><option value="semiquantitative"${selected(lab.resultType, "semiquantitative")}>Semiquantitative</option></select></label>
    ${lab.resultType === "quantitative" ? field(alternative === "bal-intracellular-bacteria" ? "Percent BAL cells" : "Quantitative result", "microbiologyResults.0.value", lab.value ?? "", "number", 'step="any"') : ""}
    ${lab.resultType === "semiquantitative" ? field("Semiquantitative result", "microbiologyResults.0.category", lab.category ?? "") : ""}
  </div>
  ${lrt || alternative === "lung-tissue" ? `<p class="pneu-threshold"><strong>Table 5 threshold:</strong> ${esc(thresholdText(lab.specimenType))}</p>` : ""}
  <div class="pneu-check-grid"><label><input type="checkbox" data-pneu-field="microbiologyResults.0.contaminated"${checked(lab.contaminated)}> Contaminated</label><label><input type="checkbox" data-pneu-field="microbiologyResults.0.excluded"${checked(lab.excluded)}> Exclusion applies</label></div>
  <button type="button" class="link-button" data-pneu-remove="microbiologyResults" data-index="0">Remove laboratory evidence</button></div>`;
}

function labCell(state, input, errors, table, algorithm) {
  const active = state.selectedLabAlternative[algorithm];
  return `<div class="pneu-block">
    <p class="pneu-block-lead">${table.lead}</p>
    <ul class="pneu-bullets">${table.options.map(option => `<li class="pneu-bullet${active === option.id ? " selected" : ""}"><label><input type="radio" name="lab-${esc(algorithm)}" data-lab-alternative="${option.id}" data-algorithm="${esc(algorithm)}"${checked(active === option.id)}><span class="pneu-bullet-text">${option.text}</span></label>${active === option.id ? labRecordFields(input, errors, option.id) : ""}</li>`).join("")}</ul>
  </div>`;
}

// -------------------------------------------------------------------- host (PNU3)

const HOST_OPTIONS = [
  ["neutropenia-anc", "Neutropenia — absolute neutrophil count &lt; 500/mm³"], ["neutropenia-wbc", "Neutropenia — total white blood cell count &lt; 500/mm³"],
  ["leukemia", "Leukemia"], ["lymphoma", "Lymphoma"], ["hiv-cd4", "HIV positive with CD4 count &lt; 200 cells/mm³"], ["splenectomy", "Splenectomy"],
  ["solid-organ-transplant", "History of solid organ transplant"], ["hematopoietic-stem-cell-transplant", "History of hematopoietic stem cell transplant"],
  ["cytotoxic-chemotherapy", "Cytotoxic chemotherapy"], ["systemic-steroids", "Enteral or parenteral steroids daily for &gt; 14 consecutive days on the date of event (excludes inhaled and topical)"]
];

function hostCell(state, input) {
  const type = state.selectedHostAlternative; const item = input.hostEvidence[0];
  let fields = "";
  if (item && ["neutropenia-anc", "neutropenia-wbc"].includes(type)) fields = `${field("Result", "hostEvidence.0.value", item.value ?? "", "number")}${field("Evidence date", "hostEvidence.0.date", item.date ?? "", "date")}`;
  else if (item && type === "hiv-cd4") fields = `${field("CD4 count", "hostEvidence.0.cd4Count", item.cd4Count ?? "", "number")}<label class="pneu-inline-check"><input type="checkbox" data-pneu-field="hostEvidence.0.hivPositive"${checked(item.hivPositive)}> HIV-positive status documented</label>`;
  else if (item && type === "cytotoxic-chemotherapy") fields = field("Active on date", "hostEvidence.0.activeOnDate", item.activeOnDate ?? "", "date");
  else if (item && type === "systemic-steroids") fields = `<label class="pneu-field"><span>Route</span><select data-pneu-field="hostEvidence.0.route"><option value="enteral"${selected(item.route, "enteral")}>Enteral</option><option value="parenteral"${selected(item.route, "parenteral")}>Parenteral</option></select></label>${field("Start date", "hostEvidence.0.startDate", item.startDate ?? "", "date")}${field("Through date", "hostEvidence.0.endDate", item.endDate ?? "", "date")}`;
  return `<div class="pneu-block">
    <p class="pneu-block-lead">Patient who is immunocompromised — select <u>one</u> condition ⁽¹⁰⁾</p>
    <ul class="pneu-bullets">${HOST_OPTIONS.map(([id, label]) => `<li class="pneu-bullet${type === id ? " selected" : ""}"><label><input type="radio" name="pnu3-host" data-host-alternative="${id}"${checked(type === id)}><span class="pneu-bullet-text">${label}</span></label></li>`).join("")}</ul>
    ${fields ? `<div class="pneu-nested-evidence pneu-grid">${fields}</div>` : ""}
  </div>`;
}

// -------------------------------------------------------------------- tables

function manualTable(title, headers, cells) {
  return `<figure class="pneu-manual-table">
    <figcaption>${esc(title)}</figcaption>
    <p class="pneu-table-note">NOTE: The PNEU Algorithms (PNU1,2,3) and Flowcharts include FOOTNOTE references. The interpretation and guidance provided in the FOOTNOTES are an important part of the algorithms and must be incorporated into the decision-making process when determining if a PNEU definition is met.</p>
    <div class="pneu-manual-grid cols-${headers.length}">
      ${headers.map(header => `<div class="pneu-manual-th">${esc(header)}</div>`).join("")}
      ${cells.map(cell => `<div class="pneu-manual-td">${cell}</div>`).join("")}
    </div>
  </figure>`;
}

function footnotesBlock(numbers) {
  return `<details class="pneu-footnotes"><summary>Footnotes referenced above</summary><dl>${numbers.map(number => `<dt>${number}</dt><dd>${esc(FOOTNOTE_TEXT[number])}</dd>`).join("")}</dl><p class="pneu-source-line">NHSN pneumonia.pdf, Chapter 6 — Device-associated Module (PNEU), printed pages 6-6 – 6-16.</p></details>`;
}

function pnu1Criteria(state, input, evaluation, errors) {
  const age = ageYears(input);
  const signs = PNU1_PATHWAYS.map((pathway, index) => pathwayHtml(input, pathway, age, { showBand: index > 0 })).join("");
  return manualTable("Table 1: Specific Site Algorithms for Clinically Defined Pneumonia (PNU1)", ["Imaging Test Evidence", "Signs / Symptoms"], [imagingCell(input, evaluation, errors), signs])
    + footnotesBlock([1, 2, 3, 4, 5, 6, 7, 13])
    + `<aside class="pneu-note">PNU1 has no laboratory criterion. Pathogens and secondary bloodstream infections are not reported for PNU1.</aside>`;
}

function pnu2Criteria(state, input, evaluation, errors) {
  const age = ageYears(input);
  const signs = pathwayHtml(input, PNU2_SIGN_PATHWAY, age);
  return manualTable(PNU2_COMMON_LAB.tableTitle, ["Imaging Test Evidence", "Signs / Symptoms", "Laboratory"], [imagingCell(input, evaluation, errors), signs, labCell(state, input, errors, PNU2_COMMON_LAB, "common")])
    + `<div class="pneu-or-rule"><span>OR</span></div>`
    + manualTable(PNU2_DEFINITIVE_LAB.tableTitle, ["Imaging Test Evidence", "Signs / Symptoms", "Laboratory"], [imagingCell(input, evaluation, errors), signs, labCell(state, input, errors, PNU2_DEFINITIVE_LAB, "definitive")])
    + footnotesBlock([1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13]);
}

function pnu3Criteria(state, input, evaluation, errors) {
  const age = ageYears(input);
  const signs = `${hostCell(state, input)}<div class="pneu-and-rule"><span>AND</span></div>${pathwayHtml(input, PNU3_SIGN_PATHWAY, age)}`;
  // Table 4 laboratory column: the two PNU3-specific findings, then "OR / Any of the
  // following from: LABORATORY CRITERIA DEFINED UNDER PNU2" — which is Tables 2 and 3.
  const lab = `${labCell(state, input, errors, PNU3_LAB, "pnu3")}
    <div class="pneu-or-rule"><span>OR</span></div>
    <p class="pneu-lab-crossref">Any of the following from <b>LABORATORY CRITERIA DEFINED UNDER PNU2</b></p>
    ${labCell(state, input, errors, PNU2_COMMON_LAB, "common")}
    <div class="pneu-or-rule"><span>OR</span></div>
    ${labCell(state, input, errors, PNU2_DEFINITIVE_LAB, "definitive")}`;
  return manualTable("Table 4: Specific Site Algorithm for Pneumonia in Immunocompromised Patients (PNU3)", ["Imaging Test Evidence", "Signs / Symptoms", "Laboratory"], [imagingCell(input, evaluation, errors), signs, lab])
    + footnotesBlock([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
}

// -------------------------------------------------------------------- shell

function friendlyErrors(result) {
  const errors = result.errors || [];
  return errors.map(raw => {
    if (/microbiologyResults\[\d+\]\.collectionDate/.test(raw)) return { key: `lab-date-${raw.match(/\[(\d+)\]/)[1]}`, message: raw.includes("ISO") ? "Enter a valid collection date." : "Enter the laboratory specimen collection date." };
    if (/microbiologyResults\[\d+\]\.specimenType/.test(raw)) return { key: `lab-specimen-${raw.match(/\[(\d+)\]/)[1]}`, message: "Select a specimen type." };
    if (/microbiologyResults\[\d+\]\.organism/.test(raw)) return { key: `lab-organism-${raw.match(/\[(\d+)\]/)[1]}`, message: "Enter the organism result." };
    if (/imagingStudies\[\d+\]\.date/.test(raw)) return { key: `image-date-${raw.match(/\[(\d+)\]/)[1]}`, message: raw.includes("ISO") ? "Enter a valid imaging date." : "Enter the imaging study date." };
    if (/patientContext\.dateOfBirth/.test(raw)) return { key: "dob", message: "Enter the patient's date of birth." };
    if (/admissionDate/.test(raw)) return { key: "admission", message: "Enter the admission date." };
    return null;
  }).filter(Boolean);
}
function errorFor(errors, key) { return errors.find(error => error.key === key)?.message || ""; }

function patientSection(input, errors) {
  const age = ageYears(input); const veryYoung = age !== null && age < 2 / 12;
  return `<section class="pneu-context pneu-context-compact"><strong>Patient context</strong>${field("Date of birth", "patientContext.dateOfBirth", input.patientContext.dateOfBirth, "date", "", errorFor(errors, "dob"))}${field("Admission date", "admissionDate", input.admissionDate, "date", "", errorFor(errors, "admission"))}${veryYoung ? field("Gestational age (weeks)", "patientContext.gestationalAgeWeeksAtBirth", input.patientContext.gestationalAgeWeeksAtBirth ?? "", "number", 'min="20" max="45"') : ""}</section>`;
}

export function renderPneuAbstraction(state, subtype) {
  const input = state.inputs[subtype]; const result = evaluatePneuSubtype(subtype, input);
  const evaluation = result.ok ? result.evaluation : null; const errors = friendlyErrors(result);
  const criteria = subtype === "PNU1" ? pnu1Criteria(state, input, evaluation, errors) : subtype === "PNU2" ? pnu2Criteria(state, input, evaluation, errors) : pnu3Criteria(state, input, evaluation, errors);
  return `${statusPanel(subtype, result, input)}<form class="pneu-form" data-subtype="${subtype}">${patientSection(input, errors)}${criteria}<div class="pneu-actions"><button type="button" data-pneu-reset>Reset ${subtype}</button></div><details><summary>Developer diagnostics</summary><pre>Evaluator input\n${esc(JSON.stringify(input, null, 2))}\n\nEvaluator output\n${esc(JSON.stringify(evaluation || result, null, 2))}</pre></details></form>`;
}

// -------------------------------------------------------------------- state changes

export function addPneuRecord(input, collection, seed = {}) {
  const list = input[collection]; const prefix = collection === "imagingStudies" ? "image" : "lab";
  list.push(collection === "imagingStudies" ? { id: `${prefix}-${Date.now()}-${list.length}`, date: "", modality: "chest-xray", findings: [], interpretation: "definitive", attributedToOtherCondition: false, ...seed }
    : { id: `${prefix}-${Date.now()}-${list.length}`, specimenType: "blood", collectionDate: "", testMethod: "culture", organism: { id: "eligible-bacterium", tags: ["bacterium"] }, resultType: "qualitative", positive: true, contaminated: false, excluded: false, ...seed });
  syncImagingRelationships(input); return list.length;
}
export function removePneuRecord(input, collection, index) { input[collection].splice(index, 1); syncImagingRelationships(input); }
function syncImagingRelationships(input) { input.imagingRelationships = input.imagingStudies.slice(1).map((study, i) => ({ fromStudyId: input.imagingStudies[i].id, toStudyId: study.id, type: study.relationshipType || "persistent" })); }

export function toggleClinicalFinding(input, kind, enabled, date) {
  const index = input.clinicalFindings.findIndex(item => item.kind === kind);
  if (enabled && index < 0) input.clinicalFindings.push({ id: `finding-${kind}`, kind, date: date ?? anchorDate(input) });
  if (!enabled && index >= 0) input.clinicalFindings.splice(index, 1);
}
export function toggleMeasurement(input, kind, enabled, seed = {}) {
  const index = input.measurements.findIndex(item => item.kind === kind);
  if (enabled && index < 0) input.measurements.push({ id: `measurement-${kind}`, kind, value: seed.value ?? 0, unit: seed.unit ?? MEASUREMENT_UNITS[kind], date: seed.date ?? anchorDate(input) });
  if (!enabled && index >= 0) input.measurements.splice(index, 1);
}

// Resolves a "pathwayId:blockId:bulletId" checkbox back to the evaluator input it drives.
function findBullet(key) {
  const [pathwayId, blockId, bulletId] = key.split(":");
  const pathways = [...PNU1_PATHWAYS, PNU2_SIGN_PATHWAY, PNU3_SIGN_PATHWAY];
  for (const pathway of pathways) {
    if (pathway.id !== pathwayId) continue;
    for (const block of pathway.blocks) {
      if (block.id !== blockId) continue;
      const bullet = block.bullets.find(item => item.id === bulletId);
      if (bullet) return bullet;
    }
  }
  return null;
}

export function toggleManualBullet(input, key, enabled) {
  const bullet = findBullet(key);
  if (!bullet) return;
  if (bullet.kinds) {
    if (enabled) toggleClinicalFinding(input, bullet.kinds[0], true);
    else { for (const kind of bullet.kinds) toggleClinicalFinding(input, kind, false); if (bullet.tachypnea) toggleMeasurement(input, "respiratory-rate", false); }
    return;
  }
  toggleMeasurement(input, bullet.kind, enabled, bullet.defaults);
  if (bullet.companion) toggleMeasurement(input, bullet.companion.kind, enabled, bullet.companion.defaults);
}

export function selectBulletVariant(input, kinds, value) {
  const list = kinds.split(",");
  for (const kind of list) toggleClinicalFinding(input, kind, false);
  toggleMeasurement(input, "respiratory-rate", false);
  const [type, target] = value.split(":");
  if (type === "finding") toggleClinicalFinding(input, target, true);
  else toggleMeasurement(input, "respiratory-rate", true, { value: 0, unit: "breaths/min" });
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
  if (path?.startsWith("measurement.")) {
    const [, kind, property] = path.split(".");
    let item = input.measurements.find(entry => entry.kind === kind);
    if (!item && element.value !== "") { item = { id: `measurement-${kind}`, kind, value: 0, unit: MEASUREMENT_UNITS[kind], date: anchorDate(input) }; input.measurements.push(item); }
    if (item) item[property] = property === "value" ? Number(element.value) : element.value;
    return;
  }
  if (!path) return;
  let value = element.type === "checkbox" ? element.checked : (element.type === "number" ? Number(element.value) : element.value);
  if (element.type === "radio" && ["true", "false"].includes(element.value)) value = element.value === "true";
  setPath(input, path, value); syncImagingRelationships(input);
}
export function toggleImageFinding(input, index, finding, enabled) { input.imagingStudies[index].findings = enabled && finding ? [finding] : []; }
export function setLabOrganism(input, index, id) { const tags = id === "virus" ? ["virus"] : id.startsWith("legionella") ? ["legionella"] : id === "candida" ? ["candida"] : ["bacterium"]; input.microbiologyResults[index].organism = { id, tags }; }
// One laboratory finding is recorded at a time: PNU2 is met by either algorithm, and PNU3
// draws on the PNU2 tables, so selecting a finding in one table clears the others rather
// than leaving a stale selection pointed at the newly replaced specimen record.
export function selectLabAlternative(state, input, algorithm, alternative) {
  for (const key of Object.keys(state.selectedLabAlternative)) state.selectedLabAlternative[key] = key === algorithm ? alternative : "";
  input.microbiologyResults = []; input.histopathologyResults = [];
}
export function addLabAlternative(input, alternative) {
  const mapping = { blood: ["blood", "culture", "qualitative"], "pleural-fluid": ["pleural-fluid", "culture", "qualitative"], lrt: ["bronchoscopic-bal", "culture", "quantitative"], "lung-tissue": ["lung-tissue", "culture", "quantitative"], "bal-intracellular-bacteria": ["bronchoscopic-bal", "direct-microscopy", "quantitative"], "respiratory-or-tissue-identification": ["respiratory-secretions", "non-culture-diagnostic-test", "qualitative"], "paired-sera-fourfold-igg": ["paired-sera", "igg", "quantitative"], "legionella-paired-sera-ifa": ["paired-sera", "ifa", "quantitative"], "legionella-urine-antigen": ["urine", "eia", "qualitative"], "pnu3-fungus": ["bronchoscopic-bal", "culture", "qualitative"] };
  if (alternative === "pnu3-candida") return addPnu3CandidaPair(input);
  if (alternative === "pnu3-fungus") return addPnu3Fungus(input);
  const entry = mapping[alternative]; if (!entry) return;
  const [specimenType, testMethod, resultType] = entry;
  addPneuRecord(input, "microbiologyResults", { specimenType, testMethod, resultType, unit: alternative.includes("paired") ? "fold-rise" : alternative === "bal-intracellular-bacteria" ? "percent-cells" : undefined, organism: { id: alternative.startsWith("legionella") ? "legionella-pneumophila-serogroup-1" : alternative === "respiratory-or-tissue-identification" ? "virus" : "eligible-bacterium", tags: alternative.startsWith("legionella") ? ["legionella"] : alternative === "respiratory-or-tissue-identification" ? ["virus"] : ["bacterium"] } });
}
