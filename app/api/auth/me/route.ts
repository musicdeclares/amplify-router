import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { getApiUser } from "@/app/lib/api-auth";

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get email from auth user
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
      user.id,
    );

    return NextResponse.json({
      id: user.id,
      role: user.role,
      email: authUser?.user?.email ?? null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
