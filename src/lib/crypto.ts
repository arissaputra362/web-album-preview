import crypto from "crypto";

/**
 * Hashes a plaintext password using scrypt with a unique random 16-byte salt.
 * Returns format: `${salt}:${hash}`
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Synchronous version for simple seeding and scripts
 */
export function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored `${salt}:${hash}` string.
 * Uses timingSafeEqual to guard against timing attacks.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!storedHash || !storedHash.includes(":")) {
      return resolve(false);
    }
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) {
      return resolve(false);
    }

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const originalBuffer = Buffer.from(originalHash, "hex");
        if (originalBuffer.length !== derivedKey.length) {
          return resolve(false);
        }
        resolve(crypto.timingSafeEqual(originalBuffer, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}

