import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "@/lib/supabase";

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Uploads image at local `fileUri` to `avatars/{userId}/avatar` and returns public URL. */
export async function uploadAvatarToStorage(userId: string, fileUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const lower = fileUri.toLowerCase();
  const ext = lower.endsWith(".png") ? "png" : "jpg";
  const contentType = ext === "png" ? "image/png" : "image/jpeg";
  const path = `${userId}/avatar.${ext}`;
  const bytes = base64ToUint8Array(base64);
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, {
      contentType,
      upsert: true,
    });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
