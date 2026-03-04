import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistics — LionFury",
  description: "Attack data and statistics since October 7, 2023. Alerts by category, targeted cities, and intensity patterns.",
  openGraph: {
    title: "Statistics — LionFury",
    description: "Attack data and statistics since October 7, 2023.",
  },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
