export default function StatsLoading() {
  return (
    <div className="min-h-screen bg-bg pt-8 pb-20 animate-pulse">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header skeleton */}
        <div className="mb-10">
          <div className="h-10 w-64 bg-bg-card rounded-lg mb-2" />
          <div className="h-4 w-48 bg-bg-card rounded" />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-2xl p-6 h-24" />
          ))}
        </div>

        {/* Section header */}
        <div className="h-5 w-24 bg-bg-card rounded mb-4" />

        {/* Charts grid skeleton */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div className="bg-bg-card border border-border rounded-2xl h-64" />
          <div className="bg-bg-card border border-border rounded-2xl h-64" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div className="bg-bg-card border border-border rounded-2xl h-64" />
          <div className="bg-bg-card border border-border rounded-2xl h-64" />
        </div>

        {/* Heatmap skeletons */}
        <div className="h-5 w-28 bg-bg-card rounded mb-4" />
        <div className="bg-bg-card border border-border rounded-2xl h-40 mb-6" />
        <div className="bg-bg-card border border-border rounded-2xl h-40" />
      </div>
    </div>
  );
}
