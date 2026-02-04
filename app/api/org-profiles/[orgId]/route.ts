import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { stripUtmParams, isSamePrimaryDomain } from "@/app/lib/url-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;

    // Fetch org base data from org_public_view
    const { data: org, error: orgError } = await supabaseAdmin
      .from("org_public_view")
      .select("*")
      .eq("id", orgId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Fetch profile (may not exist yet)
    const { data: profile } = (await supabaseAdmin
      .from("router_org_profiles")
      .select("*")
      .eq("org_id", orgId)
      .single()) as {
      data: {
        id: string;
        org_id: string;
        org_name: string | null;
        mission: string | null;
        cta_url: string | null;
        cta_text: string | null;
        fan_actions: string[] | null;
        image_url: string | null;
        created_at: string;
        updated_at: string;
      } | null;
      error: unknown;
    };

    // Fetch tour overrides pointing to this org (with tour + artist details)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: linkedTours } = (await (supabaseAdmin.from("router_tour_overrides") as any)
      .select(
        `
        id,
        country_code,
        enabled,
        tour:router_tours (
          id,
          name,
          start_date,
          end_date,
          enabled,
          router_artists (id, handle, name)
        )
      `,
      )
      .eq("org_id", orgId)) as {
      data:
        | {
            id: string;
            country_code: string;
            enabled: boolean;
            tour: {
              id: string;
              name: string;
              start_date: string;
              end_date: string;
              enabled: boolean;
              router_artists: { id: string; handle: string; name: string };
            };
          }[]
        | null;
      error: unknown;
    };

    // Fetch country defaults where this org is the recommended org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: countryDefaults } = (await (supabaseAdmin.from("router_country_defaults") as any)
      .select("id, country_code, effective_from, effective_to, notes")
      .eq("org_id", orgId)) as {
      data:
        | {
            id: string;
            country_code: string;
            effective_from: string | null;
            effective_to: string | null;
            notes: string | null;
          }[]
        | null;
      error: unknown;
    };

    // For each country default, find up to 2 active/upcoming tours that would
    // implicitly route here (tours with overrides in this country but no org_id
    // set, OR tours without any override for this country at all).
    const todayStr = new Date().toISOString().split("T")[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const implicitTours: Record<string, any[]> = {};

    if (countryDefaults && countryDefaults.length > 0) {
      const countryCodes = [
        ...new Set(countryDefaults.map((d) => d.country_code)),
      ];

      for (const cc of countryCodes) {
        // Fetch active/upcoming tours that have an override for this country
        // pointing to a different org or no org (null = use MDE default)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: tours } = (await (supabaseAdmin.from("router_tours") as any)
          .select(
            `
            id,
            name,
            start_date,
            end_date,
            enabled,
            router_artists (id, handle, name),
            router_tour_overrides!inner (
              country_code,
              org_id
            )
          `,
          )
          .eq("enabled", true)
          .gte("end_date", todayStr)
          .eq("router_tour_overrides.country_code", cc)
          .is("router_tour_overrides.org_id", null)
          .limit(2)) as {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: any[] | null;
          error: unknown;
        };

        // Also find tours that have NO override for this country at all
        // (they would also fall through to the country default)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: allActiveTours } = (await (supabaseAdmin.from("router_tours") as any)
          .select(
            `
            id,
            name,
            start_date,
            end_date,
            enabled,
            router_artists (id, handle, name),
            router_tour_overrides (
              country_code
            )
          `,
          )
          .eq("enabled", true)
          .gte("end_date", todayStr)
          .limit(20)) as {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: any[] | null;
          error: unknown;
        };

        const toursWithoutOverride = (allActiveTours || []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t: any) =>
            !t.router_tour_overrides?.some(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (o: any) => o.country_code === cc,
            ),
        );

        // Merge both lists, deduplicate, take first 2
        const tourIds = new Set<string>();
        const merged = [];
        for (const t of [...(tours || []), ...toursWithoutOverride]) {
          if (!tourIds.has(t.id)) {
            tourIds.add(t.id);
            merged.push({
              id: t.id,
              name: t.name,
              start_date: t.start_date,
              end_date: t.end_date,
              router_artists: t.router_artists,
            });
          }
          if (merged.length >= 2) break;
        }

        implicitTours[cc] = merged;
      }
    }

    return NextResponse.json({
      profile,
      org,
      linkedTours: linkedTours || [],
      countryDefaults: countryDefaults || [],
      implicitTours,
    });
  } catch (error) {
    console.error("Error fetching org profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch org profile" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const body = await request.json();
    const { org_name, mission, cta_text, fan_actions } = body;
    let { cta_url } = body;

    const warnings: string[] = [];

    // Validate org exists and get website for domain check
    const { data: org, error: orgError } = (await supabaseAdmin
      .from("org_public_view")
      .select("*")
      .eq("id", orgId)
      .single()) as {
      data: { id: string; website: string | null } | null;
      error: unknown;
    };

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Process cta_url if provided
    if (cta_url) {
      // Validate URL format
      try {
        new URL(cta_url);
      } catch {
        return NextResponse.json(
          { error: "Invalid CTA URL format" },
          { status: 400 },
        );
      }

      // Strip UTM parameters — the router appends its own at redirect time
      const { url: cleanUrl, stripped } = stripUtmParams(cta_url);
      if (stripped) {
        cta_url = cleanUrl;
        warnings.push(
          "UTM parameters were removed. The router adds consistent UTM tracking at redirect time.",
        );
      }

      // Check domain against org website
      if (org.website && !isSamePrimaryDomain(cta_url, org.website)) {
        warnings.push(
          "CTA URL domain does not match the organization's website. AMPLIFY CTA links should point to the organization's own site.",
        );
      }
    }

    // Upsert profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error } = await (supabaseAdmin.from("router_org_profiles") as any)
      .upsert(
        {
          org_id: orgId,
          org_name: org_name || null,
          mission: mission || null,
          cta_url: cta_url || null,
          cta_text: cta_text || null,
          fan_actions: fan_actions || null,
        },
        { onConflict: "org_id" },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      profile,
      ...(warnings.length > 0 ? { warnings } : {}),
    });
  } catch (error) {
    console.error("Error saving org profile:", error);
    return NextResponse.json(
      { error: "Failed to save org profile" },
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from("router_org_profiles") as any)
      .delete()
      .eq("org_id", orgId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting org profile:", error);
    return NextResponse.json(
      { error: "Failed to delete org profile" },
      { status: 500 },
    );
  }
}
