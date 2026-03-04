export default function BriefLoading() {
  return (
    <div className="min-h-screen bg-bg pt-8 pb-20 animate-pulse">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header skeleton */}
        <div className="mb-10">
          <div className="h-10 w-64 bg-bg-card rounded-lg mb-2" />
          <div className="h-4 w-48 bg-bg-card rounded mb-4" />
          <div className="flex items-center gap-4">
            <div className="h-3 w-32 bg-bg-card rounded" />
            <div className="h-3 w-24 bg-bg-card rounded" />
          </div>
        </div>

        {/* Disclaimer skeleton */}
        <div className="bg-bg-card border border-border rounded-xl p-3 mb-8 h-10" />

        {/* Brief section skeletons */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-2xl p-6 h-36" />
          ))}
        </div>

        {/* Summary stats skeleton */}
        <div className="mt-8 bg-bg-card border border-border rounded-2xl p-6 h-32" />
      </div>
    </div>
  );
}
