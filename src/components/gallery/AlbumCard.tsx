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
      className="group block relative select-none rounded-[12px] focus-visible:ring-2 focus-visible:ring-[#00543D] focus-visible:outline-hidden"
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
            <div className="w-full h-full flex flex-col items-center justify-center text-black/30 space-y-1">
              <Folder className="w-10 h-10" />
              <span className="text-[11px]">Cover belum diatur</span>
            </div>
          )}

          {/* Top Lock Badge if private (Solid tactile badge, no excessive glassmorphism) */}
          {isLocked && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#0A0B0C] border border-white/10 text-white text-[10px] font-medium shadow-xs">
              <Lock className="w-3 h-3 text-amber-300" />
              <span>Privat</span>
            </div>
          )}

          {/* Top Right Arrow Trigger (Clean white paper trigger) */}
          <div className="absolute top-3 right-3 p-1.5 rounded-[6px] bg-white border border-black/10 text-[#0A0B0C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xs">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card Metadata & Typography */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-black/65 font-medium">
            <span>{formattedDate}</span>
            <span className="uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-black/5 text-[10px] text-black/75 font-semibold">
              {album.visibility === "public" ? "Koleksi" : "Privat"}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-[#0A0B0C] tracking-tight group-hover:text-[#00543D] transition-colors leading-snug">
            {album.title}
          </h3>

          {album.description && (
            <p className="text-xs text-black/75 line-clamp-2 leading-relaxed pt-0.5">
              {album.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
