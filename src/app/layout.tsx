import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DriveAlbum: Galeri Foto & Video Kenangan Keluarga",
  description: "Arsip kenangan foto dan video keluarga berestetika editorial langsung dari Google Drive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-[#F9F9F9] text-[#0A0B0C] selection:bg-[#ABCBF9] selection:text-black">
        <Navbar />
        <main className="flex-1 pt-28 sm:pt-32">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
