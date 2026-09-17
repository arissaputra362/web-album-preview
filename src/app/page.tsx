import Link from "next/link";
import { localDb, db, isDbConfigured } from "@/db";
import { albums, Album } from "@/db/schema";
import AlbumCard from "@/components/gallery/AlbumCard";
import FeaturedHeroAlbum from "@/components/gallery/FeaturedHeroAlbum";
import { BookOpen, Camera } from "lucide-react";

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

  // The latest album is chosen as the Featured Magazine Hero
  const featuredAlbum = publicAlbums.length > 0 ? publicAlbums[0] : null;
  const secondaryAlbums = publicAlbums.length > 1 ? publicAlbums.slice(1) : [];

  return (
    <div className="max-w-[1240px] mx-auto px-6 pb-28 space-y-16 sm:space-y-24">
      
      {/* Editorial Intro Header */}
      <section className="pt-4 sm:pt-10 text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[6px] bg-white border border-black/8 text-xs text-black/75 shadow-2xs font-medium">
          <BookOpen className="w-3.5 h-3.5 text-[#00543D]" />
          <span>Arsip Kenangan Keluarga • Tersimpan di Google Drive</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#0A0B0C] leading-[1.12] font-editorial">
          Setiap senyum, langkah kecil, dan momen indah tersimpan abadi.
        </h1>

        <p className="text-sm sm:text-base text-black/75 max-w-xl mx-auto leading-relaxed">
          Galeri foto & video keluarga yang terkurasi langsung dari Google Drive dengan kehangatan estetika editorial.
        </p>
      </section>

      {/* Hero Spotlight: Featured Magazine Cover Album */}
      {featuredAlbum ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs font-medium text-black/60 px-1">
            <span className="uppercase tracking-wider text-[11px] font-semibold text-[#00543D] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00543D] animate-pulse" />
              Sorotan Utama Terbaru
            </span>
          </div>

          <FeaturedHeroAlbum album={featuredAlbum} />
        </section>
      ) : (
        <section className="py-20 text-center bg-white rounded-[16px] border border-black/5 p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto text-black/30">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0A0B0C]">Belum ada album publik</h3>
          <p className="text-xs text-black/60 max-w-sm mx-auto">
            Masuk ke panel admin untuk menghubungkan folder Google Drive pertama Anda.
          </p>
          <Link
            href="/admin/login"
            className="inline-block px-6 py-2.5 rounded-[8px] bg-[#00543D] text-white text-xs font-medium hover:bg-[#003e2c] transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-[#00543D] focus-visible:outline-hidden"
          >
            Masuk ke Admin Portal
          </Link>
        </section>
      )}

      {/* Other Curated Collections Section */}
      {secondaryAlbums.length > 0 && (
        <section id="gallery" className="space-y-10 pt-6">
          <div className="flex items-end justify-between border-b border-black/8 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-black/60 font-medium">Koleksi Lainnya</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0B0C] mt-1 font-editorial">
                Jelajahi Arsip Kenangan
              </h2>
            </div>
            <span className="text-xs text-black/60 font-medium">
              {secondaryAlbums.length} Koleksi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {secondaryAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
