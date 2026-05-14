import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCustomerConfirmation, sendAdminNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { checkout_reference } = body;

  if (!checkout_reference) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: checkout_reference },
  });

  if (!booking || !booking.paymentId) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  // Verify actual payment status directly with SumUp — don't trust the webhook body
  const sumupRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${booking.paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.SUMUP_API_KEY}` },
  });

  if (!sumupRes.ok) {
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  const checkout = await sumupRes.json();
  const status: string = checkout.status;

  if (status === "PAID") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", paymentStatus: "PAID" },
    });

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
    ]);
  } else if (status === "FAILED" || status === "CANCELLED") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", paymentStatus: status },
    });
  }

  return NextResponse.json({ ok: true });
}
