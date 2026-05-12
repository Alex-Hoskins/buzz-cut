import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

const TOTAL_KEY = "total_cuts";
// Per-player rate limit: max 30 increments per hour (covers replays without
// letting anyone meaningfully inflate the count).
const RATE_KEY = (id: string) => `cuts_rate:${id}`;
const RATE_LIMIT = 30;
const RATE_WINDOW = 3600; // seconds

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  let playerId: string;
  try {
    const body = await req.json();
    playerId = body.playerId ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!UUID_RE.test(playerId)) {
    return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
  }

  const rateKey = RATE_KEY(playerId);
  const count = await redis.incr(rateKey);
  if (count === 1) await redis.expire(rateKey, RATE_WINDOW);
  if (count > RATE_LIMIT) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const total = await redis.incr(TOTAL_KEY);
  return NextResponse.json({ total });
}
