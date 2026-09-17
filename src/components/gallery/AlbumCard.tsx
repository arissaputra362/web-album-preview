import Link from "next/link";
import { Album } from "@/db/schema";
import { ArrowUpRight, Folder, Lock } from "lucide-react";

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  const formattedDate = album.createdAt
    ? new Date(album.createdAt).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
      })
    : "";

  const displayCoverUrl =
    album.coverFileId && (!album.coverUrl || album.coverUrl.includes("drive.google.com"))
      ? `/api/drive/image/${album.coverFileId}`
      : album.coverUrl;

  const isLocked = Boolean(album.visibility === "private" && album.pin && album.pin.trim().length > 0);

  return (
    <Link
      href={`/album/${album.slug}`}
      className="group block relative select-none"
    >
      {/* Tactile Stack Layer 1 (Depth Shadow Sheet) */}
      <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black/[0.03] rounded-[12px] border border-black/5 rotate-[1deg] pointer-events-none transition-transform duration-300 group-hover:translate-x-3 group-hover:translate-y-3" />

      {/* Tactile Stack Layer 2 (Underlying Page Sheet) */}
      <div className="absolute inset-0 -translate-x-1 translate-y-1 bg-white rounded-[12px] border border-black/8 -rotate-[0.8deg] pointer-events-none transition-transform duration-300 group-hover:-translate-x-1.5 group-hover:translate-y-1.5" />

      {/* Main Front Album Cover */}
      <div className="relative bg-white rounded-[10px] border border-black/10 overflow-hidden shadow-xs transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
        
        {/* Cover Image Container */}
        <div className="relative aspect-[16/11] w-full overflow-hidden bg-black/5">
          {displayCoverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayCoverUrl}
              alt={album.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-black/20 space-y-1">
              <Folder className="w-10 h-10" />
              <span className="text-[10px] font-mono">Cover belum diatur</span>
            </div>
          )}

          {/* Top Lock Badge if private */}
          {isLocked && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-mono shadow-xs">
              <Lock className="w-3 h-3 text-amber-300" />
              <span>Privat</span>
            </div>
          )}

          {/* Top Right Arrow Trigger */}
          <div className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs text-[#0A0B0C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xs">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card Metadata & Typography */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-black/40 font-mono">
            <span>{formattedDate}</span>
            <span className="uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 text-[10px]">
              {album.visibility === "public" ? "Koleksi" : "Privat"}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-[#0A0B0C] tracking-tight group-hover:text-[#00543D] transition-colors leading-snug">
            {album.title}
          </h3>

          {album.description && (
            <p className="text-xs text-black/60 line-clamp-2 leading-relaxed pt-0.5">
              {album.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
