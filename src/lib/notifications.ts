import { Resend } from 'resend';
import twilio from 'twilio';
import { Client as QStashClient } from '@upstash/qstash';
import BookingConfirmationEmail from '@/emails/BookingConfirmationEmail';
import BookingReminderEmail from '@/emails/BookingReminderEmail';
import * as React from 'react';
import prisma from '@/lib/prisma';

// Initialize clients. They will naturally be undefined/throw if env vars are missing,
// but we handle checks before calling them so it doesn't crash the build.
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
let twilioClient: twilio.Twilio | null = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}
const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN || 'dummy_token' });

// Define generic types for models that will be passed
export type BookingLike = { id: string; startTime: Date; endTime: Date };
export type CustomerLike = { fullName: string; email: string; phone: string | null };
export type StudioLike = { name: string };
export type LocationLike = { name: string };

export async function sendConfirmation(booking: BookingLike, customer: CustomerLike, studio: StudioLike, location: LocationLike) {
  try {
    const settings = await prisma.notificationSetting.findUnique({ where: { id: "default" } });
    if (!settings) return;

    const timeString = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(booking.startTime));

    const buildMessage = (template: string) => {
      return template
        .replace("{{customerName}}", customer.fullName)
        .replace("{{studioName}}", studio.name)
        .replace("{{locationName}}", location.name)
        .replace("{{time}}", timeString);
    };

    // Send Email
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Ctrl Book <hello@example.com>', // Replace with your domain in production
        to: customer.email,
        subject: buildMessage(settings.emailConfirmationSubject),
        react: BookingConfirmationEmail({
          customerName: customer.fullName,
          studioName: studio.name,
          locationName: location.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
        }) as React.ReactElement,
      });
    }

    // Send SMS
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER && customer.phone) {
      await twilioClient.messages.create({
        body: buildMessage(settings.smsConfirmationTemplate),
        from: process.env.TWILIO_PHONE_NUMBER,
        to: customer.phone,
      });
    }
  } catch (error) {
    console.error("Error sending confirmation notifications:", error);
  }
}

export async function sendReminder(booking: BookingLike, customer: CustomerLike, studio: StudioLike, location: LocationLike) {
  try {
    const settings = await prisma.notificationSetting.findUnique({ where: { id: "default" } });
    if (!settings) return;

    const timeString = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(booking.startTime));

    const buildMessage = (template: string) => {
      return template
        .replace("{{customerName}}", customer.fullName)
        .replace("{{studioName}}", studio.name)
        .replace("{{locationName}}", location.name)
        .replace("{{time}}", timeString);
    };

    // Send Email
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Ctrl Book <hello@example.com>',
        to: customer.email,
        subject: buildMessage(settings.emailReminderSubject),
        react: BookingReminderEmail({
          customerName: customer.fullName,
          studioName: studio.name,
          locationName: location.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
        }) as React.ReactElement,
      });
    }

    // Send SMS
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER && customer.phone) {
      await twilioClient.messages.create({
        body: buildMessage(settings.smsReminderTemplate),
        from: process.env.TWILIO_PHONE_NUMBER,
        to: customer.phone,
      });
    }
  } catch (error) {
    console.error("Error sending reminder notifications:", error);
  }
}

export async function scheduleReminder(bookingId: string, startTime: Date, reminderHours: number = 24) {
  try {
    const reminderTime = new Date(startTime.getTime() - reminderHours * 60 * 60 * 1000); // Dynamic hours before
    const now = new Date();
    
    // Only schedule if it's in the future
    if (reminderTime > now) {
      if (process.env.QSTASH_TOKEN) {
        await qstash.publishJSON({
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/reminders`,
          body: { bookingId },
          notBefore: Math.floor(reminderTime.getTime() / 1000), // Unix timestamp in seconds
        });
        console.log(`Scheduled reminder for booking ${bookingId} at ${reminderTime}`);
      } else {
        console.warn("QSTASH_TOKEN is missing. Reminder not scheduled.");
      }
    } else {
      console.log(`Reminder time (${reminderTime}) is in the past. Skipping.`);
    }
  } catch (error) {
    console.error("Error scheduling reminder:", error);
  }
}
