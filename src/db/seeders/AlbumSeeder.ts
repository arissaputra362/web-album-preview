import fs from "fs";
import path from "path";

export const INITIAL_ALBUMS = [
  {
    id: "demo-album-1",
    title: "Liburan Musim Panas di Bali",
    slug: "bali-summer-holiday",
    description: "Momen kehangatan keluarga di pesisir pantai Sanur dan keindahan Ubud.",
    driveFolderId: "demo-folder-bali",
    coverFileId: "demo-cover-1",
    coverUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
    visibility: "public",
    pin: null,
    story: "Perjalanan dimulai dari pantai timur saat fajar merekah. Setiap deburan ombak membawa tawa riang dan kenangan yang tak terlupakan.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-album-2",
    title: "Ulang Tahun Pertama Hanna",
    slug: "hanna-first-birthday",
    description: "Syukuran dan tawa bersama keluarga besar merayakan usia satu tahun Hanna.",
    driveFolderId: "demo-folder-hanna",
    coverFileId: "demo-cover-2",
    coverUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
    visibility: "public",
    pin: null,
    story: "Kue stroberi mungil, balon warna-warni, dan tatapan polos penuh binar kebahagiaan.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function runAlbumSeeder() {
  console.log("\n📸 [AlbumSeeder] Menjalankan seeding album demo...");

  const connectionString = process.env.DATABASE_URL;
  const isPostgres = Boolean(connectionString && connectionString.trim().length > 0);

  if (isPostgres) {
    try {
      const { drizzle } = await import("drizzle-orm/neon-serverless");
      const { Pool } = await import("@neondatabase/serverless");
      const { eq } = await import("drizzle-orm");
      const schema = await import("../schema");

      const pool = new Pool({ connectionString });
      const db = drizzle(pool, { schema });

      for (const a of INITIAL_ALBUMS) {
        const existing = await db
          .select()
          .from(schema.albums)
          .where(eq(schema.albums.slug, a.slug))
          .limit(1);

        if (existing && existing.length === 0) {
          await db.insert(schema.albums).values(a);
          console.log(`   ✓ [Postgres] Album [${a.title}] berhasil ditambahkan.`);
        }
      }
    } catch (err) {
      console.error("   ⚠️ [Postgres] Gagal melakukan seeding album ke PostgreSQL:", err);
    }
  }

  const localDbPath = path.join(process.cwd(), ".local-db.json");
  let localData: any = { albums: [], users: [] };

  if (fs.existsSync(localDbPath)) {
    try {
      localData = JSON.parse(fs.readFileSync(localDbPath, "utf-8"));
    } catch {
      localData = { albums: [], users: [] };
    }
  }

  if (!Array.isArray(localData.albums)) {
    localData.albums = [];
  }

  for (const a of INITIAL_ALBUMS) {
    const exists = localData.albums.some((item: any) => item.slug === a.slug);
    if (!exists) {
      localData.albums.push(a);
      console.log(`   ✓ [.local-db.json] Album [${a.title}] berhasil ditambahkan.`);
    }
  }

  fs.writeFileSync(localDbPath, JSON.stringify(localData, null, 2), "utf-8");
  console.log("✅ [AlbumSeeder] Seeding album demo selesai!\n");
}

