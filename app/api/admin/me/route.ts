import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { jwtVerify } from "jose";

export async function GET(request: NextRequest) {
  if (!await verifyAdminToken(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token =
    request.cookies.get("admin_token")?.value ||
    request.headers.get("Authorization")?.replace("Bearer ", "");

  const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
  const { payload } = await jwtVerify(token!, SECRET);

  const user = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: { name: true, email: true },
  });

  return NextResponse.json({ ok: true, name: user?.name });
}
