import Link from "next/link";
import { formatDate, formatSellerLocation, formatTenure, getTypicalResponseLabel, parsePhotos } from "@/lib/utils";
import { formatStars, getFollowerLabel, getRatingLabel, isVerifiedSeller } from "@/lib/seller-stats";
import ListingCard from "./ListingCard";
import SellerListingCard from "./SellerListingCard";
import UserAvatar from "./UserAvatar";
import FollowSellerButton from "./FollowSellerButton";
import PublicFollowPreview from "./PublicFollowPreview";
import BannerUpload from "./BannerUpload";

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
};

function HeroStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-black/35 border border-white/10 px-4 py-3 backdrop-blur-sm">
      <span className="text-white/70 text-base leading-none mt-0.5" aria-hidden>
        🕐
      </span>
      <div className="min-w-0">
        <p className="text-white/60 text-xs">{label}</p>
        <p className="text-white text-sm font-medium mt-0.5">{value}</p>
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
}: SellerProfileViewProps) {
  const reviewCount = seller.reviewsReceived.length;
  const avgRating =
    reviewCount > 0
      ? seller.reviewsReceived.reduce((s, r) => s + r.rating, 0) / reviewCount
      : null;
  const verified = isVerifiedSeller(reviewCount, avgRating);

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
      <div className="relative rounded-xl overflow-hidden mb-8 min-h-[300px] sm:min-h-[340px]">
        <div className="absolute inset-0">
          {seller.banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seller.banner}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/45" />
        </div>

        {showOwnerBannerEdit && <BannerUpload initialBanner={seller.banner} compact />}

        <div className="relative z-10 p-4 sm:p-6 flex flex-col min-h-[300px] sm:min-h-[340px]">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="rounded-full ring-4 ring-white/90 shadow-lg shrink-0">
              <UserAvatar name={seller.name} avatar={seller.avatar} size="xl" />
            </div>

            <div className="flex-1 min-w-0 pt-1 sm:pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{seller.name}</h1>
                {verified && (
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-500 text-white text-sm font-bold shrink-0"
                    title="Перевірений продавець"
                  >
                    ✓
                  </span>
                )}
              </div>

              <p className="text-white/75 mt-1 text-sm sm:text-base">
                {formatSellerLocation(seller.city)}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {avgRating !== null ? (
                    <>
                      <span className="text-yellow-400 text-base leading-none tracking-tight">
                        {formatStars(avgRating)}
                      </span>
                      <span className="text-white font-semibold text-sm sm:text-base">
                        {avgRating.toFixed(1)}
                      </span>
                      <span className="text-white/75 text-sm">({getRatingLabel(reviewCount)})</span>
                    </>
                  ) : (
                    <span className="text-white/60 text-sm">⭐ — · Поки немає відгуків</span>
                  )}
                </div>

                <span className="inline-flex items-center gap-1.5 text-white/85 text-sm">
                  <span aria-hidden>👥</span>
                  {getFollowerLabel(followerCount)}
                </span>

                {verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 border border-white/15 px-3 py-1 text-xs text-white">
                    <span aria-hidden>🛡️</span>
                    Перевірений продавець
                  </span>
                )}
              </div>

              <div className="mt-3">
                {isOwner && showAsPublic ? (
                  <PublicFollowPreview followerCount={followerCount} onDark hideFollowerCount />
                ) : !isOwner ? (
                  <FollowSellerButton
                    sellerId={seller.id}
                    isLoggedIn={isLoggedIn}
                    isOwner={false}
                    initialFollowing={isFollowing}
                    initialFollowerCount={followerCount}
                    onDark
                    hideFollowerCount
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-auto pt-6">
            <HeroStatCard label="Зареєстрований" value={formatDate(seller.createdAt)} />
            <HeroStatCard label="На сайті" value={formatTenure(seller.createdAt)} />
            <HeroStatCard
              label="Відповідає зазвичай"
              value={getTypicalResponseLabel(reviewCount, seller.listings.length)}
            />
          </div>
        </div>
      </div>

      {reviewCount > 0 && (
        <div className="mb-8 bg-white rounded-xl border p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Розподіл оцінок</h2>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {ratingBreakdown.map(({ star, count }) => (
              <div key={star} className="bg-gray-50 rounded-lg p-2">
                <p className="text-yellow-500">{"⭐".repeat(star)}</p>
                <p className="font-medium mt-1">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviewCount > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Відгуки ({reviewCount})</h2>
          <div className="space-y-3">
            {seller.reviewsReceived.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border p-4">
                <p className="text-yellow-500">{"⭐".repeat(r.rating)}</p>
                {r.comment && <p className="text-gray-700 mt-2 text-sm">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  {r.reviewer.name} · {formatDate(r.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        {isOwner && pendingWithoutPhotos.length > 0 && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
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

        <h2 className="text-lg font-semibold mb-4">
          {isOwner ? "Мої оголошення" : "Оголошення продавця"} ({seller.listings.length})
        </h2>
        {seller.listings.length === 0 ? (
          <p className="text-gray-500">
            {isOwner ? "У вас поки немає оголошень" : "Немає активних оголошень"}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

      <p className="mt-8 text-center">
        <Link href={backHref} className="text-brand-700 hover:underline">
          {backLabel}
        </Link>
      </p>
    </>
  );
}
