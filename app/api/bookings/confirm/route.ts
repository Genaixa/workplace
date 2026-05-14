import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCustomerConfirmation, sendAdminNotification } from "@/lib/email";

// GET /api/bookings/confirm?id=xxx
// Returns booking status — used by the confirm page to poll after payment.
// If still PENDING, actively checks SumUp so confirmation doesn't depend solely on webhooks.
export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  // If still pending, actively poll SumUp rather than waiting for the webhook
  if (booking.status === "PENDING" && booking.paymentId) {
    try {
      const sumupRes = await fetch(
        `https://api.sumup.com/v0.1/checkouts/${booking.paymentId}`,
        { headers: { Authorization: `Bearer ${process.env.SUMUP_API_KEY}` } }
      );

      if (sumupRes.ok) {
        const checkout = await sumupRes.json();
        const sumupStatus: string = checkout.status;

        if (sumupStatus === "PAID") {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: "CONFIRMED", paymentStatus: "PAID" },
          });
          booking.status = "CONFIRMED";

          const dateStr = booking.date.toLocaleDateString("en-GB", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          });
          await Promise.all([
            sendCustomerConfirmation({
              bookingId: booking.id,
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              date: dateStr,
              startHour: booking.startHour,
              hours: booking.hours,
              amount: booking.amount,
            }),
            sendAdminNotification({
              bookingId: booking.id,
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              date: dateStr,
              startHour: booking.startHour,
              hours: booking.hours,
              amount: booking.amount,
            }),
          ]).catch(() => { /* emails are best-effort */ });
        } else if (sumupStatus === "FAILED" || sumupStatus === "CANCELLED") {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: "CANCELLED", paymentStatus: sumupStatus },
          });
          booking.status = "CANCELLED";
        }
      }
    } catch {
      // SumUp check failed — return current DB status and let the client retry
    }
  }

  return NextResponse.json({
    id: booking.id,
    status: booking.status,
    customerName: booking.customerName,
    date: booking.date,
    startHour: booking.startHour,
    hours: booking.hours,
    amount: booking.amount,
  });
}
