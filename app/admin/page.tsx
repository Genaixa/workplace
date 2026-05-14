"use client";
import { useState, useEffect, useCallback } from "react";
import { formatPrice, calculatePrice } from "@/lib/pricing";

type PromoCode = {
  code: string;
  discountHours: number;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  createdAt: string;
};

type Booking = {
  id: string;
  date: string;
  startHour: number;
  endHour: number;
  hours: number;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  isManual: boolean;
  notes: string | null;
  createdAt: string;
};

type Slot = { hour: number; booked: number; available: number };

function formatHour(h: number) {
  const suffix = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00${suffix}`;
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"dashboard" | "manual" | "edit" | "promo">("dashboard");
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [promoForm, setPromoForm] = useState({ code: "", discountHours: 1, expiresAt: "" });
  const [promoError, setPromoError] = useState("");
  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startHour: 9,
    hours: 1,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });
  const [actionError, setActionError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      const d = await res.json();
      setLoginError(d.error || "Login failed");
    }
  }

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setAuthed(true); })
      .catch(() => {})
      .finally(() => setAuthChecking(false));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [bRes, aRes] = await Promise.all([
      fetch(`/api/admin/bookings?date=${selectedDate}`),
      fetch(`/api/availability?date=${selectedDate}`),
    ]);
    if (bRes.ok) setBookings(await bRes.json());
    if (aRes.ok) {
      const d = await aRes.json();
      setSlots(d.slots || []);
    }
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  const fetchPromos = useCallback(async () => {
    const res = await fetch("/api/admin/promo");
    if (res.ok) setPromos(await res.json());
  }, []);

  useEffect(() => {
    if (authed && view === "promo") fetchPromos();
  }, [authed, view, fetchPromos]);

  async function deactivatePromo(code: string) {
    if (!confirm(`Deactivate code "${code}"?`)) return;
    await fetch(`/api/admin/promo/${encodeURIComponent(code)}`, { method: "DELETE" });
    fetchPromos();
  }

  async function handlePromoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPromoError("");
    const res = await fetch("/api/admin/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: promoForm.code,
        discountHours: promoForm.discountHours,
        expiresAt: promoForm.expiresAt || null,
      }),
    });
    if (res.ok) {
      setPromoForm({ code: "", discountHours: 1, expiresAt: "" });
      fetchPromos();
    } else {
      const d = await res.json();
      setPromoError(d.error || "Failed to create code");
    }
  }

  async function cancelBooking(id: string) {
    if (!confirm("Cancel this booking?")) return;
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError("");
    const res = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manualForm),
    });
    if (res.ok) {
      setView("dashboard");
      setSelectedDate(manualForm.date);
      fetchData();
    } else {
      const d = await res.json();
      setActionError(d.error || "Failed to create booking");
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBooking) return;
    setActionError("");
    const res = await fetch(`/api/admin/bookings/${editBooking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startHour: editBooking.startHour,
        hours: editBooking.hours,
        notes: editBooking.notes,
      }),
    });
    if (res.ok) {
      setView("dashboard");
      fetchData();
    } else {
      const d = await res.json();
      setActionError(d.error || "Failed to update booking");
    }
  }

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--twp-dark)" }}>
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-40" style={{ color: "var(--twp-cream)" }} />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "var(--twp-dark)" }}>
        <div className="w-full max-w-sm">
          <img
            src="https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/twp-logo-white.png"
            alt="The Work Place"
            className="h-14 mx-auto mb-10"
          />
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "rgba(245,240,235,0.5)" }}>Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                style={{ borderColor: "rgba(245,240,235,0.3)", color: "var(--twp-cream)" }}
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "rgba(245,240,235,0.5)" }}>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                style={{ borderColor: "rgba(245,240,235,0.3)", color: "var(--twp-cream)" }}
              />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button type="submit" className="btn-outline mt-2">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--twp-cream)", minHeight: "100vh" }}>
      {/* Admin nav */}
      <div style={{ backgroundColor: "var(--twp-dark)", color: "var(--twp-cream)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/twp-logo-white.png" alt="" className="h-8" />
            <span className="text-xs tracking-widest uppercase opacity-50">Admin Panel</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => { setView("dashboard"); setActionError(""); }}
              className="text-xs tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity"
            >
              Dashboard
            </button>
            <button
              onClick={() => { setView("manual"); setActionError(""); }}
              className="text-xs tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity"
            >
              + Manual Booking
            </button>
            <button
              onClick={() => { setView("promo"); setPromoError(""); }}
              className="text-xs tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity"
            >
              Promo Codes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {view === "dashboard" && (
          <>
            {/* Date selector + capacity bar */}
            <div className="flex items-center gap-6 mb-8 flex-wrap">
              <div>
                <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">Viewing Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border px-4 py-2 text-sm bg-transparent outline-none"
                  style={{ borderColor: "rgba(26,26,26,0.25)" }}
                />
              </div>
              <button onClick={fetchData} className="btn-primary text-xs self-end">Refresh</button>
            </div>

            {/* Hourly capacity grid */}
            <div className="mb-10">
              <h2 className="text-xs tracking-widest uppercase opacity-50 mb-4">Capacity — {selectedDate}</h2>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {slots.map((slot) => {
                  const pct = (slot.booked / 12) * 100;
                  const full = slot.available === 0;
                  return (
                    <div key={slot.hour} className="text-center">
                      <div className="text-xs opacity-40 mb-1">{formatHour(slot.hour)}</div>
                      <div className="h-16 border relative overflow-hidden" style={{ borderColor: "rgba(26,26,26,0.15)" }}>
                        <div
                          className="absolute bottom-0 left-0 right-0 transition-all"
                          style={{
                            height: `${pct}%`,
                            backgroundColor: full ? "#c0392b" : pct > 66 ? "#e67e22" : "var(--twp-dark)",
                            opacity: 0.7,
                          }}
                        />
                        <span
                          className="absolute inset-0 flex items-center justify-center text-xs font-medium"
                          style={{ color: pct > 50 ? "var(--twp-cream)" : "var(--twp-dark)" }}
                        >
                          {slot.booked}/12
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bookings table */}
            <h2 className="text-xs tracking-widest uppercase opacity-50 mb-4">
              Bookings ({bookings.filter((b) => b.status !== "CANCELLED").length} active)
            </h2>
            {loading ? (
              <p className="text-sm opacity-40">Loading…</p>
            ) : bookings.length === 0 ? (
              <p className="text-sm opacity-40">No bookings for this date.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "rgba(26,26,26,0.15)" }}>
                      {["Name", "Time", "Hours", "Amount", "Status", "Type", "Actions"].map((h) => (
                        <th key={h} className="text-left py-3 px-2 text-xs tracking-widest uppercase opacity-40 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b"
                        style={{
                          borderColor: "rgba(26,26,26,0.08)",
                          opacity: b.status === "CANCELLED" ? 0.4 : 1,
                        }}
                      >
                        <td className="py-3 px-2">
                          <div>{b.customerName}</div>
                          <div className="text-xs opacity-40">{b.customerEmail}</div>
                          {b.customerPhone && <div className="text-xs opacity-40">{b.customerPhone}</div>}
                        </td>
                        <td className="py-3 px-2">{formatHour(b.startHour)} – {formatHour(b.endHour)}</td>
                        <td className="py-3 px-2">{b.hours}h</td>
                        <td className="py-3 px-2">{formatPrice(b.amount)}</td>
                        <td className="py-3 px-2">
                          <span
                            className="text-xs px-2 py-1"
                            style={{
                              backgroundColor:
                                b.status === "CONFIRMED" ? "rgba(74,92,74,0.15)" :
                                b.status === "CANCELLED" ? "rgba(192,57,43,0.1)" :
                                "rgba(26,26,26,0.08)",
                            }}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs opacity-50">{b.isManual ? "Manual" : "Online"}</td>
                        <td className="py-3 px-2">
                          {b.status !== "CANCELLED" && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => { setEditBooking(b); setView("edit"); setActionError(""); }}
                                className="text-xs opacity-60 hover:opacity-100 underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => cancelBooking(b.id)}
                                className="text-xs text-red-600 opacity-70 hover:opacity-100"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {view === "manual" && (
          <div className="max-w-lg">
            <button onClick={() => setView("dashboard")} className="text-xs tracking-widest uppercase opacity-50 hover:opacity-80 mb-8 flex items-center gap-2">
              ← Back
            </button>
            <h2 className="text-2xl mb-8" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>Add Manual Booking</h2>
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-5">
              {[
                { label: "Date", key: "date", type: "date" },
                { label: "Customer Name", key: "customerName", type: "text" },
                { label: "Customer Email", key: "customerEmail", type: "email" },
                { label: "Customer Phone", key: "customerPhone", type: "tel" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">{f.label}</label>
                  <input
                    type={f.type}
                    value={manualForm[f.key as keyof typeof manualForm] as string}
                    onChange={(e) => setManualForm({ ...manualForm, [f.key]: e.target.value })}
                    required={f.key !== "customerEmail" && f.key !== "customerPhone"}
                    className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                    style={{ borderColor: "rgba(26,26,26,0.25)" }}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">Start Hour</label>
                  <select
                    value={manualForm.startHour}
                    onChange={(e) => setManualForm({ ...manualForm, startHour: parseInt(e.target.value) })}
                    className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                    style={{ borderColor: "rgba(26,26,26,0.25)" }}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 8).map((h) => (
                      <option key={h} value={h}>{formatHour(h)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">Duration</label>
                  <select
                    value={manualForm.hours}
                    onChange={(e) => setManualForm({ ...manualForm, hours: parseInt(e.target.value) })}
                    className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                    style={{ borderColor: "rgba(26,26,26,0.25)" }}
                  >
                    {[1, 2, 3, 4].map((h) => (
                      <option key={h} value={h}>{h === 4 ? "4+ hours (Day Pass)" : `${h} hour${h > 1 ? "s" : ""}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">Notes (optional)</label>
                <input
                  type="text"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                  style={{ borderColor: "rgba(26,26,26,0.25)" }}
                />
              </div>
              {actionError && <p className="text-red-600 text-sm">{actionError}</p>}
              <button type="submit" className="btn-primary self-start mt-2">Add Booking</button>
            </form>
          </div>
        )}

        {view === "promo" && (
          <div>
            <button onClick={() => setView("dashboard")} className="text-xs tracking-widest uppercase opacity-50 hover:opacity-80 mb-8 flex items-center gap-2">
              ← Back
            </button>
            <h2 className="text-2xl mb-8" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>Promo Codes</h2>

            {/* Create form */}
            <div className="max-w-lg mb-12">
              <h3 className="text-xs tracking-widest uppercase opacity-50 mb-5">Create New Code</h3>
              <form onSubmit={handlePromoSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">Code</label>
                    <input
                      type="text"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase().replace(/\s+/g, "") })}
                      placeholder="e.g. WELCOME1"
                      required
                      className="w-full border-b pb-2 text-sm bg-transparent outline-none uppercase tracking-widest"
                      style={{ borderColor: "rgba(26,26,26,0.25)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">Free Hours</label>
                    <select
                      value={promoForm.discountHours}
                      onChange={(e) => setPromoForm({ ...promoForm, discountHours: parseInt(e.target.value) })}
                      className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                      style={{ borderColor: "rgba(26,26,26,0.25)" }}
                    >
                      {[1, 2, 3, 4].map((h) => (
                        <option key={h} value={h}>{h === 4 ? "4 hours (Day Pass)" : `${h} hour${h > 1 ? "s" : ""} free`}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">Expires On (optional)</label>
                  <input
                    type="date"
                    value={promoForm.expiresAt}
                    onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })}
                    className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                    style={{ borderColor: "rgba(26,26,26,0.25)" }}
                  />
                </div>
                {promoError && <p className="text-red-600 text-sm">{promoError}</p>}
                <button type="submit" className="btn-primary self-start mt-2">Create Code</button>
              </form>
            </div>

            {/* Codes table */}
            <h3 className="text-xs tracking-widest uppercase opacity-50 mb-4">All Codes</h3>
            {promos.length === 0 ? (
              <p className="text-sm opacity-40">No promo codes yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "rgba(26,26,26,0.15)" }}>
                      {["Code", "Free Hours", "Discount", "Expires", "Used", "Status", ""].map((h) => (
                        <th key={h} className="text-left py-3 px-2 text-xs tracking-widest uppercase opacity-40 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {promos.map((p) => (
                      <tr key={p.code} className="border-b" style={{ borderColor: "rgba(26,26,26,0.08)", opacity: p.active ? 1 : 0.4 }}>
                        <td className="py-3 px-2 font-medium tracking-wider">{p.code}</td>
                        <td className="py-3 px-2">{p.discountHours}h free</td>
                        <td className="py-3 px-2">{formatPrice(calculatePrice(p.discountHours))}</td>
                        <td className="py-3 px-2 text-xs opacity-60">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("en-GB") : "Never"}</td>
                        <td className="py-3 px-2">{p.usedCount === 0 ? "Not yet used" : "Used"}</td>
                        <td className="py-3 px-2">
                          <span className="text-xs px-2 py-1" style={{ backgroundColor: p.active ? "rgba(74,92,74,0.15)" : "rgba(192,57,43,0.1)" }}>
                            {p.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {p.active && (
                            <button onClick={() => deactivatePromo(p.code)} className="text-xs text-red-600 opacity-70 hover:opacity-100">
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {view === "edit" && editBooking && (
          <div className="max-w-lg">
            <button onClick={() => setView("dashboard")} className="text-xs tracking-widest uppercase opacity-50 hover:opacity-80 mb-8 flex items-center gap-2">
              ← Back
            </button>
            <h2 className="text-2xl mb-2" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>Edit Booking</h2>
            <p className="text-sm opacity-50 mb-8">{editBooking.customerName}</p>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">Start Hour</label>
                  <select
                    value={editBooking.startHour}
                    onChange={(e) => setEditBooking({ ...editBooking, startHour: parseInt(e.target.value) })}
                    className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                    style={{ borderColor: "rgba(26,26,26,0.25)" }}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 8).map((h) => (
                      <option key={h} value={h}>{formatHour(h)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">Duration</label>
                  <select
                    value={editBooking.hours}
                    onChange={(e) => setEditBooking({ ...editBooking, hours: parseInt(e.target.value) })}
                    className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                    style={{ borderColor: "rgba(26,26,26,0.25)" }}
                  >
                    {[1, 2, 3, 4].map((h) => (
                      <option key={h} value={h}>{h === 4 ? "4+ hours (Day Pass)" : `${h} hour${h > 1 ? "s" : ""}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">Notes</label>
                <input
                  type="text"
                  value={editBooking.notes || ""}
                  onChange={(e) => setEditBooking({ ...editBooking, notes: e.target.value })}
                  className="w-full border-b pb-2 text-sm bg-transparent outline-none"
                  style={{ borderColor: "rgba(26,26,26,0.25)" }}
                />
              </div>
              {actionError && <p className="text-red-600 text-sm">{actionError}</p>}
              <button type="submit" className="btn-primary self-start mt-2">Save Changes</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
