"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Download, Video, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { DriveMediaItem } from "@/lib/drive";

interface LightboxProps {
  media: DriveMediaItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ media, initialIndex, onClose }: LightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [highResLoaded, setHighResLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const currentItem = media[currentIndex];

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleNext = useCallback(() => {
    if (media.length <= 1) return;
    setHighResLoaded(false);
    setHasError(false);
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  const handlePrev = useCallback(() => {
    if (media.length <= 1) return;
    setHighResLoaded(false);
    setHasError(false);
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  // Reset load state when current index changes
  useEffect(() => {
    setHighResLoaded(false);
    setHasError(false);
  }, [currentIndex]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [handleNext, handlePrev, onClose]);

  // Touch handlers with vertical swipe detection to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Horizontal swipe for next/prev
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    // Pull down / swipe up to dismiss
    else if (Math.abs(diffY) > 80 && Math.abs(diffX) < 40) {
      onClose();
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  if (!mounted || !currentItem) return null;

  const isVideo = currentItem.kind === "video";
  const displayThumbUrl = currentItem.thumbnailUrl || currentItem.originalUrl;
  const displayOriginalUrl = currentItem.originalUrl || currentItem.thumbnailUrl;

  const content = (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[999] bg-black/92 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 text-white animate-fade-in select-none"
      style={{ touchAction: "pan-y" }}
    >
      {/* Sleek Top Header Bar (Safe area, touch-friendly, never hidden behind Navbar) */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto z-20 pt-1 sm:pt-0">
        {/* Left: Counter & Media Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs font-mono tracking-wider text-white/70 bg-white/10 px-2.5 py-1 rounded-full border border-white/5 shadow-xs">
            {currentIndex + 1} / {media.length}
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase font-mono tracking-wider text-white/60">
            {isVideo ? <Video className="w-3 h-3 text-[#FFBBFC]" /> : <ImageIcon className="w-3 h-3 text-[#ABCBF9]" />}
            <span>{isVideo ? "Video" : "Foto"}</span>
          </div>
          <span className="hidden sm:inline-block text-xs text-white/60 truncate max-w-[200px] md:max-w-md font-mono">
            {currentItem.name}
          </span>
        </div>

        {/* Right: Download & Touch-Friendly Close Button */}
        <div className="flex items-center gap-2">
          <a
            href={currentItem.downloadUrl || displayOriginalUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 sm:px-3 sm:py-1.5 text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download Media"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer shadow-xs"
            title="Tutup Preview (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Media Presentation Area with Generous Mobile Margin */}
      <div className="relative flex-1 flex items-center justify-center my-2 sm:my-4 overflow-hidden">
        {/* Desktop Side Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="hidden sm:flex absolute left-2 sm:left-4 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white/90 transition-all backdrop-blur-sm cursor-pointer shadow-md"
              title="Foto Sebelumnya"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="hidden sm:flex absolute right-2 sm:right-4 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white/90 transition-all backdrop-blur-sm cursor-pointer shadow-md"
              title="Foto Berikutnya"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Media Frame */}
        <div className="relative max-h-[72vh] sm:max-h-[80vh] max-w-[92vw] sm:max-w-[85vw] flex items-center justify-center">
          {isVideo ? (
            <div className="relative flex items-center justify-center bg-black/40 rounded-[12px] overflow-hidden shadow-2xl">
              <video
                key={currentItem.id}
                src={displayOriginalUrl}
                poster={displayThumbUrl}
                controls
                playsInline
                preload="metadata"
                onLoadedData={() => setHighResLoaded(true)}
                onError={() => setHasError(true)}
                className="max-h-[70vh] sm:max-h-[78vh] max-w-[90vw] sm:max-w-[82vw] rounded-[10px] outline-hidden"
              >
                Browser Anda tidak mendukung pemutar video HTML5.
              </video>
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              {/* Progressive Layer 1: Instant Low-Res Thumbnail (Zero Black Screen) */}
              {displayThumbUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayThumbUrl}
                  alt={currentItem.name}
                  className={`max-h-[70vh] sm:max-h-[78vh] max-w-[90vw] sm:max-w-[82vw] object-contain rounded-[10px] transition-opacity duration-300 ${
                    highResLoaded ? "opacity-0 absolute inset-0 pointer-events-none" : "opacity-90 blur-xs"
                  }`}
                />
              )}

              {/* Progressive Layer 2: Full-Res Image (Smoothly Fades In) */}
              {!hasError && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayOriginalUrl}
                  alt={currentItem.name}
                  onLoad={() => setHighResLoaded(true)}
                  onError={() => setHasError(true)}
                  className={`max-h-[70vh] sm:max-h-[78vh] max-w-[90vw] sm:max-w-[82vw] object-contain rounded-[10px] shadow-2xl transition-opacity duration-300 ${
                    highResLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}

              {/* Center Spinner while downloading high-res */}
              {!highResLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="p-3 rounded-full bg-black/60 backdrop-blur-md shadow-lg">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                </div>
              )}

              {/* Error fallback state */}
              {hasError && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-[12px] text-center space-y-3 max-w-sm">
                  <p className="text-xs text-white/60">Gagal memuat media beresolusi penuh.</p>
                  <button
                    onClick={() => {
                      setHasError(false);
                      setHighResLoaded(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Lagi</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Hint / Mobile Navigation Navigation */}
      <div className="flex items-center justify-between sm:justify-center w-full max-w-5xl mx-auto px-2 pt-1 z-20 text-[11px] text-white/50">
        {/* Mobile Left Arrow */}
        {media.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="sm:hidden p-2 rounded-full bg-white/10 active:bg-white/25 text-white/80"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div className="text-center font-mono text-[10px] sm:text-[11px] tracking-wide">
          <span className="hidden sm:inline">Gunakan tombol panah keyboard • Esc untuk menutup</span>
          <span className="sm:hidden">Geser kiri / kanan • Tarik ke bawah untuk menutup</span>
        </div>

        {/* Mobile Right Arrow */}
        {media.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="sm:hidden p-2 rounded-full bg-white/10 active:bg-white/25 text-white/80"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
