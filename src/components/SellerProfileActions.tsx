"use client";

import Link from "next/link";
import FollowSellerButton from "./FollowSellerButton";
import PublicFollowPreview from "./PublicFollowPreview";

const lightButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60";

const bannerButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/25 disabled:opacity-60";

type SellerProfileActionsProps = {
  sellerId: string;
  sellerName: string;
  profilePath: string;
  firstListingId?: string;
  isLoggedIn: boolean;
  isFollowing: boolean;
  followerCount: number;
  isOwner: boolean;
  showAsPublic?: boolean;
  inBanner?: boolean;
};

export default function SellerProfileActions({
  sellerId,
  sellerName,
  profilePath,
  firstListingId,
  isLoggedIn,
  isFollowing,
  followerCount,
  isOwner,
  showAsPublic = false,
  inBanner = false,
}: SellerProfileActionsProps) {
  const buttonClass = inBanner ? bannerButtonClass : lightButtonClass;

  async function shareProfile() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${profilePath}`
        : profilePath;

    try {
      if (navigator.share) {
        await navigator.share({ title: sellerName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      alert("Посилання на профіль скопійовано!");
    } catch {
      // User cancelled share sheet.
    }
  }

  const messageHref = firstListingId ? `/listings/${firstListingId}` : "/messages";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${inBanner ? "justify-end" : ""}`}>
      {isOwner && showAsPublic ? (
        <PublicFollowPreview followerCount={followerCount} onDark={inBanner} hideFollowerCount />
      ) : !isOwner ? (
        <FollowSellerButton
          sellerId={sellerId}
          isLoggedIn={isLoggedIn}
          isOwner={false}
          initialFollowing={isFollowing}
          initialFollowerCount={followerCount}
          onDark={inBanner}
          hideFollowerCount
        />
      ) : null}

      {!isOwner && (
        <Link href={messageHref} className={buttonClass}>
          <span aria-hidden>💬</span>
          Message
        </Link>
      )}

      <button type="button" onClick={shareProfile} className={buttonClass}>
        <span aria-hidden>🔗</span>
        Share
      </button>
    </div>
  );
}
