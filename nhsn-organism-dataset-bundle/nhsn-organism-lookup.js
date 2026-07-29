/**
 * NHSN organism lookup helpers.
 *
 * Important: `recognized_pathogen_candidate` is not a final NHSN event
 * determination. Apply event-specific exclusions and criteria separately.
 */

export function normalizeOrganismName(value = "") {
  return value
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildNhsnOrganismIndex(dataset) {
  const byCode = new Map();
  const bySnomedCode = new Map();
  const byName = new Map();

  for (const organism of dataset.organisms ?? []) {
    if (organism.nhsnCode) {
      byCode.set(organism.nhsnCode.toUpperCase(), organism);
    }

    if (organism.snomedCode) {
      bySnomedCode.set(String(organism.snomedCode), organism);
    }

    for (const name of [
      organism.displayName,
      organism.snomedPreferredTerm,
      organism.normalizedDisplayName,
    ]) {
      if (name) {
        byName.set(normalizeOrganismName(name), organism);
      }
    }
  }

  return { byCode, bySnomedCode, byName };
}

export function findNhsnOrganism(query, index) {
  const raw = String(query ?? "").trim();

  if (!raw) {
    return {
      status: "unresolved",
      organism: null,
      reason: "No organism was entered.",
    };
  }

  const match =
    index.byCode.get(raw.toUpperCase()) ??
    index.bySnomedCode.get(raw) ??
    index.byName.get(normalizeOrganismName(raw));

  if (!match) {
    return {
      status: "unresolved",
      organism: null,
      reason:
        "Organism not found in the local NHSN dataset. Manual NHSN review is required.",
    };
  }

  return {
    status: "matched",
    organism: match,
    classification: match.pathogenClassification,
  };
}
