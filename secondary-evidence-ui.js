export const COMPACT_MEN_RENDERER_VERSION = "Rendering compact MEN evidence UI v3";

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const numberWord = (value) => ({ 1: "One", 2: "Two", 3: "Three" })[value] || String(value);
const qualificationNoteIdsByCriterion = Object.freeze({ "MEN-1": ["MEN-note-shunt"], "MEN-2": ["MEN-note-group-i", "MEN-note-seizures"], "MEN-3": ["MEN-note-group-i", "MEN-note-seizures"] });

export function getVisibleMenCriteria(criteria, patientAge) {
  return criteria.filter((criterion) => criterion.ageApplicability === "infant" ? patientAge === "infant" : criterion.id === "MEN-2" ? patientAge !== "infant" : criterion.id === "MEN-3" ? patientAge === "infant" : true);
}
export function checkboxEvidenceValue(checked) { return checked ? "met" : "notMet"; }

function evidenceMet(item, evidence) {
  return evidence[item.id] === "met" && (!item.exclusionId || evidence[item.exclusionId] !== "met");
}
function alternativeMet(item, evidence) { return item.anyOf ? item.anyOf.some((entry) => evidenceMet(entry, evidence)) : evidenceMet(item, evidence); }
export function getRequirementPresentation(group, evidence) {
  const completed = group.anyOf.filter((item) => alternativeMet(item, evidence)).length;
  return { completed, required: group.minimumRequiredCount, remaining: Math.max(0, group.minimumRequiredCount - completed), met: completed >= group.minimumRequiredCount, grouped: group.anyOf.some((item) => item.anyOf) };
}
export function getMenProgress(evaluation, criteria, evidence) {
  const completed = criteria.flatMap((criterion) => criterion.allOf).filter((item) => evidenceMet(item, evidence)).length;
  const missing = evaluation.branches ? Math.min(...evaluation.branches.filter((branch) => criteria.some((criterion) => criterion.id === branch.id)).map((branch) => branch.missing.length)) : 0;
  return { completed, missing: Number.isFinite(missing) ? missing : 0, met: evaluation.siteDefinitionMet };
}

function renderEvidenceCheckbox(item, evidence) {
  return `<label class="secondary-evidence-item"><input type="checkbox" data-evidence-id="${escapeHtml(item.id)}" ${evidence[item.id] === "met" ? "checked" : ""}><span>${escapeHtml(item.label)}</span></label>`;
}
function renderQualificationNotes(criterion, notes) {
  const relevant = (qualificationNoteIdsByCriterion[criterion.id] || []).map((id) => notes.find((note) => note.id === id)).filter(Boolean);
  return relevant.length ? `<span class="secondary-note-controls">${relevant.map((note, index) => { const id = `${criterion.id}-qualification-note-${index}`; return `<button type="button" class="secondary-note-button" data-men-note-button="${id}" aria-controls="${id}" aria-expanded="false" aria-label="Show qualifying NHSN note">i</button><span id="${id}" class="secondary-qualification-note" hidden>${escapeHtml(note.text)}</span>`; }).join("")}</span>` : "";
}
function renderRequirement(group, evidence) {
  const progress = getRequirementPresentation(group, evidence);
  const instruction = progress.grouped ? `Select findings from ${numberWord(progress.required).toUpperCase()} different groups.` : "Select ONE qualifying supporting test.";
  const content = progress.grouped
    ? group.anyOf.map((branch, index) => `<section class="secondary-logic-group ${alternativeMet(branch, evidence) ? "satisfied" : ""}"><h6>${alternativeMet(branch, evidence) ? "✓" : "☐"} Group ${["I", "II", "III", "IV"][index] || index + 1}</h6><p>${escapeHtml(branch.label)}</p>${branch.anyOf.map((item) => renderEvidenceCheckbox(item, evidence)).join("")}</section>`).join("")
    : group.anyOf.map((item) => renderEvidenceCheckbox(item, evidence)).join("");
  return `<section class="secondary-requirement ${progress.met ? "satisfied" : ""}"><header><h5>${escapeHtml(group.label)}</h5><span>Requirement: ${progress.required}${progress.grouped ? " groups" : ""}</span></header><p class="secondary-instruction">${instruction}</p>${content}<strong class="secondary-requirement-status">${progress.met ? "✓ Requirement satisfied" : `${numberWord(progress.remaining)} still needed`}</strong></section>`;
}
function criterionScore(criterion, evidence) {
  const atoms = [...criterion.allOf, ...(criterion.groups || []).flatMap((group) => group.anyOf.flatMap((item) => item.anyOf || [item]))];
  return atoms.length ? atoms.filter((item) => evidenceMet(item, evidence)).length / atoms.length : 0;
}
function criterionRemaining(criterion, evidence) {
  const unmetAll = criterion.allOf.filter((item) => !evidenceMet(item, evidence));
  const conciseSingleRequirement = !criterion.groups?.length && unmetAll.length === 1 ? criterion.label.split(" — ").slice(1).join(" — ") : "";
  const remaining = conciseSingleRequirement ? [conciseSingleRequirement] : unmetAll.map((item) => item.label);
  for (const group of criterion.groups || []) {
    const progress = getRequirementPresentation(group, evidence);
    if (!progress.met) remaining.push(progress.grouped ? `${numberWord(progress.remaining)} additional finding group${progress.remaining === 1 ? "" : "s"}` : `${numberWord(progress.remaining)} qualifying finding${progress.remaining === 1 ? "" : "s"} from “${group.label}”`);
  }
  return remaining;
}
function criterionIsMet(criterion, evidence) { return criterionRemaining(criterion, evidence).length === 0; }
function renderCriterionSummary(criterion, evidence, manuallyOpen, notes) {
  const complete = criterionIsMet(criterion, evidence);
  const remaining = criterionRemaining(criterion, evidence);
  const open = manuallyOpen ? manuallyOpen === criterion.id : !complete;
  return `<details class="secondary-criterion" data-men-criterion="${criterion.id}" ${open ? "open" : ""}><summary><span class="secondary-criterion-title">${escapeHtml(`${complete ? "✓ " : ""}${criterion.label}`)}${renderQualificationNotes(criterion, notes)}</span>${complete ? "" : "<small>Incomplete</small>"}</summary><div class="secondary-criterion-body">${complete ? `<strong>✓ ${escapeHtml(criterion.label)} met</strong>` : `<strong>Still needed:</strong><ul>${remaining.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`}</div></details>`;
}
function collectEvidenceItems(criteria) {
  const items = criteria.flatMap((criterion) => [...criterion.allOf, ...(criterion.groups || []).flatMap((group) => group.anyOf.flatMap((item) => item.anyOf || [item]))]);
  const byId = new Map();
  for (const item of items) {
    const existing = byId.get(item.id);
    if (existing && (existing.label !== item.label || existing.exclusionId !== item.exclusionId)) throw new Error(`Conflicting shared evidence definition: ${item.id}`);
    byId.set(item.id, item);
  }
  return byId;
}
function renderSharedEvidenceSections(definition, criteria, evidence) {
  const items = collectEvidenceItems(criteria);
  const renderedIds = new Set();
  const sections = definition.evidenceSections.map((section) => {
    const controls = section.evidenceIds.map((id) => {
      if (renderedIds.has(id)) throw new Error(`Duplicate shared evidence ID: ${id}`);
      const item = items.get(id);
      if (!item) throw new Error(`Unknown shared evidence ID: ${id}`);
      renderedIds.add(id);
      return renderEvidenceCheckbox(item, evidence);
    }).join("");
    return `<section class="secondary-requirement secondary-shared-evidence" data-evidence-section="${escapeHtml(section.id)}"><header><h4>${escapeHtml(section.label)}</h4></header>${controls}</section>`;
  }).join("");
  if ([...items.keys()].some((id) => !renderedIds.has(id))) throw new Error(`Unmapped shared evidence in ${definition.siteCode}`);
  return sections;
}
function renderCriterion(criterion, evidence, evaluation, manuallyOpen, notes) {
  const complete = evaluation.metCriterion === criterion.id;
  const open = manuallyOpen ? manuallyOpen === criterion.id : !complete;
  const title = `${complete ? "✓ " : ""}${criterion.label}`;
  return `<details class="secondary-criterion" data-men-criterion="${criterion.id}" ${open ? "open" : ""}><summary><span class="secondary-criterion-title">${escapeHtml(title)}${renderQualificationNotes(criterion, notes)}</span>${complete ? "" : "<small>Incomplete</small>"}</summary><div class="secondary-criterion-body">${criterion.allOf.length ? `<section class="secondary-requirement"><header><h5>Required evidence</h5></header>${criterion.allOf.map((item) => renderEvidenceCheckbox(item, evidence)).join("")}</section>` : ""}${(criterion.groups || []).map((group) => renderRequirement(group, evidence)).join("")}</div></details>`;
}
function renderReferences(definition) {
  const sources = [definition.source, ...definition.notes.map((note) => note.source)];
  const unique = [...new Map(sources.map((source) => [`${source.document}|${source.sectionHeading}|${source.printedPage}|${source.pdfPage}`, source])).values()];
  return `<details class="secondary-references"><summary>NHSN Reference</summary>${unique.map((source) => `<dl><div><dt>Chapter</dt><dd>${escapeHtml(source.chapter)}</dd></div><div><dt>Section</dt><dd>${escapeHtml(source.sectionHeading)}</dd></div><div><dt>Printed page(s)</dt><dd>${escapeHtml(source.printedPage)}</dd></div><div><dt>PDF page(s)</dt><dd>${escapeHtml(source.pdfPage)}</dd></div><div><dt>Source document</dt><dd>${escapeHtml(source.document)}</dd></div></dl>`).join("")}</details>`;
}
export function renderCompactMenEvidence({ definition, evaluation, patientAge, evidence = {}, openCriterion = "" }) {
  const criteria = getVisibleMenCriteria(definition.criteria, patientAge);
  const closest = [...criteria].sort((a, b) => criterionScore(b, evidence) - criterionScore(a, evidence))[0];
  const remaining = evaluation.siteDefinitionMet ? [] : criterionRemaining(closest, evidence);
  const status = `<div class="secondary-site-status ${evaluation.siteDefinitionMet ? "met" : "incomplete"}" role="status" aria-live="polite"><strong>${evaluation.siteDefinitionMet ? `🟢 ${escapeHtml(definition.siteCode)} Site Definition Met` : `🟡 ${escapeHtml(definition.siteCode)} Site Definition Not Met`}</strong>${remaining.length ? `<span>Still needed:</span><ul>${remaining.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}</div>`;
  const usesSharedEvidence = definition.majorCategoryCode === "BJ" && Array.isArray(definition.evidenceSections);
  const renderedCriteria = criteria.map((criterion) => usesSharedEvidence ? renderCriterionSummary(criterion, evidence, openCriterion, definition.notes) : renderCriterion(criterion, evidence, evaluation, openCriterion, definition.notes)).join("");
  const criterionMarkup = usesSharedEvidence ? `<section class="secondary-criterion-pathways"><h4>Qualifying criterion pathways</h4>${renderedCriteria}</section>` : renderedCriteria;
  const exclusionSelected = definition.exclusions.some((item) => evidence[item.id] === "met") || evaluation.status === "exclusionApplies";
  const exclusion = `<details class="secondary-criterion exclusion" ${exclusionSelected ? "open" : ""}><summary>Exclusion review</summary><div class="secondary-criterion-body">${definition.exclusions.map((item) => renderEvidenceCheckbox(item, evidence)).join("")}</div></details>`;
  const sharedEvidenceMarkup = usesSharedEvidence ? renderSharedEvidenceSections(definition, criteria, evidence) : "";
  return `${status}<div class="evidence-group secondary-evidence-review" data-men-renderer="compact-v3">${sharedEvidenceMarkup}${criterionMarkup}${exclusion}${renderReferences(definition)}</div>`;
}

export function renderSecondaryEvidenceSafely(options) {
  try {
    return renderCompactMenEvidence(options);
  } catch (error) {
    const siteCode = options?.definition?.siteCode || "unknown";
    const isDevelopment = typeof process !== "undefined"
      ? process.env.NODE_ENV !== "production"
      : ["localhost", "127.0.0.1", ""].includes(globalThis.location?.hostname || "");
    if (isDevelopment) console.error(`Secondary BSI pathway rendering failed for site ${siteCode}.`, error);
    return '<div class="secondary-guidance warning" role="status">Site-specific guidance could not be loaded for this pathway.</div>';
  }
}
