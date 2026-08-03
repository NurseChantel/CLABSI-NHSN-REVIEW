import { evaluateAgeApplicability } from "./patient-context.js";
import { compareMeasurement } from "./measurements.js";
import { evaluateOrganismPredicate, validateMicrobiologyResult } from "./microbiology.js";
import { evaluatePnuImaging, pnuTachypneaThreshold, validatePnuBaseInput } from "./pnu1.js";
import { createCalendarWindow, createInfectionWindow, createRepeatInfectionTimeframe, dateInWindow } from "./timeline.js";
import { isPlainObject, valid, validateDate, validationError } from "./validation.js";

const source = (section, printedPage, sourceId, document = "NHSN pneumonia.pdf") => Object.freeze({ document, section, printedPage, sourceId });
export const PNU2_SOURCES = Object.freeze({
  common: source("Table 2: Pneumonia with Common Bacterial or Filamentous Fungal Pathogens", "6-7", "PNU2.table2"),
  other: source("Table 3: Pneumonia with Viral, Legionella, and Other Bacterial Pathogens", "6-8", "PNU2.table3"),
  specimens: source("General Comments 5–7; Footnotes 8–9", "6-4–6-5, 6-14–6-15", "PNU2.specimens"),
  thresholds: source("Table 5: Threshold values for cultured specimens", "6-15", "PNU2.table5"),
  clinical: source("Tables 2–3; Footnotes 3–7", "6-7–6-8, 6-12–6-14", "PNU2.clinical"),
  imaging: source("Guidance for Determination of Eligible Imaging Test Evidence; Footnotes 1, 2, 13", "6-3, 6-12, 6-16", "PNU2.imaging"),
  timing: source("Infection Window Period and Date of Event", "2-3–2-8", "PNU2.timing", "NHSN HAI.pdf"),
  rit: source("Repeat Infection Timeframe", "2-11–2-12", "PNU2.rit", "NHSN HAI.pdf"),
  attribution: source("Secondary BSI Attribution Period and Pathogen Assignment", "2-15–2-19", "PNU2.attribution", "NHSN HAI.pdf"),
  relationship: source("Secondary BSI and Matching Organisms", "17-1–17-3", "PNU2.relationship", "Secondary BSI Chapter.pdf"),
  checklist: source("PNU2 worksheets", "PDF pages 5–8", "PNU2.checklist", "NHSN pneumonia checklist.pdf")
});

export const PNU2_PROTOCOL = Object.freeze({ eventFamily: "PNEU", siteCode: "PNU2", name: "Pneumonia with Specific Laboratory Findings", branches: Object.freeze([
  "blood", "pleural-fluid", "bronchoscopic-bal", "protected-specimen-brushing", "nonbronchoscopic-bal", "endotracheal-aspirate", "lung-tissue", "bal-intracellular-bacteria", "histopathology-abscess", "histopathology-invasive-fungus",
  "respiratory-or-tissue-identification", "paired-sera-fourfold-igg", "legionella-paired-sera-ifa", "legionella-urine-antigen"
]), source: PNU2_SOURCES.common, sourceCrossCheck: PNU2_SOURCES.checklist });

const day = value => Date.parse(`${value}T00:00:00Z`);
const requirement = (id, message, sourceMetadata) => Object.freeze({ id, message, source: sourceMetadata });
const excludedTags = ["oral-flora", "respiratory-flora", "community-associated-fungus", "vector-borne"];
const restrictedTags = ["candida", "yeast", "coagulase-negative-staphylococcus", "enterococcus"];
const respiratoryTargetTags = ["virus", "bordetella", "legionella", "chlamydia", "mycoplasma"];
const respiratorySpecimens = ["respiratory-secretions", "bronchoscopic-bal", "protected-specimen-brushing", "nonbronchoscopic-bal", "endotracheal-aspirate", "lung-tissue"];
const thresholds = Object.freeze({
  "lung-tissue": { quantitativeValue: 1e4, unit: "CFU/g" }, "bronchoscopic-bal": { quantitativeValue: 1e4, unit: "CFU/ml" },
  "protected-specimen-brushing": { quantitativeValue: 1e3, unit: "CFU/ml" }, "nonbronchoscopic-bal": { quantitativeValue: 1e4, unit: "CFU/ml" },
  "endotracheal-aspirate": { quantitativeValue: 1e5, unit: "CFU/ml" }
});
const semi = new Set(["moderate", "heavy", "many", "numerous", "2+", "3+", "4+"]);

function inWindow(record, window) { return dateInWindow(record.collectionDate ?? record.date, window).value; }
function measurementMet(input, kind, window, rules) {
  return input.measurements.some(item => item.kind === kind && dateInWindow(item.date, window).value && rules.some(rule => compareMeasurement(item, rule).value.met));
}
function findingMet(input, kinds, window) { return input.clinicalFindings.some(item => kinds.includes(item.kind) && dateInWindow(item.date, window).value); }
function clinical(input, window, eventDate) {
  const age70 = evaluateAgeApplicability(input.patientContext, eventDate, { unit: "years", operator: "gte", value: 70 }).value.met;
  const systemic = measurementMet(input, "temperature", window, [{ comparator: "gt", value: 38, unit: "C" }])
    || measurementMet(input, "wbc", window, [{ comparator: "lte", value: 4000, unit: "cells/mm3" }, { comparator: "gte", value: 12000, unit: "cells/mm3" }])
    || (age70 && findingMet(input, ["altered-mental-status-no-other-cause"], window));
  const respiratory = [findingMet(input, ["sputum-change", "secretions-change", "increased-suctioning"], window),
    findingMet(input, ["dyspnea", "new-or-worsening-cough"], window) || measurementMet(input, "respiratory-rate", window, [{ comparator: "gt", value: pnuTachypneaThreshold(input.patientContext, eventDate), unit: "breaths/min" }]),
    findingMet(input, ["rales", "crackles", "bronchial-breath-sounds"], window), findingMet(input, ["worsening-gas-exchange"], window)].some(Boolean);
  return { met: systemic && respiratory, systemic, respiratory };
}

function organismEligible(result) {
  const base = evaluateOrganismPredicate(result.organism, { excludeTags: excludedTags });
  if (!base.ok || !base.value.met) return false;
  return !restrictedTags.some(tag => result.organism.tags.includes(tag)) || ["lung-tissue", "pleural-fluid"].includes(result.specimenType);
}
function pleuralEligible(result) { return result.specimenType === "pleural-fluid" && ["thoracentesis", "chest-tube-within-24-hours"].includes(result.collectionTechnique); }
function positiveIdentification(result) { return result.resultType === "qualitative" && result.positive === true && !result.contaminated && !result.excluded && !["asc", "ast"].includes(result.testMethod); }

function evaluateLaboratory(input, window) {
  const branches = [];
  for (const result of input.microbiologyResults.filter(item => inWindow(item, window))) {
    const common = organismEligible(result);
    const add = (id, met, reason = null) => branches.push({ id, met, resultIds: met ? [result.id] : [], reason });
    add("blood", result.specimenType === "blood" && positiveIdentification(result) && common);
    add("pleural-fluid", pleuralEligible(result) && positiveIdentification(result) && common);
    if (thresholds[result.specimenType]) {
      const threshold = thresholds[result.specimenType];
      const quantityMet = result.resultType === "quantitative" ? result.unit === threshold.unit && result.value >= threshold.quantitativeValue
        : result.resultType === "semiquantitative" && result.laboratoryUnableToProvideQuantitativeCorrespondence === true && semi.has(result.category);
      add(result.specimenType, common && !result.contaminated && !result.excluded && result.testMethod === "culture" && quantityMet);
    }
    add("bal-intracellular-bacteria", result.specimenType === "bronchoscopic-bal" && result.testMethod === "direct-microscopy" && result.resultType === "quantitative" && result.unit === "percent-cells" && result.value >= 5 && common);
    const target = respiratoryTargetTags.some(tag => result.organism.tags.includes(tag));
    add("respiratory-or-tissue-identification", respiratorySpecimens.includes(result.specimenType) && target && positiveIdentification(result) && ["culture", "non-culture-diagnostic-test"].includes(result.testMethod));
    add("paired-sera-fourfold-igg", result.specimenType === "paired-sera" && result.testMethod === "igg" && result.resultType === "quantitative" && result.unit === "fold-rise" && result.value >= 4 && target);
    add("legionella-paired-sera-ifa", result.specimenType === "paired-sera" && result.testMethod === "ifa" && result.resultType === "quantitative" && result.unit === "fold-rise" && result.value >= 4 && result.organism.id === "legionella-pneumophila-serogroup-1");
    add("legionella-urine-antigen", result.specimenType === "urine" && ["ria", "eia"].includes(result.testMethod) && positiveIdentification(result) && result.organism.id === "legionella-pneumophila-serogroup-1");
  }
  for (const result of input.histopathologyResults.filter(item => inWindow(item, window))) branches.push({ id: result.finding === "abscess-or-consolidation-with-intense-pmn" ? "histopathology-abscess" : "histopathology-invasive-fungus", met: true, resultIds: [result.id] });
  const collapsed = PNU2_PROTOCOL.branches.map(id => ({ id, met: branches.some(item => item.id === id && item.met), resultIds: branches.filter(item => item.id === id && item.met).flatMap(item => item.resultIds), source: ["respiratory-or-tissue-identification", "paired-sera-fourfold-igg", "legionella-paired-sera-ifa", "legionella-urine-antigen"].includes(id) ? PNU2_SOURCES.other : (thresholds[id] ? PNU2_SOURCES.thresholds : PNU2_SOURCES.common) }));
  return { met: collapsed.some(item => item.met), branches: collapsed, qualifyingResultIds: collapsed.flatMap(item => item.resultIds) };
}

function validateInput(input) {
  const errors = validatePnuBaseInput(input);
  if (!isPlainObject(input)) return errors;
  if (!Array.isArray(input.microbiologyResults)) errors.push("microbiologyResults must be an array");
  else input.microbiologyResults.forEach((item, index) => { const result = validateMicrobiologyResult(item, `microbiologyResults[${index}]`); if (!result.ok) errors.push(...result.errors); if (isPlainObject(item) && item.positive !== undefined && typeof item.positive !== "boolean") errors.push(`microbiologyResults[${index}].positive must be boolean`); });
  if (!Array.isArray(input.histopathologyResults)) errors.push("histopathologyResults must be an array");
  else input.histopathologyResults.forEach((item, index) => { if (!isPlainObject(item) || typeof item.id !== "string") errors.push(`histopathologyResults[${index}] must have an id`); else { errors.push(...validateDate(item.date, `histopathologyResults[${index}].date`)); if (!["abscess-or-consolidation-with-intense-pmn", "fungal-hyphae-or-pseudohyphae-invading-parenchyma"].includes(item.finding)) errors.push(`histopathologyResults[${index}].finding is invalid`); } });
  if (input.bloodResults !== undefined && !Array.isArray(input.bloodResults)) errors.push("bloodResults must be an array when supplied");
  else (input.bloodResults ?? []).forEach((item, index) => { const result = validateMicrobiologyResult(item, `bloodResults[${index}]`); if (!result.ok) errors.push(...result.errors); });
  return errors;
}

export function evaluatePnu2(input) {
  const errors = validateInput(input); if (errors.length) return validationError(errors);
  const attempts = [...input.imagingStudies].sort((a, b) => day(a.date) - day(b.date)).map(first => {
    const infectionWindow = createInfectionWindow(first.date, PNU2_SOURCES.timing).value;
    const infant = evaluateAgeApplicability(input.patientContext, first.date, { unit: "years", operator: "lte", value: 1 }).value.met;
    const imaging = evaluatePnuImaging(input, first, infant, day(first.date) <= day(input.admissionDate) + 86400000);
    const clinicalResult = clinical(input, infectionWindow, first.date); const laboratory = evaluateLaboratory(input, infectionWindow);
    return { first, infectionWindow, imaging, clinical: clinicalResult, laboratory, met: imaging.met && clinicalResult.met && laboratory.met };
  });
  const matched = attempts.find(item => item.met); const closest = matched ?? attempts.sort((a, b) => Number(!a.imaging.met) + Number(!a.clinical.met) + Number(!a.laboratory.met) - (Number(!b.imaging.met) + Number(!b.clinical.met) + Number(!b.laboratory.met)))[0];
  const usedDates = matched ? [matched.first.date, ...input.measurements.filter(item => dateInWindow(item.date, matched.infectionWindow).value).map(item => item.date), ...input.clinicalFindings.filter(item => dateInWindow(item.date, matched.infectionWindow).value).map(item => item.date), ...input.microbiologyResults.filter(item => matched.laboratory.qualifyingResultIds.includes(item.id)).map(item => item.collectionDate), ...input.histopathologyResults.filter(item => matched.laboratory.qualifyingResultIds.includes(item.id)).map(item => item.date)] : [];
  const dateOfEvent = matched ? [...new Set(usedDates)].sort()[0] : null; const repeatInfectionTimeframe = dateOfEvent ? createRepeatInfectionTimeframe(dateOfEvent, PNU2_SOURCES.rit).value : null; const secondaryBsiAttributionPeriod = dateOfEvent ? createCalendarWindow(dateOfEvent, 3, 13, PNU2_SOURCES.attribution).value : null;
  let secondaryBsi = { met: false, status: matched ? "noBloodResult" : "siteNotQualified", organismRelationshipMet: false, timingMet: false, matchingSiteResultIds: [] };
  if (matched && input.bloodResults?.length) {
    const qualifyingSite = input.microbiologyResults.filter(item => matched.laboratory.qualifyingResultIds.includes(item.id));
    for (const blood of input.bloodResults) {
      const timingMet = dateInWindow(blood.collectionDate, secondaryBsiAttributionPeriod).value; const bloodCriterion = qualifyingSite.some(item => item.specimenType === "blood" && item.id === blood.id); const matching = qualifyingSite.filter(item => item.specimenType !== "blood" && item.organism.id === blood.organism.id && organismEligible(item)); const relationshipMet = organismEligible(blood) && (bloodCriterion || matching.length > 0);
      if (relationshipMet && timingMet) { secondaryBsi = { met: true, status: "attributionMet", organismRelationshipMet: true, timingMet: true, matchingSiteResultIds: matching.map(item => item.id) }; break; }
      secondaryBsi = { met: false, status: "attributionIncomplete", organismRelationshipMet: relationshipMet, timingMet, matchingSiteResultIds: matching.map(item => item.id) };
    }
  }
  const remaining = []; if (!closest.imaging.met) remaining.push(requirement("imaging", "Qualifying one-study exception or serial imaging persistence/progression", PNU2_SOURCES.imaging)); if (!closest.clinical.systemic) remaining.push(requirement("systemic", "One qualifying systemic finding", PNU2_SOURCES.clinical)); if (!closest.clinical.respiratory) remaining.push(requirement("respiratory", "One qualifying respiratory finding group", PNU2_SOURCES.clinical)); if (!closest.laboratory.met) remaining.push(requirement("laboratory", "One complete, eligible PNU2 laboratory branch", PNU2_SOURCES.common));
  return valid(Object.freeze({ eventFamily: "PNEU", siteCode: "PNU2", met: Boolean(matched), status: matched ? "PNU2 Met" : "PNU2 Not Met", dateOfEvent, infectionWindow: matched?.infectionWindow ?? closest.infectionWindow, repeatInfectionTimeframe, secondaryBsiAttributionPeriod, imaging: matched?.imaging ?? closest.imaging, clinical: Object.freeze(matched?.clinical ?? closest.clinical), laboratoryEvidence: Object.freeze(matched?.laboratory ?? closest.laboratory), specimenEligibility: Object.freeze({ source: PNU2_SOURCES.specimens }), exclusions: Object.freeze(excludedTags), remainingRequirements: Object.freeze(matched ? [] : remaining), secondaryBsi: Object.freeze(secondaryBsi), source: PNU2_SOURCES.common }));
}
