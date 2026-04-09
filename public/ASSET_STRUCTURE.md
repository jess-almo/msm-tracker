## Asset Structure

Use this folder layout when adding app images.

### Branding

- `public/branding/app-icon.png`
  - Main app icon
  - Used in the header and browser/app icon
  - Prefer a square PNG

### Monster Portraits

- `public/monsters/portraits/<monster-name>.png`
  - Monster art used on collection cards and future monster views
  - Use lowercase kebab-case names

Examples:
- `noggin.png`
- `toe-jammer.png`
- `oaktopus.png`
- `gjoob.png`

### Collection World Icons

- `public/monsters/worlds/icons/<world-name>.png`
  - Used inside opened collection sheets
  - This is the “world icon” version

Examples:
- `plant.png`
- `cold.png`
- `fire-haven.png`
- `magical-sanctum.png`

### Collection World Pins

- `public/monsters/worlds/pins/<world-name>.png`
  - Used on the Collections home cards
  - This is the “map pin / world marker” version

Examples:
- `plant.png`
- `cold.png`
- `fire-oasis.png`
- `ethereal-island.png`

### Element Icons

- `public/monsters/elements/<element-name>.png`
  - Used by the shared circular element chip system
  - Prefer the circular icon set for repeated in-app UI use
  - Use lowercase kebab-case names

Examples:
- `plant.png`
- `electricity.png`
- `season-of-love.png`
- `echoes-of-eco.png`
- `anniversary-month.png`

### Temporary Drop Zone

- `public/inbox/`
  - Optional holding area before you sort files
  - Nothing here is guaranteed to be used by the app

## Naming Rules

- Use `.png` when possible
- Use lowercase
- Replace spaces with hyphens
- Remove apostrophes

Examples:
- `clavi-gnat.png`
- `toe-jammer.png`
- `fire-haven.png`
- `seasonal-shanty.png`

## Quick Rule

- Monster art goes in `public/monsters/portraits`
- Island/world sheet art goes in `public/monsters/worlds/icons`
- Island/world card art goes in `public/monsters/worlds/pins`
- Element icons go in `public/monsters/elements`
- App logo goes in `public/branding/app-icon.png`
