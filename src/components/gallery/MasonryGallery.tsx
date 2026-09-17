"use client";

import { useState } from "react";
import { DriveMediaItem } from "@/lib/drive";
import Lightbox from "./Lightbox";
import StoryBlock from "./StoryBlock";
import { Maximize2, Play, Video, Image as ImageIcon, Camera } from "lucide-react";

interface MasonryGalleryProps {
  media: DriveMediaItem[];
  story?: string;
}

function MediaCard({
  item,
  onClick,
}: {
  item: DriveMediaItem;
  onClick: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isVideo = item.kind === "video";

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-[8px] bg-white border border-black/5 shadow-xs transition-all duration-300 hover:shadow-md break-inside-avoid"
    >
      {/* Skeleton Shimmer Placeholder while loading */}
      {!isLoaded && !hasError && (
        <div className="w-full aspect-[4/3] bg-gradient-to-tr from-black/[0.03] via-black/[0.07] to-black/[0.03] animate-pulse flex flex-col items-center justify-center p-4 text-center text-black/30 space-y-2">
          {isVideo ? (
            <Video className="w-7 h-7 text-[#00543D]/40 animate-bounce" />
          ) : (
            <Camera className="w-7 h-7 text-black/20" />
          )}
          <span className="text-[11px] font-mono text-black/40 truncate max-w-[80%]">
            {item.name}
          </span>
        </div>
      )}

      {/* Actual Media Preview */}
      {!hasError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnailUrl || item.originalUrl}
          alt={item.name}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-auto object-cover transition-all duration-500 group-hover:scale-[1.02] ${
            isLoaded ? "opacity-100" : "opacity-0 absolute inset-0 h-full w-full"
          }`}
        />
      ) : (
        <div className="w-full aspect-[4/3] bg-black/5 flex flex-col items-center justify-center p-4 text-center text-black/40 space-y-1">
          <ImageIcon className="w-6 h-6 text-black/20" />
          <span className="text-xs font-medium truncate max-w-[90%]">{item.name}</span>
          <span className="text-[10px] text-black/40 font-mono">Klik untuk melihat</span>
        </div>
      )}

      {/* Video badge */}
      {isVideo && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-mono uppercase tracking-wider shadow-xs">
          <Video className="w-3 h-3 text-[#FFBBFC]" />
          <span>Video</span>
        </div>
      )}

      {/* Center Play Button for videos */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-12 h-12 rounded-full bg-white/85 backdrop-blur-md text-[#0A0B0C] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#00543D] group-hover:text-white transition-all">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      )}

      {/* Bottom Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4 text-white z-20">
        <span className="text-xs truncate font-medium max-w-[80%]">{item.name}</span>
        <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-xs">
          <Maximize2 className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

export default function MasonryGallery({ media, story }: MasonryGalleryProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);

  if (!media || media.length === 0) {
    return (
      <div className="py-24 text-center text-black/40">
        <p className="text-sm">Tidak ada foto atau video di folder ini.</p>
      </div>
    );
  }

  // Split media into two sets if a story block exists to display the story midway
  const midpoint = Math.ceil(media.length / 2);
  const firstBatch = story ? media.slice(0, midpoint) : media;
  const secondBatch = story ? media.slice(midpoint) : [];

  const renderMediaGrid = (items: DriveMediaItem[], offsetIndex: number) => (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
      {items.map((item, idx) => {
        const actualIndex = offsetIndex + idx;
        return (
          <MediaCard
            key={item.id || actualIndex}
            item={item}
            onClick={() => setActiveMediaIndex(actualIndex)}
          />
        );
      })}
    </div>
  );

  return (
    <div className="w-full">
      {renderMediaGrid(firstBatch, 0)}

      {story && <StoryBlock story={story} />}

      {secondBatch.length > 0 && renderMediaGrid(secondBatch, midpoint)}

      {activeMediaIndex !== null && (
        <Lightbox
          media={media}
          initialIndex={activeMediaIndex}
          onClose={() => setActiveMediaIndex(null)}
        />
      )}
    </div>
  );
}
