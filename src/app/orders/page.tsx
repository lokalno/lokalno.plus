import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OrdersList from "@/components/OrdersList";
import SellerOrdersPageView from "@/components/SellerOrdersPageView";
import { getSellerOrdersPageData } from "@/lib/seller-orders-page-data";
import Link from "next/link";
import { BUYER_ORDER_PLACED_MESSAGE } from "@/lib/order-status-ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{ view?: string; placed?: string }>;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/orders");
  }

  const userId = session.user.id;
  const isBuyerView = params.view === "buyer";

  if (!isBuyerView) {
    const data = await getSellerOrdersPageData(userId);
    if (!data) redirect("/login?callbackUrl=/orders");
    return <SellerOrdersPageView data={data} />;
  }

  const orders = await prisma.order.findMany({
    where: { buyerId: userId },
    include: {
      listing: true,
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const orderIds = orders.map((order) => order.id);
  const reviews = await prisma.review.findMany({
    where: { orderId: { in: orderIds } },
    select: { orderId: true },
  });
  const reviewedOrderIds = new Set(reviews.map((review) => review.orderId));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Мої покупки</h1>
        <Link href="/orders" className="text-sm font-medium text-brand-700 hover:underline">
          🛒 Замовлення як продавець →
        </Link>
      </div>

      {params.placed === "1" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">✓ Замовлення успішно оформлено</p>
          <p className="mt-1">{BUYER_ORDER_PLACED_MESSAGE}</p>
        </div>
      )}

      <OrdersList
        orders={orders}
        currentUserId={userId}
        reviewedOrderIds={reviewedOrderIds}
        emptyMessage="Ви ще нічого не замовляли"
      />
    </div>
  );
}
