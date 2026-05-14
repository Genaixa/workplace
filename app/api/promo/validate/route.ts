import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePrice, applyPromoDiscount } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, hours } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false, error: "No code provided" }, { status: 400 });
  }
  if (!hours || ![1, 2, 3, 4].includes(hours)) {
    return NextResponse.json({ valid: false, error: "Invalid hours" }, { status: 400 });
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!promo || !promo.active) {
    return NextResponse.json({ valid: false, error: "Invalid promo code" });
  }
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "This promo code has expired" });
  }
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    return NextResponse.json({ valid: false, error: "This promo code has already been used" });
  }

  const discountPence = calculatePrice(promo.discountHours);
  const finalPence = applyPromoDiscount(hours, promo.discountHours);

  return NextResponse.json({
    valid: true,
    code: promo.code,
    discountHours: promo.discountHours,
    discountPence,
    finalPence,
  });
}
