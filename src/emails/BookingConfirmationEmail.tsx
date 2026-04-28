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

interface BookingConfirmationEmailProps {
  customerName: string;
  studioName: string;
  locationName: string;
  startTime: Date;
  endTime: Date;
  manageUrl?: string;
}

export const BookingConfirmationEmail = ({
  customerName,
  studioName,
  locationName,
  startTime,
  endTime,
  manageUrl,
}: BookingConfirmationEmailProps) => {
  const timeString = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(startTime));

  return (
    <Html>
      <Head />
      <Preview>Your booking at {studioName} is confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Booking Confirmed 🎉</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Your booking at <strong>{studioName}</strong> ({locationName}) is confirmed for <strong>{timeString}</strong>.
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
            We look forward to seeing you!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingConfirmationEmail;

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
