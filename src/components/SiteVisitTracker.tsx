"use client";

import { useEffect } from "react";

function getKyivDateKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Kyiv" });
}

export default function SiteVisitTracker() {
  useEffect(() => {
    const dayKey = getKyivDateKey();
    const storageKey = `lokalno-site-visit-${dayKey}`;
    if (sessionStorage.getItem(storageKey)) return;

    fetch("/api/site-visit", { method: "POST" })
      .then(() => sessionStorage.setItem(storageKey, "1"))
      .catch(() => {});
  }, []);

  return null;
}
