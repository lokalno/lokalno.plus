import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProfileCabinetShell from "@/components/ProfileCabinetShell";
import SellerAnalyticsDashboard from "@/components/SellerAnalyticsDashboard";
import { getSellerAnalyticsPageData } from "@/lib/seller-analytics-page-data";

export const dynamic = "force-dynamic";

export default async function ProfileAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile/analytics");
  }

  const data = await getSellerAnalyticsPageData(session.user.id);
  if (!data) redirect("/login?callbackUrl=/profile/analytics");

  return (
    <>
      <div className="border-b border-brand-100/80 bg-gradient-to-br from-brand-50 via-white to-emerald-50/30">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Кабінет продавця
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Аналітика
            </h1>
            <p className="mt-1 text-sm text-gray-500">Графіки продажів та активності</p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow"
          >
            ← До замовлень
          </Link>
        </div>
      </div>

      <ProfileCabinetShell
        userName={data.user.name}
        userAvatar={data.user.avatar}
        rating={data.avgRating}
        reviewCount={data.reviewCount}
        active="analytics"
        variant="compact"
        orderBadge={data.orderCounts.new + data.orderCounts.processing}
        messageBadge={data.unreadMessages}
        listingBadge={data.listingCount}
        followerBadge={data.followerCount}
        priceOfferBadge={data.pendingPriceOffers}
      >
        <SellerAnalyticsDashboard orders={data.orders} totalViews={data.totalViews} />
      </ProfileCabinetShell>
    </>
  );
}
