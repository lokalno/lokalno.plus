"use client";

import { SessionProvider } from "next-auth/react";
import { HeaderNotificationsProvider } from "@/components/HeaderNotifications";
import SiteVisitTracker from "@/components/SiteVisitTracker";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HeaderNotificationsProvider>
        <SiteVisitTracker />
        {children}
      </HeaderNotificationsProvider>
    </SessionProvider>
  );
}
