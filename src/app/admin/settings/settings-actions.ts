"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getGlobalSettings() {
  let settings = await prisma.globalSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.globalSettings.create({
      data: { id: "default" },
    });
  }
  return settings;
}

export async function updateGlobalSettings(data: {
  cancellationWindowHours: number;
  rescheduleWindowHours: number;
  rescheduleFee: number;
}) {
  const result = await prisma.globalSettings.upsert({
    where: { id: "default" },
    update: data,
    create: {
      id: "default",
      ...data,
    },
  });

  revalidatePath("/admin/settings");
  return result;
}
