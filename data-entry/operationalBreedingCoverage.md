# Operational Breeding Coverage Audit

Generated: 2026-04-05T23:55:14.861Z

## Target

- Included systems: Amber, Wublin
- Operational completeness means:
  - runtime monster database entry exists
  - explicit breeding-island metadata exists
  - runtime breeding data includes a standard breeding time through combo coverage or time-only coverage

## Summary

- Unique requirement monsters: 76
- Operationally complete: 76/76 (100.0%)
- Combo coverage with time: 70
- Time-only coverage: 6
- Combo coverage missing time: 0
- Missing runtime breeding data: 0
- Missing monster database entries: 0
- Missing breeding-island metadata: 0
- Missing enhanced times (quality-only gap): 0
- Operational completeness achieved: Yes
- Exact combo completeness achieved: No

## Blocking Gaps

- None. All currently tracked requirement monsters meet the operational completeness target.

## Time-Only Coverage (Operationally Complete, Still Worth Upgrading)

| Monster | Total Required | References | Systems | Coverage | Breedable On |
| --- | ---: | ---: | --- | --- | --- |
| Kayna | 64 | 31 | amber | time_only | Fire Haven, Fire Oasis, Amber Island, Light, Psychic, Faerie, Bone, Mirror Light, Mirror Psychic, Mirror Faerie, Mirror Bone |
| Noggin | 36 | 4 | amber, wublin | time_only | Plant, Air, Water, Earth, Fire Haven, Faerie, Bone, Mirror Plant, Mirror Air, Mirror Water, Mirror Earth, Mirror Faerie, Mirror Bone |
| Toe Jammer | 32 | 4 | amber, wublin | time_only | Plant, Cold, Air, Water, Fire Oasis, Psychic, Bone, Mirror Plant, Mirror Cold, Mirror Air, Mirror Water, Mirror Psychic, Mirror Bone |
| Mammott | 28 | 3 | amber, wublin | time_only | Plant, Cold, Air, Earth, Fire Oasis, Light, Faerie, Shugabush, Mirror Plant, Mirror Cold, Mirror Air, Mirror Earth, Mirror Light, Mirror Faerie |
| Tweedle | 20 | 3 | amber, wublin | time_only | Cold, Air, Water, Earth, Fire Haven, Fire Oasis, Mirror Cold, Mirror Air, Mirror Water, Mirror Earth |
| Potbelly | 14 | 2 | amber, wublin | time_only | Plant, Cold, Water, Earth, Fire Haven, Light, Psychic, Shugabush, Mirror Plant, Mirror Cold, Mirror Water, Mirror Earth, Mirror Light, Mirror Psychic |

## Missing Enhanced Times (Quality Gaps Only)

- None.

## Parser / Promotion Backlog

- Unknown parsed combo names not yet modeled in the runtime monster database: 0
- Unknown parsed time names not yet modeled in the runtime monster database: 51
- Ambiguous time-only candidates intentionally skipped during promotion: 6

### Ambiguous Time-Only Monsters

- Clackula, Fluoress, Pentumbra, Theremind, Vhenshun, Whaill

### Unknown Parsed Time Names

- Epic, Charrkoll, Faesoddoid Fungus, Rare Squot, Rare Peckidna, Rare, Epic Floot Fly, Epic Clackula, Floot, Rare Periscorp, Rare Cahoot, Rare Déjà-Jin, Shhimmer, Epic Hyehehe, Clavi, Rare Yooreek, Rare Meebkin, Rare Blarret, Rare Gaddzooks, Rare Auglur, Rare Nitebear, Arcorina, Epic Flum Ox, Rare Larvaluss, Rare Frondley, Epic Incisaur, Rare Blow't, Scallyrags, eRmA gUrDy, Dakktyl, Rare Whaill, Rare Wheezel, Epic Tiawa, Epic Drummidary, Epic Bleatnik, Bogle, Fandhul, Epic Bisonorus, Epic Bowhead, Epic Candelavra
- ...and 11 more
