import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "25"),
  secure: false,
  ...(process.env.SMTP_USER && {
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  }),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "bookings@theworkplaceuk.co.uk",
    to: process.env.ADMIN_EMAIL || "info@theworkplaceuk.co.uk",
    replyTo: email,
    subject: `Website enquiry from ${esc(name)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Website Enquiry</h2>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #555; width: 120px;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${esc(name)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #555;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
          <tr><td style="padding: 8px; color: #555; vertical-align: top;">Message</td><td style="padding: 8px; white-space: pre-wrap;">${esc(message)}</td></tr>
        </table>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
