import { calendarDayDistance } from "./timeline.js";
import { isPlainObject, valid, validateDate, validationError } from "./validation.js";

const INTERPRETATIONS = new Set(["definitive", "equivocal"]);
const RELATIONS = new Set(["persistent", "progressive"]);

export function validateImagingStudy(study, path = "study") {
  if (!isPlainObject(study)) return validationError([`${path} must be an object`]);
  const errors = [];
  if (typeof study.id !== "string" || !study.id) errors.push(`${path}.id must be a non-empty string`);
  errors.push(...validateDate(study.date, `${path}.date`));
  if (typeof study.modality !== "string" || !study.modality) errors.push(`${path}.modality must be a non-empty string`);
  if (!Array.isArray(study.findings) || study.findings.some(finding => typeof finding !== "string" || !finding)) errors.push(`${path}.findings must be an array of non-empty strings`);
  if (!INTERPRETATIONS.has(study.interpretation)) errors.push(`${path}.interpretation must be definitive or equivocal`);
  if (study.attributedToOtherCondition !== undefined && typeof study.attributedToOtherCondition !== "boolean") errors.push(`${path}.attributedToOtherCondition must be boolean when supplied`);
  return errors.length ? validationError(errors) : valid(Object.freeze({ ...study, findings: Object.freeze([...study.findings]) }));
}

export function validateImagingRelationship(relationship, studies) {
  const errors = [];
  if (!isPlainObject(relationship) || typeof relationship.fromStudyId !== "string" || typeof relationship.toStudyId !== "string" || !RELATIONS.has(relationship.type)) {
    errors.push("imaging relationship is malformed");
  } else {
    if (relationship.fromStudyId === relationship.toStudyId) errors.push("imaging relationship requires two distinct studies");
    if (!studies.some(study => study.id === relationship.fromStudyId) || !studies.some(study => study.id === relationship.toStudyId)) errors.push("imaging relationship references an unknown study");
  }
  return errors.length ? validationError(errors) : valid(Object.freeze({ ...relationship }));
}

export function evaluateSerialImaging({ studies, relationship, eligibleFindings, maximumCalendarDays }) {
  const errors = [];
  if (!Array.isArray(studies) || studies.length < 2) errors.push("at least two imaging studies are required");
  else studies.forEach((study, index) => { const result = validateImagingStudy(study, `studies[${index}]`); if (!result.ok) errors.push(...result.errors); });
  if (!Array.isArray(eligibleFindings) || !eligibleFindings.length) errors.push("eligibleFindings must be a non-empty array");
  if (!Number.isInteger(maximumCalendarDays) || maximumCalendarDays < 0) errors.push("maximumCalendarDays must be a non-negative integer");
  if (errors.length) return validationError(errors);
  const relation = validateImagingRelationship(relationship, studies);
  if (!relation.ok) return relation;
  const first = studies.find(study => study.id === relationship.fromStudyId);
  const second = studies.find(study => study.id === relationship.toStudyId);
  const distance = calendarDayDistance(first.date, second.date);
  const commonEligibleFinding = eligibleFindings.some(finding => first.findings.includes(finding) && second.findings.includes(finding));
  const bothHaveEligibleFinding = eligibleFindings.some(finding => first.findings.includes(finding))
    && eligibleFindings.some(finding => second.findings.includes(finding));
  const eligible = first.interpretation === "definitive" && second.interpretation === "definitive"
    && !first.attributedToOtherCondition && !second.attributedToOtherCondition;
  return valid(Object.freeze({
    met: eligible && bothHaveEligibleFinding && distance.value >= 0 && distance.value <= maximumCalendarDays && (relationship.type === "progressive" || commonEligibleFinding),
    relationship: relationship.type,
    calendarDays: distance.value,
    studyIds: Object.freeze([first.id, second.id])
  }));
}
