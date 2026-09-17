"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Shield } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

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
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
              isAdmin ? "bg-[#00543D] text-white" : "text-black/70 hover:text-black hover:bg-black/5"
            }`}
          >
            <Shield className="w-3 h-3" />
            Admin
          </Link>
        </div>
      </nav>
    </header>
  );
}

