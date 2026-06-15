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
import AdminListingDuplicateBadge from "@/components/AdminListingDuplicateBadge";
import AdminListingDuplicatesPanel from "@/components/AdminListingDuplicatesPanel";
import AdminListingDuplicateReportBanner from "@/components/AdminListingDuplicateReportBanner";
import AdminPurgePendingButton from "@/components/AdminPurgePendingButton";
import {
  buildListingDuplicateIndex,
  findPendingListingDuplicateGroups,
  isPossibleDuplicate,
  serializeDuplicateSiblingsMap,
} from "@/lib/admin-listing-duplicates";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const listingSelect = {
  id: true,
  title: true,
  price: true,
  sellerId: true,
  photos: true,
  status: true,
  createdAt: true,
  promImportKey: true,
  promUniqueId: true,
  promProductId: true,
  promSku: true,
  city: true,
  stock: true,
  views: true,
  description: true,
  seller: { select: { name: true, email: true } },
} as const;

export default async function AdminListingsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const { status: statusFilter } = await searchParams;

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const showPendingOnly = statusFilter === "pending";

  const pendingCount = await prisma.listing.count({ where: { status: "PENDING" } });

  const listings = await prisma.listing.findMany({
    where: showPendingOnly ? { status: "PENDING" } : undefined,
    select: listingSelect,
    orderBy: showPendingOnly
      ? { createdAt: "desc" }
      : [{ status: "asc" }, { createdAt: "desc" }],
    ...(showPendingOnly ? {} : { take: 100 }),
  });

  const pendingForDuplicates = showPendingOnly
    ? listings
    : pendingCount > 0
      ? await prisma.listing.findMany({
          where: { status: "PENDING" },
          select: listingSelect,
          orderBy: { createdAt: "desc" },
        })
      : [];

  const duplicateReport = findPendingListingDuplicateGroups(pendingForDuplicates);
  const duplicateIndex = buildListingDuplicateIndex(pendingForDuplicates, duplicateReport);
  const duplicateSiblingsMap = serializeDuplicateSiblingsMap(pendingForDuplicates, duplicateIndex);
  const listingTitles = Object.fromEntries(pendingForDuplicates.map((listing) => [listing.id, listing.title]));

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

      {showPendingOnly && (
        <AdminListingDuplicateReportBanner report={duplicateReport} listingTitles={listingTitles} />
      )}

      {showPendingOnly && <AdminPurgePendingButton pendingCount={pendingCount} />}

      {pendingCount > 0 && showPendingOnly && duplicateReport.duplicateGroupCount === 0 && (
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
            const possibleDuplicate =
              listing.status === "PENDING" && isPossibleDuplicate(listing.id, duplicateIndex);
            const duplicateSiblings = duplicateSiblingsMap[listing.id] ?? [];

            return (
              <div
                key={listing.id}
                className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  listing.status === "PENDING" ? "border-amber-300 bg-amber-50/40" : ""
                }`}
              >
                <div className="flex gap-4 min-w-0 flex-1">
                  <AdminListingPhotos listingId={listing.id} initialPhotos={photos} />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/listings/${listing.id}`} className="font-medium hover:text-brand-700">
                        {listing.title}
                      </Link>
                      {possibleDuplicate && <AdminListingDuplicateBadge />}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPrice(listing.price)} · {listing.city} · {listing.seller.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {LISTING_STATUSES[listing.status] || listing.status} · {formatDate(listing.createdAt)}
                      · 👁 {listing.views}
                      {photos.length > 0 ? ` · 📷 ${photos.length}` : " · без фото"}
                      {listing.stock > 0 ? ` · 📦 ${listing.stock} шт.` : " · немає на складі"}
                      {listing.promImportKey ? ` · Prom: ${listing.promImportKey}` : ""}
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
                <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                  {possibleDuplicate && duplicateSiblings.length > 1 && (
                    <AdminListingDuplicatesPanel
                      listingTitle={listing.title}
                      siblings={duplicateSiblings}
                    />
                  )}
                  <AdminListingActions
                    listingId={listing.id}
                    status={listing.status}
                    hasPhotos={hasListingPhotos(listing.photos)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
