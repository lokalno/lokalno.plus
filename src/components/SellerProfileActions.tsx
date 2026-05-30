"use client";

import Link from "next/link";
import FollowSellerButton from "./FollowSellerButton";
import PublicFollowPreview from "./PublicFollowPreview";

const heroButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 hover:shadow-md disabled:opacity-60";

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
}: SellerProfileActionsProps) {
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
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {isOwner && showAsPublic ? (
        <PublicFollowPreview followerCount={followerCount} onDark hideFollowerCount />
      ) : !isOwner ? (
        <FollowSellerButton
          sellerId={sellerId}
          isLoggedIn={isLoggedIn}
          isOwner={false}
          initialFollowing={isFollowing}
          initialFollowerCount={followerCount}
          variant="hero"
          hideFollowerCount
        />
      ) : null}

      {!isOwner && (
        <Link href={messageHref} className={heroButtonClass}>
          <span aria-hidden>💬</span>
          Написати
        </Link>
      )}

      <button type="button" onClick={shareProfile} className={heroButtonClass}>
        <span aria-hidden>🔗</span>
        Поділитися
      </button>
    </div>
  );
}
