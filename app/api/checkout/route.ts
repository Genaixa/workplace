import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePrice, applyPromoDiscount, MAX_DESKS } from "@/lib/pricing";

// POST /api/checkout
// Creates a SumUp checkout and a PENDING booking, returns checkout URL
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, startHour, hours, customerName, customerEmail, customerPhone, promoCode } = body;

  if (!date || !startHour || !hours || !customerName || !customerEmail || !customerPhone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (![1, 2, 3, 4].includes(hours)) {
    return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
  }
  if (!Number.isInteger(startHour) || startHour < 8 || startHour > 22) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }

  // Validate promo code if provided
  let appliedPromo: { code: string; discountHours: number } | null = null;
  if (promoCode) {
    const normalized = String(promoCode).trim().toUpperCase();
    const promo = await prisma.promoCode.findUnique({ where: { code: normalized } });
    if (!promo || !promo.active) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
    }
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return NextResponse.json({ error: "This promo code has already been used" }, { status: 400 });
    }
    appliedPromo = { code: promo.code, discountHours: promo.discountHours };
  }

  const bookingDate = new Date(date);
  const endHour = startHour + hours;
  const baseAmount = calculatePrice(hours);
  const discountPence = appliedPromo ? calculatePrice(appliedPromo.discountHours) : 0;
  const amount = appliedPromo ? applyPromoDiscount(hours, appliedPromo.discountHours) : baseAmount;
  const pendingCutoff = new Date(Date.now() - 30 * 60 * 1000);

  // Check availability for all slots this booking covers
  const existingBookings = await prisma.booking.findMany({
    where: {
      date: bookingDate,
      OR: [
        { status: "CONFIRMED" },
        { status: "PENDING", createdAt: { gte: pendingCutoff } },
      ],
    },
    select: { startHour: true, endHour: true },
  });

  for (let h = startHour; h < endHour; h++) {
    const count = existingBookings.filter(
      (b) => b.startHour <= h && b.endHour > h
    ).length;
    if (count >= MAX_DESKS) {
      return NextResponse.json(
        { error: `No desks available at ${h}:00` },
        { status: 409 }
      );
    }
  }

  // If fully covered by promo, confirm immediately without payment
  if (amount === 0) {
    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          date: bookingDate,
          startHour,
          endHour,
          hours,
          amount: 0,
          customerName,
          customerEmail,
          customerPhone,
          status: "CONFIRMED",
          promoCode: appliedPromo!.code,
          discountPence,
        },
      });
      await tx.promoCode.update({
        where: { code: appliedPromo!.code },
        data: { usedCount: { increment: 1 } },
      });
      return b;
    });

    return NextResponse.json({
      bookingId: booking.id,
      checkoutUrl: `${process.env.NEXTAUTH_URL}/book/confirm?id=${booking.id}`,
    });
  }

  // Create PENDING booking first
  const booking = await prisma.booking.create({
    data: {
      date: bookingDate,
      startHour,
      endHour,
      hours,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      status: "PENDING",
      promoCode: appliedPromo?.code ?? null,
      discountPence,
    },
  });

  // Create SumUp checkout
  const promoNote = appliedPromo ? ` (promo: ${appliedPromo.code})` : "";
  const sumupRes = await fetch("https://api.sumup.com/v0.1/checkouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUMUP_API_KEY}`,
    },
    body: JSON.stringify({
      checkout_reference: booking.id,
      amount: amount / 100,
      currency: "GBP",
      description: `Desk booking – ${date} ${startHour}:00 (${hours}h)${promoNote}`,
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      redirect_url: `${process.env.NEXTAUTH_URL}/book/confirm?id=${booking.id}`,
      notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/sumup`,
    }),
  });

  if (!sumupRes.ok) {
    // Roll back pending booking if SumUp fails
    await prisma.booking.delete({ where: { id: booking.id } });
    const err = await sumupRes.json().catch(() => ({}));
    console.error("SumUp error:", err);
    return NextResponse.json(
      { error: "Payment provider error. Please try again." },
      { status: 502 }
    );
  }

  const checkout = await sumupRes.json();

  // Save SumUp checkout ID and increment promo usage atomically
  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { paymentId: checkout.id },
    });
    if (appliedPromo) {
      await tx.promoCode.update({
        where: { code: appliedPromo.code },
        data: { usedCount: { increment: 1 } },
      });
    }
  });

  return NextResponse.json({
    bookingId: booking.id,
    checkoutId: checkout.id,
    checkoutUrl: `${process.env.NEXTAUTH_URL}/book/pay?checkoutId=${checkout.id}&bookingId=${booking.id}`,
  });
}
