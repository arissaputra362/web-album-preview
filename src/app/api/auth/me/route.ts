import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findUserByEmail } from "@/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("drivealbum_admin_session");

    if (!sessionCookie || sessionCookie.value !== "authenticated") {
      return NextResponse.json({
        success: false,
        authenticated: false,
      }, { status: 401 });
    }

    const defaultAdminEmail = (process.env.ADMIN_EMAIL || "admin@drivealbum.local").trim().toLowerCase();
    const user = await findUserByEmail(defaultAdminEmail);

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user?.id || "admin-default",
        name: user?.name || "Administrator",
        email: user?.email || defaultAdminEmail,
        role: user?.role || "admin",
      },
    });
  } catch (err: any) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({
      success: false,
      authenticated: false,
    }, { status: 500 });
  }
}

