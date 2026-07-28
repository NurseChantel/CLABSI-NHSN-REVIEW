# NHSN / CDC Synonyms of Pathogens — processed dataset

This folder contains GitHub-ready derivatives of `Synonyms-of-Pathogens.xlsx`.

## Files

- `organisms.json` — one record per unique SNOMED code + preferred term, with synonym arrays.
- `synonym_lookup.json` — normalized term → matching organism record(s), optimized for calculator lookup.
- `organism_synonyms.csv` — flat row-per-synonym export.
- `SOURCE.md` — provenance and update notes.

## Dataset summary

- Source sheet: `all terms 2024`
- Raw synonym rows: 6,674
- Unique organism records: 2,278
- Unique normalized lookup terms: 4,392

## JavaScript example

```js
import lookupData from "./data/synonym_lookup.json" with { type: "json" };

function normalizeOrganismName(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s*\(organism\)\s*$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const matches = lookupData.lookup[normalizeOrganismName("E. coli")] ?? [];
```

A lookup value is an array because a synonym can occasionally be ambiguous. Your calculator should ask the user to choose when multiple matches are returned.

## Suggested repository location

```text
data/nhsn-organisms/
  organisms.json
  synonym_lookup.json
  organism_synonyms.csv
  SOURCE.md
```

Commit the original Excel workbook separately only when you want exact source preservation. Keep the processed files generated from it reproducibly.
