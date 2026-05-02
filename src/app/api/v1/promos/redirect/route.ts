import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const promo = searchParams.get("promo");

    // Get Framer URL from environment variables
    const framerBaseUrl = process.env.NEXT_PUBLIC_FRAMER_URL || "https://yourdomain.com/booking";
    
    // Construct target URL
    const targetUrl = new URL(framerBaseUrl);
    if (date) targetUrl.searchParams.set("date", date);
    if (promo) targetUrl.searchParams.set("promo", promo);

    // Append the #booking-widget anchor hash
    const redirectUrl = `${targetUrl.toString()}#booking-widget`;

    return NextResponse.redirect(redirectUrl, 302);
  } catch (err: any) {
    console.error("[PROMO REDIRECT] Error:", err);
    return NextResponse.json(
      { error: "Invalid URL redirect" },
      { status: 500 }
    );
  }
}
