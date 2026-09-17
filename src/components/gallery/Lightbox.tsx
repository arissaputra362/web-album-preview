"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download, Video, Image as ImageIcon } from "lucide-react";
import { DriveMediaItem } from "@/lib/drive";

interface LightboxProps {
  media: DriveMediaItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ media, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const currentItem = media[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [handleNext, handlePrev, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  if (!currentItem) return null;

  const isVideo = currentItem.kind === "video";

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0A0B0C]/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 text-white animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tracking-widest text-white/50">
            {currentIndex + 1} / {media.length}
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase font-mono tracking-wider">
            {isVideo ? <Video className="w-3 h-3 text-[#FFBBFC]" /> : <ImageIcon className="w-3 h-3 text-[#ABCBF9]" />}
            <span>{isVideo ? "Video" : "Photo"}</span>
          </div>
          <span className="text-xs text-white/80 truncate max-w-[150px] sm:max-w-md">
            {currentItem.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={currentItem.downloadUrl || currentItem.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Download Original Media"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main presentation */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        {media.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/90 transition-all backdrop-blur-sm cursor-pointer"
              title="Previous (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/90 transition-all backdrop-blur-sm cursor-pointer"
              title="Next (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div className="relative max-h-full max-w-full flex items-center justify-center">
          {isVideo ? (
            <video
              key={currentItem.id}
              src={currentItem.originalUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[82vh] max-w-[92vw] rounded-md shadow-2xl bg-black outline-hidden"
            >
              Browser Anda tidak mendukung pemutar video HTML5.
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentItem.originalUrl || currentItem.thumbnailUrl}
              alt={currentItem.name}
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-md shadow-2xl transition-all duration-200"
            />
          )}
        </div>
      </div>

      {/* Bottom caption / hint */}
      <div className="text-center text-[11px] text-white/40 pb-2">
        <span className="hidden sm:inline">Use Arrow keys to navigate • Esc to close</span>
        <span className="sm:hidden">Swipe left/right to browse media</span>
      </div>
    </div>
  );
}
