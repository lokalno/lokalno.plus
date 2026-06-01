import Link from "next/link";
import ProfileCabinetShell from "@/components/ProfileCabinetShell";
import SellerOrdersDashboard from "@/components/SellerOrdersDashboard";
import SellerCabinetStatsPanel from "@/components/SellerCabinetStatsPanel";
import OrdersNavLink from "@/components/OrdersNavLink";
import type { getSellerOrdersPageData } from "@/lib/seller-orders-page-data";

type SellerOrdersPageViewProps = {
  data: NonNullable<Awaited<ReturnType<typeof getSellerOrdersPageData>>>;
};

export default function SellerOrdersPageView({ data }: SellerOrdersPageViewProps) {
  const { user, orders, unreadMessages, reviewCount, avgRating, orderCounts, listingCount, followerCount, pendingPriceOffers } = data;

  return (
    <>
      <div className="border-b border-brand-100/80 bg-gradient-to-br from-brand-50 via-white to-emerald-50/30">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Кабінет продавця
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Мої замовлення
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Керуйте замовленнями, статусами та доставкою
            </p>
          </div>
          <OrdersNavLink
            href="/profile"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow"
          >
            ← До профілю
          </OrdersNavLink>
        </div>
      </div>

      <ProfileCabinetShell
        userName={user.name}
        userAvatar={user.avatar}
        rating={avgRating}
        reviewCount={reviewCount}
        active="orders"
        variant="compact"
        orderBadge={orderCounts.new + orderCounts.processing}
        messageBadge={unreadMessages}
        listingBadge={listingCount}
        followerBadge={followerCount}
        priceOfferBadge={pendingPriceOffers}
        rightSidebar={<SellerCabinetStatsPanel orders={orders} />}
      >
        <SellerOrdersDashboard orders={orders} />

        <p className="mt-8 text-center text-sm text-gray-500">
          <Link href="/orders?view=buyer" className="text-brand-700 hover:underline">
            Переглянути мої покупки як покупець →
          </Link>
        </p>
      </ProfileCabinetShell>
    </>
  );
}
