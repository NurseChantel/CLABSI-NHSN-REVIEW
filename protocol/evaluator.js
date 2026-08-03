import { evaluateExpression, validateExpression } from "./expressions.js";
import { validatePatientContext } from "./patient-context.js";
import { validateTimeline } from "./timeline.js";
import { isPlainObject, valid, validateSource, validationError } from "./validation.js";

export function validateProtocolDefinition(definition) {
  if (!isPlainObject(definition)) return validationError(["protocol definition must be an object"]);
  const errors = [];
  for (const key of ["eventFamily", "siteCode"]) if (typeof definition[key] !== "string" || !definition[key]) errors.push(`definition.${key} must be a non-empty string`);
  errors.push(...validateSource(definition.source, "definition.source"));
  if (!Array.isArray(definition.subtypes) || !definition.subtypes.length) errors.push("definition.subtypes must be a non-empty hierarchy array");
  else {
    const ids = new Set();
    definition.subtypes.forEach((subtype, index) => {
      if (!isPlainObject(subtype) || typeof subtype.id !== "string" || ids.has(subtype.id)) errors.push(`definition.subtypes[${index}] is malformed or duplicated`);
      else ids.add(subtype.id);
      const checked = validateExpression(subtype.expression, `definition.subtypes[${index}].expression`);
      if (!checked.ok) errors.push(...checked.errors);
    });
  }
  return errors.length ? validationError(errors) : valid(definition);
}

export function evaluateProtocol(definition, input) {
  const definitionResult = validateProtocolDefinition(definition);
  if (!definitionResult.ok) return definitionResult;
  if (!isPlainObject(input)) return validationError(["protocol input must be an object"]);
  const patient = validatePatientContext(input.patientContext);
  const timeline = validateTimeline(input.timeline);
  const errors = [...(patient.ok ? [] : patient.errors), ...(timeline.ok ? [] : timeline.errors)];
  if (input.eventFamily !== definition.eventFamily) errors.push("input event family does not match protocol event family");
  if (input.siteCode !== definition.siteCode) errors.push("input site code does not match protocol site code");
  if (input.attribution !== undefined && (!isPlainObject(input.attribution) || typeof input.attribution.status !== "string")) errors.push("input.attribution requires a status string");
  if (errors.length) return validationError(errors);
  const evaluated = definition.subtypes.map(subtype => ({ subtype, result: evaluateExpression(subtype.expression, input) }));
  const invalid = evaluated.find(entry => !entry.result.ok);
  if (invalid) return invalid.result;
  const matched = evaluated.find(entry => entry.result.value.met);
  const result = Object.freeze({
    eventFamily: definition.eventFamily,
    siteCode: definition.siteCode,
    subtype: matched?.subtype.id ?? null,
    dateOfEvent: input.timeline.dateOfEventCandidate ?? null,
    infectionWindow: input.timeline.infectionWindow ?? null,
    repeatInfectionTimeframe: input.timeline.repeatInfectionTimeframe ?? null,
    qualificationStatus: matched ? "qualified" : "incomplete",
    remainingRequirements: Object.freeze(matched ? [] : evaluated.flatMap(entry => entry.result.value.remaining)),
    exclusions: Object.freeze(evaluated.flatMap(entry => entry.result.value.exclusions)),
    attributionStatus: input.attribution?.status ?? "notEvaluated",
    source: definition.source
  });
  return valid(result);
}
