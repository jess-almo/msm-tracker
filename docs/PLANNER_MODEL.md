# Planner Model Notes

Working notes for the next Island Manager / queue cleanup pass.

## Goals

- Keep sheet progress easy to read at a glance.
- Preserve the satisfying `tracked` coverage signal so a sheet can feel "spoken for" before every egg is zapped.
- Stop planner actions from feeling unreliable or double-writing too many systems at once.
- Keep island navigation order stable while still letting focus order drive what matters inside each island.

## Current Pain

- Island cards and `Jump to island` started reordering based on operational priority, even though that priority was only meant to affect the lists inside each island card.
- Planner `Breed` actions currently mutate both sheet progress and live sessions immediately, which makes the planner feel slippery when the board and the sheet disagree.
- Island Manager has testing/debug controls mixed into the main action lane, which makes real operational controls harder to trust.

## Direction

Use three separate truths instead of forcing one number to do every job:

1. Sheet progress
   - Permanent progress like `zapped`
   - Coverage / planning progress like `tracked`
   - Answers: "How covered is this sheet?"

2. Live island state
   - What is physically breeding or hatching on islands right now
   - Answers: "What is actually on the board?"

3. Operational priority
   - Focus order, with only the top five focused goals driving queue and planner urgency
   - Answers: "What should the player care about first?"

## Ordering Rules

- Keep island card order and `Jump to island` order stable by island order.
- Use focus order inside each island card:
  - `Need Now`
  - `Collection Missing`
  - zap target choices
  - ready / blocked queue ordering
- Only the top five focused goals should drive operational urgency.
- Lower-ranked focused goals can stay visible without driving the live operational surfaces.

## UI Meaning

- `Zapped` = permanent completed progress
- `Tracked` = fully spoken-for progress, including work already accounted for
- `Live on board` = what is actively breeding or in nursery right now

This keeps the strong "100% tracked" feeling without forcing every planner click to perfectly synchronize every layer.

## Next Refactor Questions

- Should `tracked` stay as a stored sheet field, or become a derived/reserved value?
- Should planner `Breed` create a reservation first and a live session second, instead of doing both at once?
- Which testing/reset controls should move out of the primary Island Manager action lane?
