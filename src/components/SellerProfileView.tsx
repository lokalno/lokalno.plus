import Link from "next/link";
import { formatDate, formatSellerLocation, parsePhotos } from "@/lib/utils";
import {
  formatStars,
  getFollowerLabel,
  getRatingLabel,
  getSellerLevel,
  isVerifiedSeller,
  SELLER_LEVEL_LABELS,
  SELLER_LEVEL_STYLES,
} from "@/lib/seller-stats";
import ListingCard from "./ListingCard";
import SellerListingCard from "./SellerListingCard";
import UserAvatar from "./UserAvatar";
import BannerUpload from "./BannerUpload";
import SellerProfileActions from "./SellerProfileActions";

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
};

function formatMemberSince(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

function GlassStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[108px] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function LightStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
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
}: SellerProfileViewProps) {
  const reviewCount = seller.reviewsReceived.length;
  const listingCount = seller.listings.length;
  const avgRating =
    reviewCount > 0
      ? seller.reviewsReceived.reduce((s, r) => s + r.rating, 0) / reviewCount
      : null;
  const verified = isVerifiedSeller(reviewCount, avgRating);
  const sellerLevel = getSellerLevel({
    listingCount,
    reviewCount,
    avgRating,
    followerCount,
  });
  const resolvedProfilePath = profilePath ?? (isOwner ? "/profile" : `/sellers/${seller.id}`);
  const firstActiveListing = seller.listings.find((listing) => listing.status === "ACTIVE");

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: seller.reviewsReceived.filter((r) => r.rating === star).length,
  }));

  const pendingWithoutPhotos = isOwner
    ? seller.listings.filter(
        (listing) => listing.status === "PENDING" && parsePhotos(listing.photos).length === 0
      )
    : [];

  return (
    <>
      <section className="relative mb-10">
        <div className="relative h-[320px] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5">
          {seller.banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seller.banner}
              alt=""
              className="absolute inset-0 h-full w-full scale-105 object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-brand-800 to-brand-600" />
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          {showOwnerBannerEdit && <BannerUpload initialBanner={seller.banner} compact />}

          <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur-md ${SELLER_LEVEL_STYLES[sellerLevel]}`}
            >
              {sellerLevel === "TOP" && <span aria-hidden>👑</span>}
              {sellerLevel === "TRUSTED" && <span aria-hidden>🛡️</span>}
              {sellerLevel === "NEW" && <span aria-hidden>✨</span>}
              {SELLER_LEVEL_LABELS[sellerLevel]}
            </span>
          </div>

          <div className="absolute bottom-4 right-4 left-4 hidden sm:flex sm:justify-end">
            <div className="flex flex-wrap gap-2">
              <GlassStatCard label="Listings" value={String(listingCount)} />
              <GlassStatCard label="Followers" value={String(followerCount)} />
              <GlassStatCard label="Reviews" value={String(reviewCount)} />
              <GlassStatCard label="Member since" value={formatMemberSince(seller.createdAt)} />
            </div>
          </div>
        </div>

        <div className="relative z-10 -mt-16 px-4 sm:-mt-20 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="shrink-0 rounded-full p-1 ring-4 ring-white shadow-2xl">
                <UserAvatar name={seller.name} avatar={seller.avatar} size="2xl" />
              </div>

              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    {seller.name}
                  </h1>
                  {verified && (
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-md"
                      title="Verified seller"
                    >
                      ✓
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-700 backdrop-blur-sm sm:hidden">
                    {SELLER_LEVEL_LABELS[sellerLevel]}
                  </span>
                </div>

                <p className="mt-2 text-base text-gray-600">{formatSellerLocation(seller.city)}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700">
                  {avgRating !== null ? (
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span className="text-yellow-500">{formatStars(avgRating)}</span>
                      <span>{avgRating.toFixed(1)}</span>
                      <span className="text-gray-500">({getRatingLabel(reviewCount)})</span>
                    </span>
                  ) : (
                    <span className="text-gray-500">⭐ Поки немає відгуків</span>
                  )}
                  <span className="hidden text-gray-300 sm:inline">•</span>
                  <span>{getFollowerLabel(followerCount)}</span>
                  <span className="hidden text-gray-300 sm:inline">•</span>
                  <span>
                    {listingCount}{" "}
                    {listingCount === 1 ? "оголошення" : listingCount < 5 ? "оголошення" : "оголошень"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
                  <LightStatCard label="Listings" value={String(listingCount)} />
                  <LightStatCard label="Followers" value={String(followerCount)} />
                  <LightStatCard label="Reviews" value={String(reviewCount)} />
                  <LightStatCard label="Member since" value={formatMemberSince(seller.createdAt)} />
                </div>

                <div className="mt-5">
                  <SellerProfileActions
                    sellerId={seller.id}
                    sellerName={seller.name}
                    profilePath={resolvedProfilePath}
                    firstListingId={firstActiveListing?.id}
                    isLoggedIn={isLoggedIn}
                    isFollowing={isFollowing}
                    followerCount={followerCount}
                    isOwner={isOwner}
                    showAsPublic={showAsPublic}
                  />
                </div>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-2 xl:grid-cols-4">
              <LightStatCard label="Listings" value={String(listingCount)} />
              <LightStatCard label="Followers" value={String(followerCount)} />
              <LightStatCard label="Reviews" value={String(reviewCount)} />
              <div className="rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Member since
                </p>
                <p className="mt-1 text-sm font-bold leading-snug text-gray-900">
                  {formatDate(seller.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {reviewCount > 0 && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Розподіл оцінок</h2>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {ratingBreakdown.map(({ star, count }) => (
              <div key={star} className="rounded-xl bg-gray-50 p-2">
                <p className="text-yellow-500">{"⭐".repeat(star)}</p>
                <p className="mt-1 font-medium">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviewCount > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Відгуки ({reviewCount})</h2>
          <div className="space-y-3">
            {seller.reviewsReceived.map((r) => (
              <div key={r.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-yellow-500">{"⭐".repeat(r.rating)}</p>
                {r.comment && <p className="mt-2 text-sm text-gray-700">{r.comment}</p>}
                <p className="mt-2 text-xs text-gray-400">
                  {r.reviewer.name} · {formatDate(r.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        {isOwner && pendingWithoutPhotos.length > 0 && (
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
        )}

        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">
            {isOwner ? "Мої оголошення" : "Товари продавця"}
          </h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            {listingCount} items
          </span>
        </div>

        {seller.listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
            {isOwner ? "У вас поки немає оголошень" : "Немає активних оголошень"}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {seller.listings.map((listing) =>
              isOwner ? (
                <SellerListingCard key={listing.id} listing={listing} />
              ) : (
                <ListingCard key={listing.id} listing={listing} />
              )
            )}
          </div>
        )}
      </section>

      <p className="mt-10 text-center">
        <Link href={backHref} className="text-brand-700 hover:underline">
          {backLabel}
        </Link>
      </p>
    </>
  );
}
