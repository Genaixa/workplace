import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!await verifyAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { code } = await params;

  await prisma.promoCode.update({
    where: { code: decodeURIComponent(code) },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
