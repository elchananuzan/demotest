import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import Navbar from "@/components/Navigation/Navbar";
import DocumentDirection from "@/components/DocumentDirection";

export const metadata: Metadata = {
  title: "LionFury — Real-Time Israel Defense Intelligence",
  description: "Live alert dashboard with human stories. See what Israelis experience in real-time.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LionFury",
  },
  openGraph: {
    title: "LionFury — Real-Time Israel Defense Intelligence",
    description: "Live alert dashboard showing what Israelis experience during rocket attacks. Real people. Real stories.",
    type: "website",
    siteName: "LionFury",
  },
  twitter: {
    card: "summary_large_image",
    title: "LionFury",
    description: "Real-time Israel defense intelligence dashboard",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="bg-bg text-text-primary font-sans antialiased">
        <AppProvider>
          <DocumentDirection />
          <Navbar />
          <main className="pt-14">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
