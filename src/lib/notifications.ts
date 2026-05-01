import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Resend } from "resend";
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
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || "AC_dummy_sid",
  process.env.TWILIO_AUTH_TOKEN || "dummy_token",
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

function formatPhone(phone: string) {
  if (phone.startsWith("+")) return phone.replace(/\s+/g, "");
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) return `+1${cleaned}`;
  return `+${cleaned}`;
}


async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  const provider = process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : 'ses');
  const from = process.env.EMAIL_FROM || (provider === 'resend' ? 'onboarding@resend.dev' : 'noreply@yourdomain.com');

  if (provider === "resend") {
    const resendOptions: any = {
      from,
      to,
      subject,
    };
    if (html) resendOptions.html = html;
    if (text) resendOptions.text = text;

    return await resend.emails.send(resendOptions);
  } else {
    return await sesClient.send(
      new SendEmailCommand({
        Destination: { ToAddresses: [to] },
        Message: {
          Body: {
            Html: html ? { Data: html } : undefined,
            Text: text ? { Data: text } : undefined,
          },
          Subject: { Data: subject },
        },
        Source: from,
      }),
    );
  }
}

export async function sendConfirmation(
  bookings: (BookingLike & { studio: StudioLike & { location: LocationLike } })[],
  customer: CustomerLike,
  mediaUrl?: string,
) {
  if (bookings.length === 0) return;

  const firstBooking = bookings[0];
  const { manageUrl } = await buildAppUrls(firstBooking.id);
  
  const isMultiple = bookings.length > 1;
  const timeString = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(firstBooking.startTime));

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
    studioName: isMultiple ? "Multiple Studios" : firstBooking.studio.name,
    locationName: firstBooking.studio.location.name,
    timeString: isMultiple ? `${bookings.length} reservations` : timeString,
    manageUrl,
  };

  // 1. Send Email
  try {
    const bookingItems = await Promise.all(
      bookings.map(async (b) => {
        const { manageUrl: individualManageUrl } = await buildAppUrls(b.id);
        return {
          id: b.id,
          studioName: b.studio.name,
          locationName: b.studio.location.name,
          startTime: b.startTime,
          endTime: b.endTime,
          manageUrl: individualManageUrl,
        };
      })
    );

    const html = await render(
      BookingConfirmationEmail({
        customerName: customer.fullName,
        bookings: bookingItems,
      }) as React.ReactElement,
    );
    await sendEmail({
      to: customer.email,
      subject: buildMessage(settings.emailConfirmationSubject, data),
      html,
    });
    
    for (const b of bookings) {
      await logNotification(b.id, "confirmation", "email", "success");
    }
  } catch (err: any) {
    for (const b of bookings) {
      await logNotification(
        b.id,
        "confirmation",
        "email",
        "failed",
        err.message,
      );
    }
  }

  // 2. Send SMS/MMS via Twilio
  if (customer.phone) {
    try {
      const body = buildMessage(settings.smsConfirmationTemplate, data);
      await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formatPhone(customer.phone),
        mediaUrl: mediaUrl ? [mediaUrl] : undefined,
      });
      for (const b of bookings) {
        await logNotification(b.id, "confirmation", "sms", "success");
      }
    } catch (err: any) {
      for (const b of bookings) {
        await logNotification(
          b.id,
          "confirmation",
          "sms",
          "failed",
          err.message,
        );
      }
    }
  }

  // 3. IMPORTANT: Update Booking Status from Pending to Confirmed
  for (const b of bookings) {
    if (b.status === "pending") {
      await prisma.booking.update({
        where: { id: b.id },
        data: { status: "confirmed" },
      });
      console.log(`[NOTIFY] Booking ${b.id} transitioned to CONFIRMED.`);
    }
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
    await sendEmail({
      to: customer.email,
      subject: buildMessage(settings.emailReminderSubject, data),
      html,
    });
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
        to: formatPhone(customer.phone),
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
    await sendEmail({
      to: customer.email,
      subject: buildMessage(settings.emailCancellationSubject, data),
      text: buildMessage(settings.smsCancellationTemplate, data),
    });
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
        to: formatPhone(customer.phone),
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
    await sendEmail({
      to: customer.email,
      subject: buildMessage(settings.emailRescheduleSubject, data),
      text: buildMessage(settings.smsRescheduleTemplate, data),
    });
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
        to: formatPhone(customer.phone),
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


