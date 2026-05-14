"use client";
import { useState, useEffect, useCallback } from "react";
import { calculatePrice, formatPrice, OPENING_HOUR, MAX_END_HOUR, MAX_DESKS } from "@/lib/pricing";

type Slot = { hour: number; booked: number; available: number };

function formatHour(h: number) {
  const suffix = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00${suffix}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function BookPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = addDays(today, 1);
  const maxDate = addDays(today, 62); // ~2 months

  const [selectedDate, setSelectedDate] = useState<Date>(tomorrow);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [hours, setHours] = useState(1);
  const [step, setStep] = useState<"pick" | "details" | "processing">("pick");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    setStartHour(null);
    try {
      const res = await fetch(`/api/availability?date=${toDateString(date)}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const endHour = startHour !== null ? startHour + hours : null;

  // Check if all slots in the selected range are available
  const rangeAvailable =
    startHour !== null &&
    endHour !== null &&
    Array.from({ length: hours }, (_, i) => startHour + i).every((h) => {
      const slot = slots.find((s) => s.hour === h);
      return slot && slot.available > 0;
    });

  const price = calculatePrice(hours);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startHour || !rangeAvailable) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: toDateString(selectedDate),
          startHour,
          hours,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      // Redirect to SumUp checkout
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--twp-cream)" }}>
      {/* Header banner */}
      <div
        className="py-16 px-6 text-center"
        style={{ backgroundColor: "var(--twp-dark)", color: "var(--twp-cream)" }}
      >
        <p className="text-xs tracking-widest uppercase opacity-50 mb-3">The Work Place</p>
        <h1 className="text-4xl md:text-6xl" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>
          Book a Drop-in Desk
        </h1>
        <p className="mt-4 opacity-60 text-sm">
          12 desks available · Pay securely online · Confirmation by email
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Pricing reminder */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
          {[
            { label: "1 hour", price: "£8.00" },
            { label: "2 hours", price: "£11.00" },
            { label: "3 hours", price: "£14.00" },
            { label: "4+ hours", price: "£15.00" },
          ].map((p) => (
            <div
              key={p.label}
              className="text-center py-4 border"
              style={{ borderColor: "rgba(26,26,26,0.15)" }}
            >
              <p className="text-xs tracking-widest uppercase opacity-50 mb-1">{p.label}</p>
              <p className="text-2xl" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>{p.price}</p>
            </div>
          ))}
        </div>

        {step === "pick" && (
          <div className="grid md:grid-cols-2 gap-12">
            {/* Date picker */}
            <div>
              <h2 className="text-xs tracking-widest uppercase opacity-50 mb-6">Select a Date</h2>
              <input
                type="date"
                value={toDateString(selectedDate)}
                min={toDateString(tomorrow)}
                max={toDateString(maxDate)}
                onChange={(e) => {
                  const d = new Date(e.target.value + "T00:00:00");
                  setSelectedDate(d);
                }}
                className="w-full border px-4 py-3 text-sm bg-transparent outline-none cursor-pointer"
                style={{ borderColor: "rgba(26,26,26,0.25)" }}
              />
              <p className="text-xs opacity-40 mt-2">
                Bookings open from the day before. Same-day bookings require calling us directly on 0191 468 3968.
              </p>
            </div>

            {/* Time slots */}
            <div>
              <h2 className="text-xs tracking-widest uppercase opacity-50 mb-6">Select a Start Time</h2>
              {loadingSlots ? (
                <p className="text-sm opacity-50">Loading availability…</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => {
                    const isSelected = startHour === slot.hour;
                    const isFull = slot.available === 0;
                    return (
                      <button
                        key={slot.hour}
                        disabled={isFull}
                        onClick={() => setStartHour(isSelected ? null : slot.hour)}
                        className="py-3 px-2 text-center text-sm border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          borderColor: isSelected ? "var(--twp-dark)" : "rgba(26,26,26,0.2)",
                          backgroundColor: isSelected ? "var(--twp-dark)" : "transparent",
                          color: isSelected ? "var(--twp-cream)" : "inherit",
                        }}
                      >
                        <span className="block font-medium">{formatHour(slot.hour)}</span>
                        <span className="block text-xs mt-0.5" style={{ opacity: isFull ? 1 : 0.5 }}>
                          {isFull ? "Full" : `${slot.available} left`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Duration + summary */}
        {step === "pick" && startHour !== null && (
          <div
            className="mt-12 border p-8"
            style={{ borderColor: "rgba(26,26,26,0.2)" }}
          >
            <h2 className="text-xs tracking-widest uppercase opacity-50 mb-6">How Long?</h2>
            <div className="flex gap-3 flex-wrap mb-8">
              {[1, 2, 3, 4].map((h) => {
                const possible = startHour + h <= MAX_END_HOUR;
                const hrsLabel = h === 4 ? "4+ hrs (Day Pass)" : `${h} hr${h > 1 ? "s" : ""}`;
                return (
                  <button
                    key={h}
                    disabled={!possible}
                    onClick={() => setHours(h)}
                    className="px-5 py-2.5 text-sm border transition-all disabled:opacity-30"
                    style={{
                      borderColor: hours === h ? "var(--twp-dark)" : "rgba(26,26,26,0.2)",
                      backgroundColor: hours === h ? "var(--twp-dark)" : "transparent",
                      color: hours === h ? "var(--twp-cream)" : "inherit",
                    }}
                  >
                    {hrsLabel}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm opacity-70 space-y-1">
                <p>
                  <span className="opacity-50">Date:</span>{" "}
                  {selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
                <p>
                  <span className="opacity-50">Time:</span>{" "}
                  {formatHour(startHour)} – {formatHour(startHour + hours)}
                </p>
                {!rangeAvailable && (
                  <p className="text-red-600">Some slots in this range are fully booked. Please choose a shorter duration or different time.</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs tracking-widest uppercase opacity-50 mb-1">Total</p>
                <p className="text-3xl" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>{formatPrice(price)}</p>
              </div>
            </div>

            <button
              onClick={() => setStep("details")}
              disabled={!rangeAvailable}
              className="btn-primary mt-6 w-full text-center disabled:opacity-40"
            >
              Continue to Payment Details
            </button>
          </div>
        )}

        {/* Customer details */}
        {step === "details" && (
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="text-xs tracking-widest uppercase opacity-50 hover:opacity-80 mb-8 flex items-center gap-2"
            >
              ← Back
            </button>

            <div
              className="border p-6 mb-8 text-sm"
              style={{ borderColor: "rgba(26,26,26,0.15)", backgroundColor: "rgba(26,26,26,0.03)" }}
            >
              <p className="font-medium mb-1">
                {selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="opacity-60">
                {formatHour(startHour!)} – {formatHour(startHour! + hours)} · {formatPrice(price)}
              </p>
            </div>

            <h2 className="text-xs tracking-widest uppercase opacity-50 mb-6">Your Details</h2>

            <div className="flex flex-col gap-6 mb-8">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "Jane Smith" },
                { label: "Email Address", key: "email", type: "email", placeholder: "jane@example.com" },
                { label: "Phone Number", key: "phone", type: "tel", placeholder: "07700 900000" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    required
                    className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                    style={{ borderColor: "rgba(26,26,26,0.25)" }}
                  />
                </div>
              ))}
            </div>

            <p className="text-xs opacity-40 mb-6">
              By booking you agree to our cancellation policy: contact us at least 2 hours before your start time to amend or cancel. Refunds are processed offline.
            </p>

            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-center disabled:opacity-50"
            >
              {submitting ? "Redirecting to payment…" : `Pay ${formatPrice(price)} securely`}
            </button>

            <p className="text-xs opacity-40 text-center mt-4">
              Secure payment powered by SumUp
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
