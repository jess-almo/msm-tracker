# Inbox Research Reference

This file is generated from `data-entry/inbox.txt` by `data-entry/parseInboxResearch.mjs`.
The parser merges new extractions into structured reference output, archives processed raw page dumps, and trims them out of the live inbox.

## Latest Run

- Processed sections: Epic Monsters, Breeding, Breeding Combinations, Rare Monsters, Breeding Times
- New mechanics facts found: 51
- New combo candidates found: 134
- New time candidates found: 514
- Remaining inbox lines: 6

## Structured Candidate Summary

- Combo candidates stored: 134
- Time candidates stored: 514
- Combo candidates by rarity: Common 124 · Rare 10
- Combo candidates by category: Natural 25 · Fire 17 · Magical 39 · Ethereal 15 · Seasonal 15 · Mythical 13 · Rare 10
- Time candidates by rarity: Common 269 · Epic 101 · Rare 144

## Core Breeding Mechanics

- Standard breeding requires two different monster species, each at least level 4.
  - Source: line 381
  - Evidence: To breed, select two Monsters of different species that are at least level 4 in the Breeding Structure, in any order you'd like. A new Monster will result consisting of all Elements combined, unless an Element is repeated. If an Element is repeated, the resulting Monster will be one of its parents. For example, Drumpler (Earth Element & Cold Element) and Mammott (Cold Element) will not result in a new Monster because the Cold (Cold Element) Element is present in both Monsters. Correct combinations can also often lead to resulting in the parent Monsters, with the exception of Natural Double-Element Monsters.
- If the selected parents repeat an element, the result can collapse into one of the parents instead of producing a new combined outcome.
  - Source: line 381
  - Evidence: To breed, select two Monsters of different species that are at least level 4 in the Breeding Structure, in any order you'd like. A new Monster will result consisting of all Elements combined, unless an Element is repeated. If an Element is repeated, the resulting Monster will be one of its parents. For example, Drumpler (Earth Element & Cold Element) and Mammott (Cold Element) will not result in a new Monster because the Cold (Cold Element) Element is present in both Monsters. Correct combinations can also often lead to resulting in the parent Monsters, with the exception of Natural Double-Element Monsters.
- Special classes such as Ethereals, Legendaries, Mythicals, Seasonals, and Epics rely on specific monster pairs rather than pure element-union rules.
  - Source: line 383
  - Evidence: Some special Monsters like Ethereals, Legendary Monsters, Mythicals, Seasonals, and Epics aren't determined by a specific Element combination, and instead need two specific Monsters.
- Levels above 4 improve odds for rarer outcomes, but they do not guarantee success.
  - Source: line 388
  - Evidence: Monster levels then adjust these chances. Only levels above Level 4 matter, and higher levels increase the chance of rarer outcomes more than common ones. Each parent contributes to this bonus, and Monsters with more elements contribute slightly more. This means leveling both parents improves your odds, especially when aiming for harder-to-get Monsters, though it does not guarantee success.
- Wishing Torches shift probability from common outcomes toward rarer outcomes; they do not create new results.
  - Source: line 390
  - Evidence: Wishing Torches further modify the odds by shifting probability from common results to the rarest possible result for that breeding combination. The more torches that are lit, the larger this shift becomes. The torch effect can be strengthened by Island Skins, limited-time events, and certain bonuses. Importantly, torches do not add new outcomes or increase total luck, they simply move chance away from common Monsters and toward rare ones.
- Rare result checks happen after the base breeding result is chosen, so Rare availability is layered on top of the normal result pool.
  - Source: line 392
  - Evidence: After the game selects a breeding result, it may perform an additional check to see if that result becomes a Rare variant (when available). This check is influenced by torches, events, and special cases such as breeding a Common Monster with its Rare form. Breeding structures, time reductions, and previous attempts do not affect the outcome; each breeding attempt is calculated independently.
- Natural Double-Element monsters are guaranteed results and cannot fail into a parent.
  - Source: line 399
  - Evidence: Doubles have traditionally the highest chance to be bred out of everything that's breedable where they are at, and just require two Single-Element Monsters. Natural Doubles have a 100% success rate, and thus cannot result in one of the parents. However, the breeding of Double-Element Non-Natural Monster have a slightly lower chance to succeed and can result in one of the parent Monsters.
- Triple-Element breeding is not guaranteed and can fail into one of the parents.
  - Source: line 404
  - Evidence: Triples have a lower chance to be bred than Double-Elements, and require a Double-Element and single Element Monster. Breeding combinations for Triple-Element Monsters are not guaranteed, and thus can result in one of the parents instead.
- For Quad-Element targets, Triple + Single is generally a better choice than Double + Double.
  - Source: line 409
  - Evidence: Quads have a lower chance to be bred than Triple-Elements, and in the case of Fire and Magical Monsters, can take multiple attempts. Since Quad-Element Monsters have many Elements, many combinations exist. Breeding a Triple with a Single is much more successful than breeding two Doubles.
- Common + Rare of the same monster guarantees that monster's Common result.
  - Source: line 541
  - Evidence: Breeding is a core mechanic in My Singing Monsters. This article details the best breeding combination for every Monster, except Epic Monsters, which are on Epic Breeding Combinations. The best breeding combination is chosen for either the greatest chance of success, or the lowest wait time if you 'fail' and get one of the parent Monsters. The "best" combination also assumes that you don't already have the Monster. If you do already have the Monster, you can breed it with a Quad-Element Monster to get it more reliably. When a Common Monster is bred with its Rare counterpart, the result will be a 100% success rate. However, special-classed Monsters can only breed on their own Island; so, Shugabush can only breed on Shugabush Island, Ethereals on Ethereal Island, Mythicals on Mythical Island, Seasonals on Seasonal Shanty, and Paironormals on Major Paironormal Carnival.
- Special classes are island-bound for breeding, such as Shugabush on Shugabush Island, Ethereals on Ethereal Island, Mythicals on Mythical Island, and Seasonals on Seasonal Shanty.
  - Source: line 541
  - Evidence: Breeding is a core mechanic in My Singing Monsters. This article details the best breeding combination for every Monster, except Epic Monsters, which are on Epic Breeding Combinations. The best breeding combination is chosen for either the greatest chance of success, or the lowest wait time if you 'fail' and get one of the parent Monsters. The "best" combination also assumes that you don't already have the Monster. If you do already have the Monster, you can breed it with a Quad-Element Monster to get it more reliably. When a Common Monster is bred with its Rare counterpart, the result will be a 100% success rate. However, special-classed Monsters can only breed on their own Island; so, Shugabush can only breed on Shugabush Island, Ethereals on Ethereal Island, Mythicals on Mythical Island, Seasonals on Seasonal Shanty, and Paironormals on Major Paironormal Carnival.

## Rare Breeding Rules

- Most Rares use the same breeding combination as their Common counterpart, except Rare Single-Element monsters, which use specific Triple-Element pair rules.
  - Source: line 415
  - Evidence: Rare Monsters are special variants of existing Monsters that have a lower chance to obtain and only available for limited times. They have the same combination as their Common counterpart, with the exception of Rare Singles, which are bred with two different Triple-Element Monsters that share the same Element as the Single. For example, Bowgart (Plant Element + Water Element + Cold Element) and Pummel (Plant Element + Earth Element + Water Element) can result in either Rare Potbelly or Rare Toe Jammer since they share the Plant and Water Elements.
- Rares are limited-time variants that usually share song, animation, and breeding combination with their Common counterparts while taking longer to breed and hatch.
  - Source: line 1822
  - Evidence: Rare Monsters are an elusive class of Monsters that are unique variants of regular Monsters that are only available during limited-time promotions. Because they are hard to obtain, they are able to produce more Currency, and take longer to breed and hatch. They share many traits with their Common counterparts, including their song, animation, and breeding combination. However, Rare Wubbox has a unique song and animation, due to the extra difficulty to obtain it.
- Rarethereals on Ethereal Workshop are not bred in a normal structure; they are evolved through the Rarefied Attunement Structure.
  - Source: line 1871
  - Evidence: On Ethereal Workshop, Monsters cannot be bred. Instead, Rares are obtained by evolving a Common Monster into a Rare by tuning up all of its Elements using the Rarefied Attunement Structure. The Elements that are available to be tuned up changes each week.
- Breeding and incubation time are part of Rare identification, especially because Rare eggs historically matched Common egg designs.
  - Source: line 2294
  - Evidence: Their official reply was:, "Hi there! There is no error - the eggs of Rare Monsters are designed to be the same as their Common counterparts. It's sort of like how the Ugly Duckling's egg looked like the duck eggs... until it hatched. Players will have to pay special attention to breeding and incubation times so that they know when a Rare is on its way!" This was also before Rare Monsters had a shimmer around their eggs.
- Breeding Rare + Rare is possible, but the inbox material does not support treating it as a better Rare-chance strategy.
  - Source: line 2300
  - Evidence: Rares can be bred with one another, but no evidence suggests that this offers a higher chance of successfully breeding a Rare. This includes breeding failure. For example, a failed breeding attempt with a Rare Furcorn might produce a regular Furcorn, not a Rare Furcorn. Of course, a Rare Monster cannot be produced using any breeding method if the breeding attempt is made outside the time when that Rare Monster is not available.
- Rare + Common of the same species is valid once you already own the Rare, and it can be used to duplicate that monster during the Rare's availability window.
  - Source: line 2301
  - Evidence: Rares can be bred with their common counterparts. This can be useful in making multiple Rares of the same type. Obviously, to do this, one of those Rares must already be owned. For example, an Entbrat can be bred with a Rare Entbrat and produce another Entbrat. (It would be possible to breed a Rare Entbrat with this method as well, but only when the Rare Entbrat is being offered). With Rare Ethereal Monsters, this sort of breeding can only be done on Ethereal Island. For example, a Ghazt and a Rare Ghazt on Plant Island cannot breed to produce another Ghazt; they can, however, on Ethereal Island.
- On Shugabush Island, Common/Rare natural plus Shugabush pairings can branch into multiple outcomes, including Common, Rare, Shugabush, or Shugafam results.
  - Source: line 2305
  - Evidence: Rare Monsters from the Plant, Cold, Air, Water, Earth Islands, and Mirror Islands that also live on Shugabush Island can be bought from the Shugabush market during Daily or weekend Deals, bred on their home island and teleported to Shugabush Island, or bred on Shugabush Island by breeding their Common counterpart with the Shugabush. This breeding may result in a Common Natural Monster, a Rare Natural Monster, a Shugabush, or the Shugafam member that results from this breeding pair.

## Rare Timing Rules

- Rare Single-Element Naturals use a 6 hour breeding time pattern.
  - Source: line 1876
  - Evidence: Rare Single-Element Naturals have breeding times of 6 hours.
- Rare Drumpler and Rare Maw are exceptions to the usual Rare timing pattern and resolve to 1 hour 7 minutes 30 seconds.
  - Source: line 1877
  - Evidence: Rare Drumpler and Rare Maw's breeding time multiplier is 2.25.
- Rare Fwog is another Rare Double exception, resolving to 1 hour 15 minutes.
  - Source: line 1879
  - Evidence: Rare Fwog's breeding time multiplier is 2.5. Resulting in a breeding time of 1 hour and 15 minutes.
- Most Rare Naturals follow a common timing rule: Common breeding time times 1.25, plus 30 minutes.
  - Source: line 1880
  - Evidence: The breeding times for most Rare Naturals, as well as Single Element Rarethereals on the Natural Islands, are usually the Common’s breeding time multiplied by 1.25, and adding 30 minutes.
- Most Rare Natural Doubles take 10 hours and 30 minutes.
  - Source: line 1881
  - Evidence: Besides Rare Drumpler, Rare Fwog, and Rare Maw, Double-Element Naturals take 10 hours and 30 minutes.
- Most Rare Natural Triples take 15 hours and 30 minutes.
  - Source: line 1882
  - Evidence: All Rare Triple-Element Naturals besides Rare T-Rox take 15 hours and 30 minutes.
- Rare T-Rox is a Rare Triple exception and only takes 10 hours and 30 minutes.
  - Source: line 1883
  - Evidence: Rare T-Rox instead takes only 10 hours and 30 minutes due to its Common counterpart taking only 8 hours instead of the usual 12.
- Rare Natural Quads take 1 day, 6 hours, and 30 minutes.
  - Source: line 1884
  - Evidence: All Rare Quad-Element Naturals take 1 day, 6 hours, and 30 minutes.
- Single-Element Rarethereals on regular or Mirror Natural Islands take 1 day, 21 hours, and 30 minutes.
  - Source: line 1885
  - Evidence: Single Element Rarethereals on the regular and Mirror Natural Islands take 1 day, 21 hours, and 30 minutes.
- Rare Fire Double-Element Hybrids take 13 hours and 30 minutes.
  - Source: line 1888
  - Evidence: This means that the Rare Double-Element Fire Hybrids take 13 hours and 30 minutes.
- Rare Fire Triple-Element Hybrids take 1 day, 2 hours and 30 minutes.
  - Source: line 1889
  - Evidence: The Rare Triple-Element Fire Hybrids take 1 day, 2 hours and 30 minutes.
- Rare Fire Quad-Element Hybrids take 2 days, 4 hours and 30 minutes.
  - Source: line 1890
  - Evidence: Rare Quad-Element Fire Hybrids take 2 days, 4 hours and 30 minutes.
- Rare Quint-Element Fire Hybrids and Rare Mimic use a 3 day 23 hour 30 minute timing rule.
  - Source: line 1892
  - Evidence: That means they take 3 days, 23 hours and 30 minutes to incubate.
- Rare Double-Element Magicals take 12 hours and 30 minutes.
  - Source: line 1894
  - Evidence: This means that the Rare Double-Element Magicals take 12 hours and 30 minutes.
- Rare Triple-Element Magicals take 1 day, 1 hour and 30 minutes.
  - Source: line 1895
  - Evidence: The Rare Triple-Element Magicals take 1 day, 1 hour and 30 minutes.
- Rare Quad-Element Impure Magicals take 1 day, 18 hours, 30 minutes.
  - Source: line 1900
  - Evidence: This means that it would take 1 day, 18 hours, 30 minutes to breed/incubate.
- Single-Element Rarethereals on Ethereal Island use a distinct 12 hour 38 minute 20 second timing pattern.
  - Source: line 1902
  - Evidence: Single Element Rarethereals on Ethereal Island have a multiplier of 1.2638, meaning they have breeding times of 12 hours, 38 minutes and 20 seconds.
- Most Double-Element Rarethereals and Rare Wubbox follow a 1.25 timing multiplier without the extra 30 minutes seen on most other Rares.
  - Source: line 1903
  - Evidence: Double Element Rarethereals (besides Rare Fung Pray) and Rare Wubbox have a multiplier of 1.25 (same as most Rare Naturals) but do not have the additional 30 minutes, unlike most Rares.

## Epic Breeding Rules

- Epics cannot be used as breeding parents and should not appear in parent-selection UI.
  - Source: line 13
  - Evidence: Epic Monsters are a class of Monsters even more elusive than Rare Monsters. They were added to the game on September 5th, 2018. Epics share the same song as their Common and Rare counterparts, with the exception of Epic Wubbox. Most Epics also share just about the same animations, but Epic Seasonals, Wublins and Mythicals have their own fully unique animations. Unlike Rares, Epics are incapable of breeding, and will not show up in the list of possible "parents" in a Breeding Structure. They also are not available to purchase in the StarShop.
- Epics are limited-time breeding or purchase targets.
  - Source: line 34
  - Evidence: Epic Monsters, similar to their Rare counterparts are only available for breeding and buying at select times. So far they have each been available for a week each after their official reveal, and have been re-released during other promotional events.
- Owning the Rare version is not required to breed or unlock an Epic.
  - Source: line 38
  - Evidence: Obtaining Epics is quite different from Rare Monsters. Each Epic will have its own unique Breeding combination per Island. Rare Monsters are not required to breed or unlock an Epic Monster[1], so a player can for example, obtain an Epic Noggin before getting a Rare Noggin.
- Each Epic has its own island-specific breeding combination.
  - Source: line 38
  - Evidence: Obtaining Epics is quite different from Rare Monsters. Each Epic will have its own unique Breeding combination per Island. Rare Monsters are not required to breed or unlock an Epic Monster[1], so a player can for example, obtain an Epic Noggin before getting a Rare Noggin.
- Epic breeding does follow pattern families by monster class and island, but the exact combination data still belongs in a dedicated combo dataset.
  - Source: line 41
  - Evidence: Epic Monsters follow a set pattern for their breeding combination. Breeding patterns for different kinds of Monsters is listed below.
- Epic Natural and Fire monsters follow broad timing patterns, but those patterns are not a substitute for storing per-monster times.
  - Source: line 63
  - Evidence: Besides Epic Seasonals and Epic Mythicals, all Epic Natural and Fire Monsters have a well-rounded breeding time of a unique odd numbered amount of hours per amount of elements. Additionally, Epic Single Element Monsters have consecutive odd numbered breeding times based on the order of their appearance.
- Amber Island Epics are obtained through Crucible evolution rather than breeding.
  - Source: line 69
  - Evidence: On Amber Island, Monsters cannot be bred. Instead, Epics are obtained by evolving a common or Rare Monster in the Crucible.
- Wublin Island Epics are not bred directly; they follow Rare Wublin evolution plus inventory filling.
  - Source: line 73
  - Evidence: On Wublin Island, Monsters cannot be bred. Instead, Epics are obtained by unlocking a Rare Wublin's evolutionary potential with Keys, and then filling in the required Epics in its inventory.

## Timer And Identification Rules

- Modern in-game time format is `Xd Xh Xm`, with seconds only shown for times below one day.
  - Source: line 527
  - Evidence: After version 3.7.0, all times in game changed format. For example a time of 1 day, 23 hours, 59 minutes, and 58 seconds used to be displayed as 1:23:59:58, and it is now displayed as 1d 23h 59m. Seconds are only included for times less than 1 day.
- Timer lookup is a valid identification tool when the result is uncertain.
  - Source: line 2366
  - Evidence: If you are unsure of what Monster you bred, try looking up the closest matching time in the table below, sorted from shortest to longest time.
- Timer alone is not always enough; island and actual parent pair are also needed to narrow outcomes.
  - Source: line 3479
  - Evidence: Many Monsters have the same times, but for most of them you can think logically to tell them apart. A time of 8 hours could be a Pango, but if you're on Plant Island then that's obviously not it. You can also follow the link to the Monster's article to see if the combination you actually used could result in that Monster.
- Rare event overlaps can produce multiple possible monsters with the same timer, which means timer-based inference still has hard ambiguity cases.
  - Source: line 3480
  - Evidence: Other Monsters can't be told apart at all, such as the Shugafam on Shugabush Island, or in events where a combination can result in two Monsters that share the same times. An example would be a Rare event where both Rare Noggin and Rare Mammott may result from any Triple-Element Monster sharing the Earth or Cold Element.
- Some breeding outcomes cannot be distinguished from time alone at all, so a truthful `Mystery Egg` state is sometimes necessary.
  - Source: line 3480
  - Evidence: Other Monsters can't be told apart at all, such as the Shugafam on Shugabush Island, or in events where a combination can result in two Monsters that share the same times. An example would be a Rare event where both Rare Noggin and Rare Mammott may result from any Triple-Element Monster sharing the Earth or Cold Element.

## Time Modifier Rules

- Colossal Conundra time reduction boosts stack multiplicatively with other reductions rather than adding directly.
  - Source: line 529
  - Evidence: Since 3.8.4, the Colossal Conundra can include time reduction Boosts. These Boosts apply multiplicatively on top of other boosts. For example, an Enhanced Nursery with the Sweti Settlement Island Skin and a 25% reduction boost would result in a (0.75 - 0.1) * 0.75 time multiplier, or a 51.25% time reduction boost.
- Single-Element Ethereals on The Colossingum use the same incubation time as they do on the Natural Islands.
  - Source: line 3484
  - Evidence: Single-Element Ethereal Monsters on The Colossingum have the same incubation time that they have on the Natural Islands.

## Future Inbox Format

Useful per-monster fields to dump into `inbox.txt`:
- monster name
- class or rarity
- breedable as result
- usable as parent
- island
- breeding combo
- breeding time
- enhanced breeding time
- availability note
- special exception note

Useful mechanics topics to dump into `inbox.txt`:
- breeding rules
- timer ambiguity rules
- time reduction math
- limited-time availability behavior
- special island exceptions

Recommended dump style:
- paste one whole wiki page block at a time when using raw dumps
- or use a small structured per-monster format when you already know the exact facts you want preserved
- the parser will archive processed page dumps and remove them from the live inbox

Noise to avoid unless a feature explicitly needs it:
- lore or flavor prose
- release history timelines unless availability logic depends on them
- gallery text
- currency and sale values unless a feature explicitly needs them
- repeated icon labels
- long trivia sections

## Research Backlog

- Promote validated combo candidates: The parser now extracts structured combo candidates from raw Breeding Combinations dumps, but those candidates should still be reviewed before promotion into src/data/breedingCombos.js.
- Promote validated breeding-time candidates: The parser now extracts grouped breeding-time candidates from raw Breeding Times dumps, but they remain research data until reviewed against runtime needs.
- Epic breeding combinations page: The inbox captured Epic mechanics rules, but full per-island Epic combo extraction still needs a dedicated page dump and parser pass.
- Limited-time availability: Breeding Availability still needs its own structured dataset if the app later supports event-aware or time-window sheets.
- Manual breed UI follow-up: Epics should be excluded from parent pickers, and parent options should be sorted by breeding usefulness rather than alphabetically.

