export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#0c0f1a] flex flex-col animate-pulse">
      {/* Header */}
      <div className="h-14 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-white/[0.06]" />
        <div className="w-20 h-4 rounded-full bg-white/[0.06]" />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {/* Section cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 flex flex-col gap-3">
            <div className="w-28 h-4 rounded-full bg-white/[0.06]" />
            <div className="w-full h-10 rounded-xl bg-white/[0.06]" />
            <div className="w-3/4 h-10 rounded-xl bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
