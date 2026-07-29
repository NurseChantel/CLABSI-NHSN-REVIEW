/** Search and loading helpers for the authoritative NHSN organism dataset. */

export function normalizeOrganismText(value = "") {
  return String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function prepareNhsnOrganisms(data) {
  if (!data || !Array.isArray(data.organisms)) {
    throw new Error("Invalid NHSN organism database: missing organisms array.");
  }

  return data.organisms.map((source) => {
    const organism = {
      ...source,
      displayName: source.displayName,
      nhsnCode: String(source.nhsnCode || ""),
      snomedCode: String(source.snomedCode || ""),
      isCommonCommensal: source.isCommonCommensal === true,
      isMbiOrganism: source.isMbiOrganism === true,
      isUtiBacterium: source.isUtiBacterium === true,
      pathogenClassification: source.pathogenClassification,
      organismType: source.isCommonCommensal === true
        ? "Common Commensal"
        : "Recognized Pathogen"
    };
    organism.searchTerms = [...new Set([
      organism.displayName,
      organism.snomedPreferredTerm,
      organism.nhsnCode,
      organism.normalizedDisplayName
    ].map(normalizeOrganismText).filter(Boolean))];
    return organism;
  });
}

export async function loadNhsnOrganisms(url = "./nhsn-organisms.json") {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load NHSN organism database (${response.status}).`);
  }
  return prepareNhsnOrganisms(await response.json());
}

/** Exact matches sort before prefix matches and then substring matches. */
export function searchOrganisms(query, organisms, { limit = 15 } = {}) {
  const normalizedQuery = normalizeOrganismText(query);
  if (!normalizedQuery) return [];

  const sorted = organisms.map((organism) => {
    const terms = organism.searchTerms || [];
    let rank = 0;
    if (terms.includes(normalizedQuery)) rank = 3;
    else if (terms.some((term) => term.startsWith(normalizedQuery))) rank = 2;
    else if (terms.some((term) => term.includes(normalizedQuery))) rank = 1;
    return { organism, rank };
  }).filter(({ rank }) => rank > 0).sort((a, b) =>
    b.rank - a.rank ||
    a.organism.displayName.localeCompare(b.organism.displayName) ||
    a.organism.nhsnCode.localeCompare(b.organism.nhsnCode)
  );
  const exactCount = sorted.filter(({ rank }) => rank === 3).length;
  return sorted.slice(0, Math.max(limit, exactCount));
}
