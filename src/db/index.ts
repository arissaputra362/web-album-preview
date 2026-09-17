import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { hashPasswordSync } from "@/lib/crypto";
import fs from "fs";
import path from "path";

// Initialize Postgres client when DATABASE_URL is available
const connectionString = process.env.DATABASE_URL;

export const isDbConfigured = Boolean(connectionString && connectionString.trim().length > 0);

let dbInstance: any = null;

if (isDbConfigured) {
  try {
    const pool = new Pool({ connectionString });
    dbInstance = drizzleNeon(pool, { schema });
  } catch (err) {
    console.warn("Failed to connect to Neon PostgreSQL, falling back to local file store:", err);
  }
}

// Local File-based fallback repository for development when DATABASE_URL is not set
const LOCAL_STORE_FILE = path.join(process.cwd(), ".local-db.json");

interface LocalStore {
  albums: schema.Album[];
  users: schema.User[];
}

import { INITIAL_USERS } from "./seeders/UserSeeder";
import { INITIAL_ALBUMS } from "./seeders/AlbumSeeder";

function getInitialUsers(): schema.User[] {
  return INITIAL_USERS.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email.toLowerCase().trim(),
    password: hashPasswordSync(u.passwordRaw),
    role: u.role,
    createdAt: new Date(),
  }));
}

function getLocalStore(): LocalStore {
  if (!fs.existsSync(LOCAL_STORE_FILE)) {
    const initial: LocalStore = {
      albums: INITIAL_ALBUMS,
      users: getInitialUsers(),
    };
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    let modified = false;

    if (!Array.isArray(parsed.albums)) {
      parsed.albums = INITIAL_ALBUMS;
      modified = true;
    }

    if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
      parsed.users = getInitialUsers();
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    }

    return parsed;
  } catch {
    const fallback: LocalStore = { albums: INITIAL_ALBUMS, users: getInitialUsers() };
    return fallback;
  }
}

function saveLocalStore(store: LocalStore) {
  fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export const localDb = {
  getAlbums: async () => getLocalStore().albums,
  getAlbumBySlug: async (slug: string) => {
    const store = getLocalStore();
    return store.albums.find((a) => a.slug === slug) || null;
  },
  createAlbum: async (album: schema.Album) => {
    const store = getLocalStore();
    store.albums.unshift(album);
    saveLocalStore(store);
    return album;
  },
  updateAlbum: async (id: string, update: Partial<schema.Album>) => {
    const store = getLocalStore();
    const index = store.albums.findIndex((a) => a.id === id);
    if (index !== -1) {
      store.albums[index] = { ...store.albums[index], ...update, updatedAt: new Date() };
      saveLocalStore(store);
      return store.albums[index];
    }
    return null;
  },
  deleteAlbum: async (id: string) => {
    const store = getLocalStore();
    store.albums = store.albums.filter((a) => a.id !== id);
    saveLocalStore(store);
    return true;
  },

  // User methods
  getUsers: async () => getLocalStore().users,
  getUserByEmail: async (email: string) => {
    const store = getLocalStore();
    return store.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  },
  createUser: async (user: schema.User) => {
    const store = getLocalStore();
    const existingIndex = store.users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex !== -1) {
      store.users[existingIndex] = user;
    } else {
      store.users.push(user);
    }
    saveLocalStore(store);
    return user;
  },
  updateUser: async (id: string, update: Partial<schema.User>) => {
    const store = getLocalStore();
    const index = store.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      store.users[index] = { ...store.users[index], ...update };
      saveLocalStore(store);
      return store.users[index];
    }
    return null;
  },
};

export async function findUserByEmail(email: string): Promise<schema.User | null> {
  if (isDbConfigured && dbInstance) {
    try {
      const res = await dbInstance
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email.trim().toLowerCase()))
        .limit(1);
      if (res && res[0]) return res[0];
    } catch (e) {
      console.warn("Error querying user from Postgres, falling back to localDb:", e);
    }
  }
  return localDb.getUserByEmail(email);
}

export async function updateUserPassword(email: string, newPasswordHash: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  let updated = false;

  if (isDbConfigured && dbInstance) {
    try {
      await dbInstance
        .update(schema.users)
        .set({ password: newPasswordHash })
        .where(eq(schema.users.email, normalizedEmail));
      updated = true;
    } catch (e) {
      console.warn("Error updating user password in Postgres:", e);
    }
  }

  const user = await localDb.getUserByEmail(normalizedEmail);
  if (user) {
    await localDb.updateUser(user.id, { password: newPasswordHash });
    updated = true;
  }

  return updated;
}

export const db = dbInstance;
