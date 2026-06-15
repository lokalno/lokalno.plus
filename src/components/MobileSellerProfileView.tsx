"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import ProfileSafetyBanner from "@/components/ProfileSafetyBanner";
import SellerListingsInventory from "@/components/SellerListingsInventory";
import SellerProfileActions from "@/components/SellerProfileActions";
import OrdersNavLink from "@/components/OrdersNavLink";
import SellerListingsCatalog from "@/components/SellerListingsCatalog";
import { formatDate, formatSellerLocation } from "@/lib/utils";
import {
  formatDaysOnSiteLabel,
  formatMemberSinceMonthYear,
  getDaysOnSite,
  getRatingLabel,
  SELLER_LEVEL_LABELS,
  type SellerLevel,
} from "@/lib/seller-stats";
import type { OrderListItem } from "@/components/OrdersList";

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
  category: string;
  itemLocation?: string | null;
  seller: { name: string };
};

type MobileTab = "listings" | "reviews";

type MobileSellerProfileViewProps = {
  displayName: string;
  seller: {
    id: string;
    avatar: string | null;
    city: string;
    createdAt: Date;
    listings: Listing[];
    reviewsReceived: Review[];
  };
  sellerLevel: SellerLevel;
  followerCount: number;
  reviewCount: number;
  listingCount: number;
  avgRating: number | null;
  isOwner: boolean;
  isLoggedIn: boolean;
  isFollowing: boolean;
  profilePath: string;
  messageListingId?: string;
  sellerOrders?: OrderListItem[];
  pendingNotice?: React.ReactNode;
  initialTab?: MobileTab;
};

function StatCell({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center text-center px-1">
      <span className="text-lg" aria-hidden>
        {icon}
      </span>
      <span className="mt-1 text-base font-bold text-gray-900 leading-none">{value}</span>
      <span className="mt-1 text-[10px] text-gray-500 leading-tight">{label}</span>
    </div>
  );
}

export default function MobileSellerProfileView({
  displayName,
  seller,
  sellerLevel,
  followerCount,
  reviewCount,
  listingCount,
  avgRating,
  isOwner,
  isLoggedIn,
  isFollowing,
  profilePath,
  messageListingId,
  sellerOrders,
  pendingNotice,
  initialTab,
}: MobileSellerProfileViewProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>(initialTab === "reviews" ? "reviews" : "listings");
  const orderCount = sellerOrders?.length ?? 0;
  const daysOnSite = getDaysOnSite(seller.createdAt);
  const memberLabel = formatMemberSinceMonthYear(seller.createdAt);

  useEffect(() => {
    if (initialTab === "reviews") setActiveTab("reviews");
    if (initialTab === "listings") setActiveTab("listings");
  }, [initialTab]);

  return (
    <div className="xl:hidden space-y-4 pb-2">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <UserAvatar name={displayName} avatar={seller.avatar} size="lg" showOnline />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold text-gray-900">{displayName}</h1>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                <span aria-hidden>✦</span>
                {SELLER_LEVEL_LABELS[sellerLevel]}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
              <span aria-hidden>📍</span>
              {formatSellerLocation(seller.city)}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <span aria-hidden>📅</span>
              {memberLabel}
            </p>
          </div>
        </div>

        {isOwner ? (
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <Link
              href="/listings/new"
              className="inline-flex min-h-0 items-center justify-center rounded-lg bg-brand-600 px-2 py-2 text-center text-[11px] font-semibold leading-tight text-white hover:bg-brand-700"
            >
              + Додати оголошення
            </Link>
            <OrdersNavLink
              href="/orders"
              className="inline-flex min-h-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 py-2 text-center text-[11px] font-semibold leading-tight text-gray-800 hover:bg-gray-50"
            >
              🛒 Мої замовлення{orderCount > 0 ? ` (${orderCount})` : ""}
            </OrdersNavLink>
          </div>
        ) : (
          <div className="mt-4">
            <SellerProfileActions
              sellerId={seller.id}
              sellerName={displayName}
              profilePath={profilePath}
              firstListingId={messageListingId}
              isLoggedIn={isLoggedIn}
              isFollowing={isFollowing}
              followerCount={followerCount}
              isOwner={false}
            />
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-1 border-t border-gray-100 pt-4">
          <StatCell icon="📦" value={String(listingCount)} label="Оголошення" />
          <StatCell
            icon="⭐"
            value={String(reviewCount)}
            label={reviewCount === 1 ? "Відгук" : reviewCount >= 2 && reviewCount <= 4 ? "Відгуки" : "Відгуків"}
          />
          <StatCell icon="👥" value={String(followerCount)} label="Підписників" />
          <StatCell icon="📅" value={formatDaysOnSiteLabel(daysOnSite)} label="На сайті" />
        </div>
      </section>

      <ProfileSafetyBanner />

      <nav
        className="flex gap-1 overflow-x-auto overscroll-x-contain border-b border-gray-200 pb-0 scrollbar-hide"
        aria-label="Розділи профілю"
      >
        <button
          type="button"
          onClick={() => setActiveTab("listings")}
          className={`relative shrink-0 px-3 py-2.5 text-sm font-medium whitespace-nowrap ${
            activeTab === "listings" ? "text-brand-700" : "text-gray-500"
          }`}
        >
          Оголошення
          {activeTab === "listings" && (
            <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-brand-600" />
          )}
        </button>

        {isOwner && (
          <OrdersNavLink
            href="/orders"
            className="relative shrink-0 px-3 py-2.5 text-sm font-medium whitespace-nowrap text-gray-500 hover:text-gray-800"
          >
            Замовлення{orderCount > 0 ? ` (${orderCount})` : ""}
          </OrdersNavLink>
        )}

        {isOwner && (
          <Link
            href="/favorites"
            className="relative shrink-0 px-3 py-2.5 text-sm font-medium whitespace-nowrap text-gray-500 hover:text-gray-800"
          >
            Обране
          </Link>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`relative shrink-0 px-3 py-2.5 text-sm font-medium whitespace-nowrap ${
            activeTab === "reviews" ? "text-brand-700" : "text-gray-500"
          }`}
        >
          Відгуки{reviewCount > 0 ? ` (${reviewCount})` : ""}
          {activeTab === "reviews" && (
            <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-brand-600" />
          )}
        </button>
      </nav>

      {pendingNotice}

      {activeTab === "listings" && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-gray-900">
              {isOwner ? "Мої оголошення" : "Товари продавця"}
            </h2>
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {listingCount}{" "}
              {listingCount === 1 ? "товар" : listingCount < 5 ? "товари" : "товарів"}
            </span>
          </div>

          {seller.listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              {isOwner ? "У вас поки немає оголошень" : "Немає активних оголошень"}
              {isOwner && (
                <Link
                  href="/listings/new"
                  className="mt-3 block font-medium text-brand-700 hover:underline"
                >
                  + Додати перше оголошення
                </Link>
              )}
            </div>
          ) : isOwner ? (
            <SellerListingsInventory listings={seller.listings} />
          ) : (
            <SellerListingsCatalog listings={seller.listings} compact />
          )}
        </section>
      )}

      {activeTab === "reviews" && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-gray-900">Відгуки</h2>
            {avgRating != null && (
              <span className="text-sm text-gray-600">
                ⭐ {avgRating.toFixed(1)} · {getRatingLabel(reviewCount)}
              </span>
            )}
          </div>

          {reviewCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              Поки немає відгуків
            </div>
          ) : (
            <div className="space-y-2">
              {seller.reviewsReceived.map((review) => (
                <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-yellow-500 text-sm">{"⭐".repeat(review.rating)}</p>
                  {review.comment && (
                    <p className="mt-1 text-sm text-gray-700 leading-snug">{review.comment}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {review.reviewer.name} · {formatDate(review.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
