import { isPlainObject, valid, validateSource, validationError } from "./validation.js";

const TYPES = new Set(["evidence", "predicate", "allOf", "anyOf", "atLeast", "conditional"]);

export function validateExpression(expression, path = "expression") {
  if (!isPlainObject(expression) || !TYPES.has(expression.type)) return validationError([`${path} has an unsupported expression type`]);
  const errors = validateSource(expression.source, `${path}.source`);
  if (typeof expression.id !== "string" || !expression.id) errors.push(`${path}.id must be a non-empty string`);
  if (typeof expression.failureMessage !== "string" || !expression.failureMessage) errors.push(`${path}.failureMessage must be a non-empty string`);
  if (["allOf", "anyOf", "atLeast"].includes(expression.type)) {
    if (!Array.isArray(expression.children) || !expression.children.length) errors.push(`${path}.children must be a non-empty array`);
    else expression.children.forEach((child, index) => { const result = validateExpression(child, `${path}.children[${index}]`); if (!result.ok) errors.push(...result.errors); });
  }
  if (expression.type === "atLeast" && (!Number.isInteger(expression.minimum) || expression.minimum < 1 || expression.minimum > (expression.children?.length ?? 0))) errors.push(`${path}.minimum is invalid`);
  if (expression.type === "evidence" && (typeof expression.evidenceId !== "string" || !expression.evidenceId)) errors.push(`${path}.evidenceId must be a non-empty string`);
  if (expression.type === "predicate" && typeof expression.evaluate !== "function") errors.push(`${path}.evaluate must be a function`);
  if (expression.type === "conditional") {
    for (const key of ["when", "then"]) {
      const result = validateExpression(expression[key], `${path}.${key}`);
      if (!result.ok) errors.push(...result.errors);
    }
    if (expression.otherwise !== undefined) { const result = validateExpression(expression.otherwise, `${path}.otherwise`); if (!result.ok) errors.push(...result.errors); }
  }
  return errors.length ? validationError(errors) : valid(expression);
}

const failure = expression => Object.freeze({ id: expression.id, message: expression.failureMessage, source: expression.source });

export function evaluateExpression(expression, context = {}) {
  const checked = validateExpression(expression);
  if (!checked.ok) return checked;
  try {
    if (expression.type === "evidence") {
      const met = context.evidence?.[expression.evidenceId] === "met";
      return valid(Object.freeze({ met, remaining: Object.freeze(met ? [] : [failure(expression)]), exclusions: Object.freeze([]) }));
    }
    if (expression.type === "predicate") {
      const outcome = expression.evaluate(context);
      if (!isPlainObject(outcome) || typeof outcome.met !== "boolean") return validationError([`${expression.id} predicate returned a malformed result`]);
      return valid(Object.freeze({ met: outcome.met, remaining: Object.freeze(outcome.met ? [] : [failure(expression)]), exclusions: Object.freeze(outcome.exclusions ?? []) }));
    }
    if (expression.type === "conditional") {
      const condition = evaluateExpression(expression.when, context);
      if (!condition.ok) return condition;
      const selected = condition.value.met ? expression.then : expression.otherwise;
      return selected ? evaluateExpression(selected, context) : valid(Object.freeze({ met: true, remaining: Object.freeze([]), exclusions: Object.freeze([]) }));
    }
    const results = expression.children.map(child => evaluateExpression(child, context));
    const invalid = results.find(result => !result.ok);
    if (invalid) return invalid;
    const values = results.map(result => result.value);
    const metCount = values.filter(value => value.met).length;
    const met = expression.type === "allOf" ? metCount === values.length : expression.type === "anyOf" ? metCount > 0 : metCount >= expression.minimum;
    const remaining = met ? [] : expression.type === "allOf"
      ? values.flatMap(value => value.remaining)
      : [failure(expression)];
    return valid(Object.freeze({ met, metCount, remaining: Object.freeze(remaining), exclusions: Object.freeze(values.flatMap(value => value.exclusions)) }));
  } catch (error) {
    return validationError([`${expression.id} evaluation failed: ${error instanceof Error ? error.message : "unknown error"}`]);
  }
}
