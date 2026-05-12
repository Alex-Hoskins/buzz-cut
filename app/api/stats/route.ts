import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET() {
  const raw = await redis.get<number | string>("total_cuts");
  const totalCuts = raw ? Number(raw) : 0;
  return NextResponse.json({ totalCuts });
}
