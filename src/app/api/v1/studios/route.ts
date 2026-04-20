import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const studios = await prisma.studio.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(studios);
  } catch (error) {
    console.error("Fetch all studios err:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
