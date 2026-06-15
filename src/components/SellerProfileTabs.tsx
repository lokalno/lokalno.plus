"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { getPositiveReviewPercent, getSellerAchievements } from "@/lib/seller-stats";
import { countsTowardSellerAchievement } from "@/lib/order-cancel";
import SellerListingsCatalog from "./SellerListingsCatalog";
import SellerListingsInventory from "./SellerListingsInventory";
import OrdersNavLink from "./OrdersNavLink";
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
  category: string;
  itemLocation?: string | null;
  seller: { name: string };
};

type TabId = "listings" | "orders" | "about" | "reviews" | "followers" | "stats" | "achievements";

type SellerProfileTabsProps = {
  isOwner: boolean;
  sellerName: string;
  sellerCity: string;
  memberSince: string;
  memberTenure: string;
  sellerLevelLabel: string;
  verified: boolean;
  followerCount: number;
  reviewCount: number;
  listingCount: number;
  activeListingCount: number;
  avgRating: number | null;
  positiveReviewPercent: number | null;
  reviews: Review[];
  listings: Listing[];
  ratingBreakdown: { star: number; count: number }[];
  pendingNotice?: React.ReactNode;
  sellerOrders?: OrderListItem[];
  currentUserId?: string;
  initialTab?: TabId;
};

const VIEWPORT_1CM_INSET = "ml-[calc(50%-50vw+1cm)] w-[calc(100vw-2cm)] max-w-none";

const BASE_TABS: { id: TabId; label: string; icon: string; ownerOnly?: boolean }[] = [
  { id: "listings", label: "Оголошення", icon: "📦" },
  { id: "orders", label: "Замовлення", icon: "🛒", ownerOnly: true },
  { id: "about", label: "Про продавця", icon: "👤" },
  { id: "reviews", label: "Відгуки", icon: "⭐" },
  { id: "achievements", label: "Досягнення", icon: "🏆", ownerOnly: true },
  { id: "followers", label: "Підписники", icon: "👥" },
  { id: "stats", label: "Статистика", icon: "📊" },
];

export default function SellerProfileTabs(props: SellerProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(props.initialTab ?? "listings");

  useEffect(() => {
    if (props.initialTab) setActiveTab(props.initialTab);
  }, [props.initialTab]);

  const visibleTabs = BASE_TABS.filter((tab) => !tab.ownerOnly || props.isOwner);

  const tabs = visibleTabs.map((tab) => ({
    ...tab,
    count:
      tab.id === "reviews"
        ? props.reviewCount
        : tab.id === "followers"
          ? props.followerCount
          : tab.id === "orders"
            ? props.sellerOrders?.length
            : undefined,
  }));

  return (
    <>
      <div
        id="seller-profile-tabs"
        className={`${VIEWPORT_1CM_INSET} mb-6 scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-2 sm:px-4">
          <div className="flex gap-1 overflow-x-auto py-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              const label =
                tab.count != null ? `${tab.label} (${tab.count})` : tab.label;

              if (tab.id === "orders" && props.isOwner) {
                return (
                  <OrdersNavLink
                    key={tab.id}
                    href="/orders"
                    className="relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium text-brand-700 transition hover:text-brand-800 sm:px-4"
                  >
                    <span aria-hidden className="text-base">
                      {tab.icon}
                    </span>
                    {label}
                  </OrdersNavLink>
                );
              }

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium transition sm:px-4 ${
                    active
                      ? "text-brand-700"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <span aria-hidden className="text-base">
                    {tab.icon}
                  </span>
                  {label}
                  {tab.id === "stats" && (
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                      New
                    </span>
                  )}
                  {active && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-600" />
                  )}
                </button>
              );
            })}
          </div>

          {props.isOwner && (
            <Link
              href="/profile/settings"
              className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:inline-flex"
            >
              <span aria-hidden>⚙️</span>
              Налаштування профілю
            </Link>
          )}
        </div>
      </div>

      {props.pendingNotice && (
        <div className={`${VIEWPORT_1CM_INSET} mb-4`}>{props.pendingNotice}</div>
      )}

      {activeTab === "listings" && (
        <section className={VIEWPORT_1CM_INSET}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              {props.isOwner ? "Мої оголошення" : "Товари продавця"}
            </h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
              {props.listingCount}{" "}
              {props.listingCount === 1
                ? "товар"
                : props.listingCount < 5
                  ? "товари"
                  : "товарів"}
            </span>
          </div>

          {props.listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
              {props.isOwner ? "У вас поки немає оголошень" : "Немає активних оголошень"}
            </div>
          ) : props.isOwner ? (
            <SellerListingsInventory listings={props.listings} />
          ) : (
            <SellerListingsCatalog listings={props.listings} />
          )}
        </section>
      )}

      {activeTab === "about" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Про продавця</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500">Ім&apos;я</dt>
              <dd className="mt-1 font-medium text-gray-900">{props.sellerName}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Місто</dt>
              <dd className="mt-1 font-medium text-gray-900">{props.sellerCity}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Рівень</dt>
              <dd className="mt-1 font-medium text-gray-900">{props.sellerLevelLabel}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">На сайті з</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {props.memberSince}
                <span className="block text-sm font-normal text-gray-500">
                  {props.memberTenure}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Статус</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {props.verified ? "🛡️ Підтверджений продавець" : "Продавець на платформі"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Оголошення</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {props.listingCount} загалом · {props.activeListingCount} активних
              </dd>
            </div>
          </dl>
        </section>
      )}

      {activeTab === "reviews" && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Відгуки ({props.reviewCount})</h2>
          {props.reviewCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
              Поки немає відгуків
            </div>
          ) : (
            <div className="space-y-3">
              {props.reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <p className="text-yellow-500">{"⭐".repeat(review.rating)}</p>
                  {review.comment && (
                    <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
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

      {activeTab === "achievements" && props.isOwner && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">Досягнення</h2>
          <p className="mb-4 text-sm text-gray-500">
            Відкривайте нові нагороди, розвиваючи свій магазин на Локально
          </p>
          {(() => {
            const achievements = getSellerAchievements({
              listingCount: props.listingCount,
              reviewCount: props.reviewCount,
              followerCount: props.followerCount,
              orderCount: props.sellerOrders?.filter(countsTowardSellerAchievement).length ?? 0,
              verified: props.verified,
            });
            const unlockedCount = achievements.filter((item) => item.unlocked).length;

            return (
              <>
                <p className="mb-4 text-sm font-medium text-brand-700">
                  Відкрито {unlockedCount} з {achievements.length}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`rounded-2xl border p-4 shadow-sm transition ${
                        achievement.unlocked
                          ? "border-brand-200 bg-brand-50/60"
                          : "border-gray-200 bg-gray-50 opacity-70"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                            achievement.unlocked ? "bg-white" : "bg-gray-100 grayscale"
                          }`}
                          aria-hidden
                        >
                          {achievement.icon}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">{achievement.title}</p>
                          <p className="mt-1 text-sm text-gray-600">{achievement.description}</p>
                          <p
                            className={`mt-2 text-xs font-medium ${
                              achievement.unlocked ? "text-brand-700" : "text-gray-400"
                            }`}
                          >
                            {achievement.unlocked ? "✓ Відкрито" : "Ще не відкрито"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </section>
      )}

      {activeTab === "followers" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            Підписники ({props.followerCount})
          </h2>
          <p className="text-sm text-gray-600">
            {props.followerCount === 0
              ? "У цього продавця поки немає підписників."
              : `${props.followerCount} ${
                  props.followerCount === 1
                    ? "користувач підписаний"
                    : "користувачів підписано"
                } на оновлення від продавця.`}
          </p>
        </section>
      )}

      {activeTab === "stats" && (
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Оголошення</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{props.listingCount}</p>
              <p className="text-xs text-emerald-600">Активних {props.activeListingCount}</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Підписники</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{props.followerCount}</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Відгуки</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{props.reviewCount}</p>
              {props.positiveReviewPercent != null && (
                <p className="text-xs text-emerald-600">
                  Позитивні {props.positiveReviewPercent}%
                </p>
              )}
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Рейтинг</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {props.avgRating != null ? props.avgRating.toFixed(1) : "—"}
              </p>
            </div>
          </div>

          {props.reviewCount > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Розподіл оцінок</h3>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {props.ratingBreakdown.map(({ star, count }) => (
                  <div key={star} className="rounded-xl bg-gray-50 p-2">
                    <p className="text-yellow-500">{"⭐".repeat(star)}</p>
                    <p className="mt-1 font-medium">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
