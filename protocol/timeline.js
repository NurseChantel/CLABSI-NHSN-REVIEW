import { collect, isPlainObject, valid, validateDate, validateSource, validationError } from "./validation.js";

const DAY_MS = 86400000;
const toDay = value => Date.parse(`${value}T00:00:00Z`) / DAY_MS;
const fromDay = value => new Date(value * DAY_MS).toISOString().slice(0, 10);

export function addCalendarDays(date, days) {
  const errors = collect(validateDate(date, "date"), Number.isInteger(days) ? [] : ["days must be an integer"]);
  return errors.length ? validationError(errors) : valid(fromDay(toDay(date) + days));
}

export function calendarDayDistance(start, end) {
  const errors = collect(validateDate(start, "start"), validateDate(end, "end"));
  return errors.length ? validationError(errors) : valid(toDay(end) - toDay(start));
}

export function createCalendarWindow(anchorDate, daysBefore, daysAfter, source) {
  const errors = collect(
    validateDate(anchorDate, "anchorDate"),
    Number.isInteger(daysBefore) && daysBefore >= 0 ? [] : ["daysBefore must be a non-negative integer"],
    Number.isInteger(daysAfter) && daysAfter >= 0 ? [] : ["daysAfter must be a non-negative integer"],
    validateSource(source, "source")
  );
  if (errors.length) return validationError(errors);
  return valid(Object.freeze({ anchorDate, start: fromDay(toDay(anchorDate) - daysBefore), end: fromDay(toDay(anchorDate) + daysAfter), source }));
}

export function dateInWindow(date, window) {
  const errors = collect(validateDate(date, "date"), validateCalendarWindow(window));
  return errors.length ? validationError(errors) : valid(toDay(date) >= toDay(window.start) && toDay(date) <= toDay(window.end));
}

export function validateCalendarWindow(window, path = "window") {
  if (!isPlainObject(window)) return [`${path} must be an object`];
  const errors = collect(validateDate(window.start, `${path}.start`), validateDate(window.end, `${path}.end`));
  if (window.source !== undefined) errors.push(...validateSource(window.source, `${path}.source`));
  if (!errors.length && toDay(window.start) > toDay(window.end)) errors.push(`${path}.start must not be after ${path}.end`);
  return errors;
}

export function createInfectionWindow(anchorDate, source) {
  return createCalendarWindow(anchorDate, 3, 3, source);
}

export function selectDateOfEvent(candidates, infectionWindow) {
  const errors = validateCalendarWindow(infectionWindow, "infectionWindow");
  if (!Array.isArray(candidates) || !candidates.length) errors.push("candidates must be a non-empty array");
  else candidates.forEach((candidate, index) => {
    if (!isPlainObject(candidate)) errors.push(`candidates[${index}] must be an object`);
    else errors.push(...validateDate(candidate.date, `candidates[${index}].date`));
  });
  if (errors.length) return validationError(errors);
  const eligible = candidates.filter(candidate => toDay(candidate.date) >= toDay(infectionWindow.start) && toDay(candidate.date) <= toDay(infectionWindow.end));
  if (!eligible.length) return validationError(["no Date of Event candidate falls within the Infection Window Period"]);
  eligible.sort((a, b) => toDay(a.date) - toDay(b.date));
  return valid(Object.freeze({ ...eligible[0] }));
}

export function createRepeatInfectionTimeframe(dateOfEvent, source) {
  return createCalendarWindow(dateOfEvent, 0, 13, source);
}

export function validateTimeline(timeline) {
  if (!isPlainObject(timeline)) return validationError(["timeline must be an object"]);
  const errors = validateDate(timeline.admissionDate, "timeline.admissionDate");
  for (const [key, value] of Object.entries(timeline)) {
    if (key.endsWith("Dates")) {
      if (!Array.isArray(value)) errors.push(`timeline.${key} must be an array`);
      else value.forEach((date, index) => errors.push(...validateDate(date, `timeline.${key}[${index}]`)));
    }
  }
  if (timeline.dateOfEventCandidate !== undefined) errors.push(...validateDate(timeline.dateOfEventCandidate, "timeline.dateOfEventCandidate"));
  for (const name of ["infectionWindow", "repeatInfectionTimeframe", "secondaryBsiAttributionPeriod"]) {
    if (timeline[name] !== undefined) errors.push(...validateCalendarWindow(timeline[name], `timeline.${name}`));
  }
  return errors.length ? validationError(errors) : valid(Object.freeze({ ...timeline }));
}
