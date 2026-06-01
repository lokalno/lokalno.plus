"use client";

import Link from "next/link";
import FollowSellerButton from "./FollowSellerButton";
import PublicFollowPreview from "./PublicFollowPreview";

const lightButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60";

const bannerSecondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-zinc-900/70 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-zinc-800/85 disabled:opacity-60 md:rounded-xl md:px-3.5 md:py-2 md:text-sm";

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
  const secondaryClass = inBanner ? bannerSecondaryButtonClass : lightButtonClass;

  const chatHref =
    firstListingId != null
      ? `/messages?listingId=${encodeURIComponent(firstListingId)}&partnerId=${encodeURIComponent(sellerId)}`
      : null;
  const loginHref = chatHref
    ? `/login?callbackUrl=${encodeURIComponent(chatHref)}`
    : null;

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

  return (
    <div className={`flex flex-wrap items-center gap-1.5 md:gap-2 ${inBanner ? "justify-end" : ""}`}>
      {isOwner && showAsPublic ? (
        <PublicFollowPreview followerCount={followerCount} onDark={inBanner} hideFollowerCount />
      ) : !isOwner ? (
        <FollowSellerButton
          sellerId={sellerId}
          isLoggedIn={isLoggedIn}
          isOwner={false}
          initialFollowing={isFollowing}
          initialFollowerCount={followerCount}
          variant={inBanner ? "bannerPremium" : "default"}
          onDark={inBanner}
          hideFollowerCount
        />
      ) : null}

      {!isOwner &&
        (chatHref ? (
          <Link
            href={isLoggedIn ? chatHref : loginHref!}
            className={secondaryClass}
            prefetch={false}
          >
            <span aria-hidden>💬</span>
            Написати
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="У продавця поки немає оголошень для чату"
            className={secondaryClass}
          >
            <span aria-hidden>💬</span>
            Написати
          </button>
        ))}

      <button type="button" onClick={shareProfile} className={secondaryClass}>
        <span aria-hidden>🔗</span>
        Поділитися
      </button>
    </div>
  );
}
