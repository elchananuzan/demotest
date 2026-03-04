import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intelligence Brief — LionFury",
  description: "AI-powered pattern analysis of attack data. Anomalies, trends, and intensity reports.",
  openGraph: {
    title: "Intelligence Brief — LionFury",
    description: "AI-powered pattern analysis of attack data.",
  },
};

export default function BriefLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
