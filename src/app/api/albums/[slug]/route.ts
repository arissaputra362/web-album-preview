import { NextResponse } from "next/server";
import { localDb, db, isDbConfigured } from "@/db";
import { albums } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchFolderContent, fetchPhotosFromDriveFolder } from "@/lib/drive";

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const url = new URL(req.url);
    const requestedFolderId = url.searchParams.get("folderId");

    let album = null;
    if (isDbConfigured && db) {
      const res = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1);
      album = res[0] || null;
    } else {
      album = await localDb.getAlbumBySlug(slug);
    }

    if (!album) {
      return NextResponse.json({ success: false, error: "Album not found" }, { status: 404 });
    }

    const isProtected = Boolean(album.visibility === "private" && album.pin && album.pin.trim().length > 0);
    const providedPin = url.searchParams.get("pin") || req.headers.get("x-album-pin");

    // If album is private with PIN and provided PIN is incorrect
    if (isProtected && providedPin !== album.pin) {
      const publicAlbumInfo = {
        title: album.title,
        slug: album.slug,
        description: album.description,
        visibility: album.visibility,
        createdAt: album.createdAt,
      };
      return NextResponse.json({
        success: true,
        data: {
          album: publicAlbumInfo,
          isProtected: true,
          unlocked: false,
          folders: [],
          media: [],
          mediaCount: 0,
          folderCount: 0,
        },
      });
    }

    const activeFolderId = requestedFolderId || album.driveFolderId;
    const folderContent = await fetchFolderContent(activeFolderId);

    // Sanitize album so raw PIN is not leaked to client
    const safeAlbum = { ...album, pin: undefined };

    return NextResponse.json({
      success: true,
      data: {
        album: safeAlbum,
        isProtected,
        unlocked: true,
        currentFolderId: folderContent.currentFolderId,
        currentFolderName: folderContent.currentFolderName,
        rootFolderId: album.driveFolderId,
        folders: folderContent.folders,
        media: folderContent.media,
        mediaCount: folderContent.media.length,
        folderCount: folderContent.folders.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/albums/[slug] error:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("drivealbum_admin_session=authenticated")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Sesi admin diperlukan." },
        { status: 401 }
      );
    }

    const { slug } = await context.params;

    if (isDbConfigured && db) {
      await db.delete(albums).where(eq(albums.slug, slug));
    } else {
      const album = await localDb.getAlbumBySlug(slug);
      if (album) {
        await localDb.deleteAlbum(album.id);
      }
    }

    return NextResponse.json({ success: true, message: "Album deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/albums/[slug] error:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("drivealbum_admin_session=authenticated")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Sesi admin diperlukan." },
        { status: 401 }
      );
    }

    const { slug } = await context.params;
    const body = await req.json();
    const { title, driveFolderId, description, story, visibility, pin } = body;

    let existing = null;
    if (isDbConfigured && db) {
      const res = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1);
      existing = res[0] || null;
    } else {
      existing = await localDb.getAlbumBySlug(slug);
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: "Album not found" }, { status: 404 });
    }

    const updates: Partial<typeof albums.$inferInsert> = {
      title: title ?? existing.title,
      driveFolderId: driveFolderId ?? existing.driveFolderId,
      description: description ?? existing.description,
      story: story ?? existing.story,
      visibility: visibility ?? existing.visibility,
      pin: pin !== undefined ? (pin ? pin.trim() : null) : existing.pin,
      updatedAt: new Date(),
    };

    // If driveFolderId changed, re-sync cover image
    if (driveFolderId && driveFolderId !== existing.driveFolderId) {
      try {
        const photos = await fetchPhotosFromDriveFolder(driveFolderId);
        if (photos && photos.length > 0) {
          updates.coverUrl = photos[0].thumbnailUrl;
          updates.coverFileId = photos[0].id;
        }
      } catch {
        // preserve existing cover
      }
    }

    if (isDbConfigured && db) {
      await db.update(albums).set(updates).where(eq(albums.slug, slug));
    } else {
      await localDb.updateAlbum(existing.id, updates);
    }

    return NextResponse.json({ success: true, data: { ...existing, ...updates } });
  } catch (error: any) {
    console.error("PUT /api/albums/[slug] error:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

