export default function AlbumLoading() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 pb-28 space-y-10 animate-fade-in">
      {/* Top back navigation skeleton */}
      <div className="w-32 h-4 bg-black/5 rounded-full animate-pulse" />

      {/* Header skeleton */}
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-24 h-4 bg-black/5 rounded-full animate-pulse" />
          <div className="w-32 h-4 bg-black/5 rounded-full animate-pulse" />
        </div>
        <div className="w-72 sm:w-96 h-10 sm:h-12 bg-black/10 rounded-[8px] animate-pulse" />
        <div className="w-full max-w-lg h-4 bg-black/5 rounded-full animate-pulse" />
      </div>

      {/* Breadcrumb skeleton */}
      <div className="w-full max-w-md h-10 bg-white border border-black/5 rounded-full animate-pulse" />

      {/* Masonry Skeleton Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {[
          "aspect-[4/3]",
          "aspect-[3/4]",
          "aspect-[16/9]",
          "aspect-[1/1]",
          "aspect-[4/5]",
          "aspect-[16/10]",
        ].map((aspect, i) => (
          <div
            key={i}
            className={`w-full ${aspect} bg-gradient-to-tr from-black/[0.03] via-black/[0.07] to-black/[0.03] rounded-[8px] border border-black/5 animate-pulse break-inside-avoid`}
          />
        ))}
      </div>
    </div>
  );
}

