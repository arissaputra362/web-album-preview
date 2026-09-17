"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Album } from "@/db/schema";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCw,
  Folder,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock,
  LogOut,
  KeyRound,
  X,
  ChevronDown,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [description, setDescription] = useState("");
  const [story, setStory] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Change Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  // Admin Profile Menu state
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setShowAdminMenu(false);
      }
    };
    if (showAdminMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAdminMenu]);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/albums");
      const data = await res.json();
      if (data.success) {
        setAlbums(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verify admin authentication via backend
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          router.push("/admin/login");
          return;
        }
        fetchAlbums();
      } catch {
        router.push("/admin/login");
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    if (typeof document !== "undefined") {
      document.cookie = "drivealbum_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    router.push("/admin/login");
    router.refresh();
  };

  const handleOpenCreate = () => {
    setEditingAlbum(null);
    setTitle("");
    setDriveFolderId("");
    setDescription("");
    setStory("");
    setVisibility("public");
    setPin("");
    setFormError("");
    setShowModal(true);
  };

  const handleOpenEdit = (album: Album) => {
    setEditingAlbum(album);
    setTitle(album.title);
    setDriveFolderId(album.driveFolderId);
    setDescription(album.description || "");
    setStory(album.story || "");
    setVisibility(album.visibility || "public");
    setPin((album as any).pin || "");
    setFormError("");
    setShowModal(true);
  };

  const handleSubmitAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !driveFolderId.trim()) {
      setFormError("Judul album dan Google Drive Folder ID wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editingAlbum);
      const url = isEdit ? `/api/albums/${editingAlbum?.slug}` : "/api/albums";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          driveFolderId,
          description,
          story,
          visibility,
          pin: visibility === "private" ? pin : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingAlbum(null);
        fetchAlbums();
        setSyncStatus(
          isEdit ? "Album berhasil diperbarui!" : "Album baru berhasil ditambahkan!"
        );
      } else {
        setFormError(data.error || "Gagal memproses album.");
      }
    } catch (err: any) {
      setFormError(err?.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (newPassword !== confirmPassword) {
      setPassError("Konfirmasi password baru tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("Password baru minimal terdiri dari 6 karakter.");
      return;
    }

    setPassSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (data.success) {
        setPassSuccess("Password admin berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPassSuccess("");
        }, 1500);
      } else {
        setPassError(data.error || "Gagal mengubah password.");
      }
    } catch (err: any) {
      setPassError(err?.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setPassSubmitting(false);
    }
  };

  const handleDeleteAlbum = async (slug: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus album ini?")) return;
    try {
      const res = await fetch(`/api/albums/${slug}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchAlbums();
        setSyncStatus("Album berhasil dihapus.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestSync = async (folderId: string, albumId: string) => {
    setSyncingId(albumId);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(`Berhasil terhubung! Ditemukan ${data.data.count} foto di Google Drive.`);
        fetchAlbums();
      } else {
        setSyncStatus(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      setSyncStatus(`Error: ${err?.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-2 pb-24 space-y-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-black/5 pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-black/40">Admin Portal</span>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A0B0C] mt-1">
            Manajemen Album & Google Drive
          </h1>
          <p className="text-xs text-black/50 mt-1">
            Service Account aktif:{" "}
            <code className="bg-black/5 px-2 py-0.5 rounded text-[11px] text-[#00543D] font-mono">
              drivealbum-bot@potent-retina-464605-h2.iam.gserviceaccount.com
            </code>
          </p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00543D] text-white text-xs font-medium hover:bg-[#003e2c] transition-all shadow-xs cursor-pointer relative z-20 shrink-0 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tambah Album Baru
          </button>

          {/* Admin Account Dropdown Menu */}
          <div className="relative" ref={adminMenuRef}>
            <button
              type="button"
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white border border-black/10 hover:bg-black/5 text-black/80 text-xs font-medium transition-all cursor-pointer shadow-xs select-none"
              aria-expanded={showAdminMenu}
            >
              <div className="w-5 h-5 rounded-full bg-[#00543D] text-white flex items-center justify-center font-bold text-[10px]">
                A
              </div>
              <span className="font-medium">Admin</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-black/40 transition-transform duration-200 ${
                  showAdminMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Floating Panel */}
            {showAdminMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-[12px] border border-black/10 shadow-xl py-2 z-50 animate-fade-in text-xs">
                <div className="px-4 py-2.5 border-b border-black/5">
                  <p className="font-semibold text-[#0A0B0C]">Administrator</p>
                  <p className="text-[11px] text-black/40 truncate font-mono">admin@drivealbum.local</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminMenu(false);
                      setPassError("");
                      setPassSuccess("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setShowPasswordModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-black/70 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-[#00543D]" />
                    <span>Ubah Password</span>
                  </button>
                </div>

                <div className="border-t border-black/5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="p-4 rounded-[8px] bg-white border border-black/10 flex items-center gap-3 text-xs">
          <CheckCircle2 className="w-4 h-4 text-[#00543D]" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Table of Albums */}
      <div className="bg-white rounded-[8px] border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F9F9] border-b border-black/5 font-mono text-[11px] uppercase tracking-wider text-black/40">
              <tr>
                <th className="py-3.5 px-6">Album</th>
                <th className="py-3.5 px-6">Drive Folder ID</th>
                <th className="py-3.5 px-6">Visibilitas & Akses</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-black/40">
                    Memuat data album...
                  </td>
                </tr>
              ) : albums.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-black/40">
                    Belum ada album. Klik tombol &ldquo;Tambah Album Baru&rdquo; di atas untuk menghubungkan Google Drive.
                  </td>
                </tr>
              ) : (
                albums.map((album) => (
                  <tr key={album.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-black/5 overflow-hidden flex items-center justify-center shrink-0">
                          {album.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Folder className="w-5 h-5 text-black/20" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#0A0B0C]">{album.title}</p>
                          <p className="text-[11px] text-black/40 font-mono">/{album.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono text-black/60">
                      <span className="bg-black/5 px-2 py-1 rounded text-[11px]">
                        {album.driveFolderId}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                            album.visibility === "public"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {album.visibility === "public" ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                          {album.visibility}
                        </span>

                        {album.visibility === "private" && (
                          (album as any).pin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                              <Lock className="w-2.5 h-2.5 text-amber-700" />
                              PIN: {(album as any).pin}
                            </span>
                          ) : (
                            <span className="text-[10px] text-black/40 font-mono pl-1">
                              Tanpa PIN
                            </span>
                          )
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1 sm:gap-2">
                        {/* Edit Album Button */}
                        <button
                          onClick={() => handleOpenEdit(album)}
                          className="p-2 rounded-full hover:bg-black/5 text-black/60 hover:text-black transition-colors cursor-pointer"
                          title="Edit Album & PIN"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Re-sync Drive Button */}
                        <button
                          onClick={() => handleTestSync(album.driveFolderId, album.id)}
                          disabled={syncingId === album.id}
                          className="p-2 rounded-full hover:bg-black/5 text-black/60 hover:text-black transition-colors cursor-pointer"
                          title="Cek Sinkronisasi Google Drive"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${syncingId === album.id ? "animate-spin" : ""}`}
                          />
                        </button>

                        {/* View Gallery Link */}
                        <Link
                          href={`/album/${album.slug}`}
                          target="_blank"
                          className="p-2 rounded-full hover:bg-black/5 text-black/60 hover:text-black transition-colors"
                          title="Buka Halaman Galeri"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        {/* Delete Album Button */}
                        <button
                          onClick={() => handleDeleteAlbum(album.slug)}
                          className="p-2 rounded-full hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                          title="Hapus Album"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Album Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] border border-black/10 max-w-lg w-full p-6 space-y-5 animate-fade-in shadow-xl">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#0A0B0C]">
                {editingAlbum ? "Edit Album" : "Tambah Album Baru"}
              </h2>
              <p className="text-xs text-black/50 mt-1">
                {editingAlbum
                  ? "Perbarui informasi album, visibilitas, atau PIN akses keluarga."
                  : "Masukkan nama album dan Google Drive Folder ID."}
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAlbum} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-black/70 mb-1">Judul Album *</label>
                <input
                  type="text"
                  placeholder="Contoh: Liburan Akhir Tahun di Jogja"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[4px] border border-black/15 focus:outline-hidden focus:border-[#00543D]"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-black/70 mb-1">
                  Google Drive Folder ID *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 1a2b3c4d5e6f7g8h9..."
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[4px] border border-black/15 focus:outline-hidden focus:border-[#00543D] font-mono"
                  required
                />
                <p className="text-[10px] text-black/40 mt-1">
                  Ambil dari URL folder Google Drive: <code>drive.google.com/drive/folders/[FOLDER_ID]</code>
                </p>
              </div>

              <div>
                <label className="block font-medium text-black/70 mb-1">Deskripsi Singkat</label>
                <textarea
                  placeholder="Deskripsi singkat mengenai koleksi foto ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-[4px] border border-black/15 focus:outline-hidden focus:border-[#00543D]"
                />
              </div>

              <div>
                <label className="block font-medium text-black/70 mb-1">
                  Story Block (Narasi Editorial Antar Foto)
                </label>
                <textarea
                  placeholder="Cerita atau kutipan puitis yang akan disisipkan di tengah galeri foto..."
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-[4px] border border-black/15 focus:outline-hidden focus:border-[#00543D]"
                />
              </div>

              <div>
                <label className="block font-medium text-black/70 mb-1">Visibilitas</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[4px] border border-black/15 bg-white focus:outline-hidden focus:border-[#00543D]"
                >
                  <option value="public">Publik (Muncul di Halaman Depan)</option>
                  <option value="private">Privat (Hanya dengan link langsung)</option>
                </select>
              </div>

              {/* PIN configuration for Private Albums */}
              {visibility === "private" && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-[6px] space-y-1.5 animate-fade-in">
                  <label className="block font-medium text-amber-900 text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    PIN Akses Album Privat (4–6 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="Contoh: 1234 (Kosongkan jika tidak butuh PIN)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-[4px] border border-amber-300/70 bg-white font-mono text-xs focus:outline-hidden focus:border-[#00543D]"
                  />
                  <p className="text-[10px] text-amber-800/80 leading-relaxed">
                    Jika diisi, pengunjung keluarga wajib memasukkan PIN ini untuk membuka dan melihat foto/video.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full hover:bg-black/5 text-black/70 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-full bg-[#00543D] text-white font-medium hover:bg-[#003e2c] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : editingAlbum
                    ? "Simpan Perubahan"
                    : "Simpan Album"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[12px] border border-black/10 w-full max-w-md p-6 sm:p-8 space-y-6 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#00543D]/10 flex items-center justify-center text-[#00543D]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0A0B0C]">Ubah Password Admin</h3>
                  <p className="text-[11px] text-black/50">Gunakan password yang kuat dan mudah diingat</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                {passError}
              </div>
            )}

            {passSuccess && (
              <div className="p-3 bg-green-50 text-[#00543D] text-xs rounded-md border border-green-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00543D] shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-black/70 mb-1">Password Saat Ini</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    placeholder="Masukkan password admin saat ini"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-[4px] border border-black/15 focus:outline-hidden focus:border-[#00543D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                  >
                    {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-black/70 mb-1">Password Baru (Min. 6 Karakter)</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    placeholder="Masukkan password baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-[4px] border border-black/15 focus:outline-hidden focus:border-[#00543D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-black/70 mb-1">Konfirmasi Password Baru</label>
                <input
                  type={showNewPass ? "text" : "password"}
                  placeholder="Ketik ulang password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 rounded-[4px] border border-black/15 focus:outline-hidden focus:border-[#00543D]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-full hover:bg-black/5 text-black/70 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passSubmitting}
                  className="px-6 py-2 rounded-full bg-[#00543D] text-white font-medium hover:bg-[#003e2c] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {passSubmitting ? "Memproses..." : "Simpan Password Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
