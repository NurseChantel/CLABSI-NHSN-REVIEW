# NHSN organism dataset

## Files

- `nhsn-organisms.json` — readable application dataset
- `nhsn-organisms.min.json` — smaller production copy
- `convert_nhsn_organisms.py` — rebuilds the JSON from the NHSN workbook
- `nhsn-organism-lookup.js` — exact-match lookup helpers

## Recommended repository layout

```text
data/nhsn/
  nhsn-organisms.json
  nhsn-organisms.min.json
  source/
    master-organism-com-commensals-lists.xlsx
scripts/
  convert_nhsn_organisms.py
src/lib/
  nhsn-organism-lookup.js
```

## Rebuild

```bash
python scripts/convert_nhsn_organisms.py \
  data/nhsn/source/master-organism-com-commensals-lists.xlsx \
  data/nhsn/nhsn-organisms.json
```

## Classification rule

- `isCommonCommensal: true` means the workbook category contains `CC`.
- A non-CC organism is stored as `recognized_pathogen_candidate`, not as a
  final recognized-pathogen determination.
- Apply NHSN event-specific organism exclusions and criteria separately.
- An unmatched organism must return `unresolved`; never assume it is a
  recognized pathogen merely because it is absent from the local dataset.
