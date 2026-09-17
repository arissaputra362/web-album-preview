import { NextResponse } from "next/server";
import { localDb, db, isDbConfigured } from "@/db";
import { albums } from "@/db/schema";
import { fetchPhotosFromDriveFolder } from "@/lib/drive";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    let allAlbums = [];
    if (isDbConfigured && db) {
      allAlbums = await db.select().from(albums);
    } else {
      allAlbums = await localDb.getAlbums();
    }

    // Automatically ensure all album covers use our authenticated image proxy
    const sanitized = allAlbums.map((a: any) => {
      if (a.coverFileId && (!a.coverUrl || a.coverUrl.includes("drive.google.com"))) {
        return { ...a, coverUrl: `/api/drive/image/${a.coverFileId}` };
      }
      return a;
    });

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    console.error("GET /api/albums error:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("drivealbum_admin_session=authenticated")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Sesi admin diperlukan." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, driveFolderId, visibility, pin, story } = body;

    if (!title || !driveFolderId) {
      return NextResponse.json(
        { success: false, error: "Title and Google Drive Folder ID are required." },
        { status: 400 }
      );
    }

    const baseSlug = slugify(title);
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    // Try fetching first photo to use as cover preview
    let coverUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
    let coverFileId = "";

    try {
      const photos = await fetchPhotosFromDriveFolder(driveFolderId);
      if (photos && photos.length > 0) {
        coverUrl = photos[0].thumbnailUrl;
        coverFileId = photos[0].id;
      }
    } catch {
      // Keep default cover
    }

    const newAlbum = {
      id: `album_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      slug: uniqueSlug,
      description: description || "",
      driveFolderId: driveFolderId.trim(),
      coverFileId,
      coverUrl,
      visibility: visibility || "public",
      pin: pin ? pin.trim() : null,
      story: story || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isDbConfigured && db) {
      await db.insert(albums).values(newAlbum);
    } else {
      await localDb.createAlbum(newAlbum);
    }

    return NextResponse.json({ success: true, data: newAlbum });
  } catch (error: any) {
    console.error("POST /api/albums error:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

