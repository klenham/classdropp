import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const uploader = (form.get("uploader") as string | null)?.trim() || "Anonymous";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const safeUploader = uploader.replace(/[^a-zA-Z0-9-_ ]/g, "").slice(0, 40) || "Anonymous";
    const pathname = `${safeUploader}/${file.name}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ blob });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
