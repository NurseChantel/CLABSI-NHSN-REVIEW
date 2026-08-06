// Which NHSN infection sites an identified organism can be reviewed against.
//
// Source: Secondary BSI Chapter.pdf (Chapter 17) unless stated otherwise; PNEU rules come
// from NHSN pneumonia.pdf (Chapter 6).
//
// The governing principle, from the structure of Chapter 17 itself: a site definition is
// driven by the SPECIMEN SOURCE, not by the identity of the organism. "Organism(s)
// identified from bone" meets BONE; the same organism from CSF meets MEN. So an organism
// is eligible for review against every site by default, and the manual's organism rules
// act only as restrictions on top of that. Those restrictions are enumerable and each one
// is cited below.
//
// This module answers "which sites may I review for this organism", never "which site is
// met". Per AGENTS.md a suggested site is a chart-review starting point only.

import { secondarySiteDefinitions } from "./registry.js";

const chapter17 = (printedPage, sectionHeading) => Object.freeze({ document: "Secondary BSI Chapter.pdf", chapter: "Chapter 17 — Surveillance Definitions for Specific Types of Infections", printedPage, sectionHeading });
const chapter6 = (printedPage, sectionHeading) => Object.freeze({ document: "NHSN pneumonia.pdf", chapter: "Chapter 6 — Device-associated Module (PNEU)", printedPage, sectionHeading });

export const ELIGIBILITY_SOURCES = Object.freeze({
  excludedOrganisms: chapter17("17-1", "NOTES 6 — organisms that primarily cause community-associated infections"),
  commonCommensalBlood: chapter17("17-1", "Introduction — a single common commensal blood specimen cannot be used"),
  matchingOrganism: chapter17("17-1–17-3", "NOTES 8 — matching organisms"),
  mbi: chapter17("17-20–17-22", "GIT 1b and 2c; IAB 2b and 3b — blood must contain at least one MBI organism"),
  cdi: chapter17("17-18", "CDI — Clostridioides difficile Infection"),
  ge: chapter17("17-19", "GE — Comment on enteric pathogens"),
  skin: chapter17("17-26", "SKIN criterion 2a — common commensal restriction"),
  circ: chapter17("17-25", "CIRC criteria 2 and 3 — pathogen versus common commensal"),
  endo: chapter17("17-30–17-33", "ENDO 4, 5, 6 and 7 — microbiology pathways"),
  usi: chapter17("17-28", "USI — excludes UTI (see Chapter 7)"),
  pneuBlood: chapter6("6-14", "Footnote 8 — organism identified from blood"),
  pneuDefinitive: chapter6("6-8", "Table 3 — viral, Legionella and other bacterial pneumonias")
});

const normalize = (value = "") => String(value).normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const hasWord = (name, term) => new RegExp(`(^| )${term}( |$)`).test(name);
const startsWithGenus = (name, genus) => name === genus || name.startsWith(`${genus} `);
const anyGenus = (name, genera) => genera.some(genus => startsWithGenus(name, genus));

// Chapter 17, 17-1, NOTES 6. These organisms "are excluded and cannot be used to meet any
// NHSN definition", so they are ineligible everywhere including PNEU.
const EXCLUDED_FUNGI = ["blastomyces", "histoplasma", "coccidioides", "paracoccidioides", "cryptococcus", "pneumocystis"];
const EXCLUDED_VECTOR_BORNE = ["anaplasma", "ehrlichia", "borrelia", "rickettsia"];

// Chapter 17, 17-19, GE Comment. The manual introduces this list with "include", so it is
// explicitly non-exhaustive — an unlisted organism is unresolved, not ineligible.
const ENTERIC_GENERA = ["salmonella", "shigella", "yersinia", "campylobacter", "listeria", "vibrio", "giardia"];
const ENTERIC_ECOLI = /^(entero(haemorrhagic|hemorrhagic|toxigenic|pathogenic|invasive|aggregative)|diffusely adherent|shiga toxin producing) escherichia coli/;

// Chapter 17, 17-30 and 17-31, ENDO 4a/5a.
const ENDO_TYPICAL_SPECIES = ["staphylococcus aureus", "staphylococcus lugdunensis", "enterococcus faecalis"];
const ENDO_TYPICAL_GENERA = ["streptococcus", "granulicatella", "abiotrophia", "gemella", "haemophilus", "aggregatibacter", "cardiobacterium", "eikenella", "kingella"];
const ENDO_TYPICAL_STREPTOCOCCUS_EXCLUSIONS = ["streptococcus pneumoniae", "streptococcus pyogenes"];
// Chapter 17, 17-30 and 17-31, ENDO 4b/5b — only in the presence of prosthetic material.
const ENDO_PROSTHETIC_SPECIES = ["corynebacterium striatum", "corynebacterium jeikeium", "serratia marcescens", "pseudomonas aeruginosa", "cutibacterium acnes"];

const isExcludedOrganism = (name) => anyGenus(name, EXCLUDED_FUNGI) || anyGenus(name, EXCLUDED_VECTOR_BORNE);
const isCDifficile = (name) => /^clostridioides difficile|^clostridium difficile/.test(name);
const isEnteric = (name) => anyGenus(name, ENTERIC_GENERA) || ENTERIC_ECOLI.test(name);
const isCandidaOrYeast = (name) => startsWithGenus(name, "candida") || hasWord(name, "yeast");
const isEnterococcus = (name) => startsWithGenus(name, "enterococcus");
const isCoagulaseNegativeStaph = (name, organism) => /staphylococcus,? coagulase negative/.test(name) || (startsWithGenus(name, "staphylococcus") && organism.isCommonCommensal === true);
const isNonTuberculousMycobacterium = (name) => startsWithGenus(name, "mycobacterium") && !/tuberculosis|africanum|bovis|microti|canetti/.test(name);
const isPneuDefinitiveTarget = (name) => anyGenus(name, ["bordetella", "legionella", "chlamydia", "chlamydophila", "mycoplasma"]);

// Dataset display names carry trailing qualifiers, for example
// "Streptococcus pyogenes (group A streptococci)", so species are matched on a name that
// equals the species or continues past it rather than by exact equality.
const isSpecies = (name, species) => name === species || name.startsWith(`${species} `);

function endoPathway(name, organism) {
  if (ENDO_TYPICAL_SPECIES.some(species => isSpecies(name, species))) return { pathway: "typical", collections: 2 };
  if (startsWithGenus(name, "streptococcus")) {
    return ENDO_TYPICAL_STREPTOCOCCUS_EXCLUSIONS.some(species => isSpecies(name, species)) ? { pathway: "nonTypical", collections: 3 } : { pathway: "typical", collections: 2 };
  }
  if (anyGenus(name, ENDO_TYPICAL_GENERA)) return { pathway: "typical", collections: 2 };
  if (ENDO_PROSTHETIC_SPECIES.some(species => isSpecies(name, species)) || isCandidaOrYeast(name) || isNonTuberculousMycobacterium(name) || isCoagulaseNegativeStaph(name, organism)) {
    return { pathway: "prostheticTypical", collections: 2 };
  }
  return { pathway: "nonTypical", collections: 3 };
}

const reason = (text, source) => Object.freeze({ text, source });

/**
 * @param organism an NHSN dataset record: { displayName, isCommonCommensal, isMbiOrganism, isUtiBacterium }
 * @returns { status, siteCodes, byCode: { [siteCode]: { status, reasons } }, organismNotes }
 *   status per site is "eligible" | "conditional" | "notEligible".
 */
export function evaluateOrganismEligibility(organism, { siteCodes = Object.keys(secondarySiteDefinitions), includePneu = true } = {}) {
  const name = normalize(organism?.normalizedDisplayName || organism?.displayName || "");
  const commonCommensal = organism?.isCommonCommensal === true;
  const mbi = organism?.isMbiOrganism === true;
  const codes = includePneu ? [...siteCodes, "PNEU"] : [...siteCodes];

  const byCode = {};
  const organismNotes = [];

  if (!name) {
    for (const code of codes) byCode[code] = { status: "unresolved", reasons: [reason("No organism selected.", ELIGIBILITY_SOURCES.matchingOrganism)] };
    return { byCode, organismNotes, siteCodes: codes };
  }

  // R1 — excluded everywhere.
  if (isExcludedOrganism(name)) {
    const note = reason("This organism primarily causes community-associated infection and is excluded from every NHSN definition.", ELIGIBILITY_SOURCES.excludedOrganisms);
    for (const code of codes) byCode[code] = { status: "notEligible", reasons: [note] };
    return { byCode, organismNotes: [note], siteCodes: codes };
  }

  // R8 — a single common commensal blood specimen is not usable anywhere.
  if (commonCommensal) {
    organismNotes.push(reason("Common commensal. A single common commensal blood specimen does not meet an LCBI criterion, so it cannot be used to meet a site-specific criterion nor be counted as a secondary BSI. Two matching blood collections are required, or the site criterion must be met by a site specimen.", ELIGIBILITY_SOURCES.commonCommensalBlood));
  }
  if (organism?.isUtiBacterium === true) {
    organismNotes.push(reason("On the NHSN UTI bacterium list. A urinary source may be a Chapter 7 UTI rather than a Chapter 17 USI.", ELIGIBILITY_SOURCES.usi));
  }

  // The common commensal blood rule applies to the organism as a whole, so it is carried
  // once in organismNotes rather than repeated against all 35 sites, which would bury the
  // site-specific conditions below it. A site becomes "conditional" only when a rule
  // changes something about that site.
  for (const code of codes) byCode[code] = { status: "eligible", reasons: [] };

  const restrict = (code, status, text, source) => {
    if (!byCode[code]) return;
    const rank = { eligible: 0, conditional: 1, notEligible: 2, unresolved: 1 };
    byCode[code] = { status: rank[status] >= rank[byCode[code].status] ? status : byCode[code].status, reasons: [...byCode[code].reasons, reason(text, source)] };
  };

  // R2 — CDI. Criterion 1 accepts only a positive test for toxin-producing C. difficile and
  // criterion 2 (pseudomembranous colitis) identifies no organism, so no other organism can
  // supply the matching-organism relationship a secondary BSI to CDI requires.
  if (isCDifficile(name)) restrict("CDI", "eligible", "Toxin-producing C. difficile on an unformed stool specimen meets CDI criterion 1.", ELIGIBILITY_SOURCES.cdi);
  else restrict("CDI", "notEligible", "CDI criterion 1 accepts only a positive test for toxin-producing C. difficile, and criterion 2 identifies no organism, so this organism cannot meet a CDI criterion element.", ELIGIBILITY_SOURCES.cdi);

  // R3 — GE. The manual's enteric pathogen list is introduced with "include" and is not
  // exhaustive, so an unlisted organism is unresolved rather than ineligible.
  if (isEnteric(name)) restrict("GE", "eligible", "Listed by the manual as an enteric pathogen for GE criterion 2.", ELIGIBILITY_SOURCES.ge);
  else restrict("GE", "conditional", "GE criterion 2 requires an enteric pathogen. The manual's list is introduced with \"include\" and is not exhaustive; confirm this organism is not normal intestinal flora before using it. GE criterion 1 requires no organism.", ELIGIBILITY_SOURCES.ge);

  // R4 — MBI-conditioned sub-criteria.
  for (const [code, criteria] of [["GIT", "GIT 1b and 2c"], ["IAB", "IAB 2b and 3b"]]) {
    restrict(code, "conditional", mbi
      ? `On the NHSN MBI organism list, so it can satisfy the blood-organism requirement in ${criteria}.`
      : `Not on the NHSN MBI organism list, so it cannot satisfy the blood-organism requirement in ${criteria}. The other ${code} criteria remain available.`, ELIGIBILITY_SOURCES.mbi);
  }

  // R5 — SKIN 2a.
  if (commonCommensal) restrict("SKIN", "conditional", "SKIN criterion 2a excludes identification of two or more common commensal organisms without a recognized pathogen.", ELIGIBILITY_SOURCES.skin);

  // R6 — CIRC routes pathogens and common commensals to different criteria.
  restrict("CIRC", "conditional", commonCommensal
    ? "A common commensal from the circumcision site meets CIRC criterion 3 only, which additionally requires antimicrobial therapy initiated within two days."
    : "A pathogen from the circumcision site meets CIRC criterion 2.", ELIGIBILITY_SOURCES.circ);

  // R7 — ENDO microbiology pathways.
  const endo = endoPathway(name, organism);
  restrict("ENDO", "conditional", {
    typical: "Typical infective endocarditis organism: ENDO 4a and 5a require 2 or more matching blood collections drawn on separate occasions no more than 1 calendar day apart.",
    prostheticTypical: "Typical only in the presence of prosthetic material: ENDO 4b and 5b require prosthetic material plus 2 or more matching blood collections no more than 1 calendar day apart.",
    nonTypical: "Not a typical infective endocarditis organism: ENDO 4c and 5c require 3 or more matching blood collections no more than 1 calendar day apart."
  }[endo.pathway], ELIGIBILITY_SOURCES.endo);
  restrict("ENDO", "conditional", commonCommensal
    ? "For the ENDO 6 and 7 minor blood element, the same common commensal must be identified from 2 or more blood collections drawn on separate occasions on the same or consecutive days."
    : "For the ENDO 6 and 7 minor blood element, a recognized pathogen identified from blood is sufficient.", ELIGIBILITY_SOURCES.endo);

  // R9 — PNEU.
  if (byCode.PNEU) {
    if (isCoagulaseNegativeStaph(name, organism) || isEnterococcus(name) || isCandidaOrYeast(name)) {
      restrict("PNEU", "conditional", "Coagulase-negative Staphylococcus, Enterococcus species, and Candida species or yeast not otherwise specified identified from blood cannot be deemed secondary to a PNEU event unless the organism was also identified from lung tissue or eligible pleural fluid. The PNU3 matching-Candida exception may still apply.", ELIGIBILITY_SOURCES.pneuBlood);
    }
    if (isPneuDefinitiveTarget(name)) {
      restrict("PNEU", "conditional", "Eligible for the PNU2 Table 3 definitive laboratory pathway (virus, Bordetella, Legionella, Chlamydia, or Mycoplasma identified from respiratory secretions or tissue).", ELIGIBILITY_SOURCES.pneuDefinitive);
    }
  }

  return { byCode, organismNotes, siteCodes: codes };
}

/** Rolls per-site verdicts up to the Chapter 17 major categories used by the site picker. */
export function summariseByCategory(evaluation, categories) {
  const worst = { eligible: 0, conditional: 1, notEligible: 2 };
  const summary = {};
  for (const category of categories) {
    const verdicts = category.siteCodes.map(code => evaluation.byCode[code]).filter(Boolean);
    if (!verdicts.length) continue;
    const anyEligible = verdicts.some(item => item.status !== "notEligible");
    const allNotEligible = verdicts.every(item => item.status === "notEligible");
    const anyConditional = verdicts.some(item => item.status === "conditional");
    summary[category.majorCategoryCode] = {
      status: allNotEligible ? "notEligible" : anyConditional ? "conditional" : "eligible",
      eligibleCount: verdicts.filter(item => item.status !== "notEligible").length,
      totalCount: verdicts.length,
      anyEligible,
      worstRank: Math.max(...verdicts.map(item => worst[item.status] ?? 1))
    };
  }
  return summary;
}
