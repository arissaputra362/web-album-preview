import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const albums = pgTable("albums", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  driveFolderId: text("drive_folder_id").notNull(),
  coverFileId: text("cover_file_id"),
  coverUrl: text("cover_url"),
  visibility: text("visibility").default("public").notNull(), // 'public' | 'private'
  pin: text("pin"), // Optional 4-6 digit passcode for private albums
  story: text("story"), // Written stories between photographs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

