import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_DESKS, OPENING_HOUR, MAX_END_HOUR } from "@/lib/pricing";

// GET /api/availability?date=2026-05-20
// Returns booked desk count per hour slot for the given date
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const pendingCutoff = new Date(Date.now() - 30 * 60 * 1000);

  // Expire stale PENDING bookings so they don't hold slots indefinitely
  await prisma.booking.updateMany({
    where: { status: "PENDING", createdAt: { lt: pendingCutoff } },
    data: { status: "CANCELLED" },
  });

  // Fetch all active bookings for this date
  const bookings = await prisma.booking.findMany({
    where: {
      date,
      OR: [
        { status: "CONFIRMED" },
        { status: "PENDING", createdAt: { gte: pendingCutoff } },
      ],
    },
    select: { startHour: true, endHour: true },
  });

  // Build slot occupancy map: hour -> desk count
  const occupancy: Record<number, number> = {};
  for (let h = OPENING_HOUR; h < MAX_END_HOUR; h++) {
    occupancy[h] = 0;
  }

  for (const booking of bookings) {
    for (let h = booking.startHour; h < booking.endHour; h++) {
      if (h in occupancy) {
        occupancy[h]++;
      }
    }
  }

  // Build response: available desks per start hour
  const slots = Object.entries(occupancy).map(([hour, booked]) => ({
    hour: parseInt(hour),
    booked,
    available: Math.max(0, MAX_DESKS - booked),
  }));

  return NextResponse.json({ date: dateStr, slots });
}
