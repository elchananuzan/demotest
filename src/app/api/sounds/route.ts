import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null; // "siren" | "early" | "clear"

  if (!file || !type || !["siren", "early", "clear"].includes(type)) {
    return NextResponse.json({ error: "Missing file or type" }, { status: 400 });
  }

  // Generate a unique path: sounds/{type}/{timestamp}-{name}
  const ext = file.name.split(".").pop() || "mp3";
  const path = `${type}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("sounds")
    .upload(path, buffer, {
      contentType: file.type || "audio/mpeg",
      upsert: true,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("sounds").getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}

export async function DELETE(req: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { path } = await req.json();
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Extract storage path from full URL
  const match = path.match(/\/sounds\/(.+)$/);
  const storagePath = match ? match[1] : path;

  const { error } = await supabase.storage.from("sounds").remove([storagePath]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
