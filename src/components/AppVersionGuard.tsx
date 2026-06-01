"use client";

import { useEffect } from "react";
import { APP_VERSION } from "@/lib/app-version";
import { syncClientWithServerVersion } from "@/lib/client-version-sync";

export default function AppVersionGuard() {
  useEffect(() => {
    void syncClientWithServerVersion(APP_VERSION);
  }, []);

  return null;
}
