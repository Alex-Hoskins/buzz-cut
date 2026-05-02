// Deterministic daily challenge generator.
// Pure/isomorphic — no Path2D, no browser APIs — safe to call server-side.

import type { HeadConfig, SkullShape, HairTop, HairSides, HairBeard } from "./head-system";
import { getHolidayForDate, type HolidayConfig } from "./holidays";

export interface DailyConfig {
  dateString: string;
  headConfig: HeadConfig;
  holiday: HolidayConfig | null;
  swingSpeed: number;
  par: number;
  customerLabel: string;
}

// ─── PRNG ────────────────────────────────────────────────────────────────────

function cyrb53(str: string): number {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick<T>(prng: () => number, items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = prng() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r < 0) return item;
  }
  return items[items.length - 1][0];
}

// ─── Component pools ──────────────────────────────────────────────────────────

const SKULL_POOL: SkullShape[] = ["round", "oval", "tall", "narrow", "wide", "egg"];

const HAIR_TOP_WEIGHTED: [HairTop, number][] = [
  ["short-cap",  1  ],
  ["full-top",   3  ],
  ["fluffy",     2  ],
  ["comb-over",  2  ],
  ["receding",   1.5],
  ["spiky",      1  ],
  ["man-bun",    1  ],
];

const HAIR_SIDES_WEIGHTED: [HairSides, number][] = [
  ["sideburns",   40],
  ["none",        30],
  ["mutton-chops",15],
  ["chin-strap",  10],
  ["ear-tufts",    5],
];

const HAIR_BEARD_WEIGHTED: [HairBeard, number][] = [
  ["none",           50],
  ["stubble",        20],
  ["goatee",         15],
  ["full",           10],
  ["chinstrap-beard", 3],
  ["soul-patch",      2],
];

const HAIR_COLOR_PALETTE = [
  "#3b2a1e", "#5b3a1a", "#1a1a1a", "#6b4226", "#2a1810",
  "#c4a35a", "#8b4513", "#d4a373", "#a8a8a8", "#e8d5b0",
];

// Sun=220, Mon=180, Tue=230, Wed=260, Thu=290, Fri=340, Sat=300
const SWING_BY_DOW = [220, 180, 230, 260, 290, 340, 300];

// ─── Par estimation (no Path2D) ───────────────────────────────────────────────

const SKULL_RX: Record<SkullShape, number> = {
  round: 150, oval: 140, tall: 130, narrow: 115, wide: 175, egg: 125,
};

function estimateHairWidth(config: HeadConfig): number {
  const rx = SKULL_RX[config.skull];
  if (config.hairTop === "mohawk") return 76; // 60px strip + 2×8 bounds padding
  if (config.hairTop === "bald" || config.hairTop === "short-cap") {
    if (config.hairSides !== "none") return rx * 2;
    if (config.hairBeard !== "none" && config.hairBeard !== "stubble") return rx * 2 - 16;
    return 0;
  }
  return rx * 2;
}

export function estimatePar(config: HeadConfig): number {
  const w = estimateHairWidth(config);
  if (w === 0) return 3;
  return Math.min(12, Math.max(3, Math.ceil(w / 44) + 1));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function generateDaily(dateString: string): DailyConfig {
  const hash = cyrb53(dateString);
  const prng = mulberry32(hash >>> 0);

  // Base picks — always consume exactly 5 prng calls before any holiday override
  const skull    = SKULL_POOL[Math.floor(prng() * SKULL_POOL.length)];
  const hairTop  = weightedPick(prng, HAIR_TOP_WEIGHTED);
  const hairSides = weightedPick(prng, HAIR_SIDES_WEIGHTED);
  const hairBeard = weightedPick(prng, HAIR_BEARD_WEIGHTED);
  const hairColor = HAIR_COLOR_PALETTE[Math.floor(prng() * HAIR_COLOR_PALETTE.length)];

  let headConfig: HeadConfig = { skull, hairTop, hairSides, hairBeard, hairColor };

  // Holiday overrides
  const holiday = getHolidayForDate(dateString);
  if (holiday) {
    if (holiday.forceSkull)     headConfig = { ...headConfig, skull:     holiday.forceSkull };
    if (holiday.forceHairTop)   headConfig = { ...headConfig, hairTop:   holiday.forceHairTop };
    if (holiday.forceHairSides) headConfig = { ...headConfig, hairSides: holiday.forceHairSides };
    if (holiday.forceHairBeard) headConfig = { ...headConfig, hairBeard: holiday.forceHairBeard };
    if (holiday.forceColor) {
      headConfig = { ...headConfig, hairColor: holiday.forceColor };
    } else if (holiday.colorPool) {
      headConfig = { ...headConfig, hairColor: holiday.colorPool[Math.floor(prng() * holiday.colorPool.length)] };
    }
  }

  const dow = new Date(dateString + "T12:00:00").getDay();
  const swingSpeed = SWING_BY_DOW[dow];
  const par = estimatePar(headConfig);
  const customerLabel = holiday
    ? `Today's Customer: ${holiday.emoji} ${holiday.shortLabel}`
    : "Today's Customer";

  return { dateString, headConfig, holiday, swingSpeed, par, customerLabel };
}
