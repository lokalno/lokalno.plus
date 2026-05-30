import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, parsePhotos } from "@/lib/utils";
import { hasListingPhotos } from "@/lib/listing-photos";
import { LISTING_STATUSES } from "@/lib/constants";
import AdminListingActions from "@/components/AdminListingActions";
import AdminListingPhotos from "@/components/AdminListingPhotos";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminListingsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const { status: statusFilter } = await searchParams;

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const showPendingOnly = statusFilter === "pending";

  const [listings, pendingCount] = await Promise.all([
    prisma.listing.findMany({
      where: showPendingOnly ? { status: "PENDING" } : undefined,
      include: {
        seller: { select: { name: true, email: true } },
      },
      orderBy: showPendingOnly
        ? { createdAt: "desc" }
        : [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.listing.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Назад до адмінки
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Модерація оголошень</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/listings?status=pending"
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              showPendingOnly
                ? "bg-amber-500 text-white"
                : "bg-white border hover:bg-gray-50"
            }`}
          >
            На модерації{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Link>
          <Link
            href="/admin/listings"
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              !showPendingOnly ? "bg-brand-600 text-white" : "bg-white border hover:bg-gray-50"
            }`}
          >
            Усі оголошення
          </Link>
        </div>
      </div>

      {pendingCount > 0 && showPendingOnly && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">
            {pendingCount} оголошень чекають вашого підтвердження
          </p>
          <p className="text-sm text-amber-800 mt-1">
            Натисніть «Підтвердити» — оголошення з&apos;явиться на сайті для всіх користувачів.
          </p>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          {showPendingOnly ? "Немає оголошень на модерації" : "Оголошень поки немає"}
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const photos = parsePhotos(listing.photos);

            return (
            <div
              key={listing.id}
              className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                listing.status === "PENDING" ? "border-amber-300 bg-amber-50/40" : ""
              }`}
            >
              <div className="flex gap-4 min-w-0 flex-1">
                <AdminListingPhotos listingId={listing.id} />

                <div className="min-w-0">
                  <Link href={`/listings/${listing.id}`} className="font-medium hover:text-brand-700">
                    {listing.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatPrice(listing.price)} · {listing.city} · {listing.seller.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {LISTING_STATUSES[listing.status] || listing.status} · {formatDate(listing.createdAt)}
                    · 👁 {listing.views}
                    {photos.length > 0 ? ` · 📷 ${photos.length}` : " · без фото"}
                  </p>
                  {listing.status === "PENDING" && (
                    <>
                      <p className="text-xs text-amber-700 mt-1">{listing.seller.email}</p>
                      {!hasListingPhotos(listing.photos) && (
                        <p className="text-xs text-red-700 mt-2 font-medium">
                          Немає фото — напишіть продавцю ({listing.seller.email}), щоб відкрив
                          оголошення → Редагувати → завантажив фото знову.
                        </p>
                      )}
                    </>
                  )}
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{listing.description}</p>
                </div>
              </div>
              <AdminListingActions
                listingId={listing.id}
                status={listing.status}
                hasPhotos={hasListingPhotos(listing.photos)}
              />
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
