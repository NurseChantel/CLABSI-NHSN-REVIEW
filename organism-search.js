/** Search helpers for the NHSN/SNOMED organism data files. */

export function normalizeOrganismText(value = "") {
  return String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s*\(organism\)\s*$/u, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateLookup(data) {
  if (!data || !Array.isArray(data.organisms)) {
    throw new Error("Invalid synonym lookup: missing organisms array.");
  }

  return data.organisms.map((item) => ({
    snomedCode: String(item.snomed_code),
    preferredTerm: item.preferred_term,
    normalizedPreferredTerm: normalizeOrganismText(item.preferred_term),
    normalizedTerms: [...new Set([
      item.preferred_term,
      ...(item.synonyms || []),
      ...(item.normalized_synonyms || [])
    ].map(normalizeOrganismText).filter(Boolean))]
  }));
}

export async function loadSynonymLookup(url = "./synonym_lookup.json") {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load organism synonym lookup (${response.status}).`);
  }
  return validateLookup(await response.json());
}

/**
 * Exact synonym matches are returned first, followed by prefix and substring
 * matches. Results are distinct by SNOMED code, so an ambiguous synonym keeps
 * every possible organism available for an explicit user selection.
 */
export function searchOrganisms(query, organisms, { limit = 15 } = {}) {
  const normalizedQuery = normalizeOrganismText(query);
  if (!normalizedQuery) return [];

  const sorted = organisms
    .map((organism) => {
      const terms = organism.normalizedTerms || [];
      let rank = 0;
      if (terms.includes(normalizedQuery)) rank = 3;
      else if (terms.some((term) => term.startsWith(normalizedQuery))) rank = 2;
      else if (terms.some((term) => term.includes(normalizedQuery))) rank = 1;
      return { organism, rank };
    })
    .filter(({ rank }) => rank > 0)
    .sort((a, b) =>
      b.rank - a.rank ||
      a.organism.preferredTerm.localeCompare(b.organism.preferredTerm) ||
      a.organism.snomedCode.localeCompare(b.organism.snomedCode)
    );
  const exactCount = sorted.filter(({ rank }) => rank === 3).length;
  return sorted.slice(0, Math.max(limit, exactCount));
}

/** Lazily fetch the optional detail dataset; search does not depend on it. */
export async function loadOrganismDetails(url = "./organisms.json") {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load organism details (${response.status}).`);
  }
  const data = await response.json();
  if (!data || !Array.isArray(data.organisms)) {
    throw new Error("Invalid organism detail database: missing organisms array.");
  }
  return data.organisms;
}
