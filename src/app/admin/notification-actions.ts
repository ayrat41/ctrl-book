"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNotificationSettings() {
  let settings = await prisma.notificationSetting.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.notificationSetting.create({
      data: { id: "default" },
    });
  }
  return settings;
}

export async function updateNotificationSettings(data: {
  reminderHours: number;
  smsConfirmationTemplate: string;
  smsReminderTemplate: string;
  emailConfirmationSubject: string;
  emailReminderSubject: string;
}) {
  const result = await prisma.notificationSetting.upsert({
    where: { id: "default" },
    update: data,
    create: {
      id: "default",
      ...data,
    },
  });

  revalidatePath("/admin/notifications");
  return result;
}
