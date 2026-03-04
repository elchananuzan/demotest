import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Human Stories — LionFury",
  description: "Behind every alert, real people with real lives. See what Israelis were doing when the sirens went off.",
  openGraph: {
    title: "Human Stories — LionFury",
    description: "Behind every alert, real people with real lives.",
  },
};

export default function StoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
