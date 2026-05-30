"use client";

import { useEffect } from "react";

type ViewTrackerProps = {
  listingId: string;
  isOwner: boolean;
};

export default function ViewTracker({ listingId, isOwner }: ViewTrackerProps) {
  useEffect(() => {
    if (isOwner) return;

    const key = `lokalno-view-${listingId}`;
    if (sessionStorage.getItem(key)) return;

    fetch(`/api/listings/${listingId}/view`, { method: "POST" })
      .then(() => sessionStorage.setItem(key, "1"))
      .catch(() => {});
  }, [listingId, isOwner]);

  return null;
}
