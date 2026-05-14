"use client";
import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      } else {
        setStatus("sent");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col justify-center gap-4 py-8">
        <p className="text-lg" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>
          Message sent.
        </p>
        <p className="text-sm opacity-60">Thanks, {form.name}. We&apos;ll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {[
        { label: "Name", key: "name", type: "text" },
        { label: "Email", key: "email", type: "email" },
      ].map((f) => (
        <div key={f.key}>
          <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">{f.label}</label>
          <input
            type={f.type}
            value={form[f.key as keyof typeof form]}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            required
            className="w-full border-b pb-2 text-sm bg-transparent outline-none"
            style={{ borderColor: "rgba(26,26,26,0.25)" }}
          />
        </div>
      ))}
      <div>
        <label className="block text-xs tracking-widest uppercase opacity-50 mb-2">Message</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
          rows={4}
          className="w-full border-b pb-2 text-sm bg-transparent outline-none resize-none"
          style={{ borderColor: "rgba(26,26,26,0.25)" }}
        />
      </div>
      {status === "error" && (
        <p className="text-red-600 text-sm">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary self-start disabled:opacity-50"
      >
        {status === "submitting" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
