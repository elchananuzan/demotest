import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timeline — LionFury",
  description: "Chronological alert feed with filters. Every rocket, drone, and missile alert documented.",
  openGraph: {
    title: "Timeline — LionFury",
    description: "Chronological alert feed with filters.",
  },
};

export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
