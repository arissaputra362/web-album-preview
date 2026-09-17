import { notFound } from "next/navigation";
import Link from "next/link";
import { localDb, db, isDbConfigured } from "@/db";
import { albums } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchFolderContent } from "@/lib/drive";
import AlbumExplorer from "@/components/gallery/AlbumExplorer";
import { ArrowLeft, Calendar, Image as ImageIcon, Folder } from "lucide-react";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AlbumDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let album = null;
  if (isDbConfigured && db) {
    const res = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1);
    album = res[0] || null;
  } else {
    album = await localDb.getAlbumBySlug(slug);
  }

  if (!album) {
    notFound();
  }

  const isLocked = Boolean(album.visibility === "private" && album.pin && album.pin.trim().length > 0);

  // If album is private with PIN, do not preload media server-side without PIN verification
  const content = isLocked
    ? { folders: [], media: [] }
    : await fetchFolderContent(album.driveFolderId);

  const formattedDate = album.createdAt
    ? new Date(album.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="max-w-[1200px] mx-auto px-6 pb-28 space-y-10">
      {/* Top back navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-black/70 hover:text-black transition-colors rounded-[4px] px-1 py-0.5 focus-visible:ring-2 focus-visible:ring-[#00543D] focus:outline-hidden"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke semua album
        </Link>
      </div>

      {/* Album Header */}
      <header className="max-w-3xl space-y-4">
        <div className="flex items-center flex-wrap gap-4 text-xs text-black/70 font-medium">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          {isLocked ? (
            <span className="flex items-center gap-1 text-[#00543D] font-medium bg-[#00543D]/10 px-2.5 py-0.5 rounded-[4px]">
              Privat (PIN Terproteksi)
            </span>
          ) : (
            <>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                {content.media.length} Foto & Video
              </span>
              {content.folders.length > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-[#00543D]">
                    <Folder className="w-3.5 h-3.5" />
                    {content.folders.length} Subfolder
                  </span>
                </>
              )}
            </>
          )}
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0A0B0C] font-editorial">
          {album.title}
        </h1>

        {album.description && (
          <p className="text-base text-black/70 leading-relaxed pt-1">
            {album.description}
          </p>
        )}
      </header>

      {/* Interactive Explorer (Breadcrumb, Subfolders, Photos & Videos) */}
      <AlbumExplorer
        album={{ ...album, pin: null }}
        initialFolders={content.folders}
        initialMedia={content.media}
        isInitiallyLocked={isLocked}
      />
    </div>
  );
}
