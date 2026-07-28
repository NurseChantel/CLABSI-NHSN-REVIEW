const NOISE_WORDS = [
  "abnormal", "positive", "detected", "isolated", "critical",
  "final", "preliminary", "culture", "result", "report",
  "organism", "growth", "heavy", "moderate", "light", "rare"
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeOrganismText(value = "") {
  let text = String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  for (const word of NOISE_WORDS) {
    text = text.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, "g"), " ");
  }

  return text
    .replace(/&/g, " and ")
    .replace(/[()[\]{}!,;:|_\/\\-]/g, " ")
    .replace(/\bsp\.\b/g, " species ")
    .replace(/\bspp\.\b/g, " species ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value = "") {
  return [...new Set(normalizeOrganismText(value).split(" ").filter(Boolean))];
}

function getSearchableText(organism) {
  return normalizeOrganismText([
    organism.canonicalName,
    organism.displayName,
    ...(organism.aliases || []),
    ...(organism.searchTerms || []),
    organism.taxonomy?.currentGenus || "",
    ...(organism.taxonomy?.formerGenus || []),
    organism.taxonomy?.species || ""
  ].join(" "));
}

function scoreOrganism(query, organism) {
  const normalizedQuery = normalizeOrganismText(query);
  if (!normalizedQuery) return 0;

  const queryTokens = tokenize(query);
  const canonical = normalizeOrganismText(organism.canonicalName);
  const display = normalizeOrganismText(organism.displayName);
  const aliases = (organism.aliases || []).map(normalizeOrganismText);
  const searchable = getSearchableText(organism);

  let score = 0;

  if (canonical === normalizedQuery) score += 120;
  if (display === normalizedQuery) score += 115;
  if (aliases.includes(normalizedQuery)) score += 110;

  if (canonical.includes(normalizedQuery)) score += 75;
  if (display.includes(normalizedQuery)) score += 70;
  if (aliases.some(alias => alias.includes(normalizedQuery))) score += 65;

  const matchedTokens = queryTokens.filter(token => searchable.includes(token));
  score += matchedTokens.length * 12;

  if (queryTokens.length && matchedTokens.length === queryTokens.length) {
    score += 35;
  }

  return score;
}

export function searchOrganisms(query, organisms, options = {}) {
  const { limit = 10, minimumScore = 20 } = options;

  return organisms
    .map(organism => ({ organism, score: scoreOrganism(query, organism) }))
    .filter(result => result.score >= minimumScore)
    .sort((a, b) =>
      b.score - a.score ||
      a.organism.displayName.localeCompare(b.organism.displayName)
    )
    .slice(0, limit);
}

export async function loadOrganismDatabase(url = "./data/organisms.json") {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Unable to load organism database (${response.status}).`);
  }

  const database = await response.json();

  if (!Array.isArray(database.organisms)) {
    throw new Error("Invalid organism database: missing organisms array.");
  }

  return database;
}
