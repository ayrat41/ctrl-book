import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const addons = await prisma.addOn.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(addons);
  } catch (error) {
    console.error("Error fetching add-ons:", error);
    return NextResponse.json({ error: "Failed to fetch addons" }, { status: 500 });
  }
}
