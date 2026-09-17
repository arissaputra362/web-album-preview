import fs from "fs";
import path from "path";
import { hashPasswordSync } from "../../lib/crypto";

/**
 * Initial User Seed Data
 * Tambahkan atau modifikasi daftar akun pengguna di sini.
 */
export const INITIAL_USERS = [
  {
    id: "user-admin-1",
    name: "Administrator",
    email: "admin@drivealbum.local",
    passwordRaw: "admin123", // Akan di-hash otomatis dengan scrypt
    role: "admin",
  },
];

export async function runUserSeeder() {
  console.log("\n👤 [UserSeeder] Menjalankan seeding data user...");

  const usersToInsert = INITIAL_USERS.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email.toLowerCase().trim(),
    password: hashPasswordSync(user.passwordRaw),
    role: user.role,
    createdAt: new Date(),
  }));

  const connectionString = process.env.DATABASE_URL;
  const isPostgres = Boolean(connectionString && connectionString.trim().length > 0);

  // 1. Seed ke PostgreSQL jika DATABASE_URL tersedia
  if (isPostgres) {
    try {
      const { drizzle } = await import("drizzle-orm/neon-serverless");
      const { Pool } = await import("@neondatabase/serverless");
      const { eq } = await import("drizzle-orm");
      const schema = await import("../schema");

      const pool = new Pool({ connectionString });
      const db = drizzle(pool, { schema });

      for (const u of usersToInsert) {
        const existing = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, u.email))
          .limit(1);

        if (existing && existing.length > 0) {
          await db
            .update(schema.users)
            .set({ password: u.password, name: u.name, role: u.role })
            .where(eq(schema.users.email, u.email));
          console.log(`   ✓ [Postgres] User [${u.email}] berhasil diperbarui.`);
        } else {
          await db.insert(schema.users).values(u);
          console.log(`   ✓ [Postgres] User [${u.email}] berhasil ditambahkan.`);
        }
      }
    } catch (err) {
      console.error("   ⚠️ [Postgres] Gagal melakukan seeding user ke PostgreSQL:", err);
    }
  }

  // 2. Selalu sinkronkan ke .local-db.json untuk development lokal
  const localDbPath = path.join(process.cwd(), ".local-db.json");
  let localData: any = { albums: [], users: [] };

  if (fs.existsSync(localDbPath)) {
    try {
      localData = JSON.parse(fs.readFileSync(localDbPath, "utf-8"));
    } catch {
      localData = { albums: [], users: [] };
    }
  }

  if (!Array.isArray(localData.users)) {
    localData.users = [];
  }

  for (const u of usersToInsert) {
    const idx = localData.users.findIndex((item: any) => item.email.toLowerCase() === u.email);
    if (idx !== -1) {
      localData.users[idx] = u;
      console.log(`   ✓ [.local-db.json] User [${u.email}] berhasil diperbarui.`);
    } else {
      localData.users.push(u);
      console.log(`   ✓ [.local-db.json] User [${u.email}] berhasil ditambahkan.`);
    }
  }

  fs.writeFileSync(localDbPath, JSON.stringify(localData, null, 2), "utf-8");
  console.log("✅ [UserSeeder] Seeding user selesai!\n");

  console.log("   Daftar Akun yang Disediakan:");
  INITIAL_USERS.forEach((u) => {
    console.log(`   - Email   : ${u.email}`);
    console.log(`     Password: ${u.passwordRaw}`);
    console.log(`     Role    : ${u.role}`);
  });
}

// Support running directly: npx tsx src/db/seeders/UserSeeder.ts
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("UserSeeder.ts")) {
  runUserSeeder().catch((err) => {
    console.error("❌ [UserSeeder] Terjadi error:", err);
    process.exit(1);
  });
}

