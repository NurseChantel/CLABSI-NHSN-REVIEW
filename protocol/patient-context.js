import { collect, isPlainObject, valid, validateDate, validateSource, validationError } from "./validation.js";

const AGE_UNITS = new Set(["days", "months", "years"]);
const HOST_STATUSES = new Set(["met", "notMet", "unknown"]);

export function validatePatientContext(context) {
  if (!isPlainObject(context)) return validationError(["patientContext must be an object"]);
  const errors = [];
  if (context.dateOfBirth === undefined && context.exactAge === undefined) errors.push("patientContext requires dateOfBirth or exactAge");
  if (context.dateOfBirth !== undefined) errors.push(...validateDate(context.dateOfBirth, "patientContext.dateOfBirth"));
  if (context.exactAge !== undefined) {
    if (!isPlainObject(context.exactAge) || !Number.isInteger(context.exactAge.value) || context.exactAge.value < 0 || !AGE_UNITS.has(context.exactAge.unit)) {
      errors.push("patientContext.exactAge requires a non-negative integer value and days, months, or years unit");
    }
  }
  if (!isPlainObject(context.hostStatus) || !HOST_STATUSES.has(context.hostStatus.status) || !Array.isArray(context.hostStatus.reasons)) {
    errors.push("patientContext.hostStatus requires status met/notMet/unknown and a reasons array");
  } else {
    context.hostStatus.reasons.forEach((reason, index) => {
      if (!isPlainObject(reason) || typeof reason.id !== "string" || !HOST_STATUSES.has(reason.status)) errors.push(`patientContext.hostStatus.reasons[${index}] is malformed`);
      else errors.push(...validateSource(reason.source, `patientContext.hostStatus.reasons[${index}].source`));
    });
  }
  if (!isPlainObject(context.ventilator) || typeof context.ventilator.inPlace !== "boolean" || !Array.isArray(context.ventilator.periods)) {
    errors.push("patientContext.ventilator requires boolean inPlace and periods array");
  } else context.ventilator.periods.forEach((period, index) => {
    if (!isPlainObject(period)) errors.push(`patientContext.ventilator.periods[${index}] must be an object`);
    else {
      errors.push(...collect(validateDate(period.start, `patientContext.ventilator.periods[${index}].start`), period.end === null ? [] : validateDate(period.end, `patientContext.ventilator.periods[${index}].end`)));
      if (typeof period.artificialAirway !== "boolean") errors.push(`patientContext.ventilator.periods[${index}].artificialAirway must be boolean`);
      if (period.end && period.end < period.start) errors.push(`patientContext.ventilator.periods[${index}].end must not precede start`);
    }
  });
  return errors.length ? validationError(errors) : valid(Object.freeze({ ...context }));
}

export function evaluateVentilatorAssociation(context, eventDate, rule) {
  const checked = validatePatientContext(context);
  const errors = collect(checked.ok ? [] : checked.errors, validateDate(eventDate, "eventDate"));
  if (!isPlainObject(rule) || !Number.isInteger(rule.minimumConsecutiveCalendarDays) || rule.minimumConsecutiveCalendarDays < 1 || typeof rule.requireArtificialAirway !== "boolean") {
    errors.push("ventilator association rule is malformed");
  }
  if (errors.length) return validationError(errors);
  const event = new Date(`${eventDate}T00:00:00Z`);
  const previous = new Date(event.getTime() - 86400000).toISOString().slice(0, 10);
  const matchingPeriod = context.ventilator.periods.find(period => {
    const end = period.end ?? eventDate;
    const presentOnRequiredDay = (period.start <= eventDate && end >= eventDate) || (period.start <= previous && end >= previous);
    const daysThroughEvent = Math.floor((event - new Date(`${period.start}T00:00:00Z`)) / 86400000) + 1;
    return presentOnRequiredDay && daysThroughEvent >= rule.minimumConsecutiveCalendarDays && (!rule.requireArtificialAirway || period.artificialAirway);
  });
  return valid(Object.freeze({ met: Boolean(matchingPeriod), period: matchingPeriod ? Object.freeze({ ...matchingPeriod }) : null }));
}

function completedUnits(dateOfBirth, eventDate, unit) {
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  const event = new Date(`${eventDate}T00:00:00Z`);
  if (unit === "days") return Math.floor((event - birth) / 86400000);
  let value = (event.getUTCFullYear() - birth.getUTCFullYear()) * 12 + event.getUTCMonth() - birth.getUTCMonth();
  if (event.getUTCDate() < birth.getUTCDate()) value -= 1;
  return unit === "months" ? value : Math.floor(value / 12);
}

export function ageAtEvent(context, eventDate, unit) {
  const contextResult = validatePatientContext(context);
  const errors = collect(contextResult.ok ? [] : contextResult.errors, validateDate(eventDate, "eventDate"), AGE_UNITS.has(unit) ? [] : ["unit must be days, months, or years"]);
  if (errors.length) return validationError(errors);
  if (context.dateOfBirth) {
    if (eventDate < context.dateOfBirth) return validationError(["eventDate must not precede dateOfBirth"]);
    return valid(completedUnits(context.dateOfBirth, eventDate, unit));
  }
  if (context.exactAge.unit !== unit) return validationError(["exactAge unit does not match the requested unit; ambiguous age conversion is not allowed"]);
  return valid(context.exactAge.value);
}

export function evaluateAgeApplicability(context, eventDate, applicability) {
  if (!isPlainObject(applicability) || !AGE_UNITS.has(applicability.unit) || !["lt", "lte", "gt", "gte", "eq", "between"].includes(applicability.operator)) {
    return validationError(["age applicability is malformed"]);
  }
  const age = ageAtEvent(context, eventDate, applicability.unit);
  if (!age.ok) return age;
  const value = age.value;
  const met = applicability.operator === "lt" ? value < applicability.value
    : applicability.operator === "lte" ? value <= applicability.value
      : applicability.operator === "gt" ? value > applicability.value
        : applicability.operator === "gte" ? value >= applicability.value
          : applicability.operator === "eq" ? value === applicability.value
            : value >= applicability.minimum && value <= applicability.maximum;
  return valid(Object.freeze({ met, age: value, unit: applicability.unit }));
}
