import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePrice, MAX_DESKS } from "@/lib/pricing";
import { verifyAdminToken } from "@/lib/auth";

// GET /api/admin/bookings?date=2026-05-20
export async function GET(request: NextRequest) {
  if (!await verifyAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  const where = dateStr
    ? { date: new Date(dateStr) }
    : {};

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: [{ date: "asc" }, { startHour: "asc" }],
  });

  return NextResponse.json(bookings);
}

// POST /api/admin/bookings — manual booking (no payment)
export async function POST(request: NextRequest) {
  if (!await verifyAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json();
  const { date, startHour, hours, customerName, customerEmail, customerPhone, notes } = body;

  const bookingDate = new Date(date);
  const endHour = startHour + hours;
  const amount = calculatePrice(hours);

  // Check availability
  const existing = await prisma.booking.findMany({
    where: { date: bookingDate, status: { in: ["CONFIRMED", "PENDING"] } },
    select: { startHour: true, endHour: true },
  });

  for (let h = startHour; h < endHour; h++) {
    const count = existing.filter((b) => b.startHour <= h && b.endHour > h).length;
    if (count >= MAX_DESKS) {
      return NextResponse.json({ error: `No desks available at ${h}:00` }, { status: 409 });
    }
  }

  const booking = await prisma.booking.create({
    data: {
      date: bookingDate,
      startHour,
      endHour,
      hours,
      amount,
      customerName,
      customerEmail: customerEmail || "",
      customerPhone: customerPhone || "",
      status: "CONFIRMED",
      isManual: true,
      notes,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
