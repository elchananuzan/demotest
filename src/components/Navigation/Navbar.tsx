"use client";

import Link from "next/link";
import { useApp } from "@/lib/context";
import { useInstallPrompt } from "@/lib/hooks";
import { ShieldLogo } from "@/components/Icons";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { locale, setLocale, t } = useApp();
  const { isInstallable, install } = useInstallPrompt();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <ShieldLogo size={22} className="text-alert-red" />
            <span className="text-lg font-bold text-text-primary tracking-tight">
              {locale === "he" ? "זעם האריה" : "LionFury"}
            </span>
            <span className="ms-1 inline-block w-1.5 h-1.5 rounded-full bg-alert-red animate-pulse" />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isInstallable && (
              <button
                onClick={install}
                className="hidden sm:block px-3 py-1 text-xs font-medium bg-alert-red/10 text-alert-red border border-alert-red/20 rounded-full hover:bg-alert-red/20 transition-colors"
              >
                {t.common.install}
              </button>
            )}

            <NotificationBell />

            <button
              onClick={() => setLocale(locale === "en" ? "he" : "en")}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-card border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
            >
              {locale === "en" ? "עב" : "EN"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
