import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BookingReminderEmailProps {
  customerName: string;
  studioName: string;
  locationName: string;
  startTime: Date;
  manageUrl?: string;
}

export const BookingReminderEmail = ({
  customerName,
  studioName,
  locationName,
  startTime,
  endTime,
  manageUrl,
}: BookingReminderEmailProps) => {
  const timeString = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(startTime));

  return (
    <Html>
      <Head />
      <Preview>Reminder: Your booking at {studioName} is coming up!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Upcoming Booking Reminder ⏰</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            This is a quick reminder that your booking at <strong>{studioName}</strong> ({locationName}) is tomorrow at <strong>{timeString}</strong>.
          </Text>
          
          {manageUrl && (
            <div style={{ padding: "0 48px", marginTop: "24px" }}>
              <a 
                href={manageUrl} 
                style={{ 
                  backgroundColor: "#000", 
                  color: "#fff", 
                  padding: "12px 24px", 
                  borderRadius: "8px", 
                  textDecoration: "none", 
                  fontWeight: "bold", 
                  display: "inline-block"
                }}
              >
                Manage Reservation
              </a>
            </div>
          )}

          <Text style={text}>
            See you soon!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingReminderEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  padding: "0 48px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 48px",
};
