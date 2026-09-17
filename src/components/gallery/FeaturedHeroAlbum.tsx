import Link from "next/link";
import { Album } from "@/db/schema";
import { ArrowRight, Calendar, Bookmark, Folder, Lock } from "lucide-react";

interface FeaturedHeroAlbumProps {
  album: Album;
}

export default function FeaturedHeroAlbum({ album }: FeaturedHeroAlbumProps) {
  const formattedDate = album.createdAt
    ? new Date(album.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const displayCoverUrl =
    album.coverFileId && (!album.coverUrl || album.coverUrl.includes("drive.google.com"))
      ? `/api/drive/image/${album.coverFileId}`
      : album.coverUrl;

  const isLocked = Boolean(album.visibility === "private" && album.pin && album.pin.trim().length > 0);

  return (
    <div className="relative group">
      {/* Background Tactile Stack Layer 1 (Bottom Book Spine Depth) */}
      <div className="absolute inset-0 translate-x-2 translate-y-2 sm:translate-x-3 sm:translate-y-3 bg-black/[0.04] rounded-[20px] border border-black/5 rotate-[0.8deg] pointer-events-none transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-4" />

      {/* Background Tactile Stack Layer 2 (Middle Paper Depth) */}
      <div className="absolute inset-0 -translate-x-1.5 translate-y-1.5 sm:-translate-x-2 sm:translate-y-2 bg-white/70 rounded-[20px] border border-black/8 -rotate-[0.6deg] pointer-events-none transition-transform duration-500 group-hover:-translate-x-2.5 group-hover:translate-y-2.5" />

      {/* Main Magazine Cover Container */}
      <div className="relative bg-white rounded-[18px] sm:rounded-[20px] border border-black/10 p-5 sm:p-8 md:p-10 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero Cover Artwork */}
          <div className="md:col-span-7 relative">
            <Link
              href={`/album/${album.slug}`}
              className="block relative aspect-[4/3] sm:aspect-[16/11] w-full rounded-[12px] overflow-hidden bg-black/5 shadow-inner cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00543D] focus-visible:outline-hidden"
            >
              {displayCoverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayCoverUrl}
                  alt={album.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-black/30 space-y-2">
                  <Folder className="w-16 h-16" />
                  <span className="text-xs">Belum ada foto cover</span>
                </div>
              )}

              {/* Spotlight Floating Badge (Tactile Paper Badge, No Excessive Glassmorphism) */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white border border-black/10 text-[#00543D] text-[11px] font-semibold shadow-xs">
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                <span>Sorotan Utama</span>
              </div>

              {/* Private Lock Indicator */}
              {isLocked && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#0A0B0C] border border-white/10 text-white text-[11px] shadow-xs">
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>PIN Terproteksi</span>
                </div>
              )}

              {/* Subtle Vignette Gradient on bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            </Link>
          </div>

          {/* Right Column: Editorial Narrative & CTA */}
          <div className="md:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-black/65">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#00543D]" />
                  {formattedDate}
                </span>
                <span>•</span>
                <span className="uppercase tracking-wider text-[10px] bg-black/5 px-2.5 py-0.5 rounded-[4px] text-black/75 font-semibold">
                  {album.visibility === "public" ? "Koleksi Terbuka" : "Privat"}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0A0B0C] leading-tight font-editorial group-hover:text-[#00543D] transition-colors">
                <Link
                  href={`/album/${album.slug}`}
                  className="focus-visible:ring-2 focus-visible:ring-[#00543D] focus-visible:outline-hidden rounded-[4px]"
                >
                  {album.title}
                </Link>
              </h2>

              {album.description && (
                <p className="text-sm sm:text-base text-black/75 leading-relaxed line-clamp-3">
                  {album.description}
                </p>
              )}

              {album.story && (
                <div className="pt-2 border-l-2 border-[#00543D]/40 pl-3">
                  <p className="text-xs text-black/65 italic leading-relaxed line-clamp-2">
                    &ldquo;{album.story}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons (Structured Editorial Button) */}
            <div className="pt-2">
              <Link
                href={`/album/${album.slug}`}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[8px] bg-[#00543D] hover:bg-[#003e2c] text-white font-medium text-xs sm:text-sm transition-all shadow-xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00543D] focus-visible:outline-hidden"
              >
                <span>Buka Album Ini</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

