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
