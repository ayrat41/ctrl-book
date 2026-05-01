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

interface BookingItem {
  id: string;
  studioName: string;
  locationName: string;
  startTime: Date;
  endTime: Date;
  manageUrl?: string;
}

interface BookingConfirmationEmailProps {
  customerName: string;
  bookings: BookingItem[];
}

export const BookingConfirmationEmail = ({
  customerName,
  bookings,
}: BookingConfirmationEmailProps) => {
  const isMultiple = bookings.length > 1;

  return (
    <Html>
      <Head />
      <Preview>Your {isMultiple ? 'bookings' : 'booking'} confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{isMultiple ? 'Bookings' : 'Booking'} Confirmed 🎉</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Your {isMultiple ? 'reservations are' : 'reservation is'} confirmed:
          </Text>
          
          <div style={{ padding: "0 48px" }}>
            {bookings.map((booking, index) => {
              const timeString = new Intl.DateTimeFormat('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
              }).format(new Date(booking.startTime));
              
              return (
                <div key={index} style={{ marginBottom: "32px", borderLeft: "4px solid #000", paddingLeft: "16px" }}>
                  <Text style={{ margin: 0, fontWeight: "bold" }}>{booking.studioName}</Text>
                  <Text style={{ margin: 0, fontSize: "14px", color: "#666" }}>{booking.locationName}</Text>
                  <Text style={{ margin: 0, fontSize: "14px" }}>{timeString}</Text>
                  
                  {booking.manageUrl && (
                    <div style={{ marginTop: "12px" }}>
                      <a 
                        href={booking.manageUrl} 
                        style={{ 
                          backgroundColor: "#f4f4f4", 
                          color: "#000", 
                          padding: "8px 16px", 
                          borderRadius: "6px", 
                          textDecoration: "none", 
                          fontSize: "12px",
                          fontWeight: "bold",
                          display: "inline-block"
                        }}
                      >
                        Manage or Reschedule
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>


          <Text style={{ ...text, marginTop: "24px" }}>
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
