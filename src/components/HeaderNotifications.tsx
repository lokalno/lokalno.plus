"use client";



import { useCallback, useEffect, useState } from "react";



type NotificationCounts = {

  unreadMessages: number;

  unreadPriceOffers: number;

  total: number;

};



const EMPTY: NotificationCounts = {

  unreadMessages: 0,

  unreadPriceOffers: 0,

  total: 0,

};



const POLL_INTERVAL_MS = 120_000;



export function useHeaderNotifications(enabled: boolean) {

  const [counts, setCounts] = useState<NotificationCounts>(EMPTY);



  const refresh = useCallback(async () => {

    if (!enabled) {

      setCounts(EMPTY);

      return;

    }



    if (typeof document !== "undefined" && document.visibilityState !== "visible") {

      return;

    }



    try {

      const res = await fetch("/api/notifications/count", { cache: "no-store" });

      if (!res.ok) return;

      const data = (await res.json()) as NotificationCounts;

      setCounts(data);

    } catch {

      // ignore polling errors

    }

  }, [enabled]);



  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 5000);

    const timer = window.setInterval(() => {

      if (document.visibilityState === "visible") {

        void refresh();

      }

    }, POLL_INTERVAL_MS);



    const onFocus = () => void refresh();

    const onRefresh = () => void refresh();

    const onVisible = () => {

      if (document.visibilityState === "visible") void refresh();

    };



    window.addEventListener("focus", onFocus);

    window.addEventListener("lokalno-notifications-refresh", onRefresh);

    document.addEventListener("visibilitychange", onVisible);



    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);

      window.removeEventListener("focus", onFocus);

      window.removeEventListener("lokalno-notifications-refresh", onRefresh);

      document.removeEventListener("visibilitychange", onVisible);

    };

  }, [refresh]);



  return { counts, refresh };

}



export function NotificationDot({

  count,

  className = "",

}: {

  count: number;

  className?: string;

}) {

  if (count <= 0) return null;



  return (

    <span

      className={`absolute flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white ${className}`}

      aria-hidden

    />

  );

}



export function dispatchNotificationRefresh() {

  if (typeof window !== "undefined") {

    window.dispatchEvent(new Event("lokalno-notifications-refresh"));

  }

}



export function NotificationCountBadge({ count }: { count: number }) {

  if (count <= 0) return null;



  return (

    <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white shadow-sm">

      {count > 9 ? "9+" : count}

    </span>

  );

}


