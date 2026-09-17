"use client";

import { useState } from "react";
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

interface PinGateProps {
  albumTitle: string;
  onUnlock: (pin: string) => Promise<boolean>;
}

export default function PinGate({ albumTitle, onUnlock }: PinGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!pin || pin.trim().length < 3) {
      setError("Silakan masukkan PIN akses yang valid.");
      return;
    }

    setLoading(true);
    try {
      const success = await onUnlock(pin.trim());
      if (!success) {
        setError("PIN salah. Silakan coba lagi atau hubungi pemilik album.");
      }
    } catch {
      setError("Gagal memverifikasi PIN. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-6 animate-fade-in">
      <div className="bg-white rounded-[12px] border border-black/10 p-8 text-center space-y-6 shadow-sm">
        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-full bg-[#00543D]/10 text-[#00543D] flex items-center justify-center mx-auto shadow-2xs">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/5 text-[11px] font-mono text-black/60 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00543D]" />
            <span>Album Terproteksi</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0A0B0C]">
            {albumTitle}
          </h2>
          <p className="text-xs text-black/50 leading-relaxed max-w-xs mx-auto">
            Album ini bersifat privat untuk keluarga. Silakan masukkan PIN akses untuk melihat foto & video.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2 text-left animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              placeholder="Masukkan PIN (Contoh: 1234)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-lg tracking-[0.3em] font-mono px-4 py-3 rounded-[6px] border border-black/15 focus:outline-hidden focus:border-[#00543D] bg-black/[0.01]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || pin.length < 3}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#00543D] hover:bg-[#003e2c] text-white font-medium text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{loading ? "Memverifikasi..." : "Buka Album"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

