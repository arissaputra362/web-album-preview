"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Lock, Mail, Eye, EyeOff, Terminal } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@drivealbum.local");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Email atau password yang Anda masukkan salah.");
        setLoading(false);
        return;
      }

      // Success: redirect to dashboard
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Login failed:", err);
      setError("Gagal terhubung ke server. Pastikan koneksi internet atau server lokal aktif.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 animate-fade-in">
      <div className="bg-white rounded-[12px] border border-black/10 p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#00543D] text-white flex items-center justify-center mx-auto shadow-2xs">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0B0C]">Admin Portal</h1>
          <p className="text-xs text-black/50">Masuk untuk mengelola album foto & Google Drive</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-black/70 mb-1 flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-black/40" />
              Email Admin
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[4px] border border-black/15 focus:outline-hidden focus:border-[#00543D] transition-colors"
              placeholder="admin@drivealbum.local"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-black/70 mb-1 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-black/40" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-[4px] border border-black/15 focus:outline-hidden focus:border-[#00543D] transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#00543D] hover:bg-[#003e2c] text-white font-medium text-xs transition-all shadow-xs cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <span>{loading ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
