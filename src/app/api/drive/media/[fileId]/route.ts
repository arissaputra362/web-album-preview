import { NextResponse } from "next/server";
import { getDriveClient, getAccessToken, getFileMetadata, setFileMetadata, getOptimizedGoogleCdnUrl } from "@/lib/drive";
import { driveMediaRateLimiter } from "@/lib/rate-limiter";

export async function GET(
  req: Request,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await context.params;
    const sanitizedId = (fileId || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");

    // 1. Security check: Validate file ID format
    if (!sanitizedId || sanitizedId.length < 5 || sanitizedId.length > 100) {
      return new NextResponse("Invalid file ID format", { status: 400 });
    }

    // 2. Security & Quota Guard: Rate limit check per IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = driveMediaRateLimiter.check(clientIp);

    if (!rateLimit.allowed) {
      return new NextResponse("Too Many Requests. Kuota request sementara terlampaui untuk melindungi Google Drive API.", {
        status: 429,
        headers: {
          "Retry-After": rateLimit.resetTimeSeconds.toString(),
          "X-RateLimit-Remaining": "0",
        },
      });
    }

    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "true";
    const isThumb = url.searchParams.get("thumb") === "true";

    // 3. Fast In-Memory Metadata Lookup (Bypasses drive.files.get to save API quota)
    let fileMeta = getFileMetadata(sanitizedId);

    if (!fileMeta) {
      const drive = getDriveClient();
      if (drive) {
        try {
          const metaResponse = await drive.files.get({
            fileId: sanitizedId,
            fields: "id, name, mimeType, size, thumbnailLink",
          });
          fileMeta = {
            id: sanitizedId,
            name: metaResponse.data.name || `media-${sanitizedId}`,
            mimeType: metaResponse.data.mimeType || "application/octet-stream",
            size: metaResponse.data.size || undefined,
            thumbnailLink: metaResponse.data.thumbnailLink || undefined,
            timestamp: Date.now(),
          };
          setFileMetadata(sanitizedId, fileMeta);
        } catch (err: any) {
          console.warn(`Failed to fetch metadata for ${sanitizedId}:`, err?.message || err);
        }
      }
    }

    const mimeType = fileMeta?.mimeType || "application/octet-stream";
    const fileName = fileMeta?.name || `media-${sanitizedId}`;
    const fileSize = fileMeta?.size;

    // 4. HTTP Conditional Request Handling (304 Not Modified to save 100% bandwidth & quota)
    const etag = `W/"${sanitizedId}-${fileSize || '0'}"`;
    const ifNoneMatch = req.headers.get("if-none-match");

    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "ETag": etag,
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        },
      });
    }

    // 5. Google CDN High-Speed Offloading for Photos and Thumbnails (0% Drive v3 quota consumed)
    const isImage = mimeType.startsWith("image/");
    if ((isThumb || isImage) && !isDownload && fileMeta?.thumbnailLink) {
      const requestedSize = isThumb ? 600 : 1600;
      const cdnUrl = getOptimizedGoogleCdnUrl(fileMeta.thumbnailLink, requestedSize);

      if (cdnUrl) {
        try {
          const cdnRes = await fetch(cdnUrl);
          if (cdnRes.ok && cdnRes.body) {
            return new NextResponse(cdnRes.body, {
              status: 200,
              headers: {
                "Content-Type": cdnRes.headers.get("content-type") || mimeType,
                "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable",
                "ETag": etag,
                "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
              },
            });
          }
        } catch {
          // Fallback to direct Drive v3 streaming below
        }
      }
    }

    // 6. Direct HTTP Streaming for Videos and Downloads with HTTP Range (Status 206)
    const token = await getAccessToken();
    if (!token) {
      return new NextResponse("Google Drive client not authorized", { status: 500 });
    }

    const googleHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const clientRange = req.headers.get("range");
    if (clientRange) {
      googleHeaders["Range"] = clientRange;
    }

    const googleRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${sanitizedId}?alt=media`,
      {
        headers: googleHeaders,
      }
    );

    if (!googleRes.ok && googleRes.status !== 206) {
      console.error(`Google API stream error (${sanitizedId}): status ${googleRes.status}`);
      return new NextResponse("Failed to stream from Google Drive", { status: googleRes.status });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", mimeType);
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("ETag", etag);

    if (googleRes.headers.has("content-range")) {
      responseHeaders.set("Content-Range", googleRes.headers.get("content-range")!);
    }
    if (googleRes.headers.has("content-length")) {
      responseHeaders.set("Content-Length", googleRes.headers.get("content-length")!);
    }

    responseHeaders.set("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    responseHeaders.set(
      "Content-Disposition",
      isDownload
        ? `attachment; filename="${encodeURIComponent(fileName)}"`
        : `inline; filename="${encodeURIComponent(fileName)}"`
    );

    return new NextResponse(googleRes.body, {
      status: googleRes.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Error streaming Google Drive media:", error?.message || error);
    return new NextResponse("Failed to load media from Google Drive", { status: 500 });
  }
}
