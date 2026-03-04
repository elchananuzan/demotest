import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistics — LionFury",
  description: "Real-time attack data and statistics. Alerts by category, targeted cities, and intensity patterns.",
  openGraph: {
    title: "Statistics — LionFury",
    description: "Real-time attack data and statistics for the current conflict.",
  },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
