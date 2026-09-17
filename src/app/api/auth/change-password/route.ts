import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findUserByEmail, getFirstAdminUser, updateUserPassword } from "@/db";
import { verifyPassword, hashPassword } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    // 1. Verify admin session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("drivealbum_admin_session");

    if (!sessionCookie || sessionCookie.value !== "authenticated") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // 2. Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Semua field password wajib diisi." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Konfirmasi password baru tidak cocok." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password baru minimal terdiri dari 6 karakter." },
        { status: 400 }
      );
    }

    // 3. Find current user from database
    const cookieEmail = cookieStore.get("drivealbum_admin_email")?.value;

    let user = null;
    if (cookieEmail) {
      user = await findUserByEmail(cookieEmail);
    }
    // Fallback: Ambil akun admin yang terdaftar di database
    if (!user) {
      user = await getFirstAdminUser();
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Akun admin tidak ditemukan di database. Pastikan database telah di-seed." },
        { status: 404 }
      );
    }

    // 4. Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: "Password saat ini tidak sesuai. Silakan periksa kembali." },
        { status: 400 }
      );
    }

    // 5. Hash and update new password
    const newHash = await hashPassword(newPassword);
    const updated = await updateUserPassword(user.email, newHash);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Gagal memperbarui password di database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password admin berhasil diperbarui!",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}

