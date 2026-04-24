import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const studios = await prisma.studio.findMany({
      select: { roomId: true },
      distinct: ["roomId"],
    });

    const types = studios.map(s => s.roomId).filter(Boolean) as string[];

    // If there are no types yet, return a fallback empty array
    // The UI can decide to show something default or just an empty list
    return NextResponse.json(types);
  } catch (error) {
    console.error("Error fetching studio types:", error);
    return NextResponse.json(
      { error: "Failed to fetch studio types" },
      { status: 500 }
    );
  }
}
