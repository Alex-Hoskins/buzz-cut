// Level definitions for Buzz Cut.
// Each level describes the head/hair area and the clipper behavior.

export type HeadShape = "round" | "oval" | "mohawk" | "tall" | "beard";

export interface Level {
  id: number;
  name: string;
  subtitle: string;
  shape: HeadShape;
  swingSpeed: number; // pixels per second at max swing
  par: number;        // target number of passes for 3 stars
  hairColor: string;
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "The First Customer",
    subtitle: "Easy does it. Get a feel for the clippers.",
    shape: "round",
    swingSpeed: 180,
    par: 6,
    hairColor: "#3b2a1e",
  },
  {
    id: 2,
    name: "The Long Hair",
    subtitle: "Taller dome. Same rules.",
    shape: "tall",
    swingSpeed: 220,
    par: 7,
    hairColor: "#5b3a1a",
  },
  {
    id: 3,
    name: "The Mohawk",
    subtitle: "Only the strip. Don't waste passes on bare scalp.",
    shape: "mohawk",
    swingSpeed: 240,
    par: 4,
    hairColor: "#1a1a1a",
  },
  {
    id: 4,
    name: "The Speed Demon",
    subtitle: "Clippers are wired. Time your drops.",
    shape: "oval",
    swingSpeed: 360,
    par: 6,
    hairColor: "#6b4226",
  },
  {
    id: 5,
    name: "The Full Service",
    subtitle: "Head AND beard. The works.",
    shape: "beard",
    swingSpeed: 280,
    par: 8,
    hairColor: "#2a1810",
  },
];

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function calcStars(passes: number, par: number): 1 | 2 | 3 {
  if (passes <= par) return 3;
  if (passes <= par + 2) return 2;
  return 1;
}
