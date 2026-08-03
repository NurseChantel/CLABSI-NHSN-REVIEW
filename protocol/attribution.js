import { dateInWindow, validateCalendarWindow } from "./timeline.js";
import { evaluateOrganismPredicate, validateMicrobiologyResult } from "./microbiology.js";
import { isPlainObject, valid, validationError } from "./validation.js";

export function evaluateSecondaryBsiAttribution({ siteQualified, siteResults, bloodResult, attributionPeriod, relationshipRule }) {
  const errors = [];
  if (typeof siteQualified !== "boolean") errors.push("siteQualified must be boolean");
  if (!Array.isArray(siteResults)) errors.push("siteResults must be an array");
  else siteResults.forEach((result, index) => { const checked = validateMicrobiologyResult(result, `siteResults[${index}]`); if (!checked.ok) errors.push(...checked.errors); });
  const blood = validateMicrobiologyResult(bloodResult, "bloodResult");
  if (!blood.ok) errors.push(...blood.errors);
  errors.push(...validateCalendarWindow(attributionPeriod, "attributionPeriod"));
  if (!isPlainObject(relationshipRule)) errors.push("relationshipRule must be an object");
  if (errors.length) return validationError(errors);
  if (!siteQualified) return valid(Object.freeze({ status: "siteNotQualified", met: false, organismRelationshipMet: false, timingMet: false }));
  const timing = dateInWindow(bloodResult.collectionDate, attributionPeriod);
  const eligibleBlood = relationshipRule.bloodOrganismPredicate
    ? evaluateOrganismPredicate(bloodResult.organism, relationshipRule.bloodOrganismPredicate)
    : valid({ met: true });
  if (!eligibleBlood.ok) return eligibleBlood;
  const matches = siteResults.filter(result => result.organism.id === bloodResult.organism.id && !result.excluded && !result.contaminated);
  const relationshipMet = eligibleBlood.value.met && (relationshipRule.allowBloodAsCriterion === true || matches.length > 0);
  const met = relationshipMet && timing.value;
  return valid(Object.freeze({
    status: met ? "attributionMet" : "attributionIncomplete",
    met,
    organismRelationshipMet: relationshipMet,
    timingMet: timing.value,
    matchingSiteResultIds: Object.freeze(matches.map(result => result.id))
  }));
}
