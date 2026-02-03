import { NextRequest, NextResponse } from "next/server";
import { routeRequest, getCountryFromRequest, DEFAULT_FALLBACK_URL } from "@/app/lib/router-logic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;

  if (!handle) {
    return NextResponse.redirect(
      `${DEFAULT_FALLBACK_URL}?ref=no_handle`,
      302,
    );
  }

  try {
    const countryCode = getCountryFromRequest(request);

    const result = await routeRequest({
      artistHandle: handle,
      countryCode,
    });

    // Return 302 redirect to the resolved destination
    return NextResponse.redirect(result.destinationUrl, 302);
  } catch (error) {
    console.error("Router API error:", error);

    // Fallback to default AMPLIFY page on any error
    return NextResponse.redirect(
      `${DEFAULT_FALLBACK_URL}?ref=api_error`,
      302,
    );
  }
}

// export const runtime = 'edge' // Disabled: Supabase admin client requires Node.js runtime
