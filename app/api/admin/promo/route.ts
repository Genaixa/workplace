import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!await verifyAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(codes);
}

export async function POST(request: NextRequest) {
  if (!await verifyAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json();
  const { code, discountHours, expiresAt, usageLimit } = body;

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }
  if (!discountHours || ![1, 2, 3, 4].includes(Number(discountHours))) {
    return NextResponse.json({ error: "discountHours must be 1–4" }, { status: 400 });
  }

  const normalized = code.trim().toUpperCase().replace(/\s+/g, "");

  try {
    const promo = await prisma.promoCode.create({
      data: {
        code: normalized,
        discountHours: Number(discountHours),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: 1,
      },
    });
    return NextResponse.json(promo, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "A code with that name already exists" }, { status: 409 });
    }
    throw e;
  }
}
