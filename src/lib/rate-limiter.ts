/**
 * Lightweight In-Memory Sliding-Window Rate Limiter
 * Digunakan untuk melindungi API Google Drive dari scraping atau request bombing
 * yang dapat menghabiskan kuota Google Cloud.
 */

interface RateLimitRecord {
  timestamps: number[];
}

class RateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests = 150, windowMs = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Bersihkan record lama setiap 5 menit untuk mencegah kebocoran memori
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 5 * 60 * 1000).unref?.();
    }
  }

  public check(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTimeSeconds: number;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.records.get(identifier);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(identifier, record);
    }

    // Filter timestamp hanya dalam window aktif
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0] || now;
      const resetTimeSeconds = Math.ceil((oldest + this.windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTimeSeconds: Math.max(1, resetTimeSeconds),
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - record.timestamps.length,
      resetTimeSeconds: Math.ceil(this.windowMs / 1000),
    };
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }
}

// Global instance untuk proteksi endpoint Google Drive Media
// 150 request per menit per IP (cukup fleksibel untuk galeri foto banyak)
export const driveMediaRateLimiter = new RateLimiter(150, 60 * 1000);

// Global instance untuk proteksi endpoint API Auth
export const authRateLimiter = new RateLimiter(20, 60 * 1000);

