"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Camera, Shield, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminPath = pathname?.startsWith("/admin");
  const [hasSession, setHasSession] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setHasSession(document.cookie.includes("drivealbum_admin_session=authenticated"));
    }
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    if (typeof document !== "undefined") {
      document.cookie = "drivealbum_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    setHasSession(false);
    setShowDropdown(false);
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="fixed top-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between gap-6 px-6 py-3 bg-white/80 backdrop-blur-md rounded-full border border-black/5 shadow-xs max-w-3xl w-full transition-all">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-[#00543D] text-white flex items-center justify-center transition-transform group-hover:scale-105">
            <Camera className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-[#0A0B0C]">DriveAlbum</span>
            <span className="text-[10px] text-black/40 uppercase tracking-widest font-mono">Editorial</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
              pathname === "/" ? "bg-[#0A0B0C] text-white" : "text-black/70 hover:text-black hover:bg-black/5"
            }`}
          >
            Explore
          </Link>

          {hasSession ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                  isAdminPath ? "bg-[#00543D] text-white" : "text-black/70 hover:text-black hover:bg-black/5"
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Admin</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-[12px] border border-black/10 shadow-xl py-1.5 z-50 animate-fade-in text-xs">
                  <div className="px-3.5 py-2 border-b border-black/5">
                    <p className="font-semibold text-black">Administrator</p>
                    <p className="text-[10px] text-black/40 font-mono truncate">admin@drivealbum.local</p>
                  </div>

                  <Link
                    href="/admin/dashboard"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-black/70 hover:text-black hover:bg-black/5 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#00543D]" />
                    <span>Dashboard CMS</span>
                  </Link>

                  <div className="border-t border-black/5 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-red-600 hover:bg-red-50 transition-colors font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/admin/login"
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                isAdminPath ? "bg-[#00543D] text-white" : "text-black/70 hover:text-black hover:bg-black/5"
              }`}
            >
              <Shield className="w-3 h-3" />
              Admin
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
