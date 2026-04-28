import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "recygo";

if (!url || !key) {
  // Logged once at server boot — uploads will throw if used without env.
  console.warn("[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
}

export const supabase = createClient(url ?? "", key ?? "", {
  auth: { persistSession: false },
});

export async function uploadDataUrl(
  dataUrl: string,
  destPath: string,
): Promise<string> {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid data URL");
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(destPath, buffer, { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(destPath);
  return data.publicUrl;
}
