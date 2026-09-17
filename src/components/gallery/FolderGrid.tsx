import { Folder, ChevronRight } from "lucide-react";
import { DriveMediaItem } from "@/lib/drive";

interface FolderGridProps {
  folders: DriveMediaItem[];
  onSelectFolder: (folder: DriveMediaItem) => void;
}

export default function FolderGrid({ folders, onSelectFolder }: FolderGridProps) {
  if (!folders || folders.length === 0) return null;

  return (
    <div className="space-y-4 mb-10">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black/70">
        <Folder className="w-3.5 h-3.5 text-[#00543D]" />
        <span>Subfolder ({folders.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder)}
            className="flex items-center justify-between p-4 bg-white rounded-[8px] border border-black/10 hover:border-black/25 shadow-2xs hover:shadow-xs transition-all text-left group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00543D] focus:outline-hidden"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#00543D]/10 text-[#00543D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Folder className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-[#0A0B0C] truncate group-hover:text-[#00543D] transition-colors">
                  {folder.name}
                </p>
                <p className="text-xs text-black/65">Buka Folder</p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-black/60 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        ))}
      </div>
    </div>
  );
}

