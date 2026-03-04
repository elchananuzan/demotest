export default function StoriesLoading() {
  return (
    <div className="min-h-screen bg-bg pt-8 pb-20 animate-pulse">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <div className="h-12 w-72 bg-bg-card rounded-lg mx-auto mb-3" />
          <div className="h-4 w-48 bg-bg-card rounded mx-auto" />
        </div>

        {/* Hero card skeleton */}
        <div className="bg-bg-card border border-border rounded-3xl p-8 sm:p-12 mb-12 h-64" />

        {/* Results skeleton */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 mb-12 h-48" />

        {/* Timeline skeleton */}
        <div className="h-5 w-52 bg-bg-card rounded mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-border shrink-0 mt-1.5" />
                {i < 5 && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="flex-1 pb-6">
                <div className="bg-bg-card border border-border rounded-xl p-4 h-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
