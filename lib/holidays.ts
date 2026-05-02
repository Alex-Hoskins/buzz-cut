import type { HairTop, HairSides, HairBeard, SkullShape } from "./head-system";

export interface HolidayConfig {
  name: string;
  shortLabel: string;
  emoji: string;
  forceColor?: string;
  colorPool?: string[];
  forceHairTop?: HairTop;
  forceHairSides?: HairSides;
  forceHairBeard?: HairBeard;
  forceSkull?: SkullShape;
}

export const FIXED_HOLIDAYS: Record<string, HolidayConfig> = {
  "12-25": {
    name: "Christmas", shortLabel: "Christmas", emoji: "🎄",
    forceColor: "#ffffff", forceHairTop: "fluffy", forceHairBeard: "full",
  },
  "10-31": {
    name: "Halloween", shortLabel: "Halloween", emoji: "🎃",
    colorPool: ["#1a1a1a", "#5c1a3d", "#ea580c"], forceHairTop: "spiky",
  },
  "03-17": {
    name: "St. Patrick's Day", shortLabel: "St. Paddy's", emoji: "🍀",
    forceColor: "#2d7a3a", forceHairBeard: "full",
  },
  "07-04": {
    name: "Independence Day", shortLabel: "July 4th", emoji: "🇺🇸",
    colorPool: ["#cc2936", "#1a3d6e", "#ffffff"], forceHairTop: "mohawk",
  },
  "01-01": {
    name: "New Year's Day", shortLabel: "New Year", emoji: "✨",
    colorPool: ["#d4af37", "#c0c0c0", "#ffffff"], forceHairTop: "fluffy",
  },
};

// Moving holidays — hardcoded for 5 years.
export const DATED_HOLIDAYS: Record<string, HolidayConfig> = {
  // Easter (Sundays)
  "2026-04-05": { name: "Easter", shortLabel: "Easter", emoji: "🐣", colorPool: ["#f8c8dc", "#b5e3ff", "#fff4a3"], forceHairTop: "fluffy" },
  "2027-03-28": { name: "Easter", shortLabel: "Easter", emoji: "🐣", colorPool: ["#f8c8dc", "#b5e3ff", "#fff4a3"], forceHairTop: "fluffy" },
  "2028-04-16": { name: "Easter", shortLabel: "Easter", emoji: "🐣", colorPool: ["#f8c8dc", "#b5e3ff", "#fff4a3"], forceHairTop: "fluffy" },
  "2029-04-01": { name: "Easter", shortLabel: "Easter", emoji: "🐣", colorPool: ["#f8c8dc", "#b5e3ff", "#fff4a3"], forceHairTop: "fluffy" },
  "2030-04-21": { name: "Easter", shortLabel: "Easter", emoji: "🐣", colorPool: ["#f8c8dc", "#b5e3ff", "#fff4a3"], forceHairTop: "fluffy" },
  // Thanksgiving (4th Thursday of November, US)
  "2026-11-26": { name: "Thanksgiving", shortLabel: "Thanksgiving", emoji: "🦃", colorPool: ["#8b4513", "#d2691e", "#cd853f"], forceHairBeard: "full", forceHairSides: "mutton-chops" },
  "2027-11-25": { name: "Thanksgiving", shortLabel: "Thanksgiving", emoji: "🦃", colorPool: ["#8b4513", "#d2691e", "#cd853f"], forceHairBeard: "full", forceHairSides: "mutton-chops" },
  "2028-11-23": { name: "Thanksgiving", shortLabel: "Thanksgiving", emoji: "🦃", colorPool: ["#8b4513", "#d2691e", "#cd853f"], forceHairBeard: "full", forceHairSides: "mutton-chops" },
  "2029-11-22": { name: "Thanksgiving", shortLabel: "Thanksgiving", emoji: "🦃", colorPool: ["#8b4513", "#d2691e", "#cd853f"], forceHairBeard: "full", forceHairSides: "mutton-chops" },
  "2030-11-28": { name: "Thanksgiving", shortLabel: "Thanksgiving", emoji: "🦃", colorPool: ["#8b4513", "#d2691e", "#cd853f"], forceHairBeard: "full", forceHairSides: "mutton-chops" },
};

export function getHolidayForDate(dateString: string): HolidayConfig | null {
  const dated = DATED_HOLIDAYS[dateString];
  if (dated) return dated;
  const monthDay = dateString.slice(5); // "MM-DD"
  return FIXED_HOLIDAYS[monthDay] ?? null;
}
