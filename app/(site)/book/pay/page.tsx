"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    SumUpCard: {
      mount: (options: {
        id: string;
        checkoutId: string;
        onResponse?: (type: string, body: unknown) => void;
      }) => void;
    };
  }
}

function PayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutId = searchParams.get("checkoutId");
  const bookingId = searchParams.get("bookingId");
  const mountedRef = useRef(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sdkReady || mountedRef.current || !checkoutId) return;
    mountedRef.current = true;

    window.SumUpCard.mount({
      id: "sumup-card",
      checkoutId,
      onResponse(type, body) {
        if (type === "success") {
          router.push(`/book/confirm?id=${bookingId}`);
        } else if (type === "error" || type === "abort") {
          setError("Payment was not completed. Please try again.");
          mountedRef.current = false;
        }
      },
    });
  }, [sdkReady, checkoutId, bookingId, router]);

  if (!checkoutId || !bookingId) {
    return (
      <div className="text-center py-24 px-6">
        <p className="text-red-600 text-sm">Invalid payment link.</p>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"
        onReady={() => setSdkReady(true)}
      />

      <div style={{ backgroundColor: "var(--twp-cream)" }}>
        <div
          className="px-6 text-center"
          style={{ backgroundColor: "var(--twp-dark)", color: "var(--twp-cream)", paddingTop: "120px", paddingBottom: "64px" }}
        >
          <p className="text-xs tracking-widest uppercase opacity-50 mb-3">Secure Payment</p>
          <h1 className="text-4xl" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>
            Complete Your Booking
          </h1>
        </div>

        <div className="max-w-md mx-auto px-6 py-16">
          {error && (
            <p className="text-red-600 text-sm mb-6 text-center">{error}</p>
          )}
          <div id="sumup-card" />
          {!sdkReady && (
            <p className="text-sm opacity-40 text-center mt-8">Loading payment form…</p>
          )}
        </div>
      </div>
    </>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="text-center py-24"><p className="opacity-40 text-sm">Loading…</p></div>}>
      <PayContent />
    </Suspense>
  );
}
