import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { evaluateOrganismEligibility, summariseByCategory } from "./secondary/organism-eligibility.js";
import { implementedSecondaryPathways, secondarySiteCategories } from "./secondary-rules.js";

const database = JSON.parse(readFileSync(new URL("./nhsn-organisms.json", import.meta.url), "utf8")).organisms;
const organism = (displayName) => {
  const found = database.find((item) => item.displayName === displayName);
  assert.ok(found, `${displayName} is missing from nhsn-organisms.json`);
  return found;
};
const verdict = (displayName, siteCode) => evaluateOrganismEligibility(organism(displayName)).byCode[siteCode];
const statuses = (displayName) => {
  const evaluation = evaluateOrganismEligibility(organism(displayName));
  return Object.fromEntries(Object.entries(evaluation.byCode).map(([code, item]) => [code, item.status]));
};

test("every implemented Chapter 17 site plus PNEU receives a verdict", () => {
  const evaluation = evaluateOrganismEligibility(organism("Staphylococcus aureus"));
  for (const code of implementedSecondaryPathways) assert.ok(evaluation.byCode[code], code);
  assert.ok(evaluation.byCode.PNEU);
});

// Chapter 17, 17-1, NOTES 6: these organisms "are excluded and cannot be used to meet any
// NHSN definition".
test("community-associated organisms are ineligible for every site", () => {
  for (const name of ["Blastomyces dermatitidis", "Histoplasma", "Coccidioides", "Cryptococcus", "Pneumocystis", "Anaplasma", "Ehrlichia", "Borrelia", "Rickettsia"]) {
    const result = statuses(name);
    assert.ok(Object.values(result).length > 0, name);
    assert.ok(Object.values(result).every((status) => status === "notEligible"), `${name} must be ineligible everywhere`);
  }
});

// A site definition is met by the specimen source, not the organism, so an unrestricted
// organism stays open for the great majority of sites.
test("an unrestricted recognized pathogen remains eligible for most sites", () => {
  const result = statuses("Staphylococcus aureus");
  const open = Object.values(result).filter((status) => status !== "notEligible");
  assert.ok(open.length >= 30, `expected most sites open, got ${open.length}`);
  for (const code of ["BONE", "MEN", "IAB", "USI", "SKIN", "EMET", "LUNG"]) {
    assert.notEqual(result[code], "notEligible", code);
  }
});

// Chapter 17, 17-18. Criterion 1 accepts only toxin-producing C. difficile; criterion 2
// identifies no organism.
test("CDI is eligible only for C. difficile", () => {
  assert.equal(verdict("Clostridioides difficile", "CDI").status, "eligible");
  for (const name of ["Staphylococcus aureus", "Escherichia coli", "Candida albicans"]) {
    assert.equal(verdict(name, "CDI").status, "notEligible", name);
  }
});

// Chapter 17, 17-19. The enteric pathogen list is introduced with "include", so an
// unlisted organism is unresolved rather than ineligible.
test("GE recognises the listed enteric pathogens and stays conditional otherwise", () => {
  for (const name of ["Salmonella", "Shigella", "Campylobacter", "Listeria", "Vibrio", "Giardia"]) {
    assert.equal(verdict(name, "GE").status, "eligible", name);
  }
  const other = verdict("Staphylococcus aureus", "GE");
  assert.equal(other.status, "conditional");
  assert.match(other.reasons.map((item) => item.text).join(" "), /not exhaustive/);
});

// Chapter 17, 17-20 – 17-22: GIT 1b/2c and IAB 2b/3b require an MBI organism in blood.
test("MBI status is reported against the GIT and IAB blood sub-criteria", () => {
  for (const code of ["GIT", "IAB"]) {
    const mbi = verdict("Escherichia coli", code);
    assert.equal(mbi.status, "conditional");
    assert.match(mbi.reasons.map((item) => item.text).join(" "), /On the NHSN MBI organism list/);

    const nonMbi = verdict("Pseudomonas aeruginosa", code);
    assert.equal(nonMbi.status, "conditional");
    assert.match(nonMbi.reasons.map((item) => item.text).join(" "), /Not on the NHSN MBI organism list/);
  }
  assert.equal(organism("Escherichia coli").isMbiOrganism, true);
  assert.equal(organism("Pseudomonas aeruginosa").isMbiOrganism, false);
});

// Chapter 17, 17-1 introduction: a single common commensal blood specimen cannot be used.
// This applies to the organism as a whole, so it is reported once as an organism note
// rather than repeated against every site, where it would bury the site-specific rules.
test("the common commensal blood restriction is reported once, as an organism note", () => {
  const evaluation = evaluateOrganismEligibility(organism("Staphylococcus, coagulase negative"));
  assert.match(evaluation.organismNotes.map((item) => item.text).join(" "), /single common commensal blood specimen/);

  const repeated = Object.values(evaluation.byCode).filter((item) => item.reasons.some((entry) => /single common commensal blood specimen/.test(entry.text)));
  assert.equal(repeated.length, 0, "the organism-wide note must not be duplicated onto each site");

  // Only the sites the manual actually conditions on commensal status are conditional.
  const conditional = Object.entries(evaluation.byCode).filter(([, item]) => item.status === "conditional").map(([code]) => code).sort();
  assert.deepEqual(conditional, ["CIRC", "ENDO", "GE", "GIT", "IAB", "PNEU", "SKIN"]);
});

test("a recognized pathogen has no organism-wide blood restriction", () => {
  const evaluation = evaluateOrganismEligibility(organism("Staphylococcus aureus"));
  assert.doesNotMatch(evaluation.organismNotes.map((item) => item.text).join(" "), /single common commensal blood specimen/);
});

// Chapter 17, 17-26, SKIN criterion 2a.
test("SKIN reports the common commensal restriction on criterion 2a", () => {
  assert.match(verdict("Staphylococcus, coagulase negative", "SKIN").reasons.map((item) => item.text).join(" "), /two or more common commensal organisms without a recognized pathogen/);
});

// Chapter 17, 17-25, CIRC criteria 2 and 3.
test("CIRC routes pathogens and common commensals to different criteria", () => {
  assert.match(verdict("Staphylococcus aureus", "CIRC").reasons.map((item) => item.text).join(" "), /criterion 2/);
  assert.match(verdict("Staphylococcus, coagulase negative", "CIRC").reasons.map((item) => item.text).join(" "), /criterion 3 only/);
});

// Chapter 17, 17-30 – 17-31, ENDO 4a/4b/4c and 5a/5b/5c.
test("ENDO reports the correct microbiology pathway and collection count", () => {
  const text = (name) => verdict(name, "ENDO").reasons.map((item) => item.text).join(" ");
  for (const name of ["Staphylococcus aureus", "Staphylococcus lugdunensis", "Enterococcus faecalis", "Abiotrophia", "Gemella", "Eikenella corrodens", "Kingella kingae"]) {
    assert.match(text(name), /Typical infective endocarditis organism: ENDO 4a and 5a require 2 or more/, name);
  }
  // Streptococci are typical except S. pneumoniae and S. pyogenes.
  assert.match(text("Streptococcus mitis"), /Typical infective endocarditis organism/);
  assert.match(text("Streptococcus pneumoniae"), /Not a typical infective endocarditis organism.*3 or more/s);
  assert.match(text("Streptococcus pyogenes (group A streptococci)"), /Not a typical infective endocarditis organism.*3 or more/s);
  // Typical only with prosthetic material.
  for (const name of ["Serratia marcescens", "Pseudomonas aeruginosa", "Cutibacterium acnes", "Candida albicans"]) {
    assert.match(text(name), /Typical only in the presence of prosthetic material/, name);
  }
  assert.match(text("Escherichia coli"), /Not a typical infective endocarditis organism/);
});

// NHSN pneumonia.pdf, footnote 8, printed page 6-14.
test("PNEU reports the blood restriction for commensal, Enterococcus and Candida organisms", () => {
  for (const name of ["Staphylococcus, coagulase negative", "Enterococcus faecalis", "Candida albicans"]) {
    const pneu = verdict(name, "PNEU");
    assert.equal(pneu.status, "conditional", name);
    assert.match(pneu.reasons.map((item) => item.text).join(" "), /unless the organism was also identified from lung tissue or eligible pleural fluid/, name);
  }
  assert.equal(verdict("Staphylococcus aureus", "PNEU").status, "eligible");
});

// NHSN pneumonia.pdf, Table 3, printed page 6-8.
test("PNEU flags the Table 3 definitive laboratory targets", () => {
  for (const name of ["Legionella pneumophila", "Mycoplasma pneumoniae", "Bordetella pertussis"]) {
    assert.match(verdict(name, "PNEU").reasons.map((item) => item.text).join(" "), /PNU2 Table 3 definitive laboratory pathway/, name);
  }
});

test("category rollup marks a category ineligible only when every site in it is", () => {
  const excluded = summariseByCategory(evaluateOrganismEligibility(organism("Blastomyces dermatitidis")), secondarySiteCategories);
  for (const category of secondarySiteCategories) assert.equal(excluded[category.majorCategoryCode].status, "notEligible", category.majorCategoryCode);

  // GI holds CDI (ineligible for S. aureus) alongside GE, GIT, IAB and NEC, so the
  // category must not be reported as closed.
  const aureus = summariseByCategory(evaluateOrganismEligibility(organism("Staphylococcus aureus")), secondarySiteCategories);
  assert.equal(aureus.GI.status, "conditional");
  assert.ok(aureus.GI.eligibleCount < aureus.GI.totalCount);
  assert.equal(aureus.CNS.status, "eligible");
});

test("an absent organism yields unresolved verdicts rather than a guess", () => {
  const evaluation = evaluateOrganismEligibility(null);
  assert.ok(Object.values(evaluation.byCode).every((item) => item.status === "unresolved"));
});

test("every reason carries a manual citation", () => {
  for (const name of ["Staphylococcus aureus", "Staphylococcus, coagulase negative", "Escherichia coli", "Clostridioides difficile"]) {
    const evaluation = evaluateOrganismEligibility(organism(name));
    for (const [code, item] of Object.entries(evaluation.byCode)) {
      for (const entry of item.reasons) {
        assert.ok(entry.source?.document, `${name}/${code} reason has no source document`);
        assert.ok(entry.source?.printedPage, `${name}/${code} reason has no printed page`);
      }
    }
  }
});

test("the whole NHSN dataset evaluates without error", () => {
  let excluded = 0;
  for (const item of database) {
    const evaluation = evaluateOrganismEligibility(item);
    const values = Object.values(evaluation.byCode);
    assert.equal(values.length, implementedSecondaryPathways.length + 1, item.displayName);
    if (values.every((entry) => entry.status === "notEligible")) excluded += 1;
  }
  // Only the Chapter 17 note 6 organisms are excluded outright.
  assert.ok(excluded > 0 && excluded < 200, `unexpected excluded count ${excluded}`);
});
