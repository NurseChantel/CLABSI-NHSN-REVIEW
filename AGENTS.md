# NHSN surveillance application instructions

## Authoritative sources

For all NHSN surveillance definitions, criteria, timing rules, organism rules,
and secondary BSI attribution logic, use ONLY the NHSN manuals and source files
stored in this repository.

Authoritative files currently include:

- Secondary BSI Chapter.pdf
- clabsi nhsn.pdf
- any other explicitly identified NHSN protocol PDF in this repository
- clabsi nhsn.pdf — complete NHSN Patient Safety Component Manual, if confirmed by its contents
- 
Do not use:
- general medical knowledge
- remembered NHSN rules
- web searches
- third-party summaries
- assumptions based on clinical plausibility
- existing application logic as proof that a rule is correct

If the manuals do not clearly support a rule, do not invent one. Mark it as
unresolved and explain what source information is missing.

## Citation requirement

Every implemented surveillance criterion must be traceable to:

- source document filename
- criterion or site name
- page number
- relevant table, numbered criterion, or section heading

Store this citation metadata with the rule whenever practical.

## Editing rules

- Preserve the current visual format unless explicitly asked to change it.
- Do not refactor unrelated application features.
- Do not alter LCBI, central-line, MBI-LCBI, or organism logic while working on
  secondary BSI unless necessary for a documented interface.
- Do not treat an organism-associated suggested site as proof of a secondary BSI.
- Suggestions are chart-review starting points only.
- A secondary BSI determination requires the complete applicable NHSN
  site-specific definition plus the required culture-to-site relationship and
  attribution-period timing.

## Required workflow

Before modifying code:

1. Read the applicable NHSN manual pages.
2. Inspect the current implementation.
3. Produce a discrepancy report.
4. Identify unsupported, missing, simplified, or incorrectly combined criteria.
5. Do not implement changes until the requested audit stage is complete.

For implementation:

1. Implement one NHSN infection site or criterion group at a time.
2. Represent AND, OR, alternative, age-specific, timing, imaging, laboratory,
   physician-diagnosis, and organism-relationship conditions explicitly.
3. Add tests derived directly from the manual.
4. Include positive, negative, incomplete, and boundary cases.
5. Report the exact source pages used.
