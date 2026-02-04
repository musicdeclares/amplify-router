import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";

export async function GET() {
  try {
    // Fetch all profiles that have fan_actions
    const { data: profiles, error } = (await supabaseAdmin
      .from("router_org_profiles")
      .select("fan_actions")
      .not("fan_actions", "is", null)) as {
      data: Array<{ fan_actions: string[] | null }> | null;
      error: unknown;
    };

    if (error) {
      throw error;
    }

    // Extract distinct fan_actions
    const allActions = new Set<string>();
    for (const profile of profiles || []) {
      if (profile.fan_actions) {
        for (const action of profile.fan_actions) {
          allActions.add(action);
        }
      }
    }

    return NextResponse.json({
      fan_actions: Array.from(allActions).sort(),
    });
  } catch (error) {
    console.error("Error fetching fan actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch fan actions" },
      { status: 500 },
    );
  }
}
