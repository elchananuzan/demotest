"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🦁</div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">You&apos;re Offline</h1>
        <p className="text-text-secondary mb-6">
          LionFury needs an internet connection to show live alerts.
          Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-alert-red text-white font-medium rounded-xl hover:bg-alert-red/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
