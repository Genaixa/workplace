import nodemailer from "nodemailer";
import { formatPrice } from "./pricing";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "25"),
  secure: false,
  ...(process.env.SMTP_USER && {
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  }),
});

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  date: string;
  startHour: number;
  hours: number;
  amount: number;
  bookingId: string;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatTime(hour: number): string {
  const suffix = hour >= 12 ? "pm" : "am";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:00${suffix}`;
}

export async function sendCustomerConfirmation(data: BookingEmailData) {
  const endHour = data.startHour + data.hours;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Booking Confirmed — The Work Place</h2>
      <p>Hi ${esc(data.customerName)},</p>
      <p>Your desk booking has been confirmed. Here are your details:</p>
      <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #555;">Date</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${esc(data.date)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #555;">Time</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatTime(data.startHour)} – ${formatTime(endHour)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #555;">Duration</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.hours} hour${data.hours > 1 ? "s" : ""}</td></tr>
        <tr><td style="padding: 8px; color: #555;">Amount paid</td><td style="padding: 8px; font-weight: bold;">${formatPrice(data.amount)}</td></tr>
      </table>
      <p><strong>Address:</strong> Unit 5, Former Swallow Hotel, High West Street, Gateshead, NE8 1PE</p>
      <p>If you need to amend or cancel your booking, please contact us at least 2 hours before your start time.</p>
      <p>📞 0191 468 3968</p>
      <p>We look forward to seeing you!</p>
      <p style="color: #888; font-size: 12px;">Booking reference: ${esc(data.bookingId)}</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "bookings@theworkplaceuk.co.uk",
    to: data.customerEmail,
    subject: `Booking Confirmed – ${data.date} at The Work Place`,
    html,
  });
}

export async function sendAdminNotification(data: BookingEmailData) {
  const endHour = data.startHour + data.hours;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">New Booking Received</h2>
      <table style="width:100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #555;">Customer</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${esc(data.customerName)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #555;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${esc(data.customerEmail)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #555;">Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${esc(data.date)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #555;">Time</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${formatTime(data.startHour)} – ${formatTime(endHour)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #555;">Duration</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.hours} hour${data.hours > 1 ? "s" : ""}</td></tr>
        <tr><td style="padding: 8px; color: #555;">Amount</td><td style="padding: 8px;">${formatPrice(data.amount)}</td></tr>
      </table>
      <p style="color: #888; font-size: 12px;">Booking ID: ${esc(data.bookingId)}</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "bookings@theworkplaceuk.co.uk",
    to: process.env.ADMIN_EMAIL || "info@theworkplaceuk.co.uk",
    subject: `New Booking: ${esc(data.customerName)} – ${data.date} ${formatTime(data.startHour)}`,
    html,
  });
}
