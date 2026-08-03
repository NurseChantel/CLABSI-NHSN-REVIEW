import { evaluatePnu2 } from "./pnu2.js";
import { evaluateAgeApplicability } from "./patient-context.js";
import { compareMeasurement } from "./measurements.js";
import { evaluatePnuImaging, pnuTachypneaThreshold, validatePnuBaseInput } from "./pnu1.js";
import { createCalendarWindow, createInfectionWindow, createRepeatInfectionTimeframe, dateInWindow } from "./timeline.js";
import { validateMicrobiologyResult } from "./microbiology.js";
import { isPlainObject, valid, validateDate, validationError } from "./validation.js";

const source = (section, printedPage, sourceId, document = "NHSN pneumonia.pdf") => Object.freeze({ document, section, printedPage, sourceId });
export const PNU3_SOURCES = Object.freeze({
  definition: source("Table 4: Specific Site Algorithm for Pneumonia in Immunocompromised Patients (PNU3)", "6-9", "PNU3.table4"),
  host: source("Footnote 10: Immunocompromised patients", "6-15", "PNU3.host"),
  laboratory: source("Table 4; Footnotes 11–12", "6-9, 6-15–6-16", "PNU3.laboratory"),
  specimens: source("General Comments 5–7; Table 4; Footnotes 8–12", "6-4–6-5, 6-9, 6-14–6-16", "PNU3.specimens"),
  imaging: source("Guidance for Determination of Eligible Imaging Test Evidence; Footnotes 1, 2, 13", "6-3, 6-12, 6-16", "PNU3.imaging"),
  timing: source("Infection Window Period and Date of Event", "2-3–2-8", "PNU3.timing", "NHSN HAI.pdf"),
  rit: source("Repeat Infection Timeframe", "2-11–2-12", "PNU3.rit", "NHSN HAI.pdf"),
  attribution: source("Secondary BSI Attribution Period and Pathogen Assignment", "2-15–2-19", "PNU3.attribution", "NHSN HAI.pdf"),
  relationship: source("Secondary BSI and Matching Organisms", "17-1–17-3", "PNU3.relationship", "Secondary BSI Chapter.pdf"),
  checklist: source("PNU3 Pneumonia in Immunocompromised Patients worksheet", "PDF pages 9–10", "PNU3.checklist", "NHSN pneumonia checklist.pdf")
});

export const PNU3_PROTOCOL = Object.freeze({ eventFamily: "PNEU", siteCode: "PNU3", name: "Pneumonia in Immunocompromised Patients",
  hostBranches: Object.freeze(["neutropenia-anc", "neutropenia-wbc", "leukemia", "lymphoma", "hiv-cd4", "splenectomy", "solid-organ-transplant", "hematopoietic-stem-cell-transplant", "cytotoxic-chemotherapy", "systemic-steroids"]),
  laboratoryBranches: Object.freeze(["matching-candida", "fungus-direct-microscopy", "fungus-culture", "fungus-non-culture-diagnostic-test", "pnu2-laboratory"]), source: PNU3_SOURCES.definition, sourceCrossCheck: PNU3_SOURCES.checklist });

const day = value => Date.parse(`${value}T00:00:00Z`);
const clinicalKinds = new Set(["altered-mental-status-no-other-cause", "sputum-change", "secretions-change", "increased-suctioning", "dyspnea", "new-or-worsening-cough", "rales", "crackles", "bronchial-breath-sounds", "worsening-gas-exchange", "hemoptysis", "pleuritic-chest-pain"]);
const durableHosts = new Set(["leukemia", "lymphoma", "splenectomy", "solid-organ-transplant", "hematopoietic-stem-cell-transplant"]);
const fungalSpecimens = new Set(["bronchoscopic-bal", "nonbronchoscopic-bal", "protected-specimen-brushing", "endotracheal-aspirate"]);
const excludedTags = ["oral-flora", "respiratory-flora", "community-associated-fungus", "vector-borne"];
const requirement = (id, message, sourceMetadata) => Object.freeze({ id, message, source: sourceMetadata });
const inWindow = (record, window) => dateInWindow(record.collectionDate ?? record.date, window).value;
const findingMet = (input, kinds, window) => input.clinicalFindings.some(item => kinds.includes(item.kind) && dateInWindow(item.date, window).value);
const measurementMet = (input, kind, window, rules) => input.measurements.some(item => item.kind === kind && dateInWindow(item.date, window).value && rules.some(rule => compareMeasurement(item, rule).value.met));

function evaluateHost(input, eventDate) {
  const branches = PNU3_PROTOCOL.hostBranches.map(id => ({ id, met: false, evidenceIds: [], source: PNU3_SOURCES.host }));
  const mark = (id, evidence) => { const branch = branches.find(item => item.id === id); branch.met = true; branch.evidenceIds.push(evidence.id); };
  for (const evidence of input.hostEvidence) {
    if (durableHosts.has(evidence.type) && evidence.present === true) mark(evidence.type, evidence);
    if (evidence.type === "cytotoxic-chemotherapy" && evidence.activeOnDate === eventDate) mark(evidence.type, evidence);
    if (evidence.type === "hiv-cd4" && evidence.hivPositive === true && evidence.cd4Count < 200 && evidence.unit === "cells/mm3") mark(evidence.type, evidence);
    if (["neutropenia-anc", "neutropenia-wbc"].includes(evidence.type) && evidence.value < 500 && evidence.unit === "cells/mm3") mark(evidence.type, evidence);
    if (evidence.type === "systemic-steroids" && ["enteral", "parenteral"].includes(evidence.route) && evidence.daily === true && day(evidence.startDate) <= day(eventDate) - 14 * 86400000 && day(evidence.endDate) >= day(eventDate)) mark(evidence.type, evidence);
  }
  return { met: branches.some(item => item.met), branches };
}

function evaluateClinical(input, window, eventDate) {
  const age70 = evaluateAgeApplicability(input.patientContext, eventDate, { unit: "years", operator: "gte", value: 70 }).value.met;
  const met = measurementMet(input, "temperature", window, [{ comparator: "gt", value: 38, unit: "C" }])
    || (age70 && findingMet(input, ["altered-mental-status-no-other-cause"], window))
    || findingMet(input, ["sputum-change", "secretions-change", "increased-suctioning", "dyspnea", "new-or-worsening-cough", "rales", "crackles", "bronchial-breath-sounds", "worsening-gas-exchange", "hemoptysis", "pleuritic-chest-pain"], window)
    || measurementMet(input, "respiratory-rate", window, [{ comparator: "gt", value: pnuTachypneaThreshold(input.patientContext, eventDate), unit: "breaths/min" }]);
  return { met };
}

function pnu2Laboratory(input, first) {
  const syntheticDate = first.date;
  const evaluation = evaluatePnu2({ ...input, clinicalFindings: [{ id: "pnu3-pnu2-lab-probe", kind: "sputum-change", date: syntheticDate }],
    measurements: [{ id: "pnu3-pnu2-lab-probe", kind: "temperature", value: 38.1, unit: "C", date: syntheticDate }] });
  return evaluation.ok ? evaluation.value.laboratoryEvidence : { met: false, branches: [], qualifyingResultIds: [] };
}

function evaluateLaboratory(input, window, first) {
  const branches = []; const add = (id, resultIds) => branches.push({ id, met: resultIds.length > 0, resultIds, source: PNU3_SOURCES.laboratory });
  const inIwp = input.microbiologyResults.filter(item => inWindow(item, window));
  const candidaBlood = inIwp.filter(item => item.specimenType === "blood" && item.positive === true && item.organism.tags.includes("candida") && !item.contaminated && !item.excluded);
  const candidaRespiratory = inIwp.filter(item => ["sputum", "endotracheal-aspirate", "bronchoscopic-bal", "nonbronchoscopic-bal", "protected-specimen-brushing"].includes(item.specimenType) && item.positive === true && item.organism.tags.includes("candida") && !item.contaminated && !item.excluded);
  const matchedCandida = candidaBlood.flatMap(blood => candidaRespiratory.filter(respiratory => respiratory.organism.id === blood.organism.id).flatMap(respiratory => [blood.id, respiratory.id]));
  add("matching-candida", [...new Set(matchedCandida)]);
  for (const [id, method] of [["fungus-direct-microscopy", "direct-microscopy"], ["fungus-culture", "culture"], ["fungus-non-culture-diagnostic-test", "non-culture-diagnostic-test"]]) {
    add(id, inIwp.filter(item => fungalSpecimens.has(item.specimenType) && item.minimallyContaminated === true && item.positive === true && item.testMethod === method && item.organism.tags.includes("fungus") && !item.organism.tags.includes("candida") && !item.organism.tags.includes("yeast") && !excludedTags.some(tag => item.organism.tags.includes(tag)) && !item.contaminated && !item.excluded).map(item => item.id));
  }
  const pnu2 = pnu2Laboratory(input, first); add("pnu2-laboratory", pnu2.qualifyingResultIds ?? []);
  return { met: branches.some(item => item.met), branches, qualifyingResultIds: [...new Set(branches.filter(item => item.met).flatMap(item => item.resultIds))], pnu2Branches: pnu2.branches ?? [] };
}

function validateHost(evidence, index) {
  const path = `hostEvidence[${index}]`; const errors = [];
  if (!isPlainObject(evidence) || typeof evidence.id !== "string" || !PNU3_PROTOCOL.hostBranches.includes(evidence.type)) return [`${path} requires an id and valid type`];
  if (durableHosts.has(evidence.type) && typeof evidence.present !== "boolean") errors.push(`${path}.present must be boolean`);
  if (["neutropenia-anc", "neutropenia-wbc"].includes(evidence.type)) { if (typeof evidence.value !== "number" || !Number.isFinite(evidence.value) || evidence.unit !== "cells/mm3") errors.push(`${path} requires a finite cells/mm3 value`); errors.push(...validateDate(evidence.date, `${path}.date`)); }
  if (evidence.type === "hiv-cd4" && (typeof evidence.hivPositive !== "boolean" || typeof evidence.cd4Count !== "number" || !Number.isFinite(evidence.cd4Count) || evidence.unit !== "cells/mm3")) errors.push(`${path} requires explicit HIV status and finite CD4 cells/mm3`);
  if (evidence.type === "cytotoxic-chemotherapy") errors.push(...validateDate(evidence.activeOnDate, `${path}.activeOnDate`));
  if (evidence.type === "systemic-steroids") { if (!["enteral", "parenteral", "inhaled", "topical"].includes(evidence.route) || typeof evidence.daily !== "boolean") errors.push(`${path} requires route and daily status`); errors.push(...validateDate(evidence.startDate, `${path}.startDate`), ...validateDate(evidence.endDate, `${path}.endDate`)); }
  return errors;
}

function validateInput(input) {
  if (!isPlainObject(input)) return ["PNU3 input must be an object"];
  const baseInput = { ...input, clinicalFindings: Array.isArray(input.clinicalFindings) ? input.clinicalFindings.filter(item => item && !["hemoptysis", "pleuritic-chest-pain"].includes(item.kind)) : input.clinicalFindings };
  const errors = validatePnuBaseInput(baseInput);
  if (Array.isArray(input.clinicalFindings)) input.clinicalFindings.forEach((item, index) => { if (!isPlainObject(item) || typeof item.id !== "string" || !clinicalKinds.has(item.kind)) errors.push(`clinicalFindings[${index}] is invalid for PNU3`); else errors.push(...validateDate(item.date, `clinicalFindings[${index}].date`)); });
  if (!Array.isArray(input.hostEvidence)) errors.push("hostEvidence must be an array"); else input.hostEvidence.forEach((item, index) => errors.push(...validateHost(item, index)));
  if (!Array.isArray(input.microbiologyResults)) errors.push("microbiologyResults must be an array"); else input.microbiologyResults.forEach((item, index) => { const result = validateMicrobiologyResult(item, `microbiologyResults[${index}]`); if (!result.ok) errors.push(...result.errors); if (isPlainObject(item) && item.positive !== undefined && typeof item.positive !== "boolean") errors.push(`microbiologyResults[${index}].positive must be boolean`); });
  if (!Array.isArray(input.histopathologyResults)) errors.push("histopathologyResults must be an array");
  if (input.bloodResults !== undefined && !Array.isArray(input.bloodResults)) errors.push("bloodResults must be an array when supplied"); else (input.bloodResults ?? []).forEach((item, index) => { const result = validateMicrobiologyResult(item, `bloodResults[${index}]`); if (!result.ok) errors.push(...result.errors); });
  return errors;
}

export function evaluatePnu3(input) {
  const errors = validateInput(input); if (errors.length) return validationError(errors);
  const attempts = [...input.imagingStudies].sort((a, b) => day(a.date) - day(b.date)).map(first => {
    const infectionWindow = createInfectionWindow(first.date, PNU3_SOURCES.timing).value; const infant = evaluateAgeApplicability(input.patientContext, first.date, { unit: "years", operator: "lte", value: 1 }).value.met;
    const imaging = evaluatePnuImaging(input, first, infant, day(first.date) <= day(input.admissionDate) + 86400000); const clinical = evaluateClinical(input, infectionWindow, first.date); const laboratory = evaluateLaboratory(input, infectionWindow, first);
    const eventDateCandidate = [first.date, ...input.measurements.filter(item => dateInWindow(item.date, infectionWindow).value).map(item => item.date), ...input.clinicalFindings.filter(item => dateInWindow(item.date, infectionWindow).value).map(item => item.date), ...input.microbiologyResults.filter(item => laboratory.qualifyingResultIds.includes(item.id)).map(item => item.collectionDate)].sort()[0];
    const host = evaluateHost(input, eventDateCandidate); return { first, infectionWindow, imaging, host, clinical, laboratory, eventDateCandidate, met: imaging.met && host.met && clinical.met && laboratory.met };
  });
  const matched = attempts.find(item => item.met); const closest = matched ?? attempts.sort((a, b) => [a.imaging, a.host, a.clinical, a.laboratory].filter(item => !item.met).length - [b.imaging, b.host, b.clinical, b.laboratory].filter(item => !item.met).length)[0];
  const usedDates = matched ? [matched.first.date, ...input.measurements.filter(item => dateInWindow(item.date, matched.infectionWindow).value).map(item => item.date), ...input.clinicalFindings.filter(item => dateInWindow(item.date, matched.infectionWindow).value).map(item => item.date), ...input.microbiologyResults.filter(item => matched.laboratory.qualifyingResultIds.includes(item.id)).map(item => item.collectionDate)] : [];
  const dateOfEvent = matched ? matched.eventDateCandidate : null; const repeatInfectionTimeframe = dateOfEvent ? createRepeatInfectionTimeframe(dateOfEvent, PNU3_SOURCES.rit).value : null; const secondaryBsiAttributionPeriod = dateOfEvent ? createCalendarWindow(dateOfEvent, 3, 13, PNU3_SOURCES.attribution).value : null;
  let secondaryBsi = { met: false, status: matched ? "noBloodResult" : "siteNotQualified", organismRelationshipMet: false, timingMet: false, matchingSiteResultIds: [] };
  if (matched && input.bloodResults?.length) for (const blood of input.bloodResults) {
    const timingMet = dateInWindow(blood.collectionDate, secondaryBsiAttributionPeriod).value; const site = input.microbiologyResults.filter(item => matched.laboratory.qualifyingResultIds.includes(item.id));
    const bloodCriterion = site.some(item => item.id === blood.id && item.specimenType === "blood"); const matching = site.filter(item => item.id !== blood.id && item.organism.id === blood.organism.id);
    const relationshipMet = bloodCriterion || matching.length > 0; if (relationshipMet && timingMet) { secondaryBsi = { met: true, status: "attributionMet", organismRelationshipMet: true, timingMet: true, matchingSiteResultIds: matching.map(item => item.id) }; break; }
    secondaryBsi = { met: false, status: "attributionIncomplete", organismRelationshipMet: relationshipMet, timingMet, matchingSiteResultIds: matching.map(item => item.id) };
  }
  const remainingRequirements = []; if (!closest.imaging.met) remainingRequirements.push(requirement("imaging", "Qualifying PNEU imaging", PNU3_SOURCES.imaging)); if (!closest.host.met) remainingRequirements.push(requirement("host", "One explicitly evidenced NHSN immunocompromised-host condition", PNU3_SOURCES.host)); if (!closest.clinical.met) remainingRequirements.push(requirement("clinical", "One qualifying PNU3 clinical finding", PNU3_SOURCES.definition)); if (!closest.laboratory.met) remainingRequirements.push(requirement("laboratory", "One complete PNU3 laboratory branch", PNU3_SOURCES.laboratory));
  return valid(Object.freeze({ eventFamily: "PNEU", siteCode: "PNU3", met: Boolean(matched), status: matched ? "PNU3 Met" : "PNU3 Not Met", dateOfEvent, infectionWindow: matched?.infectionWindow ?? closest.infectionWindow, repeatInfectionTimeframe, secondaryBsiAttributionPeriod, imaging: matched?.imaging ?? closest.imaging, hostEligibility: Object.freeze(matched?.host ?? closest.host), clinical: Object.freeze(matched?.clinical ?? closest.clinical), laboratoryEvidence: Object.freeze(matched?.laboratory ?? closest.laboratory), specimenEligibility: Object.freeze({ source: PNU3_SOURCES.specimens }), exclusions: Object.freeze(excludedTags), remainingRequirements: Object.freeze(matched ? [] : remainingRequirements), secondaryBsi: Object.freeze(secondaryBsi), source: PNU3_SOURCES.definition }));
}
