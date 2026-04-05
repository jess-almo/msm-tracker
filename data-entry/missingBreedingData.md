# Breeding Combo Coverage Audit

Audit date: 2026-04-04

Sources read:

- `src/data/monsterRequirements.js`
- `src/data/breedingCombos.js`
- `src/utils/breedingCombos.js`

Current runtime combo source:

- `src/data/breedingCombos.js` exports `BREEDING_COMBOS_NATURAL`
- Current runtime coverage is Natural-only

## Summary

- Unique target monsters in `MONSTER_REQUIREMENTS.amber`: 32
- Unique requirement-name monsters: 76
- Unique monsters referenced anywhere in `src/data/monsterRequirements.js`: 90
- Monsters with both combo data and breeding time data: 25
- Monsters missing combo data: 65
- Monsters missing breeding time data: 65
- No referenced monster currently has timing data without combo data

## Monsters With Full Data

Bowgart, Clamble, Congle, Cybop, Dandidoo, Deedge, Drumpler, Entbrat, Furcorn, Fwog, Maw, Oaktopus, Pango, PomPom, Pummel, Quarrister, Quibble, Reedling, Riff, Scups, Shellbeat, Shrubb, Spunge, T-Rox, Thumpies

## Monsters Missing Combo Data

Banjaw, Barrb, Bisonorus, Blow't, Bonkers, Boskus, Bowhead, Bridg-It, Bulbo, Candelavra, Cantorell, Clavi Gnat, Denchuhs, Drummidary, Edamimi, Fiddlement, Floogull, Flowah, Flum Ox, Gloptic, Glowl, Gnarls, Gob, Hawlo, HippityHop, Incisaur, Kayna, Krillby, Mammott, Noggin, Peckidna, Periscorp, Phangler, Pladdie, Plinkajou, Pluckbill, PongPing, Poppette, Potbelly, Repatillo, Rooba, Rootitoot, Sneyser, Sooza, Spytrap, Squot, Stogg, Tapricorn, Thrumble, Tiawa, Toe Jammer, TooToo, Tring, Tuskski, Tweedle, Uuduk, Viveine, Whaddle, Wimmzies, Withur, Woolabee, Wynq, Yelmut, Yuggler, Ziggurab

## Monsters Missing Timing Data

Banjaw, Barrb, Bisonorus, Blow't, Bonkers, Boskus, Bowhead, Bridg-It, Bulbo, Candelavra, Cantorell, Clavi Gnat, Denchuhs, Drummidary, Edamimi, Fiddlement, Floogull, Flowah, Flum Ox, Gloptic, Glowl, Gnarls, Gob, Hawlo, HippityHop, Incisaur, Kayna, Krillby, Mammott, Noggin, Peckidna, Periscorp, Phangler, Pladdie, Plinkajou, Pluckbill, PongPing, Poppette, Potbelly, Repatillo, Rooba, Rootitoot, Sneyser, Sooza, Spytrap, Squot, Stogg, Tapricorn, Thrumble, Tiawa, Toe Jammer, TooToo, Tring, Tuskski, Tweedle, Uuduk, Viveine, Whaddle, Wimmzies, Withur, Woolabee, Wynq, Yelmut, Yuggler, Ziggurab

## Tuskski-Related Monsters

Monsters checked here are `Tuskski` plus every monster listed inside the `Tuskski` requirement block.

| Monster | Combo data | Timing data |
| --- | --- | --- |
| Blow't | no | no |
| Boskus | no | no |
| Bowgart | yes | yes |
| Bulbo | no | no |
| Cantorell | no | no |
| Clamble | yes | yes |
| Clavi Gnat | no | no |
| Congle | yes | yes |
| Deedge | yes | yes |
| Drumpler | yes | yes |
| Entbrat | yes | yes |
| Fiddlement | no | no |
| Furcorn | yes | yes |
| Kayna | no | no |
| Maw | yes | yes |
| Pango | yes | yes |
| Pladdie | no | no |
| PomPom | yes | yes |
| Quarrister | yes | yes |
| Riff | yes | yes |
| Sneyser | no | no |
| Sooza | no | no |
| Spytrap | no | no |
| Squot | no | no |
| T-Rox | yes | yes |
| Thumpies | yes | yes |
| Tuskski | no | no |
| Woolabee | no | no |
| Wynq | no | no |
| Ziggurab | no | no |

## Notes

- The current missing-combo list and missing-timing list are identical because every current runtime combo entry also includes `breedingTime`.
- This audit reflects current runtime coverage only. It does not treat `data-entry/parsedBreedingData.json` or `data-entry/inbox.txt` as production truth.
