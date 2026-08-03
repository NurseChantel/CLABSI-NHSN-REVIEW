export const validationError = (errors) => Object.freeze({
  ok: false,
  status: "validationError",
  errors: Object.freeze(errors.map(error => Object.freeze(error)))
});

export const valid = (value) => Object.freeze({ ok: true, value });

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateSource(source, path = "source") {
  const errors = [];
  if (!isPlainObject(source)) return [`${path} must be an object`];
  for (const key of ["document", "section", "printedPage", "sourceId"]) {
    if (typeof source[key] !== "string" || !source[key].trim()) errors.push(`${path}.${key} must be a non-empty string`);
  }
  return errors;
}

export function validateDate(value, path) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return [`${path} must be an ISO calendar date (YYYY-MM-DD)`];
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
    ? []
    : [`${path} must be a valid calendar date`];
}

export function collect(...groups) {
  return groups.flat().filter(Boolean);
}
