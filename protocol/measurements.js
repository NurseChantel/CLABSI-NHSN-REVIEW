import { isPlainObject, valid, validateDate, validationError } from "./validation.js";

const COMPARATORS = new Set(["lt", "lte", "eq", "gte", "gt"]);

export function validateMeasurement(measurement, path = "measurement") {
  if (!isPlainObject(measurement)) return validationError([`${path} must be an object`]);
  const errors = [];
  if (typeof measurement.id !== "string" || !measurement.id) errors.push(`${path}.id must be a non-empty string`);
  if (typeof measurement.kind !== "string" || !measurement.kind) errors.push(`${path}.kind must be a non-empty string`);
  if (typeof measurement.value !== "number" || !Number.isFinite(measurement.value)) errors.push(`${path}.value must be a finite number`);
  if (typeof measurement.unit !== "string" || !measurement.unit) errors.push(`${path}.unit must be a non-empty string`);
  errors.push(...validateDate(measurement.date, `${path}.date`));
  return errors.length ? validationError(errors) : valid(Object.freeze({ ...measurement }));
}

export function compareMeasurement(measurement, threshold) {
  const checked = validateMeasurement(measurement);
  const errors = checked.ok ? [] : [...checked.errors];
  if (!isPlainObject(threshold) || !COMPARATORS.has(threshold.comparator) || typeof threshold.value !== "number" || typeof threshold.unit !== "string") errors.push("threshold is malformed");
  else if (checked.ok && measurement.unit !== threshold.unit) errors.push("measurement and threshold units must match; implicit unit conversion is not allowed");
  if (errors.length) return validationError(errors);
  const met = threshold.comparator === "lt" ? measurement.value < threshold.value
    : threshold.comparator === "lte" ? measurement.value <= threshold.value
      : threshold.comparator === "eq" ? measurement.value === threshold.value
        : threshold.comparator === "gte" ? measurement.value >= threshold.value
          : measurement.value > threshold.value;
  return valid(Object.freeze({ met, actual: measurement.value, threshold }));
}
