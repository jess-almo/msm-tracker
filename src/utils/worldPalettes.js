function rgba([r, g, b], alpha)
{
  return `rgba(${r},${g},${b},${alpha})`;
}

function mixRgb(source, target, amount)
{
  return source.map((channel, index) =>
    Math.round(channel + (target[index] - channel) * amount)
  );
}

function createWorldPalette({
  glow,
  border = glow,
  wash = glow,
  accent = border,
  glowAlpha = 0.24,
  borderAlpha = 0.34,
  washAlpha = 0.14,
  accentAlpha = 0.2,
  glowLift = 0.18,
})
{
  const liftedGlow = mixRgb(glow, [255, 255, 255], glowLift);

  return {
    glow: rgba(liftedGlow, Math.min(glowAlpha + 0.04, 0.34)),
    border: rgba(border, borderAlpha),
    wash: rgba(wash, washAlpha),
    accent: rgba(accent, accentAlpha),
  };
}

const DEFAULT_WORLD_PALETTE = createWorldPalette({
  glow: [148, 163, 184],
  border: [148, 163, 184],
  wash: [51, 65, 85],
  accent: [148, 163, 184],
  glowAlpha: 0.22,
  borderAlpha: 0.26,
  washAlpha: 0.18,
  accentAlpha: 0.12,
});

const WORLD_PALETTE_MATCHERS = [
  {
    keys: ["celestial"],
    palette: createWorldPalette({
      glow: [190, 145, 255],
      border: [216, 180, 254],
      wash: [88, 56, 145],
      accent: [192, 132, 252],
      glowAlpha: 0.25,
      washAlpha: 0.13,
      accentAlpha: 0.22,
    }),
  },
  {
    keys: ["amber"],
    palette: createWorldPalette({
      glow: [205, 103, 28],
      border: [232, 147, 34],
      wash: [142, 74, 28],
      accent: [236, 151, 46],
      glowAlpha: 0.28,
      washAlpha: 0.16,
      accentAlpha: 0.22,
    }),
  },
  {
    keys: ["wublin"],
    palette: createWorldPalette({
      glow: [18, 119, 164],
      border: [45, 170, 190],
      wash: [14, 93, 125],
      accent: [20, 184, 166],
      glowAlpha: 0.26,
      washAlpha: 0.15,
      accentAlpha: 0.2,
    }),
  },
  {
    keys: ["mirror cold"],
    palette: createWorldPalette({
      glow: [115, 73, 164],
      border: [150, 115, 212],
      wash: [60, 44, 112],
      accent: [150, 115, 212],
      glowAlpha: 0.26,
      washAlpha: 0.16,
    }),
  },
  {
    keys: ["mirror faerie"],
    palette: createWorldPalette({
      glow: [84, 140, 187],
      border: [125, 170, 218],
      wash: [36, 82, 128],
      accent: [125, 170, 218],
      glowAlpha: 0.25,
      washAlpha: 0.15,
    }),
  },
  {
    keys: ["mirror water"],
    palette: createWorldPalette({
      glow: [82, 140, 130],
      border: [112, 185, 172],
      wash: [32, 92, 86],
      accent: [112, 185, 172],
      glowAlpha: 0.25,
      washAlpha: 0.15,
    }),
  },
  {
    keys: ["mirror light"],
    palette: createWorldPalette({
      glow: [222, 199, 35],
      border: [235, 185, 35],
      wash: [126, 96, 27],
      accent: [222, 199, 35],
      glowAlpha: 0.26,
      washAlpha: 0.14,
    }),
  },
  {
    keys: ["mirror"],
    palette: createWorldPalette({
      glow: [166, 114, 129],
      border: [196, 165, 178],
      wash: [78, 69, 92],
      accent: [196, 165, 178],
      glowAlpha: 0.22,
      borderAlpha: 0.28,
      washAlpha: 0.14,
      accentAlpha: 0.16,
    }),
  },
  {
    keys: ["plant"],
    palette: createWorldPalette({
      glow: [141, 164, 41],
      border: [160, 190, 60],
      wash: [70, 105, 32],
      accent: [141, 164, 41],
      glowAlpha: 0.27,
      washAlpha: 0.18,
      accentAlpha: 0.22,
    }),
  },
  {
    keys: ["cold"],
    palette: createWorldPalette({
      glow: [60, 98, 165],
      border: [110, 155, 220],
      wash: [30, 70, 130],
      accent: [110, 155, 220],
      glowAlpha: 0.27,
      washAlpha: 0.16,
      accentAlpha: 0.2,
    }),
  },
  {
    keys: ["air"],
    palette: createWorldPalette({
      glow: [188, 176, 106],
      border: [204, 186, 120],
      wash: [95, 82, 48],
      accent: [191, 219, 254],
      glowAlpha: 0.2,
      borderAlpha: 0.28,
      washAlpha: 0.12,
      accentAlpha: 0.14,
    }),
  },
  {
    keys: ["water"],
    palette: createWorldPalette({
      glow: [59, 174, 142],
      border: [80, 190, 165],
      wash: [24, 96, 92],
      accent: [80, 190, 165],
      glowAlpha: 0.25,
      washAlpha: 0.15,
    }),
  },
  {
    keys: ["earth"],
    palette: createWorldPalette({
      glow: [188, 106, 36],
      border: [216, 126, 48],
      wash: [112, 60, 30],
      accent: [216, 126, 48],
      glowAlpha: 0.24,
      washAlpha: 0.15,
    }),
  },
  {
    keys: ["fire"],
    palette: createWorldPalette({
      glow: [241, 123, 6],
      border: [244, 142, 28],
      wash: [150, 54, 16],
      accent: [244, 142, 28],
      glowAlpha: 0.27,
      washAlpha: 0.16,
      accentAlpha: 0.2,
    }),
  },
  {
    keys: ["light"],
    palette: createWorldPalette({
      glow: [250, 202, 21],
      border: [252, 216, 9],
      wash: [151, 116, 15],
      accent: [252, 216, 9],
      glowAlpha: 0.29,
      borderAlpha: 0.36,
      washAlpha: 0.15,
      accentAlpha: 0.22,
    }),
  },
  {
    keys: ["psychic"],
    palette: createWorldPalette({
      glow: [152, 124, 190],
      border: [190, 145, 224],
      wash: [88, 58, 130],
      accent: [190, 145, 224],
      glowAlpha: 0.25,
      borderAlpha: 0.34,
      washAlpha: 0.14,
    }),
  },
  {
    keys: ["faerie"],
    palette: createWorldPalette({
      glow: [187, 99, 145],
      border: [215, 138, 184],
      wash: [116, 48, 98],
      accent: [215, 138, 184],
      glowAlpha: 0.25,
      borderAlpha: 0.34,
      washAlpha: 0.14,
    }),
  },
  {
    keys: ["bone"],
    palette: createWorldPalette({
      glow: [135, 190, 150],
      border: [166, 200, 170],
      wash: [66, 104, 78],
      accent: [190, 180, 235],
      glowAlpha: 0.22,
      borderAlpha: 0.3,
      washAlpha: 0.13,
      accentAlpha: 0.16,
    }),
  },
  {
    keys: ["sanctum", "nexus"],
    palette: createWorldPalette({
      glow: [143, 48, 40],
      border: [190, 95, 75],
      wash: [86, 39, 55],
      accent: [190, 95, 75],
      glowAlpha: 0.24,
      washAlpha: 0.14,
    }),
  },
  {
    keys: ["ethereal"],
    palette: createWorldPalette({
      glow: [124, 107, 187],
      border: [94, 190, 200],
      wash: [45, 78, 125],
      accent: [124, 107, 187],
      glowAlpha: 0.25,
      borderAlpha: 0.32,
      washAlpha: 0.14,
      accentAlpha: 0.18,
    }),
  },
  {
    keys: ["shugabush"],
    palette: createWorldPalette({
      glow: [134, 71, 25],
      border: [180, 101, 45],
      wash: [83, 52, 24],
      accent: [180, 101, 45],
      glowAlpha: 0.23,
      borderAlpha: 0.3,
      washAlpha: 0.13,
    }),
  },
  {
    keys: ["seasonal"],
    palette: createWorldPalette({
      glow: [139, 107, 63],
      border: [190, 135, 68],
      wash: [82, 65, 46],
      accent: [190, 135, 68],
      glowAlpha: 0.23,
      borderAlpha: 0.3,
      washAlpha: 0.13,
    }),
  },
];

export function getWorldVisualPalette(worldName = "")
{
  const normalizedName = String(worldName || "").toLowerCase();
  const match = WORLD_PALETTE_MATCHERS.find(({ keys }) =>
    keys.some((key) => normalizedName.includes(key))
  );

  return match?.palette || DEFAULT_WORLD_PALETTE;
}
