const $ = (id) => document.getElementById(id);
const inputs = ['lineDate', 'doeDate', 'removalDate', 'culturePath', 'secondary', 'commensalCount', 'symptoms'];
const toDate = (value) => value ? new Date(`${value}T12:00:00`) : null;
const daysBetween = (start, end) => Math.round((end - start) / 86400000);

function lineDayOn(date, access) { return daysBetween(access, date) + 1; }
function setResult(tone, title, summary, items, lineDay = '—', window = '—') {
  const card = $('resultCard');
  card.className = `result-card ${tone}`;
  $('resultTitle').textContent = title; $('resultSummary').textContent = summary;
  $('lineDay').textContent = lineDay; $('windowStatus').textContent = window;
  $('reviewList').innerHTML = items.map(item => `<li>${item}</li>`).join('');
}
function calculate() {
  const access = toDate($('lineDate').value), doe = toDate($('doeDate').value), removal = toDate($('removalDate').value);
  const eligible = document.querySelector('input[name="lineEligible"]:checked')?.value;
  const culture = $('culturePath').value, secondary = $('secondary').value;
  if (!access || !doe || !eligible || !culture || !secondary) {
    setResult('warning', 'More information needed', 'Complete all required fields to receive a review summary.', ['Required: access date, DOE, line eligibility, blood culture pathway, and secondary-source review.']); return;
  }
  if (doe < access) { setResult('not-met', 'Timeline is not valid', 'The date of event precedes the documented first access date.', ['Correct the event timeline, then review again.']); return; }
  const doeDay = lineDayOn(doe, access);
  const dayBefore = new Date(doe); dayBefore.setDate(dayBefore.getDate() - 1);
  const presentOnDoe = !removal || removal >= doe;
  const presentDayBefore = !removal || removal >= dayBefore;
  const durationMet = (presentOnDoe && doeDay > 2) || (presentDayBefore && lineDayOn(dayBefore, access) > 2);
  const attribution = durationMet ? 'Met' : 'Not met';
  const items = [`Line day on DOE: Day ${doeDay}.`, presentOnDoe ? 'Line present on DOE.' : presentDayBefore ? 'Line not present on DOE, but present the day before.' : 'Line was removed before the day prior to DOE.'];
  if (eligible === 'no') { setResult('not-met', 'Does not meet CLABSI screen', 'The documented device is not an eligible central line for NHSN attribution.', [...items, 'A non-eligible device cannot support CLABSI attribution.'], doeDay, attribution); return; }
  if (!durationMet) { setResult('not-met', 'Central-line duration not met', 'The eligible line was not in place for more than two consecutive calendar days on the DOE or the day before.', [...items, 'Review for another HAI category or a secondary bloodstream infection.'], doeDay, attribution); return; }
  if (secondary === 'yes') { setResult('not-met', 'Secondary BSI indicated', 'Secondary bloodstream infection attribution criteria were selected as met.', [...items, 'Do not classify as CLABSI when the BSI is secondary to another infection site per NHSN rules.'], doeDay, attribution); return; }
  if (culture === 'none') { setResult('not-met', 'LCBI culture evidence not met', 'No qualifying blood culture pathway was selected.', [...items, 'Review the applicable NHSN LCBI criterion and blood culture documentation.'], doeDay, attribution); return; }
  if (culture === 'commensal' && (!$('commensalCount').checked || !$('symptoms').checked)) { setResult('warning', 'Common commensal pathway incomplete', 'The central-line attribution screen is met, but the common-commensal LCBI requirements are not fully documented.', [...items, 'Verify separate-occasion culture and symptom/timing requirements.'], doeDay, attribution); return; }
  if (secondary === 'unknown') { setResult('warning', 'Secondary-source review pending', 'The event meets the initial central-line and culture screen, but source attribution is still unresolved.', [...items, 'Complete the secondary BSI attribution assessment before final classification.'], doeDay, attribution); return; }
  setResult('met', 'Meets initial CLABSI screen', 'The entered facts meet the central-line attribution timing screen and selected LCBI pathway. Complete manual-based validation before reporting.', [...items, 'Eligible central line and >2 calendar-day criterion are met.', 'No secondary BSI source was identified in this review.'], doeDay, attribution);
}
$('culturePath').addEventListener('change', (e) => { $('commensalChecklist').hidden = e.target.value !== 'commensal'; });
$('calculate').addEventListener('click', calculate);
$('reset').addEventListener('click', () => { document.querySelectorAll('input').forEach(i => i.type === 'radio' || i.type === 'checkbox' ? i.checked = false : i.value = ''); document.querySelectorAll('select').forEach(s => s.value = ''); $('commensalChecklist').hidden = true; setResult('pending', 'Enter review details', 'The calculator will organize attribution timing and LCBI screening points.', ['Enter an access date and DOE.', 'Confirm central-line eligibility.', 'Document the LCBI pathway and secondary-source review.']); });
