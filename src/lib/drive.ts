import { google } from "googleapis";
import fs from "fs";
import path from "path";

export type MediaKind = "photo" | "video" | "folder";

export interface DriveMediaItem {
  id: string;
  name: string;
  mimeType: string;
  kind: MediaKind;
  thumbnailUrl: string;
  originalUrl: string;
  downloadUrl: string;
  width?: number;
  height?: number;
  videoDurationMs?: string;
  createdTime?: string;
  size?: string;
}

export interface FolderContent {
  currentFolderId: string;
  currentFolderName?: string;
  folders: DriveMediaItem[];
  media: DriveMediaItem[];
}

let authClientInstance: any = null;
let driveClientInstance: any = null;

export function getAuthClient() {
  if (authClientInstance) return authClientInstance;

  try {
    let credentials: any = null;

    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } else {
      const filePath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "./service-account.json";
      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, "utf-8");
        credentials = JSON.parse(fileContent);
      }
    }

    if (credentials && credentials.client_email && credentials.private_key) {
      authClientInstance = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });
      return authClientInstance;
    }
  } catch (error) {
    console.error("Failed to initialize Google Auth client:", error);
  }

  return null;
}

export async function getAccessToken(): Promise<string | null> {
  const auth = getAuthClient();
  if (!auth) return null;
  try {
    const tokenResponse = await auth.getAccessToken();
    return typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token || null;
  } catch (err) {
    console.error("Failed to get Google access token:", err);
    return null;
  }
}

export function getDriveClient() {
  if (driveClientInstance) return driveClientInstance;
  const auth = getAuthClient();
  if (auth) {
    driveClientInstance = google.drive({ version: "v3", auth });
    return driveClientInstance;
  }
  return null;
}

// Demo media for fallback or mock testing
const MOCK_MEDIA: Record<string, DriveMediaItem[]> = {
  default: [
    {
      id: "mock-1",
      name: "Sunrise over the coast.jpg",
      mimeType: "image/jpeg",
      kind: "photo",
      thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      originalUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=95",
      downloadUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=95",
      width: 2400,
      height: 1600,
      createdTime: new Date().toISOString(),
    },
    {
      id: "mock-v1",
      name: "Deburan Ombak Pantai (Video).mp4",
      mimeType: "video/mp4",
      kind: "video",
      thumbnailUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
      originalUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      width: 1920,
      height: 1080,
      videoDurationMs: "15000",
      createdTime: new Date().toISOString(),
    },
    {
      id: "mock-2",
      name: "Quiet sanctuary in the woods.jpg",
      mimeType: "image/jpeg",
      kind: "photo",
      thumbnailUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
      originalUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=95",
      downloadUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=95",
      width: 2400,
      height: 1800,
      createdTime: new Date().toISOString(),
    },
    {
      id: "mock-3",
      name: "The warm tea ceremony.jpg",
      mimeType: "image/jpeg",
      kind: "photo",
      thumbnailUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80",
      originalUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=2400&q=95",
      downloadUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=2400&q=95",
      width: 2400,
      height: 1600,
      createdTime: new Date().toISOString(),
    },
  ],
};

// In-memory cache for ultra-fast first-paint and subfolder browsing
interface CacheEntry {
  content: FolderContent;
  timestamp: number;
}
const FOLDER_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes folder cache

// In-memory File Metadata Cache to completely avoid redundant drive.files.get() calls
export interface CachedFileMeta {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  timestamp: number;
}
const FILE_META_CACHE = new Map<string, CachedFileMeta>();
const FILE_META_TTL_MS = 30 * 60 * 1000; // 30 minutes metadata cache

export function getFileMetadata(fileId: string): CachedFileMeta | null {
  const cached = FILE_META_CACHE.get(fileId);
  if (cached && Date.now() - cached.timestamp < FILE_META_TTL_MS) {
    return cached;
  }
  return null;
}

export function setFileMetadata(fileId: string, meta: Omit<CachedFileMeta, "timestamp">) {
  FILE_META_CACHE.set(fileId, { ...meta, timestamp: Date.now() });
}

// Single-Flight Request Coalescing map to prevent duplicate parallel calls to Google API
const PENDING_FOLDER_REQUESTS = new Map<string, Promise<FolderContent>>();

export function clearFolderCache(folderId?: string) {
  if (folderId) {
    FOLDER_CACHE.delete(folderId);
  } else {
    FOLDER_CACHE.clear();
    FILE_META_CACHE.clear();
  }
}

/**
 * Returns optimized Google CDN thumbnail URL scaled to requested size (e.g. =s1600)
 */
export function getOptimizedGoogleCdnUrl(thumbnailLink?: string, size = 1600): string | null {
  if (!thumbnailLink) return null;
  if (/=s\d+/i.test(thumbnailLink)) {
    return thumbnailLink.replace(/=s\d+/i, `=s${size}`);
  }
  if (/=w\d+/i.test(thumbnailLink)) {
    return thumbnailLink.replace(/=w\d+/i, `=s${size}`);
  }
  if (thumbnailLink.includes("&sz=")) {
    return thumbnailLink.replace(/&sz=[^&]+/i, `&sz=s${size}`);
  }
  return `${thumbnailLink}=s${size}`;
}

export async function fetchFolderContent(folderId: string): Promise<FolderContent> {
  const drive = getDriveClient();

  if (!drive || folderId.startsWith("demo-")) {
    const demoItems = MOCK_MEDIA[folderId] || MOCK_MEDIA.default;
    return {
      currentFolderId: folderId,
      currentFolderName: "Demo Folder",
      folders: [],
      media: demoItems,
    };
  }

  const sanitizedId = folderId.trim().replace(/[^a-zA-Z0-9_-]/g, "");

  // 1. Return cached result if fresh (instant <5ms response, zero Google API quota used)
  const cached = FOLDER_CACHE.get(sanitizedId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.content;
  }

  // 2. Single-Flight Coalescing: If a request for this folder is already in-flight, reuse its promise
  const inFlight = PENDING_FOLDER_REQUESTS.get(sanitizedId);
  if (inFlight) {
    return inFlight;
  }

  const executeFetch = async (): Promise<FolderContent> => {
    try {
      // Fetch folder's own name
      let currentFolderName = "";
      try {
        const folderMeta = await drive.files.get({
          fileId: sanitizedId,
          fields: "id, name",
        });
        currentFolderName = folderMeta.data.name || "";
      } catch {
        // ignore
      }

      // List photos, videos, and subfolders
      const response = await drive.files.list({
        q: `'${sanitizedId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/' or mimeType = 'application/vnd.google-apps.folder') and trashed = false`,
        fields: "files(id, name, mimeType, thumbnailLink, webContentLink, imageMediaMetadata, videoMediaMetadata, createdTime, size)",
        pageSize: 200,
        orderBy: "folder, createdTime desc",
      });

      const files = response.data.files || [];

      const folders: DriveMediaItem[] = [];
      const media: DriveMediaItem[] = [];

      for (const file of files) {
        if (!file.id) continue;

        const isFolder = file.mimeType === "application/vnd.google-apps.folder";
        const isVideo = file.mimeType?.startsWith("video/") || false;
        const kind: MediaKind = isFolder ? "folder" : isVideo ? "video" : "photo";

        // Pre-cache file metadata so /api/drive/media/[fileId] will NOT make separate files.get calls!
        setFileMetadata(file.id, {
          id: file.id,
          name: file.name || (isFolder ? "Folder" : "Untitled Media"),
          mimeType: file.mimeType || (isFolder ? "folder" : "image/jpeg"),
          size: file.size,
          thumbnailLink: file.thumbnailLink,
        });

        const proxyUrl = `/api/drive/media/${file.id}`;
        const downloadUrl = `/api/drive/media/${file.id}?download=true`;
        const thumbUrl = `/api/drive/media/${file.id}?thumb=true`;

        const item: DriveMediaItem = {
          id: file.id,
          name: file.name || (isFolder ? "Folder" : "Untitled Media"),
          mimeType: file.mimeType || (isFolder ? "folder" : "image/jpeg"),
          kind,
          thumbnailUrl: isFolder ? "" : thumbUrl,
          originalUrl: isFolder ? "" : proxyUrl,
          downloadUrl: isFolder ? "" : downloadUrl,
          width: file.imageMediaMetadata?.width || file.videoMediaMetadata?.width || 1600,
          height: file.imageMediaMetadata?.height || file.videoMediaMetadata?.height || 1200,
          videoDurationMs: file.videoMediaMetadata?.durationMillis,
          createdTime: file.createdTime,
          size: file.size,
        };

        if (isFolder) {
          folders.push(item);
        } else {
          media.push(item);
        }
      }

      const result: FolderContent = {
        currentFolderId: sanitizedId,
        currentFolderName,
        folders,
        media,
      };

      FOLDER_CACHE.set(sanitizedId, { content: result, timestamp: Date.now() });
      return result;
    } catch (err: any) {
      console.error(`Error fetching folder content (${folderId}):`, err?.message || err);
      return {
        currentFolderId: folderId,
        folders: [],
        media: MOCK_MEDIA.default,
      };
    } finally {
      PENDING_FOLDER_REQUESTS.delete(sanitizedId);
    }
  };

  const promise = executeFetch();
  PENDING_FOLDER_REQUESTS.set(sanitizedId, promise);
  return promise;
}

export async function fetchPhotosFromDriveFolder(folderId: string): Promise<DriveMediaItem[]> {
  const content = await fetchFolderContent(folderId);
  return content.media;
}
