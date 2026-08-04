# BJ criterion heading presentation discrepancy

## Source review and scope

This presentation audit uses `Secondary BSI Chapter.pdf`, Chapter 17: BONE,
printed pages 17-7–17-8 (PDF pages 8–9); DISC, printed page 17-8 (PDF page 9);
and JNT, printed page 17-9 (PDF page 10). The manual presents BONE criteria 3a
and 3b, DISC criteria 3a and 3b, and JNT criterion 3d once each, with definitive
imaging and clinically correlated equivocal imaging as alternatives within
those criteria.

## Discrepancy report

The application evaluator intentionally represents each imaging alternative as
a separate branch so that its AND/OR requirements remain explicit. The UI was
rendering those internal branches as separate top-level accordions, resulting
in duplicate numbered headings: BONE 3a/3b, DISC 3a/3b, and JNT 3d. These were
presentation duplicates, not duplicated or unsupported surveillance rules.

The BJ accordion event handler also closed every sibling whenever a criterion
was opened. Selecting evidence then reconstructed the review with only the
active criterion open. Both behaviors caused sections the reviewer had opened
to collapse without an explicit request.

## Authorized correction

Keep the evaluator branches and all source metadata unchanged. Present each
affected BONE, DISC, and JNT criterion number once, nest its definitive and
equivocal imaging branches as alternatives, allow multiple BJ criteria to
remain open, and preserve the set of open criteria when an evidence selection
re-renders the review.
