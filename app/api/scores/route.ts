import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

const HANDLE_RE = /^[a-zA-Z0-9_-]{3,12}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MIN_PASSES: Record<number, number> = {
  1: 7, // round  — hair width ~296px
  2: 6, // tall   — hair width ~284px
  3: 2, // mohawk — strip width ~60px
  4: 7, // oval   — hair width ~276px
  5: 7, // beard  — hair width ~280px
};

function levelKey(levelId: number) {
  return `leaderboard:level:${levelId}`;
}

function encodeScore(passes: number, timeMs: number): number {
  return passes + timeMs / 10_000_000;
}

function decodeScore(score: number): { passes: number; timeMs: number } {
  const passes = Math.floor(score);
  const timeMs = Math.round((score - passes) * 10_000_000);
  return { passes, timeMs };
}

export async function GET(req: NextRequest) {
  const levelId = parseInt(req.nextUrl.searchParams.get("level") ?? "");
  if (!levelId || !MIN_PASSES[levelId]) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  // ZRANGE with WITHSCORES returns alternating [member, score, member, score, ...]
  const raw = await redis.zrange(levelKey(levelId), 0, 9, { withScores: true });

  if (!raw || raw.length === 0) {
    return NextResponse.json([]);
  }

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
    levelId: number;
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

  const { levelId, playerId, handle, passes, timeMs } = body;

  if (!levelId || !MIN_PASSES[levelId]) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
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
  if (!Number.isInteger(passes) || passes < MIN_PASSES[levelId]) {
    return NextResponse.json(
      { error: `Minimum passes for this level is ${MIN_PASSES[levelId]}` },
      { status: 400 }
    );
  }
  if (timeMs < passes * 400) {
    return NextResponse.json(
      { error: "Time is too fast to be physically possible" },
      { status: 400 }
    );
  }

  // --- Handle uniqueness (case-insensitive) ---
  // handle_owners: field = lowercased handle, value = playerId that owns it.
  const handleLower = handle.toLowerCase();
  const currentOwner = await redis.hget<string>("handle_owners", handleLower);
  if (currentOwner && currentOwner !== playerId) {
    return NextResponse.json({ error: "Handle already taken" }, { status: 409 });
  }

  // If the player is renaming, release their old handle from the index.
  const currentHandle = await redis.hget<string>("handles", playerId);
  if (currentHandle && currentHandle.toLowerCase() !== handleLower) {
    await redis.hdel("handle_owners", currentHandle.toLowerCase());
  }

  // Persist the handle in both maps.
  await redis.hset("handles", { [playerId]: handle });
  await redis.hset("handle_owners", { [handleLower]: playerId });

  // --- Score ---
  const newScore = encodeScore(passes, timeMs);
  const key = levelKey(levelId);

  const existing = await redis.zscore(key, playerId);
  if (existing !== null) {
    const existingScore =
      typeof existing === "string" ? parseFloat(existing) : (existing as number);
    if (newScore >= existingScore) {
      return NextResponse.json({ updated: false });
    }
  }

  await redis.zadd(key, { score: newScore, member: playerId });
  return NextResponse.json({ updated: true });
}
