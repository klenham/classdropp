import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: "No url provided" }, { status: 400 });
  }
  await del(url);
  return NextResponse.json({ ok: true });
}
