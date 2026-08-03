import { ageAtEvent, evaluateAgeApplicability, validatePatientContext } from "./patient-context.js";
import { addCalendarDays, createCalendarWindow, createInfectionWindow, createRepeatInfectionTimeframe, dateInWindow } from "./timeline.js";
import { compareMeasurement, validateMeasurement } from "./measurements.js";
import { validateImagingRelationship, validateImagingStudy } from "./imaging.js";
import { isPlainObject, valid, validateDate, validationError } from "./validation.js";

const source = (section, printedPage, sourceId, document = "NHSN pneumonia.pdf") => Object.freeze({ document, section, printedPage, sourceId });

export const PNU1_SOURCES = Object.freeze({
  definition: source("Table 1: Specific Site Algorithms for Clinically Defined Pneumonia (PNU1)", "6-6", "PNU1.table1"),
  imaging: source("Guidance for Determination of Eligible Imaging Test Evidence; Table 1; Footnotes 1, 2, and 13", "6-3, 6-6, 6-12, 6-16", "PNU1.imaging"),
  clinical: source("Table 1; Footnotes 3–7", "6-6, 6-12–6-14", "PNU1.clinical"),
  timing: source("Infection Window Period and Date of Event", "2-3–2-8", "PNU1.timing", "NHSN HAI.pdf"),
  rit: source("Repeat Infection Timeframe", "2-11–2-12", "PNU1.rit", "NHSN HAI.pdf"),
  attribution: source("Reporting Instructions", "6-5", "PNU1.secondaryBsi"),
  secondaryRelationship: source("Secondary BSI and Matching Organisms", "17-1–17-3", "PNU1.secondaryRelationship", "Secondary BSI Chapter.pdf"),
  checklist: source("PNU1 Clinically Defined Pneumonia", "PDF pages 2–4", "PNU1.checklist", "NHSN pneumonia checklist.pdf")
});

export const PNU1_PROTOCOL = Object.freeze({
  eventFamily: "PNEU",
  siteCode: "PNU1",
  name: "Clinically Defined Pneumonia",
  branches: Object.freeze(["PNU1-any-patient", "PNU1-infant", "PNU1-child"]),
  laboratoryEvidence: Object.freeze({ required: false, acceptedSpecimenTypes: Object.freeze([]), acceptedOrganisms: Object.freeze([]) }),
  sourceCrossCheck: PNU1_SOURCES.checklist,
  source: PNU1_SOURCES.definition
});

const BASE_FINDINGS = new Set(["infiltrate", "consolidation", "cavitation", "air-space-disease", "focal-opacification", "patchy-increased-density"]);
const SIMPLE_FINDINGS = new Set([
  "altered-mental-status-no-other-cause", "sputum-change", "secretions-change", "increased-suctioning", "dyspnea", "new-or-worsening-cough",
  "rales", "crackles", "bronchial-breath-sounds", "worsening-gas-exchange", "temperature-instability", "nasal-flaring", "wheezing", "rhonchi", "cough", "apnea"
]);

const day = value => Date.parse(`${value}T00:00:00Z`);
const unique = values => [...new Set(values)];
const requirement = (id, message, sourceMetadata = PNU1_SOURCES.clinical) => Object.freeze({ id, message, source: sourceMetadata });

function validateFinding(finding, index) {
  const errors = [];
  if (!isPlainObject(finding)) return [`clinicalFindings[${index}] must be an object`];
  if (typeof finding.id !== "string" || !finding.id) errors.push(`clinicalFindings[${index}].id must be a non-empty string`);
  if (!SIMPLE_FINDINGS.has(finding.kind)) errors.push(`clinicalFindings[${index}].kind is not a supported PNU1 finding`);
  errors.push(...validateDate(finding.date, `clinicalFindings[${index}].date`));
  return errors;
}

function measurementsOf(input, kind, window) {
  return input.measurements.filter(item => item.kind === kind && dateInWindow(item.date, window).value);
}

function measurementMet(input, kind, window, thresholds) {
  return measurementsOf(input, kind, window).some(item => thresholds.some(threshold => compareMeasurement(item, threshold).value.met));
}

function findingMet(input, kinds, window) {
  return input.clinicalFindings.some(item => kinds.includes(item.kind) && dateInWindow(item.date, window).value);
}

function tachypneaThreshold(patientContext, eventDate) {
  const years = evaluateAgeApplicability(patientContext, eventDate, { unit: "years", operator: "gt", value: 5 });
  if (years.ok && years.value.met) return 30;
  const olderThanOne = evaluateAgeApplicability(patientContext, eventDate, { unit: "years", operator: "gt", value: 1 });
  if (olderThanOne.ok && olderThanOne.value.met) return 40;
  const months = evaluateAgeApplicability(patientContext, eventDate, { unit: "months", operator: "gte", value: 2 });
  if (months.ok && months.value.met) return 50;
  const ageDays = ageAtEvent(patientContext, eventDate, "days");
  if (ageDays.ok && patientContext.gestationalAgeWeeksAtBirth < 37 && patientContext.gestationalAgeWeeksAtBirth + Math.floor(ageDays.value / 7) < 40) return 75;
  return 60;
}

function clinicalGroups(input, window, branch, eventDate) {
  const fever = measurementMet(input, "temperature", window, [{ comparator: "gt", value: 38, unit: "C" }]);
  const hypothermia = measurementMet(input, "temperature", window, [{ comparator: "lt", value: 36.5, unit: "C" }]);
  const wbcAdult = measurementMet(input, "wbc", window, [{ comparator: "lte", value: 4000, unit: "cells/mm3" }, { comparator: "gte", value: 12000, unit: "cells/mm3" }]);
  const wbcPediatric = measurementMet(input, "wbc", window, [{ comparator: "lte", value: 4000, unit: "cells/mm3" }, { comparator: "gte", value: 15000, unit: "cells/mm3" }]);
  const leftShift = measurementMet(input, "bands", window, [{ comparator: "gte", value: 10, unit: "percent" }]);
  const sputum = findingMet(input, ["sputum-change", "secretions-change", "increased-suctioning"], window);
  const gas = findingMet(input, ["worsening-gas-exchange"], window);
  const tachypnea = measurementMet(input, "respiratory-rate", window, [{ comparator: "gt", value: tachypneaThreshold(input.patientContext, eventDate), unit: "breaths/min" }]);
  if (branch === "PNU1-any-patient") {
    const age70 = evaluateAgeApplicability(input.patientContext, eventDate, { unit: "years", operator: "gte", value: 70 }).value.met;
    return {
      required: 2,
      prerequisite: fever || wbcAdult || (age70 && findingMet(input, ["altered-mental-status-no-other-cause"], window)),
      groups: [sputum, findingMet(input, ["dyspnea", "new-or-worsening-cough"], window) || tachypnea, findingMet(input, ["rales", "crackles", "bronchial-breath-sounds"], window), gas],
      missing: [requirement("any-systemic", "At least one qualifying systemic finding"), requirement("any-respiratory", "Two qualifying respiratory finding groups")]
    };
  }
  if (branch === "PNU1-infant") {
    const heart = measurementMet(input, "heart-rate", window, [{ comparator: "lt", value: 100, unit: "beats/min" }, { comparator: "gt", value: 170, unit: "beats/min" }]);
    return {
      required: 3,
      prerequisite: gas,
      groups: [findingMet(input, ["temperature-instability"], window), measurementMet(input, "wbc", window, [{ comparator: "lte", value: 4000, unit: "cells/mm3" }]) || (measurementMet(input, "wbc", window, [{ comparator: "gte", value: 15000, unit: "cells/mm3" }]) && leftShift), sputum, findingMet(input, ["apnea", "nasal-flaring"], window) || tachypnea, findingMet(input, ["wheezing", "rales", "rhonchi"], window), findingMet(input, ["cough"], window), heart],
      missing: [requirement("infant-gas", "Worsening gas exchange"), requirement("infant-findings", "Three qualifying infant clinical finding groups")]
    };
  }
  return {
    required: 3,
    prerequisite: true,
    groups: [fever || hypothermia, wbcPediatric, sputum, findingMet(input, ["dyspnea", "apnea", "cough"], window) || tachypnea, findingMet(input, ["rales", "bronchial-breath-sounds"], window), gas],
    missing: [requirement("child-findings", "Three qualifying child clinical finding groups")]
  };
}

function eligibleImageFinding(study, infant) {
  return study.findings.some(finding => BASE_FINDINGS.has(finding) || (finding === "pneumatoceles" && infant)) && !study.attributedToOtherCondition;
}

function resolvedImage(study, studies) {
  if (study.interpretation === "definitive") return true;
  if (study.clinicalCorrelation === true) return true;
  return studies.some(later => later.date >= study.date && later.interpretation === "definitive" && later.clarifiesStudyId === study.id && later.clarification === "positive");
}

function imagingMet(input, first, infant, poa) {
  if (!eligibleImageFinding(first, infant) || !resolvedImage(first, input.imagingStudies)) return { met: false, studyIds: [] };
  if (input.imagingStudies.length === 1) {
    const met = poa || (input.soleAvailableImage === true && input.underlyingPulmonaryOrCardiacDisease === false);
    return { met, studyIds: met ? [first.id] : [] };
  }
  for (const relationship of input.imagingRelationships) {
    if (relationship.fromStudyId !== first.id) continue;
    const second = input.imagingStudies.find(study => study.id === relationship.toStudyId);
    if (!second || !eligibleImageFinding(second, infant) || !resolvedImage(second, input.imagingStudies)) continue;
    const distance = (day(second.date) - day(first.date)) / 86400000;
    const common = first.findings.some(finding => second.findings.includes(finding) && (BASE_FINDINGS.has(finding) || finding === "pneumatoceles"));
    if (distance >= 0 && distance <= 7 && (relationship.type === "progressive" || common)) return { met: true, studyIds: [first.id, second.id] };
  }
  return { met: false, studyIds: [] };
}

function branchApplicable(input, branch, eventDate) {
  if (branch === "PNU1-any-patient") return true;
  if (branch === "PNU1-infant") return evaluateAgeApplicability(input.patientContext, eventDate, { unit: "years", operator: "lte", value: 1 }).value.met;
  const older = evaluateAgeApplicability(input.patientContext, eventDate, { unit: "years", operator: "gt", value: 1 }).value.met;
  const atMost12 = evaluateAgeApplicability(input.patientContext, eventDate, { unit: "years", operator: "lte", value: 12 }).value.met;
  return older && atMost12;
}

function validateInput(input) {
  const errors = [];
  if (!isPlainObject(input)) return ["PNU1 input must be an object"];
  errors.push(...validateDate(input.admissionDate, "admissionDate"));
  if (typeof input.underlyingPulmonaryOrCardiacDisease !== "boolean") errors.push("underlyingPulmonaryOrCardiacDisease must be boolean");
  if (typeof input.soleAvailableImage !== "boolean") errors.push("soleAvailableImage must be boolean");
  if (!Array.isArray(input.imagingStudies) || !input.imagingStudies.length) errors.push("imagingStudies must contain at least one study");
  else input.imagingStudies.forEach((item, index) => { const checked = validateImagingStudy(item, `imagingStudies[${index}]`); if (!checked.ok) errors.push(...checked.errors); });
  if (!Array.isArray(input.imagingRelationships)) errors.push("imagingRelationships must be an array");
  else if (Array.isArray(input.imagingStudies)) input.imagingRelationships.forEach(item => { const checked = validateImagingRelationship(item, input.imagingStudies); if (!checked.ok) errors.push(...checked.errors); });
  if (!Array.isArray(input.measurements)) errors.push("measurements must be an array");
  else input.measurements.forEach((item, index) => { const checked = validateMeasurement(item, `measurements[${index}]`); if (!checked.ok) errors.push(...checked.errors); });
  if (!Array.isArray(input.clinicalFindings)) errors.push("clinicalFindings must be an array");
  else input.clinicalFindings.forEach((item, index) => errors.push(...validateFinding(item, index)));
  if (!isPlainObject(input.patientContext)) errors.push("patientContext must be an object");
  else {
    const checked = validatePatientContext(input.patientContext); if (!checked.ok) errors.push(...checked.errors);
    const earliestImage = Array.isArray(input.imagingStudies) && input.imagingStudies.map(item => item?.date).filter(Boolean).sort()[0];
    if (checked.ok && earliestImage) {
      const underTwoMonths = evaluateAgeApplicability(input.patientContext, earliestImage, { unit: "months", operator: "lt", value: 2 });
      if (underTwoMonths.ok && underTwoMonths.value.met && (!Number.isInteger(input.patientContext.gestationalAgeWeeksAtBirth) || input.patientContext.gestationalAgeWeeksAtBirth < 20 || input.patientContext.gestationalAgeWeeksAtBirth > 45)) errors.push("patientContext.gestationalAgeWeeksAtBirth (20–45) is required for the premature-infant tachypnea branch");
    }
  }
  if (input.microbiologyResults !== undefined && !Array.isArray(input.microbiologyResults)) errors.push("microbiologyResults must be an array when supplied");
  return errors;
}

export function evaluatePnu1(input) {
  const errors = validateInput(input);
  if (errors.length) return validationError(errors);
  const studies = [...input.imagingStudies].sort((a, b) => day(a.date) - day(b.date));
  const attempts = [];
  for (const first of studies) {
    const iwp = createInfectionWindow(first.date, PNU1_SOURCES.timing).value;
    const eventDate = first.date;
    const infant = evaluateAgeApplicability(input.patientContext, eventDate, { unit: "years", operator: "lte", value: 1 });
    if (!infant.ok) return infant;
    const poa = day(first.date) <= day(input.admissionDate) + 86400000;
    const imaging = imagingMet(input, first, infant.value.met, poa);
    for (const branch of PNU1_PROTOCOL.branches) {
      if (!branchApplicable(input, branch, eventDate)) continue;
      const clinical = clinicalGroups(input, iwp, branch, eventDate);
      const count = clinical.groups.filter(Boolean).length;
      const met = imaging.met && clinical.prerequisite && count >= clinical.required;
      const remaining = [];
      if (!imaging.met) remaining.push(requirement("imaging", "Qualifying one-study exception or two serial imaging studies demonstrating persistence/progression", PNU1_SOURCES.imaging));
      if (!clinical.prerequisite) remaining.push(clinical.missing[0]);
      if (count < clinical.required) remaining.push(clinical.missing.at(-1));
      attempts.push({ first, iwp, branch, met, imaging, clinical, count, remaining });
    }
  }
  const matched = attempts.find(attempt => attempt.met);
  const closest = matched ?? attempts.sort((a, b) => a.remaining.length - b.remaining.length)[0];
  const usedDates = matched ? [matched.first.date,
    ...input.measurements.filter(item => dateInWindow(item.date, matched.iwp).value).map(item => item.date),
    ...input.clinicalFindings.filter(item => dateInWindow(item.date, matched.iwp).value).map(item => item.date)] : [];
  const dateOfEvent = matched ? unique(usedDates).sort()[0] : null;
  const rit = dateOfEvent ? createRepeatInfectionTimeframe(dateOfEvent, PNU1_SOURCES.rit).value : null;
  const sbap = dateOfEvent ? createCalendarWindow(dateOfEvent, 3, 13, PNU1_SOURCES.attribution).value : null;
  return valid(Object.freeze({
    eventFamily: "PNEU", siteCode: "PNU1", met: Boolean(matched), status: matched ? "PNU1 Met" : "PNU1 Not Met",
    branch: matched?.branch ?? null, dateOfEvent, infectionWindow: matched?.iwp ?? closest?.iwp ?? null, repeatInfectionTimeframe: rit,
    secondaryBsiAttributionPeriod: sbap, imaging: matched?.imaging ?? closest?.imaging ?? { met: false, studyIds: [] },
    clinical: Object.freeze({ met: Boolean(matched), branch: matched?.branch ?? closest?.branch ?? null, qualifyingGroupCount: matched?.count ?? closest?.count ?? 0 }),
    laboratoryEvidence: Object.freeze({ applicable: false, message: "PNU1 has no laboratory criterion." }),
    exclusions: Object.freeze([]), remainingRequirements: Object.freeze(matched ? [] : (closest?.remaining ?? [])),
    secondaryBsi: Object.freeze({ met: false, status: "notPermittedForPNU1", organismRelationshipMet: false, timingMet: false, message: "Pathogens and secondary BSIs are not reported for PNU1." }),
    source: PNU1_SOURCES.definition
  }));
}
