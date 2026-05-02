// Level definitions for Buzz Cut.
// Each level describes the head/hair configuration and clipper behaviour.

import type { HeadConfig } from "./head-system";

export interface Level {
  id: number;
  name: string;
  subtitle: string;
  headConfig: HeadConfig;
  swingSpeed: number; // pixels per second at max swing
  hidden?: boolean;   // omit from menus/leaderboard; still playable via direct URL
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "The First Customer",
    subtitle: "Easy does it. Get a feel for the clippers.",
    headConfig: { skull: "round", hairTop: "full-top", hairSides: "sideburns", hairBeard: "none", hairColor: "#3b2a1e" },
    swingSpeed: 180,
  },
  {
    id: 2,
    name: "The Long Hair",
    subtitle: "Taller dome. Same rules.",
    headConfig: { skull: "tall", hairTop: "fluffy", hairSides: "mutton-chops", hairBeard: "none", hairColor: "#5b3a1a" },
    swingSpeed: 220,
  },
  {
    id: 3,
    name: "The Mohawk",
    subtitle: "Only the strip. Don't waste passes on bare scalp.",
    headConfig: { skull: "round", hairTop: "mohawk", hairSides: "none", hairBeard: "none", hairColor: "#1a1a1a" },
    swingSpeed: 240,
  },
  {
    id: 4,
    name: "The Speed Demon",
    subtitle: "Clippers are wired. Time your drops.",
    headConfig: { skull: "oval", hairTop: "full-top", hairSides: "sideburns", hairBeard: "none", hairColor: "#6b4226" },
    swingSpeed: 360,
  },
  {
    id: 5,
    name: "The Full Service",
    subtitle: "Head AND beard. The works.",
    headConfig: { skull: "round", hairTop: "full-top", hairSides: "sideburns", hairBeard: "full", hairColor: "#2a1810" },
    swingSpeed: 280,
  },
  {
    id: 6,
    name: "TEST: New Variants",
    subtitle: "Wide skull, spiky top, chin-strap, soul-patch.",
    headConfig: { skull: "wide", hairTop: "spiky", hairSides: "chin-strap", hairBeard: "soul-patch", hairColor: "#1a1a1a" },
    swingSpeed: 240,
    hidden: true,
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
