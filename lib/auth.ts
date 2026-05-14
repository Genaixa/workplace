import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";

if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is not set");
const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function signAdminToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  const token =
    request.cookies.get("admin_token")?.value ||
    request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}
