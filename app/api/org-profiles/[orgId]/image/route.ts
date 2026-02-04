import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const BUCKET = "router-org-images";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB" },
        { status: 400 },
      );
    }

    // Delete previous image if one exists
    const { data: existingProfile } = (await supabaseAdmin
      .from("router_org_profiles")
      .select("image_url")
      .eq("org_id", orgId)
      .single()) as {
      data: { image_url: string | null } | null;
      error: unknown;
    };

    if (existingProfile?.image_url) {
      // Extract path from the full URL
      const url = new URL(existingProfile.image_url);
      const pathParts = url.pathname.split(`/object/public/${BUCKET}/`);
      if (pathParts[1]) {
        await supabaseAdmin.storage.from(BUCKET).remove([pathParts[1]]);
      }
    }

    // Upload new image
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${orgId}/${timestamp}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);

    // Upsert profile with new image_url
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabaseAdmin.from("router_org_profiles") as any)
      .upsert(
        { org_id: orgId, image_url: publicUrl },
        { onConflict: "org_id" },
      );

    if (profileError) {
      throw profileError;
    }

    return NextResponse.json({ image_url: publicUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;

    // Get current image URL
    const { data: profile } = (await supabaseAdmin
      .from("router_org_profiles")
      .select("image_url")
      .eq("org_id", orgId)
      .single()) as {
      data: { image_url: string | null } | null;
      error: unknown;
    };

    if (profile?.image_url) {
      // Remove from storage
      const url = new URL(profile.image_url);
      const pathParts = url.pathname.split(`/object/public/${BUCKET}/`);
      if (pathParts[1]) {
        await supabaseAdmin.storage.from(BUCKET).remove([pathParts[1]]);
      }
    }

    // Clear image_url on profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from("router_org_profiles") as any)
      .update({ image_url: null })
      .eq("org_id", orgId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
