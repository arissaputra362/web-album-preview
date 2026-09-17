import { NextResponse } from "next/server";
import { fetchPhotosFromDriveFolder, clearFolderCache } from "@/lib/drive";

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("drivealbum_admin_session=authenticated")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Sesi admin diperlukan untuk sinkronisasi." },
        { status: 401 }
      );
    }

    const { folderId } = await req.json();
    const sanitizedFolderId = (folderId || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");

    if (!sanitizedFolderId || sanitizedFolderId.length < 5) {
      return NextResponse.json(
        { success: false, error: "Google Drive Folder ID tidak valid" },
        { status: 400 }
      );
    }

    clearFolderCache(sanitizedFolderId);
    const photos = await fetchPhotosFromDriveFolder(sanitizedFolderId);

    return NextResponse.json({
      success: true,
      data: {
        folderId,
        count: photos.length,
        previewPhotos: photos.slice(0, 3),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

