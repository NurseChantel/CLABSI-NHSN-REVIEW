import { isPlainObject, valid, validateDate, validationError } from "./validation.js";

const RESULT_TYPES = new Set(["quantitative", "semiquantitative", "qualitative"]);

export function validateMicrobiologyResult(result, path = "microbiology") {
  if (!isPlainObject(result)) return validationError([`${path} must be an object`]);
  const errors = [];
  for (const key of ["id", "specimenType", "testMethod"]) if (typeof result[key] !== "string" || !result[key]) errors.push(`${path}.${key} must be a non-empty string`);
  errors.push(...validateDate(result.collectionDate, `${path}.collectionDate`));
  if (!isPlainObject(result.organism) || typeof result.organism.id !== "string" || !Array.isArray(result.organism.tags)) errors.push(`${path}.organism requires id and tags`);
  if (!RESULT_TYPES.has(result.resultType)) errors.push(`${path}.resultType is invalid`);
  if (result.resultType === "quantitative" && (typeof result.value !== "number" || !Number.isFinite(result.value) || typeof result.unit !== "string")) errors.push(`${path} quantitative result requires finite value and unit`);
  if (result.resultType === "semiquantitative" && (typeof result.category !== "string" || !result.category)) errors.push(`${path} semiquantitative result requires category`);
  if (typeof result.contaminated !== "boolean" || typeof result.excluded !== "boolean") errors.push(`${path} requires boolean contaminated and excluded flags`);
  return errors.length ? validationError(errors) : valid(Object.freeze({ ...result }));
}

export function evaluateSpecimenEligibility(result, rule) {
  const checked = validateMicrobiologyResult(result);
  if (!checked.ok) return checked;
  if (!isPlainObject(rule) || !Array.isArray(rule.allowedSpecimenTypes)) return validationError(["specimen eligibility rule requires allowedSpecimenTypes"]);
  return valid(Object.freeze({ met: rule.allowedSpecimenTypes.includes(result.specimenType) && !result.contaminated && !result.excluded }));
}

export function evaluateMicrobiologyThreshold(result, threshold) {
  const checked = validateMicrobiologyResult(result);
  if (!checked.ok) return checked;
  if (!isPlainObject(threshold)) return validationError(["microbiology threshold must be an object"]);
  if (result.resultType === "quantitative") {
    if (typeof threshold.quantitativeValue !== "number" || threshold.unit !== result.unit) return validationError(["quantitative threshold requires a matching explicit unit"]);
    return valid(Object.freeze({ met: result.value >= threshold.quantitativeValue }));
  }
  if (result.resultType === "semiquantitative") {
    if (!Array.isArray(threshold.acceptedCategories)) return validationError(["semiquantitative threshold requires acceptedCategories"]);
    return valid(Object.freeze({ met: threshold.acceptedCategories.includes(result.category) }));
  }
  return validationError(["qualitative results cannot be evaluated against a quantitative or semiquantitative threshold"]);
}

export function evaluateOrganismPredicate(organism, predicate) {
  if (!isPlainObject(organism) || typeof organism.id !== "string" || !Array.isArray(organism.tags)) return validationError(["organism requires id and tags"]);
  if (!isPlainObject(predicate)) return validationError(["organism predicate must be an object"]);
  const includeIds = predicate.includeIds ?? [];
  const excludeIds = predicate.excludeIds ?? [];
  const includeTags = predicate.includeTags ?? [];
  const excludeTags = predicate.excludeTags ?? [];
  if (![includeIds, excludeIds, includeTags, excludeTags].every(Array.isArray)) return validationError(["organism predicate lists must be arrays"]);
  const included = (!includeIds.length && !includeTags.length) || includeIds.includes(organism.id) || includeTags.some(tag => organism.tags.includes(tag));
  const excluded = excludeIds.includes(organism.id) || excludeTags.some(tag => organism.tags.includes(tag));
  return valid(Object.freeze({ met: included && !excluded, excluded }));
}
