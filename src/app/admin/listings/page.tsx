import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { LISTING_STATUSES } from "@/lib/constants";
import AdminListingActions from "@/components/AdminListingActions";

export default async function AdminListingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const listings = await prisma.listing.findMany({
    include: {
      seller: { select: { name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Назад до адмінки
      </Link>
      <h1 className="text-2xl font-bold mb-6">Модерація оголошень</h1>

      <div className="space-y-3">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              listing.status === "PENDING" ? "border-yellow-300 bg-yellow-50/40" : ""
            }`}
          >
            <div>
              <Link href={`/listings/${listing.id}`} className="font-medium hover:text-brand-700">
                {listing.title}
              </Link>
              <p className="text-sm text-gray-500">
                {formatPrice(listing.price)} · {listing.city} · {listing.seller.name}
              </p>
              <p className="text-xs text-gray-400">
                {LISTING_STATUSES[listing.status] || listing.status} · {formatDate(listing.createdAt)}
                · 👁 {listing.views}
              </p>
            </div>
            <AdminListingActions listingId={listing.id} status={listing.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
