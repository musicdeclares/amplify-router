import { NextRequest, NextResponse } from "next/server";
import { routeRequest, getCountryFromRequest, getFallbackBaseUrl } from "@/app/lib/router-logic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const fallbackBase = getFallbackBaseUrl();

  if (!handle) {
    return NextResponse.redirect(`${fallbackBase}/?ref=no_handle`, 302);
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
    return NextResponse.redirect(`${fallbackBase}/?ref=api_error`, 302);
  }
}

// export const runtime = 'edge' // Disabled: Supabase admin client requires Node.js runtime
