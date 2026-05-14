import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePrice, MAX_DESKS } from "@/lib/pricing";
import { verifyAdminToken } from "@/lib/auth";

// PATCH /api/admin/bookings/:id — extend/adjust a booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { startHour, hours, status, notes } = body;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If time is being changed, recheck availability (excluding this booking)
  if (startHour !== undefined || hours !== undefined) {
    const newStart = startHour ?? booking.startHour;
    const newHours = hours ?? booking.hours;
    const newEnd = newStart + newHours;

    const existing = await prisma.booking.findMany({
      where: {
        date: booking.date,
        status: { in: ["CONFIRMED", "PENDING"] },
        id: { not: id },
      },
      select: { startHour: true, endHour: true },
    });

    for (let h = newStart; h < newEnd; h++) {
      const count = existing.filter((b) => b.startHour <= h && b.endHour > h).length;
      if (count >= MAX_DESKS) {
        return NextResponse.json({ error: `No desks available at ${h}:00` }, { status: 409 });
      }
    }

    const newAmount = calculatePrice(newHours);
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        startHour: newStart,
        endHour: newEnd,
        hours: newHours,
        amount: newAmount,
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/bookings/:id — cancel a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
