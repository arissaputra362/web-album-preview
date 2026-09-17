import Link from "next/link";
import { localDb, db, isDbConfigured } from "@/db";
import { albums, Album } from "@/db/schema";
import AlbumCard from "@/components/gallery/AlbumCard";
import { Sparkles } from "lucide-react";

export const revalidate = 0; // Dynamic data for instant updates

async function getAlbums(): Promise<Album[]> {
  try {
    let items: Album[] = [];
    if (isDbConfigured && db) {
      items = await db.select().from(albums);
    } else {
      items = await localDb.getAlbums();
    }
    return items.map((a: Album) => {
      if (a.coverFileId && (!a.coverUrl || a.coverUrl.includes("drive.google.com"))) {
        return { ...a, coverUrl: `/api/drive/image/${a.coverFileId}` };
      }
      return a;
    });
  } catch (err) {
    console.error("Error loading albums:", err);
    return [];
  }
}

export default async function HomePage() {
  const allAlbums: Album[] = await getAlbums();
  const publicAlbums = allAlbums.filter((a: Album) => a.visibility === "public");

  return (
    <div className="space-y-24 pb-24">
      {/* Editorial Hero */}
      <section className="relative max-w-5xl mx-auto px-6 pt-12 sm:pt-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/5 text-xs text-black/60 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#00543D]" />
          <span>Google Drive Powered • Zero Duplicate Storage</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#0A0B0C] leading-[1.08] font-editorial max-w-4xl mx-auto">
          Photography as the hero. Curated with editorial grace.
        </h1>

        <p className="text-base sm:text-lg text-black/60 max-w-2xl mx-auto leading-relaxed">
          DriveAlbum captures and presents your most cherished moments directly from your Google Drive folders into a luminous, daylight web gallery.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <a
            href="#gallery"
            className="px-8 py-3 rounded-full bg-[#00543D] hover:bg-[#003e2c] text-white font-medium text-sm transition-all shadow-xs hover:scale-105 active:scale-95"
          >
            Explore Albums
          </a>
          <Link
            href="/admin/dashboard"
            className="px-8 py-3 rounded-full bg-white hover:bg-black/5 text-[#0A0B0C] border border-black/10 font-medium text-sm transition-all"
          >
            Admin Panel
          </Link>
        </div>
      </section>

      {/* Album Grid Section */}
      <section id="gallery" className="max-w-[1200px] mx-auto px-6 space-y-10">
        <div className="flex items-end justify-between border-b border-black/5 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-black/40">Collections</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0B0C] mt-1">
              Curated Albums
            </h2>
          </div>
          <span className="text-xs text-black/40 font-mono">
            {publicAlbums.length} {publicAlbums.length === 1 ? "Album" : "Albums"}
          </span>
        </div>

        {publicAlbums.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-lg border border-black/5 space-y-3">
            <p className="text-base font-medium text-black/70">No public albums available yet.</p>
            <p className="text-xs text-black/40">
              Log in to the admin panel to add your first Google Drive folder.
            </p>
            <Link
              href="/admin/dashboard"
              className="inline-block mt-2 px-5 py-2 rounded-full bg-[#00543D] text-white text-xs font-medium"
            >
              Go to Admin
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {publicAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
