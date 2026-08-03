const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const row = (label, value) => `<div class="protocol-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`;
const section = (title, body) => `<section class="protocol-section"><h4>${escapeHtml(title)}</h4>${body}</section>`;

export function renderCompactPnu1({ evaluation, patientContext }) {
  if (!evaluation || typeof evaluation.met !== "boolean") throw new TypeError("A valid PNU1 evaluation is required");
  const needed = evaluation.remainingRequirements.map(item => `<li>${escapeHtml(item.message)}</li>`).join("");
  const status = `<div class="secondary-site-status ${evaluation.met ? "met" : "incomplete"}" role="status"><strong>${escapeHtml(evaluation.status)}</strong>${needed ? `<span>Still needed:</span><ul>${needed}</ul>` : ""}</div>`;
  return `<div class="evidence-group secondary-evidence-review" data-protocol-renderer="compact" data-protocol="PNU1">${section("Patient Context", row("Date of birth", patientContext.dateOfBirth ?? `${patientContext.exactAge.value} ${patientContext.exactAge.unit}`))}${section("Timeline", row("Infection Window Period", evaluation.infectionWindow ? `${evaluation.infectionWindow.start} through ${evaluation.infectionWindow.end}` : "Not established") + row("Date of Event", evaluation.dateOfEvent ?? "Not established") + row("Repeat Infection Timeframe", evaluation.repeatInfectionTimeframe ? `${evaluation.repeatInfectionTimeframe.start} through ${evaluation.repeatInfectionTimeframe.end}` : "Not established"))}${section("Imaging", row("Requirement", evaluation.imaging.met ? "Met" : "Not met"))}${section("Clinical Criteria", row("Applicable branch", evaluation.clinical.branch ?? "None") + row("Status", evaluation.clinical.met ? "Met" : "Not met"))}${section("Laboratory Evidence", `<p>${escapeHtml(evaluation.laboratoryEvidence.message)}</p>`)}${section("Exclusions", "<p>No laboratory specimen or organism exclusion is part of PNU1 qualification.</p>")}${section("PNU1 Status", status)}${section("Secondary BSI Attribution", `<p>${escapeHtml(evaluation.secondaryBsi.message)}</p>`)}</div>`;
}

export function renderPnu1Safely(options) {
  try { return renderCompactPnu1(options); }
  catch { return '<div class="secondary-guidance warning" role="status">PNU1 guidance could not be loaded.</div>'; }
}
