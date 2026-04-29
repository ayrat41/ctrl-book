import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import twilio from "twilio";
import { render } from "@react-email/render";
import BookingConfirmationEmail from "@/emails/BookingConfirmationEmail";
import BookingReminderEmail from "@/emails/BookingReminderEmail";
import * as React from "react";
import prisma from "@/lib/prisma";

// Initialize clients
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export type BookingLike = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
};
export type CustomerLike = {
  fullName: string;
  email: string;
  phone: string | null;
};
export type StudioLike = { name: string };
export type LocationLike = { name: string };

async function logNotification(
  bookingId: string | null,
  type: string,
  channel: string,
  status: string,
  errorMessage?: string,
) {
  try {
    await prisma.notificationLog.create({
      data: {
        bookingId,
        type,
        channel,
        status,
        errorMessage,
      },
    });
  } catch (err) {
    console.error("[LOG] Failed to log notification:", err);
  }
}

async function buildAppUrls(bookingId: string) {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return {
    appUrl,
    manageUrl: `${appUrl}/manage/${bookingId}`,
  };
}

const buildMessage = (
  template: string,
  data: {
    customerName: string;
    studioName: string;
    locationName: string;
    timeString: string;
    manageUrl: string;
  },
) => {
  return template
    .replace(/{{customerName}}/g, data.customerName)
    .replace(/{{studioName}}/g, data.studioName)
    .replace(/{{locationName}}/g, data.locationName)
    .replace(/{{time}}/g, data.timeString)
    .replace(/{{manageUrl}}/g, data.manageUrl);
};

export async function sendConfirmation(
  booking: BookingLike,
  customer: CustomerLike,
  studio: StudioLike,
  location: LocationLike,
  mediaUrl?: string,
) {
  const { manageUrl } = await buildAppUrls(booking.id);
  const timeString = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(booking.startTime));
  
  const settings = (await prisma.notificationSetting.findUnique({
    where: { id: "default" },
  })) || {
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
  };

  const data = {
    customerName: customer.fullName,
    studioName: studio.name,
    locationName: location.name,
    timeString,
    manageUrl,
  };

  // 1. Send Email via AWS SES
  try {
    const html = await render(
      BookingConfirmationEmail({
        ...data,
        startTime: booking.startTime,
        endTime: booking.endTime,
      }) as React.ReactElement,
    );
    await sesClient.send(
      new SendEmailCommand({
        Destination: { ToAddresses: [customer.email] },
        Message: {
          Body: { Html: { Data: html } },
          Subject: { Data: buildMessage(settings.emailConfirmationSubject, data) },
        },
        Source: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      }),
    );
    await logNotification(booking.id, "confirmation", "email", "success");
  } catch (err: any) {
    await logNotification(
      booking.id,
      "confirmation",
      "email",
      "failed",
      err.message,
    );
  }

  // 2. Send SMS/MMS via Twilio
  if (customer.phone) {
    try {
      const body = buildMessage(settings.smsConfirmationTemplate, data);
      await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: customer.phone.replace(/\s+/g, ""),
        mediaUrl: mediaUrl ? [mediaUrl] : undefined,
      });
      await logNotification(booking.id, "confirmation", "sms", "success");
    } catch (err: any) {
      await logNotification(
        booking.id,
        "confirmation",
        "sms",
        "failed",
        err.message,
      );
    }
  }

  // 3. IMPORTANT: Update Booking Status from Pending to Confirmed
  if (booking.status === "pending") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "confirmed" },
    });
    console.log(`[NOTIFY] Booking ${booking.id} transitioned to CONFIRMED.`);
  }
}

export async function sendReminder(
  booking: BookingLike,
  customer: CustomerLike,
  studio: StudioLike,
  location: LocationLike,
  mediaUrl?: string,
) {
  const { manageUrl } = await buildAppUrls(booking.id);
  const timeString = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(booking.startTime));
  const settings = (await prisma.notificationSetting.findUnique({
    where: { id: "default" },
  })) || {
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
  };

  const data = {
    customerName: customer.fullName,
    studioName: studio.name,
    locationName: location.name,
    timeString,
    manageUrl,
  };

  try {
    const html = await render(
      BookingReminderEmail({
        ...data,
        startTime: booking.startTime,
        endTime: booking.endTime,
      }) as React.ReactElement,
    );
    await sesClient.send(
      new SendEmailCommand({
        Destination: { ToAddresses: [customer.email] },
        Message: {
          Body: { Html: { Data: html } },
          Subject: { Data: buildMessage(settings.emailReminderSubject, data) },
        },
        Source: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      }),
    );
    await logNotification(booking.id, "reminder", "email", "success");
  } catch (err: any) {
    await logNotification(
      booking.id,
      "reminder",
      "email",
      "failed",
      err.message,
    );
  }

  if (customer.phone) {
    try {
      const body = buildMessage(settings.smsReminderTemplate, data);
      await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: customer.phone.replace(/\s+/g, ""),
        mediaUrl: mediaUrl ? [mediaUrl] : undefined,
      });
      await logNotification(booking.id, "reminder", "sms", "success");
    } catch (err: any) {
      await logNotification(booking.id, "reminder", "sms", "failed", err.message);
    }
  }
}

export async function sendCancellation(
  booking: BookingLike,
  customer: CustomerLike,
  studio: StudioLike,
  location: LocationLike,
) {
  const { manageUrl } = await buildAppUrls(booking.id);
  const timeString = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(booking.startTime));
  const settings = (await prisma.notificationSetting.findUnique({
    where: { id: "default" },
  })) || {
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
  };

  const data = {
    customerName: customer.fullName,
    studioName: studio.name,
    locationName: location.name,
    timeString,
    manageUrl,
  };

  try {
    await sesClient.send(
      new SendEmailCommand({
        Destination: { ToAddresses: [customer.email] },
        Message: {
          Body: {
            Text: { Data: buildMessage(settings.smsCancellationTemplate, data) },
          },
          Subject: { Data: buildMessage(settings.emailCancellationSubject, data) },
        },
        Source: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      }),
    );
    await logNotification(booking.id, "cancellation", "email", "success");
  } catch (err: any) {
    await logNotification(
      booking.id,
      "cancellation",
      "email",
      "failed",
      err.message,
    );
  }

  if (customer.phone) {
    try {
      const body = buildMessage(settings.smsCancellationTemplate, data);
      await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: customer.phone.replace(/\s+/g, ""),
      });
      await logNotification(booking.id, "cancellation", "sms", "success");
    } catch (err: any) {
      await logNotification(
        booking.id,
        "cancellation",
        "sms",
        "failed",
        err.message,
      );
    }
  }
}

export async function sendReschedule(
  booking: BookingLike,
  customer: CustomerLike,
  studio: StudioLike,
  location: LocationLike,
) {
  const { manageUrl } = await buildAppUrls(booking.id);
  const timeString = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(booking.startTime));
  const settings = (await prisma.notificationSetting.findUnique({
    where: { id: "default" },
  })) || {
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
  };

  const data = {
    customerName: customer.fullName,
    studioName: studio.name,
    locationName: location.name,
    timeString,
    manageUrl,
  };

  try {
    await sesClient.send(
      new SendEmailCommand({
        Destination: { ToAddresses: [customer.email] },
        Message: {
          Body: {
            Text: { Data: buildMessage(settings.smsRescheduleTemplate, data) },
          },
          Subject: { Data: buildMessage(settings.emailRescheduleSubject, data) },
        },
        Source: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      }),
    );
    await logNotification(booking.id, "reschedule", "email", "success");
  } catch (err: any) {
    await logNotification(
      booking.id,
      "reschedule",
      "email",
      "failed",
      err.message,
    );
  }

  if (customer.phone) {
    try {
      const body = buildMessage(settings.smsRescheduleTemplate, data);
      await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: customer.phone.replace(/\s+/g, ""),
      });
      await logNotification(booking.id, "reschedule", "sms", "success");
    } catch (err: any) {
      await logNotification(
        booking.id,
        "reschedule",
        "sms",
        "failed",
        err.message,
      );
    }
  }
}

export async function scheduleReminder(
  bookingId: string,
  startTime: Date,
  reminderHours: number = 24,
) {
  console.log(
    `[WORKER] Skipping QStash scheduling for ${bookingId}. The background worker will pick it up.`,
  );
  return;
}


