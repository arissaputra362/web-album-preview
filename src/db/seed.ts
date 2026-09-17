import fs from "fs";
import path from "path";

// Load .env.local for standalone seed execution
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { runUserSeeder } from "./seeders/UserSeeder";
import { runAlbumSeeder } from "./seeders/AlbumSeeder";

async function main() {
  console.log("==========================================");
  console.log("🌱 DriveAlbum Master Database Seeder");
  console.log("==========================================");

  await runUserSeeder();
  await runAlbumSeeder();

  console.log("==========================================");
  console.log("✨ Semua seeder berhasil dijalankan!");
  console.log("   URL Login: http://localhost:3002/admin/login");
  console.log("==========================================\n");
}

main().catch((err) => {
  console.error("❌ Master Seeder error:", err);
  process.exit(1);
});
