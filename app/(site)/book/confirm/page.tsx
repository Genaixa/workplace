"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/pricing";

type Booking = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  customerName: string;
  date: string;
  startHour: number;
  hours: number;
  amount: number;
};

function formatHour(h: number) {
  const suffix = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00${suffix}`;
}

function ConfirmContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) { setError("Missing booking reference."); return; }

    async function poll() {
      const res = await fetch(`/api/bookings/confirm?id=${id}`);
      if (!res.ok) { setError("Booking not found."); return; }
      const data = await res.json();
      setBooking(data);
      if (data.status === "CONFIRMED" || data.status === "CANCELLED") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  if (error) return (
    <div className="text-center py-24 px-6">
      <p className="text-red-600 mb-4">{error}</p>
      <Link href="/book" className="btn-primary">Back to Booking</Link>
    </div>
  );

  if (!booking) return (
    <div className="text-center py-24 px-6">
      <p className="opacity-50 text-sm">Checking payment status…</p>
    </div>
  );

  if (booking.status === "PENDING") return (
    <div className="text-center py-24 px-6">
      <div className="inline-block w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-6 opacity-40" />
      <p className="text-sm opacity-50">Waiting for payment confirmation…</p>
    </div>
  );

  if (booking.status === "CANCELLED") return (
    <div className="text-center py-24 px-6 max-w-md mx-auto">
      <h1 className="text-3xl mb-4" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>Payment not completed</h1>
      <p className="opacity-60 text-sm mb-8">Your booking was not confirmed. No charge has been made.</p>
      <Link href="/book" className="btn-primary">Try Again</Link>
    </div>
  );

  const date = new Date(booking.date);
  const endHour = booking.startHour + booking.hours;

  return (
    <div className="max-w-lg mx-auto py-24 px-6 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-8"
        style={{ backgroundColor: "var(--twp-dark)", color: "var(--twp-cream)" }}
      >
        ✓
      </div>
      <h1 className="text-4xl mb-2" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>
        Booking Confirmed
      </h1>
      <p className="opacity-60 text-sm mb-10">
        Hi {booking.customerName} — your desk is booked. A confirmation email is on its way.
      </p>

      <div
        className="text-left border p-6 mb-10 space-y-3 text-sm"
        style={{ borderColor: "rgba(26,26,26,0.15)" }}
      >
        <div className="flex justify-between">
          <span className="opacity-50">Date</span>
          <span>{date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-50">Time</span>
          <span>{formatHour(booking.startHour)} – {formatHour(endHour)}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-50">Duration</span>
          <span>{booking.hours} hour{booking.hours > 1 ? "s" : ""}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="opacity-50">Paid</span>
          <span>{formatPrice(booking.amount)}</span>
        </div>
      </div>

      <p className="text-xs opacity-40 mb-8">
        Unit 5, Former Swallow Hotel, High West Street, Gateshead, NE8 1PE<br />
        Need to change or cancel? Call us on 0191 468 3968 at least 2 hours before.
      </p>

      <Link href="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="text-center py-24"><p className="opacity-50 text-sm">Loading…</p></div>}>
      <ConfirmContent />
    </Suspense>
  );
}
