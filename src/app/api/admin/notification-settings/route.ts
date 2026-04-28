import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // We only have one settings record with id "default"
    const settings = await prisma.notificationSetting.upsert({
      where: { id: "default" },
      update: data,
      create: { ...data, id: "default" },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("[SETTINGS_UPDATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
