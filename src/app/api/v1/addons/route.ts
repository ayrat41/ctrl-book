import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const checkDate = dateStr ? new Date(dateStr) : new Date();

    const addons = await prisma.addOn.findMany({
      where: { 
        isActive: true,
        OR: [
          {
            AND: [
              { validFrom: { lte: checkDate } },
              { validTo: { gte: checkDate } }
            ]
          },
          {
            AND: [
              { validFrom: null },
              { validTo: null }
            ]
          }
        ]
      },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(addons);
  } catch (error) {
    console.error("Error fetching add-ons:", error);
    return NextResponse.json({ error: "Failed to fetch addons" }, { status: 500 });
  }
}
