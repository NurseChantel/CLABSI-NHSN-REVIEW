# Organism browser selection scroll audit

## Scope

This audit covers only the viewport and focus behavior of the expanded organism
browser. It does not evaluate or change any NHSN surveillance criterion or any
organism classification data.

## Findings

- Checklist checkboxes are not inside anchors and have no IDs, so there are no
  fragment navigations, duplicate checkbox IDs, or label/input ID collisions.
- The browse toggle, definition control, search-result controls, and generated
  remove controls are all explicitly `type="button"`. Checklist selections are
  checkbox inputs, not implicit submit buttons.
- A checklist change does not rebuild the checklist and no selection handler
  changes `location.hash`. The focused checkbox therefore remains connected to
  the document.
- The only `scrollIntoView()` calls in the organism UI belong to opening the
  browser and keyboard navigation in search results. Neither is called by a
  checklist checkbox change.
- The checkbox change calls `syncOrganismSelection()`. That function changes
  the selected-organism content above the expanded checklist and then calls
  `updateAll()`, which rebuilds several dynamically sized sections elsewhere on
  the page. The handler does not preserve either the document scroll offset or
  the checklist's scroll offset around those synchronous layout changes.

## Root cause and discrepancy

The unintended movement is a layout/scroll-anchoring side effect of the broad
render triggered by `syncOrganismSelection()`, not form submission, fragment
navigation, duplicate IDs, explicit focus movement, or a selection-time
`scrollIntoView()` call. In particular, selected-organism details are rewritten
above the open browser while `updateAll()` rewrites unrelated, variable-height
sections. The browser is then free to adjust its scroll anchor during the large
layout change. The implementation has no guard that restores the page and
checklist offsets after the render.

The focused fix is to snapshot the page offset, checklist offset, and active
checklist control immediately before the selection render, and restore them
without scrolling after both the synchronous render and the following animation
frame. No surveillance or selected-organism state logic needs to change.
