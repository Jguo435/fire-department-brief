import { NextRequest, NextResponse } from "next/server";
import { compileBrief } from "@/lib/brief-compiler";
import { checkRateLimit } from "@/lib/rate-limit";
import { isValidPlaceId } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const limit = checkRateLimit(client);
    if (!limit.allowed)
      return NextResponse.json(
        {
          success: false,
          error: "Too many briefs requested. Try again in a minute.",
          warnings: [],
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    const body = await request.json();
    const { placeId } = body;

    if (!isValidPlaceId(placeId)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid Google Place ID.", warnings: [] },
        { status: 400 },
      );
    }

    const brief = await compileBrief(placeId.trim());

    return NextResponse.json(brief);
  } catch {
    return NextResponse.json(
      { success: false, error: "The request could not be processed.", warnings: [] },
      { status: 500 },
    );
  }
}
