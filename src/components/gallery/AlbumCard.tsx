import Link from "next/link";
import { Album } from "@/db/schema";
import { ArrowUpRight, Folder } from "lucide-react";

interface AlbumCardProps {
  album: Album;
  accentColor?: string; // Optional custom left border color token
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

  return (
    <Link
      href={`/album/${album.slug}`}
      className="group block bg-white rounded-[8px] border border-black/5 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative border-l-4 border-l-[#00543D]"
    >
      {/* Cover Image */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-black/5">
        {displayCoverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayCoverUrl}
            alt={album.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black/20">
            <Folder className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-xs text-[#0A0B0C] opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-black/40 font-mono">
          <span>{formattedDate}</span>
          <span className="uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5">
            {album.visibility}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-[#0A0B0C] tracking-tight group-hover:text-[#00543D] transition-colors">
          {album.title}
        </h3>

        {album.description && (
          <p className="text-xs text-black/60 line-clamp-2 leading-relaxed">
            {album.description}
          </p>
        )}
      </div>
    </Link>
  );
}

