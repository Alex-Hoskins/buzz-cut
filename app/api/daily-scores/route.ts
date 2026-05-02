import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

const HANDLE_RE = /^[a-zA-Z0-9_-]{3,12}$/;
const UUID_RE   = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE   = /^\d{4}-\d{2}-\d{2}$/;
const TTL = 604800; // 7 days

function dailyKey(dateString: string) {
  return `daily-leaderboard:${dateString}`;
}

function encodeScore(passes: number, timeMs: number): number {
  return passes + timeMs / 10_000_000;
}

function decodeScore(score: number): { passes: number; timeMs: number } {
  const passes = Math.floor(score);
  const timeMs = Math.round((score - passes) * 10_000_000);
  return { passes, timeMs };
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const dateString = req.nextUrl.searchParams.get("date") ?? "";
  if (!DATE_RE.test(dateString)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const raw = await redis.zrange(dailyKey(dateString), 0, 9, { withScores: true });
  if (!raw || raw.length === 0) return NextResponse.json([]);

  const playerIds: string[] = [];
  const scores: number[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    playerIds.push(raw[i] as string);
    const s = raw[i + 1];
    scores.push(typeof s === "string" ? parseFloat(s) : (s as number));
  }

  const handleMap = ((await redis.hmget("handles", ...playerIds)) ?? {}) as Record<string, string | null>;
  const leaderboard = playerIds.map((id, i) => {
    const { passes, timeMs } = decodeScore(scores[i]);
    return { handle: handleMap[id] ?? "Anonymous", passes, timeMs, rank: i + 1 };
  });

  return NextResponse.json(leaderboard);
}

export async function POST(req: NextRequest) {
  let body: {
    dateString: string;
    playerId: string;
    handle: string;
    passes: number;
    timeMs: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { dateString, playerId, handle, passes, timeMs } = body;

  // Only accept submissions for today in UTC to prevent backdating.
  if (dateString !== todayUTC()) {
    return NextResponse.json(
      { error: "Submissions are only accepted for today's challenge" },
      { status: 400 }
    );
  }
  if (!UUID_RE.test(playerId)) {
    return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
  }
  if (!HANDLE_RE.test(handle)) {
    return NextResponse.json(
      { error: "Handle must be 3–12 characters: letters, numbers, _ or -" },
      { status: 400 }
    );
  }
  if (!Number.isInteger(passes) || passes < 1) {
    return NextResponse.json({ error: "Invalid passes" }, { status: 400 });
  }
  if (timeMs < passes * 400) {
    return NextResponse.json(
      { error: "Time is too fast to be physically possible" },
      { status: 400 }
    );
  }

  // Handle uniqueness (shared handle namespace with practice mode).
  const handleLower = handle.toLowerCase();
  const currentOwner = await redis.hget<string>("handle_owners", handleLower);
  if (currentOwner && currentOwner !== playerId) {
    return NextResponse.json({ error: "Handle already taken" }, { status: 409 });
  }

  const currentHandle = await redis.hget<string>("handles", playerId);
  if (currentHandle && currentHandle.toLowerCase() !== handleLower) {
    await redis.hdel("handle_owners", currentHandle.toLowerCase());
  }

  await redis.hset("handles",       { [playerId]:    handle });
  await redis.hset("handle_owners", { [handleLower]: playerId });

  const key      = dailyKey(dateString);
  const newScore = encodeScore(passes, timeMs);
  const existing = await redis.zscore(key, playerId);

  if (existing !== null) {
    const existingScore = typeof existing === "string" ? parseFloat(existing) : (existing as number);
    if (newScore >= existingScore) {
      await redis.expire(key, TTL);
      return NextResponse.json({ updated: false });
    }
  }

  await redis.zadd(key, { score: newScore, member: playerId });
  await redis.expire(key, TTL);
  return NextResponse.json({ updated: true });
}
