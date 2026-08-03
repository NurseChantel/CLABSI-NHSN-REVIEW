const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const row = (label, value) => `<div class="protocol-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`;
const section = (title, body) => `<section class="protocol-section"><h4>${escapeHtml(title)}</h4>${body}</section>`;

export function renderCompactPnu2({ evaluation, patientContext }) {
  if (!evaluation || typeof evaluation.met !== "boolean") throw new TypeError("A valid PNU2 evaluation is required");
  const needed = evaluation.remainingRequirements.map(item => `<li>${escapeHtml(item.message)}</li>`).join("");
  const activeBranches = evaluation.laboratoryEvidence.branches.filter(item => item.met).map(item => row(item.id, "Met")).join("") || "<p>No laboratory branch is currently complete.</p>";
  const status = `<div class="secondary-site-status ${evaluation.met ? "met" : "incomplete"}" role="status"><strong>${escapeHtml(evaluation.status)}</strong>${needed ? `<span>Still needed:</span><ul>${needed}</ul>` : ""}</div>`;
  return `<div class="evidence-group secondary-evidence-review" data-protocol-renderer="compact" data-protocol="PNU2">${section("Patient Context", row("Date of birth", patientContext.dateOfBirth ?? `${patientContext.exactAge.value} ${patientContext.exactAge.unit}`))}${section("Timeline", row("Infection Window Period", evaluation.infectionWindow ? `${evaluation.infectionWindow.start} through ${evaluation.infectionWindow.end}` : "Not established") + row("Date of Event", evaluation.dateOfEvent ?? "Not established") + row("Repeat Infection Timeframe", evaluation.repeatInfectionTimeframe ? `${evaluation.repeatInfectionTimeframe.start} through ${evaluation.repeatInfectionTimeframe.end}` : "Not established"))}${section("Imaging", row("Requirement", evaluation.imaging.met ? "Met" : "Not met"))}${section("Clinical Criteria", row("Systemic finding", evaluation.clinical.systemic ? "Met" : "Not met") + row("Respiratory finding", evaluation.clinical.respiratory ? "Met" : "Not met"))}${section("Laboratory Evidence", activeBranches)}${section("Specimen Eligibility", "<p>Eligibility is evaluated by specimen type, collection technique, contamination status, method, and threshold.</p>")}${section("Exclusions", `<p>${escapeHtml(evaluation.exclusions.join(", "))}</p>`)}${section("PNU2 Status", status)}${section("Secondary BSI Attribution", row("Status", evaluation.secondaryBsi.met ? "Met" : "Not met") + row("Organism relationship", evaluation.secondaryBsi.organismRelationshipMet ? "Met" : "Not met") + row("Attribution timing", evaluation.secondaryBsi.timingMet ? "Met" : "Not met"))}</div>`;
}

export function renderPnu2Safely(options) {
  try { return renderCompactPnu2(options); } catch { return '<div class="secondary-guidance warning" role="status">PNU2 guidance could not be loaded.</div>'; }
}
