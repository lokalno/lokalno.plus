import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, parsePhotos, formatViews } from "@/lib/utils";
import { formatListingStock } from "@/lib/listing-stock";
import { CONDITIONS, LISTING_STATUSES } from "@/lib/constants";
import OrderCheckoutForm from "@/components/OrderCheckoutForm";
import MessageForm from "@/components/MessageForm";
import ReportButton from "@/components/ReportButton";
import ViewTracker from "@/components/ViewTracker";
import ListingGallery from "@/components/ListingGallery";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
import MarkSoldButton from "@/components/MarkSoldButton";
import ListingCard from "@/components/ListingCard";
import ListingStockEditor from "@/components/ListingStockEditor";
import SellerCornerBadge from "@/components/SellerCornerBadge";

type Params = { params: Promise<{ id: string }> };

export default async function ListingPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: {
        select: { id: true, name: true, city: true, createdAt: true, phone: true, avatar: true },
      },
    },
  });

  if (!listing) notFound();

  const photos = parsePhotos(listing.photos);
  const isOwner = session?.user?.id === listing.sellerId;
  const inStock = listing.stock > 0;
  const canBuy = session && !isOwner && listing.status === "ACTIVE" && inStock;

  const [similar, sellerStats] = await Promise.all([
    prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        category: listing.category,
        id: { not: listing.id },
      },
      include: { seller: { select: { name: true } } },
      take: 4,
      orderBy: { views: "desc" },
    }),
    prisma.review.aggregate({
      where: { sellerId: listing.sellerId },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  const sellerRating = sellerStats._count > 0 ? sellerStats._avg.rating : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ViewTracker listingId={listing.id} isOwner={isOwner} />

      {isOwner && photos.length === 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-900">Додайте фото до оголошення</p>
          <p className="text-sm text-red-800 mt-1">
            Без фото оголошення не пройде модерацію і не з&apos;явиться в каталозі.
          </p>
          <Link
            href={`/listings/${listing.id}/edit`}
            className="inline-block mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Завантажити фото
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ListingGallery photos={photos} title={listing.title} />

        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{listing.title}</h1>
              {listing.status !== "ACTIVE" && (
                <span className="inline-block mt-2 bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
                  {LISTING_STATUSES[listing.status] || listing.status}
                </span>
              )}
            </div>

            <SellerCornerBadge
              seller={listing.seller}
              avgRating={sellerRating}
              reviewCount={sellerStats._count}
            />
          </div>

          <p className="text-3xl font-bold text-brand-700 mt-2">{formatPrice(listing.price)}</p>

          {isOwner && (
            <ListingStockEditor
              listingId={listing.id}
              initialStock={listing.stock}
              listingStatus={listing.status}
            />
          )}

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Категорія:</span> {listing.category}
            </p>
            <p>
              <span className="font-medium">Стан:</span>{" "}
              {CONDITIONS[listing.condition] || listing.condition}
            </p>
            <p>
              <span className="font-medium">Локація:</span> {listing.city}
            </p>
            <p>
              <span className="font-medium">В наявності:</span>{" "}
              {inStock ? formatListingStock(listing.stock) : "немає"}
            </p>
            <p>
              <span className="font-medium">Опубліковано:</span> {formatDate(listing.createdAt)}
            </p>
            <p>
              <span className="font-medium">Перегляди:</span> 👁 {formatViews(listing.views)}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {canBuy && <OrderCheckoutForm listingId={listing.id} />}

            {session && !isOwner && listing.status === "ACTIVE" && !inStock && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 text-center">
                Товар тимчасово відсутній
              </div>
            )}

            {session && !isOwner && (
              <MessageForm listingId={listing.id} receiverId={listing.sellerId} />
            )}

            {!session && listing.status === "ACTIVE" && (
              <Link
                href="/login"
                className="block w-full text-center bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700"
              >
                Увійти, щоб купити
              </Link>
            )}

            {isOwner && listing.status === "ACTIVE" && (
              <div className="flex gap-2">
                <Link
                  href={`/listings/${listing.id}/edit`}
                  className="flex-1 text-center border border-brand-600 text-brand-700 py-2 rounded-lg hover:bg-brand-50"
                >
                  Редагувати
                </Link>
                <MarkSoldButton listingId={listing.id} />
              </div>
            )}

            {isOwner && listing.status !== "ACTIVE" && (
              <Link
                href={`/listings/${listing.id}/edit`}
                className="block text-center border border-brand-600 text-brand-700 py-2 rounded-lg hover:bg-brand-50"
              >
                Редагувати
              </Link>
            )}

            {!isOwner && session && (
              <FavoriteButton listingId={listing.id} isLoggedIn={Boolean(session)} />
            )}

            <ShareButton title={listing.title} />

            {!isOwner && (
              <ReportButton listingId={listing.id} isLoggedIn={Boolean(session)} />
            )}
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Опис</h2>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
      </section>

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Схожі товари</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similar.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
