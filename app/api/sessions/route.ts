import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import {
  createSession,
  incrementUserTokens,
  listSessions,
} from "@/lib/storage";
import { uploadDataUrl } from "@/lib/supabase";
import type { SessionEntry } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sessions = await listSessions(
    user.role === "admin" ? undefined : user.username,
  );
  return NextResponse.json({ sessions });
}

interface IncomingPhoto {
  dataUrl: string;
  angle: string;
  capturedAt: string;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = (await req.json()) as {
    category?: string;
    weight?: number;
    photos?: IncomingPhoto[];
  };

  const category = body.category?.trim();
  const weight = Number(body.weight);
  const photos = body.photos ?? [];

  if (!category || !Number.isFinite(weight) || weight <= 0 || photos.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const id = randomUUID();
  const tokensEarned = Math.floor(weight / 10);
  const createdAt = new Date().toISOString();

  const uploaded: SessionEntry["photos"] = [];
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const dest = `${user.username}/${id}/${i + 1}_${photo.angle}.png`;
    try {
      const url = await uploadDataUrl(photo.dataUrl, dest);
      uploaded.push({ url, angle: photo.angle, capturedAt: photo.capturedAt });
    } catch (e) {
      console.error("[supabase upload]", e);
      return NextResponse.json(
        { error: "Image upload failed" },
        { status: 502 },
      );
    }
  }

  const entry = await createSession({
    id,
    username: user.username,
    category,
    weight,
    tokensEarned,
    photos: uploaded,
    createdAt,
  });

  const newTokens = await incrementUserTokens(user.username, tokensEarned);

  return NextResponse.json({ session: entry, tokens: newTokens });
}
