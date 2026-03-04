"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/context";

export default function DocumentDirection() {
  const { locale, dir } = useApp();

  useEffect(() => {
    document.documentElement.lang = locale === "he" ? "he" : "en";
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return null;
}
