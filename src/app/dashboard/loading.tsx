export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0C0C1A] flex flex-col animate-pulse">
      {/* Top nav skeleton */}
      <div className="h-14 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-white/[0.06]" />
        <div className="w-24 h-4 rounded-full bg-white/[0.06]" />
        <div className="flex-1" />
        <div className="w-8 h-8 rounded-xl bg-white/[0.06]" />
        <div className="w-8 h-8 rounded-xl bg-white/[0.06]" />
      </div>

      {/* Calendar grid skeleton */}
      <div className="flex-1 p-4 overflow-hidden">
        {/* Month header */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-6 h-6 rounded-lg bg-white/[0.06]" />
          <div className="w-32 h-5 rounded-full bg-white/[0.06]" />
          <div className="w-6 h-6 rounded-lg bg-white/[0.06]" />
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-5 rounded-full bg-white/[0.04] mx-1" />
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
