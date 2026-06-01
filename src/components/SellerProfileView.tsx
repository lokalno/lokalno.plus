import Link from "next/link";
import { getSellerDisplayName } from "@/lib/seller-display-name";
import { formatSellerLocation, parsePhotos } from "@/lib/utils";
import { resolveSellerBannerUrl } from "@/lib/seller-banner";
import {
  formatMemberSinceFull,
  formatMemberTenure,
  getFollowerLabel,
  getPositiveReviewPercent,
  getRatingLabel,
  getSellerLevel,
  isVerifiedSeller,
  SELLER_LEVEL_LABELS,
  SELLER_LEVEL_STYLES,
} from "@/lib/seller-stats";
import UserAvatar from "./UserAvatar";
import BannerUpload from "./BannerUpload";
import SellerProfileActions from "./SellerProfileActions";
import SellerProfileTabs from "./SellerProfileTabs";
import type { OrderListItem } from "./OrdersList";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewer: { name: string };
};

type Listing = {
  id: string;
  title: string;
  price: number;
  city: string;
  condition: string;
  status: string;
  stock: number;
  photos: string;
  createdAt: Date;
  views: number;
  seller: { name: string };
};

type SellerProfileViewProps = {
  seller: {
    id: string;
    name: string;
    storeName?: string | null;
    city: string;
    avatar: string | null;
    banner: string | null;
    createdAt: Date;
    listings: Listing[];
    reviewsReceived: Review[];
  };
  followerCount: number;
  isLoggedIn: boolean;
  isFollowing: boolean;
  isOwner: boolean;
  showOwnerBannerEdit?: boolean;
  showAsPublic?: boolean;
  backHref?: string;
  backLabel?: string;
  profilePath?: string;
  chatListingId?: string;
  sellerOrders?: OrderListItem[];
  currentUserId?: string;
  initialTab?: "listings" | "orders" | "about" | "reviews" | "followers" | "stats" | "achievements";
};

function PremiumStatCard({
  icon,
  iconClassName,
  label,
  value,
  subtext,
  subtextClassName = "text-zinc-400",
}: {
  icon: string;
  iconClassName: string;
  label: string;
  value: string;
  subtext: string;
  subtextClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/55 p-2 backdrop-blur-md md:rounded-2xl md:p-2.5">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm backdrop-blur-sm md:h-9 md:w-9 md:text-base ${iconClassName}`}
      >
        {icon}
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[10px] text-zinc-400 md:text-[11px]">{label}</p>
        <p className="truncate text-sm font-bold text-white md:text-base">{value}</p>
        <p className={`truncate text-[10px] md:text-[11px] ${subtextClassName}`}>{subtext}</p>
      </div>
    </div>
  );
}

export default function SellerProfileView({
  seller,
  followerCount,
  isLoggedIn,
  isFollowing,
  isOwner,
  showOwnerBannerEdit = false,
  showAsPublic = false,
  backHref = "/",
  backLabel = "← До каталогу",
  profilePath,
  chatListingId,
  sellerOrders,
  currentUserId,
  initialTab,
}: SellerProfileViewProps) {
  const reviewCount = seller.reviewsReceived.length;
  const listingCount = seller.listings.length;
  const activeListingCount = seller.listings.filter((listing) => listing.status === "ACTIVE").length;
  const avgRating =
    reviewCount > 0
      ? seller.reviewsReceived.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : null;
  const verified = isVerifiedSeller(reviewCount, avgRating);
  const positiveReviewPercent = getPositiveReviewPercent(seller.reviewsReceived);
  const sellerLevel = getSellerLevel({
    listingCount,
    reviewCount,
    avgRating,
    followerCount,
  });
  const resolvedProfilePath = profilePath ?? (isOwner ? "/profile" : `/sellers/${seller.id}`);
  const messageListingId =
    chatListingId ??
    seller.listings.find((listing) => listing.status === "ACTIVE")?.id ??
    seller.listings[0]?.id;
  const bannerUrl = resolveSellerBannerUrl(seller.banner);
  const memberSince = formatMemberSinceFull(seller.createdAt);
  const memberTenure = formatMemberTenure(seller.createdAt);
  const displayName = getSellerDisplayName(seller);

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: seller.reviewsReceived.filter((review) => review.rating === star).length,
  }));

  const pendingWithoutPhotos = isOwner
    ? seller.listings.filter(
        (listing) => listing.status === "PENDING" && parsePhotos(listing.photos).length === 0
      )
    : [];

  const pendingNotice =
    isOwner && pendingWithoutPhotos.length > 0 ? (
      <div className="mb-4 space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="font-medium text-red-900">Потрібно додати фото</p>
        {pendingWithoutPhotos.map((listing) => (
          <p key={listing.id} className="text-sm text-red-800">
            Оголошення «{listing.title}» на модерації без фото.{" "}
            <Link href={`/listings/${listing.id}/edit`} className="font-semibold underline">
              Додати фото зараз
            </Link>
          </p>
        ))}
      </div>
    ) : null;

  const actions = (
    <SellerProfileActions
      sellerId={seller.id}
      sellerName={displayName}
      profilePath={resolvedProfilePath}
      firstListingId={messageListingId}
      isLoggedIn={isLoggedIn}
      isFollowing={isFollowing}
      followerCount={followerCount}
      isOwner={isOwner}
      showAsPublic={showAsPublic}
      inBanner
    />
  );

  return (
    <>
      <section className="relative mb-0 ml-[calc(50%-50vw+1cm)] w-[calc(100vw-2cm)] max-w-none overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/10">
          <div className="relative h-[260px] bg-zinc-950 md:h-[280px] lg:h-[300px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/55" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

            {showOwnerBannerEdit && <BannerUpload initialBanner={seller.banner} compact />}

            <div className="relative z-10 flex h-full flex-col justify-between gap-2.5 p-3 md:gap-3 md:p-4 lg:p-5">
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-2.5 md:gap-3">
                  <UserAvatar
                    name={displayName}
                    avatar={seller.avatar}
                    size="banner"
                    showOnline
                  />

                  <div className="min-w-0 flex-1 text-white">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h1 className="truncate text-xl font-bold tracking-tight drop-shadow-sm md:text-2xl">
                        {displayName}
                      </h1>
                      {verified && (
                        <span
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-md md:h-6 md:w-6 md:text-xs"
                          title="Перевірений продавець"
                        >
                          ✓
                        </span>
                      )}
                    </div>

                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur-sm md:mt-1.5 md:px-2.5 md:text-xs ${SELLER_LEVEL_STYLES[sellerLevel]}`}
                    >
                      {sellerLevel === "TOP" && <span aria-hidden>👑</span>}
                      {sellerLevel === "TRUSTED" && <span aria-hidden>🛡️</span>}
                      {sellerLevel === "NEW" && <span aria-hidden>✨</span>}
                      {SELLER_LEVEL_LABELS[sellerLevel]}
                    </span>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-white/90 md:mt-2 md:gap-x-3 md:text-sm">
                      <span className="inline-flex max-w-full items-center gap-1 truncate">
                        <span aria-hidden>📍</span>
                        {formatSellerLocation(seller.city)}
                      </span>

                      {avgRating !== null ? (
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden className="text-yellow-300">
                            ⭐
                          </span>
                          {avgRating.toFixed(1)} ({getRatingLabel(reviewCount)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden>⭐</span>
                          Немає відгуків
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden>👥</span>
                        {getFollowerLabel(followerCount)}
                      </span>

                      {verified && (
                        <span className="hidden items-center gap-1 text-emerald-300 md:inline-flex">
                          <span aria-hidden>🛡️</span>
                          Підтверджений продавець
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="max-w-[40%] shrink-0 self-start sm:max-w-none">{actions}</div>
              </div>

              <div className="grid shrink-0 grid-cols-4 gap-2 md:gap-2.5">
                <PremiumStatCard
                  icon="📦"
                  iconClassName="bg-emerald-500/20 text-emerald-300"
                  label="Оголошення"
                  value={String(listingCount)}
                  subtext={`• Активних ${activeListingCount}`}
                  subtextClassName="text-emerald-400"
                />
                <PremiumStatCard
                  icon="👥"
                  iconClassName="bg-violet-500/20 text-violet-300"
                  label="Підписники"
                  value={String(followerCount)}
                  subtext={getFollowerLabel(followerCount)}
                />
                <PremiumStatCard
                  icon="⭐"
                  iconClassName="bg-amber-500/20 text-amber-300"
                  label="Відгуки"
                  value={String(reviewCount)}
                  subtext={
                    positiveReviewPercent != null
                      ? `• Позитивні ${positiveReviewPercent}%`
                      : "Немає відгуків"
                  }
                  subtextClassName={
                    positiveReviewPercent != null ? "text-emerald-400" : "text-zinc-400"
                  }
                />
                <PremiumStatCard
                  icon="📅"
                  iconClassName="bg-blue-500/20 text-blue-300"
                  label="На сайті з"
                  value={memberSince}
                  subtext={memberTenure}
                />
              </div>
            </div>
          </div>
      </section>

      <div className="-mt-px">
        <SellerProfileTabs
          isOwner={isOwner}
          sellerName={displayName}
          sellerCity={formatSellerLocation(seller.city)}
          memberSince={memberSince}
          memberTenure={memberTenure}
          sellerLevelLabel={SELLER_LEVEL_LABELS[sellerLevel]}
          verified={verified}
          followerCount={followerCount}
          reviewCount={reviewCount}
          listingCount={listingCount}
          activeListingCount={activeListingCount}
          avgRating={avgRating}
          positiveReviewPercent={positiveReviewPercent}
          reviews={seller.reviewsReceived}
          listings={seller.listings}
          ratingBreakdown={ratingBreakdown}
          pendingNotice={pendingNotice}
          sellerOrders={sellerOrders}
          currentUserId={currentUserId}
          initialTab={initialTab}
        />
      </div>

      <p className="mt-10 text-center">
        <Link href={backHref} className="text-brand-700 hover:underline">
          {backLabel}
        </Link>
      </p>
    </>
  );
}
