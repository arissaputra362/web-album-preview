"use client";

import { useState, useEffect, useCallback } from "react";
import { Album } from "@/db/schema";
import { DriveMediaItem } from "@/lib/drive";
import FolderGrid from "./FolderGrid";
import MasonryGallery from "./MasonryGallery";
import PinGate from "./PinGate";
import { ChevronRight, Home, Folder, Loader2 } from "lucide-react";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface AlbumExplorerProps {
  album: Album;
  initialFolders: DriveMediaItem[];
  initialMedia: DriveMediaItem[];
  isInitiallyLocked?: boolean;
}

export default function AlbumExplorer({
  album,
  initialFolders,
  initialMedia,
  isInitiallyLocked = false,
}: AlbumExplorerProps) {
  const [isLocked, setIsLocked] = useState(isInitiallyLocked);
  const [savedPin, setSavedPin] = useState<string>("");
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: album.driveFolderId, name: album.title },
  ]);
  const [currentFolders, setCurrentFolders] = useState<DriveMediaItem[]>(initialFolders);
  const [currentMedia, setCurrentMedia] = useState<DriveMediaItem[]>(initialMedia);
  const [loading, setLoading] = useState(false);

  const handleUnlockWithPin = useCallback(async (pinToVerify: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `/api/albums/${album.slug}?pin=${encodeURIComponent(pinToVerify)}`
      );
      const data = await res.json();

      if (data.success && data.data.unlocked) {
        setSavedPin(pinToVerify);
        setCurrentFolders(data.data.folders || []);
        setCurrentMedia(data.data.media || []);
        setIsLocked(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`album_pin_${album.slug}`, pinToVerify);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [album.slug]);

  // Check if user already unlocked this album in current session
  useEffect(() => {
    if (isInitiallyLocked && typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`album_pin_${album.slug}`);
      if (stored) {
        handleUnlockWithPin(stored);
      }
    }
  }, [isInitiallyLocked, album.slug, handleUnlockWithPin]);

  const navigateToFolder = async (
    folderId: string,
    folderName: string,
    targetBreadcrumbIndex?: number
  ) => {
    setLoading(true);
    try {
      const pinParam = savedPin ? `&pin=${encodeURIComponent(savedPin)}` : "";
      const res = await fetch(`/api/albums/${album.slug}?folderId=${folderId}${pinParam}`);
      const data = await res.json();

      if (data.success && data.data.unlocked) {
        setCurrentFolders(data.data.folders || []);
        setCurrentMedia(data.data.media || []);

        if (targetBreadcrumbIndex !== undefined) {
          setBreadcrumbs((prev) => prev.slice(0, targetBreadcrumbIndex + 1));
        } else {
          setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
        }
      }
    } catch (err) {
      console.error("Failed to load subfolder:", err);
    } finally {
      setLoading(false);
    }
  };

  // If album is private and locked, show PIN gate
  if (isLocked) {
    return <PinGate albumTitle={album.title} onUnlock={handleUnlockWithPin} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb Bar */}
      <nav className="flex items-center flex-wrap gap-2 text-xs text-black/60 bg-white px-4 py-2.5 rounded-full border border-black/5 shadow-2xs">
        <button
          onClick={() => navigateToFolder(album.driveFolderId, album.title, 0)}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            breadcrumbs.length === 1 ? "font-semibold text-[#00543D]" : "hover:text-black"
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>{album.title}</span>
        </button>

        {breadcrumbs.slice(1).map((crumb, idx) => {
          const actualIndex = idx + 1;
          const isCurrent = actualIndex === breadcrumbs.length - 1;

          return (
            <div key={crumb.id} className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-black/20" />
              <button
                onClick={() => navigateToFolder(crumb.id, crumb.name, actualIndex)}
                className={`flex items-center gap-1 transition-colors cursor-pointer ${
                  isCurrent ? "font-semibold text-[#00543D]" : "hover:text-black"
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{crumb.name}</span>
              </button>
            </div>
          );
        })}

        {loading && (
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-[#00543D] font-mono animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Memuat folder...</span>
          </div>
        )}
      </nav>

      {/* Subfolder list */}
      <FolderGrid
        folders={currentFolders}
        onSelectFolder={(f) => navigateToFolder(f.id, f.name)}
      />

      {/* Media (Photos & Videos) or Skeleton while loading */}
      {loading ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 animate-fade-in">
          {[
            "aspect-[4/3]",
            "aspect-[3/4]",
            "aspect-[16/9]",
            "aspect-[1/1]",
            "aspect-[4/5]",
            "aspect-[16/10]",
          ].map((aspect, i) => (
            <div
              key={i}
              className={`w-full ${aspect} bg-gradient-to-tr from-black/[0.03] via-black/[0.07] to-black/[0.03] rounded-[8px] border border-black/5 animate-pulse break-inside-avoid`}
            />
          ))}
        </div>
      ) : (
        <MasonryGallery media={currentMedia} story={album.story || undefined} />
      )}
    </div>
  );
}
