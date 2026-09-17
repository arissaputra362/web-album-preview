import { NextResponse } from "next/server";
import { findUserByEmail, getFirstAdminUser } from "@/db";
import { verifyPassword } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Email atau password yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Email atau password yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    // Prepare response with sanitized user data
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: {
        id: user.id,
        name: user.name || "Administrator",
        email: user.email,
        role: user.role,
      },
    });

    // Set authenticated session cookie (7 days duration)
    response.cookies.set("drivealbum_admin_session", "authenticated", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false, // Accessible by client and server
      secure: process.env.NODE_ENV === "production",
    });

    // Set admin email cookie for robust session identification
    response.cookies.set("drivealbum_admin_email", user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err: any) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}

