export const COMPACT_MEN_RENDERER_VERSION = "Rendering compact MEN evidence UI v2";

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

export function getVisibleMenCriteria(criteria, patientAge) {
  return criteria.filter((criterion) => {
    if (criterion.id === "MEN-2") return patientAge !== "infant";
    if (criterion.id === "MEN-3") return patientAge === "infant";
    return true;
  });
}

export function checkboxEvidenceValue(checked) {
  return checked ? "met" : "notMet";
}

export function getMenProgress(evaluation, criteria, evidence) {
  const evidenceIds = new Set();
  const collect = (item) => {
    if (item.id && !item.anyOf) evidenceIds.add(item.id);
    (item.allOf || []).forEach(collect);
    (item.groups || []).forEach(collect);
    (item.anyOf || []).forEach(collect);
  };
  criteria.forEach(collect);
  const completed = [...evidenceIds].filter((id) => evidence[id] === "met").length;
  const missing = evaluation.branches
    ? evaluation.branches.filter((branch) => criteria.some((criterion) => criterion.id === branch.id)).reduce((least, branch) => Math.min(least, branch.missing.length), Infinity)
    : 0;
  return { completed, missing: Number.isFinite(missing) ? missing : 0, met: evaluation.siteDefinitionMet };
}

function renderEvidenceCheckbox(item, evidence) {
  const checked = evidence[item.id] === "met";
  return `<label class="men-evidence-item"><input type="checkbox" data-evidence-id="${escapeHtml(item.id)}" ${checked ? "checked" : ""}><span>${escapeHtml(item.label)}</span></label>`;
}

function renderSource(source, label = "Source") {
  return `<details class="men-source"><summary>${label}</summary><p>${escapeHtml(source.document)} · ${escapeHtml(source.chapter)} · ${escapeHtml(source.sectionHeading)} · Printed page${String(source.printedPage).includes("–") ? "s" : ""} ${escapeHtml(source.printedPage)} · PDF page${String(source.pdfPage).includes("–") ? "s" : ""} ${escapeHtml(source.pdfPage)} · Source ID ${escapeHtml(source.sourceDataId)}</p></details>`;
}

function renderCriterion(criterion, evidence, branchStatus, open) {
  const missing = branchStatus?.missing.length || 0;
  const groups = (criterion.groups || []).map((group) => `<div class="men-logic-group"><strong>${escapeHtml(group.label)}</strong>${group.anyOf.map((branch) => branch.anyOf ? `<div class="men-branch"><span>${escapeHtml(branch.label)}</span>${branch.anyOf.map((item) => renderEvidenceCheckbox(item, evidence)).join("")}</div>` : renderEvidenceCheckbox(branch, evidence)).join("")}</div>`).join("");
  return `<details class="men-criterion" data-men-criterion="${escapeHtml(criterion.id)}" ${open ? "open" : ""}><summary><span>${escapeHtml(criterion.label)}</span><small>${missing ? `${missing} missing` : "Complete"}</small></summary><div class="men-criterion-body">${criterion.allOf.map((item) => renderEvidenceCheckbox(item, evidence)).join("")}${groups}${renderSource(criterion.source)}</div></details>`;
}

export function renderCompactMenEvidence({ definition, evaluation, patientAge, evidence = {}, openCriterion = "" }) {
  const visibleCriteria = getVisibleMenCriteria(definition.criteria, patientAge);
  const progress = getMenProgress(evaluation, visibleCriteria, evidence);
  const criteria = visibleCriteria.map((criterion, index) => renderCriterion(criterion, evidence, evaluation.branches?.find((branch) => branch.id === criterion.id), openCriterion ? openCriterion === criterion.id : index === 0)).join("");
  const exclusion = `<details class="men-criterion exclusion"><summary><span>Exclusion review</span></summary><div class="men-criterion-body">${definition.exclusions.map((item) => renderEvidenceCheckbox(item, evidence)).join("")}${renderSource(definition.source)}</div></details>`;
  const notes = [...definition.notes, ...definition.reportingInstructions].map((note) => `<li>${escapeHtml(note.text)} ${renderSource(note.source)}</li>`).join("");
  return `<div class="men-progress" role="status" aria-live="polite"><span class="complete">✓ ${progress.completed} completed requirement${progress.completed === 1 ? "" : "s"}</span><span class="missing">${progress.missing ? "❌" : "✓"} ${progress.missing} missing requirement${progress.missing === 1 ? "" : "s"}</span><strong class="${progress.met ? "met" : "pending"}">${progress.met ? "✓ Site definition met" : "Site definition not met"}</strong></div><div class="evidence-group men-review" data-men-renderer="compact-v2">${criteria}${exclusion}<details class="men-reference-notes"><summary>NHSN notes and reporting instructions</summary><ul>${notes}</ul>${renderSource(definition.secondaryBsi.source, "Secondary BSI attribution source")}</details></div>`;
}
