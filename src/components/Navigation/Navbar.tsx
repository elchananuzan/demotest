"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { useInstallPrompt } from "@/lib/hooks";

const navItems = [
  { href: "/", key: "live" as const },
  { href: "/stories", key: "stories" as const },
  { href: "/stats", key: "stats" as const },
  { href: "/timeline", key: "timeline" as const },
  { href: "/brief", key: "brief" as const },
];

export default function Navbar() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useApp();
  const { isInstallable, install } = useInstallPrompt();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-alert-red">🦁</span>
            <span className="text-lg font-bold text-text-primary tracking-tight">
              {locale === "he" ? "זעם האריה" : "LionFury"}
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors"
                >
                  <span className={isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary"}>
                    {t.nav[item.key]}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-alert-red"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  {item.key === "live" && (
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-alert-red animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>

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

            {/* Language toggle */}
            <button
              onClick={() => setLocale(locale === "en" ? "he" : "en")}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-card border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
            >
              {locale === "en" ? "עב" : "EN"}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full transition-colors ${
                  isActive
                    ? "bg-alert-red/10 text-alert-red border border-alert-red/20"
                    : "text-text-secondary"
                }`}
              >
                {t.nav[item.key]}
                {item.key === "live" && (
                  <span className="ml-1 inline-block w-1 h-1 rounded-full bg-alert-red animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
