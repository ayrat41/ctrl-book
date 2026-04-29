import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.notificationSetting.findUnique({
    where: { id: "default" },
  });

  if (!existing) {
    await prisma.notificationSetting.create({
      data: {
        id: "default",
        emailConfirmationSubject: "Your booking is confirmed, {{customerName}}!",
        smsConfirmationTemplate: "Hi {{customerName}}, your booking at {{studioName}} is confirmed for {{time}}. Details: {{manageUrl}}",
        emailReminderSubject: "Reminder: Your upcoming booking at {{studioName}}",
        smsReminderTemplate: "Reminder: Your booking at {{studioName}} is coming up at {{time}}.",
        emailCancellationSubject: "Booking Cancelled",
        smsCancellationTemplate: "Your booking at {{studioName}} has been cancelled.",
        emailRescheduleSubject: "Booking Rescheduled",
        smsRescheduleTemplate: "Your booking at {{studioName}} has been rescheduled to {{time}}.",
        reminderHours: 24,
      }
    });
    console.log("Created default notification settings.");
  } else {
    console.log("Settings already exist.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
