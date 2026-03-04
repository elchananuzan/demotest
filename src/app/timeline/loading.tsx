export default function TimelineLoading() {
  return (
    <div className="min-h-screen bg-bg pt-8 pb-20 animate-pulse">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header skeleton */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="h-10 w-56 bg-bg-card rounded-lg mb-2" />
            <div className="h-4 w-40 bg-bg-card rounded" />
          </div>
          <div className="h-9 w-24 bg-bg-card border border-border rounded-xl" />
        </div>

        {/* Filter pills skeleton */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-bg-card border border-border rounded-full" />
          ))}
        </div>

        {/* Count skeleton */}
        <div className="h-3 w-16 bg-bg-card rounded mb-4" />

        {/* Alert cards skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-xl p-4 h-24" />
          ))}
        </div>
      </div>
    </div>
  );
}
