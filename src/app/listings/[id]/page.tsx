import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, parsePhotos, formatViews, getTypicalResponseLabel } from "@/lib/utils";
import { formatListingStock, getListingStockBadgeText, getStockAvailabilityLevel } from "@/lib/listing-stock";
import { getListingSoldCount, getListingFavoriteCount, formatSoldCount } from "@/lib/listing-sales";
import { CONDITIONS, LISTING_STATUSES } from "@/lib/constants";
import { formatVehicleMileage } from "@/lib/vehicle";
import { getSellerLevel } from "@/lib/seller-stats";
import { markBuyerPriceOfferStatusRead } from "@/lib/notifications";
import { getBuyerOfferUiState } from "@/lib/price-offers";
import OrderCheckoutForm from "@/components/OrderCheckoutForm";
import ViewTracker from "@/components/ViewTracker";
import ListingGallery from "@/components/ListingGallery";
import ShareButton from "@/components/ShareButton";
import MarkSoldButton from "@/components/MarkSoldButton";
import ListingCard from "@/components/ListingCard";
import ListingStockEditor from "@/components/ListingStockEditor";
import ListingBreadcrumbs from "@/components/ListingBreadcrumbs";
import ListingDescriptionExpandable from "@/components/ListingDescriptionExpandable";
import ListingCharacteristics from "@/components/ListingCharacteristics";
import ListingContactButton from "@/components/ListingContactButton";
import ListingSafeDealBanner from "@/components/ListingSafeDealBanner";
import ListingSellerPanel from "@/components/ListingSellerPanel";
import ListingPriceOfferForm from "@/components/ListingPriceOfferForm";
import ReportButton from "@/components/ReportButton";

type Params = { params: Promise<{ id: string }> };

function formatInFavorites(count: number): string {
  return `${count} в обраному`;
}

function isTopListing(views: number, favoriteCount: number): boolean {
  return views >= 50 || favoriteCount >= 5;
}

export default async function ListingPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  let listing;
  try {
    listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, storeName: true, city: true, createdAt: true, phone: true, avatar: true },
        },
        _count: {
          select: {
            orders: { where: { paymentStatus: "PAID" } },
            favorites: true,
          },
        },
      },
    });
  } catch {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900">Оголошення тимчасово недоступне</h1>
        <p className="mt-2 text-sm text-gray-600">
          База даних оновлюється. Спробуйте оновити сторінку через кілька хвилин.
        </p>
        <Link href="/" className="mt-6 inline-block text-primary-600 hover:underline">
          На головну
        </Link>
      </div>
    );
  }

  if (!listing) notFound();

  const photos = parsePhotos(listing.photos);
  const isOwner = session?.user?.id === listing.sellerId;
  const inStock = listing.stock > 0;
  const soldCount = getListingSoldCount(listing);
  const favoriteCount = getListingFavoriteCount(listing);
  const canBuy = session && !isOwner && listing.status === "ACTIVE" && inStock;
  const showTopBadge = listing.status === "ACTIVE" && isTopListing(listing.views, favoriteCount);

  const [similar, userFavorite, buyerOffer, sellerReviewStats, positiveReviewCount, sellerListingCount, followerCount, sellerActiveListings, completedOrdersCount] =
    await Promise.all([
      prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          category: listing.category,
          id: { not: listing.id },
        },
        include: {
          seller: { select: { name: true, storeName: true } },
          _count: {
            select: {
              orders: { where: { paymentStatus: "PAID" } },
              favorites: true,
            },
          },
        },
        take: 4,
        orderBy: { views: "desc" },
      }),
      session?.user?.id
        ? prisma.favorite.findUnique({
            where: {
              userId_listingId: { userId: session.user.id, listingId: id },
            },
          })
        : Promise.resolve(null),
      session?.user?.id && !isOwner
        ? prisma.priceOffer.findFirst({
            where: { listingId: id, buyerId: session.user.id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              amount: true,
              status: true,
              orderId: true,
              buyerStatusRead: true,
              order: { select: { status: true } },
            },
          })
        : Promise.resolve(null),
      prisma.review.aggregate({
        where: { sellerId: listing.sellerId },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.review.count({
        where: { sellerId: listing.sellerId, rating: { gte: 4 } },
      }),
      prisma.listing.count({
        where: { sellerId: listing.sellerId, status: { in: ["ACTIVE", "PENDING"] } },
      }),
      prisma.sellerFollow.count({ where: { sellerId: listing.sellerId } }),
      prisma.listing.count({
        where: {
          sellerId: listing.sellerId,
          status: "ACTIVE",
          id: { not: listing.id },
        },
      }),
      prisma.order.count({
        where: { sellerId: listing.sellerId, status: "COMPLETED" },
      }),
    ]).catch(() => [[], null, null, { _avg: { rating: null }, _count: 0 }, 0, 0, 0, 0, 0] as const);

  const sellerReviewCount = sellerReviewStats._count;
  const sellerAvgRating =
    sellerReviewCount > 0 ? sellerReviewStats._avg.rating : null;
  const positiveReviewPercent =
    sellerReviewCount > 0
      ? Math.round((positiveReviewCount / sellerReviewCount) * 100)
      : null;
  const sellerLevel = getSellerLevel({
    listingCount: sellerListingCount,
    reviewCount: sellerReviewCount,
    avgRating: sellerAvgRating,
    followerCount,
  });
  const responseTimeLabel = getTypicalResponseLabel(sellerReviewCount, sellerListingCount);
  const buyerOfferForUi = buyerOffer
    ? {
        id: buyerOffer.id,
        amount: buyerOffer.amount,
        status: buyerOffer.status,
        orderId: buyerOffer.orderId,
        orderStatus: buyerOffer.order?.status ?? null,
      }
    : null;
  const offerUiState = getBuyerOfferUiState(buyerOfferForUi);
  const acceptedBuyerOffer = offerUiState === "accepted" ? buyerOfferForUi : null;

  if (
    session?.user?.id &&
    !isOwner &&
    buyerOffer &&
    (buyerOffer.status === "ACCEPTED" || buyerOffer.status === "REJECTED") &&
    buyerOffer.buyerStatusRead === false
  ) {
    await markBuyerPriceOfferStatusRead(session.user.id, id);
  }

  const characteristics = [
    { label: "Стан", value: CONDITIONS[listing.condition] || listing.condition },
    { label: "Виробник", value: listing.brand || "" },
    ...(listing.vehicleYear
      ? [{ label: "Рік випуску", value: String(listing.vehicleYear) }]
      : []),
    ...(listing.vehicleMileage !== null && listing.vehicleMileage !== undefined
      ? [{ label: "Пробіг", value: formatVehicleMileage(listing.vehicleMileage) }]
      : []),
    ...(listing.vehicleFuel ? [{ label: "Паливо", value: listing.vehicleFuel }] : []),
    ...(listing.vehicleTransmission
      ? [{ label: "Коробка передач", value: listing.vehicleTransmission }]
      : []),
    ...(listing.vehicleBody ? [{ label: "Тип кузова", value: listing.vehicleBody }] : []),
    { label: "Категорія", value: listing.category },
    { label: "Місто", value: listing.city },
    {
      label: "Наявність",
      value: inStock ? formatListingStock(listing.stock) : "Немає в наявності",
    },
    { label: "Продано", value: soldCount > 0 ? formatSoldCount(soldCount) : "" },
    { label: "Опубліковано", value: formatDate(listing.createdAt) },
    {
      label: "Статус",
      value:
        listing.status === "ACTIVE"
          ? "Активне"
          : LISTING_STATUSES[listing.status] || listing.status,
    },
  ];

  return (
    <div className="relative ml-[calc(50%-50vw+1cm)] w-[calc(100vw-2cm)] max-w-none overflow-x-visible py-6 sm:py-8">
      <ViewTracker listingId={listing.id} isOwner={isOwner} />

      <ListingBreadcrumbs category={listing.category} title={listing.title} />

      {isOwner && listing.itemLocation && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">📍 Позиція на складі (лише для вас)</p>
          <p className="mt-1 font-mono text-lg font-bold text-amber-950">{listing.itemLocation}</p>
          <p className="mt-2 text-xs text-amber-800">
            Покупці цю позицію не бачать — вона допомагає вам знайти товар серед усіх оголошень.
          </p>
        </div>
      )}

      {isOwner && !listing.itemLocation && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-900">Додайте позицію на складі</p>
          <p className="mt-1 text-sm text-red-800">
            Без неї важко знайти цей товар, коли у вас багато однакових оголошень.
          </p>
          <Link
            href={`/listings/${listing.id}/edit`}
            className="mt-3 inline-block rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Вказати позицію
          </Link>
        </div>
      )}

      {isOwner && photos.length === 0 && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-900">Додайте фото до оголошення</p>
          <p className="mt-1 text-sm text-red-800">
            Без фото оголошення не пройде модерацію і не з&apos;явиться в каталозі.
          </p>
          <Link
            href={`/listings/${listing.id}/edit`}
            className="mt-3 inline-block rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Завантажити фото
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,calc(260px+6cm))_minmax(0,1fr)_260px] lg:items-start lg:gap-6 xl:gap-8">
        <div className="order-1 lg:col-start-1">
        <ListingGallery
          photos={photos}
          title={listing.title}
          compact
          favorite={
            !isOwner
              ? {
                  listingId: listing.id,
                  isLoggedIn: Boolean(session),
                  initialFavorited: Boolean(userFavorite),
                }
              : undefined
          }
        />
        </div>

        {!isOwner && (
          <div className="order-2 lg:order-3 lg:col-start-3 lg:row-start-1">
            <ListingSellerPanel
              seller={listing.seller}
              reviewCount={sellerReviewCount}
              avgRating={sellerAvgRating}
              positiveReviewPercent={positiveReviewPercent}
              responseTimeLabel={responseTimeLabel}
              completedOrdersCount={completedOrdersCount}
              sellerLevel={sellerLevel}
              otherListingsCount={sellerActiveListings}
            />
          </div>
        )}

        <div className="order-3 min-w-0 lg:order-2 lg:col-start-2 lg:row-start-1">
          <div className="flex flex-wrap items-center gap-2">
            {showTopBadge && (
              <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                Топ оголошення
              </span>
            )}
            {listing.allowPriceOffers && listing.status === "ACTIVE" && inStock && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                Можна торг
              </span>
            )}
            {listing.status !== "ACTIVE" && (
              <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                {LISTING_STATUSES[listing.status] || listing.status}
              </span>
            )}
          </div>

          <h1 className="mt-2 text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
            {listing.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <p className="text-2xl font-bold text-brand-700 sm:text-3xl">
              {formatPrice(listing.price)}
            </p>
            {listing.status === "ACTIVE" && inStock && (() => {
              const stockLevel = getStockAvailabilityLevel(listing.stock);
              const badgeClass =
                stockLevel === "last"
                  ? "bg-amber-100 text-amber-800"
                  : stockLevel === "low"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-emerald-100 text-emerald-700";
              return (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                >
                  {getListingStockBadgeText(listing.stock)}
                </span>
              );
            })()}
            {listing.status === "ACTIVE" && !inStock && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                Немає в наявності
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {listing.status === "ACTIVE" && (
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  !inStock
                    ? "text-gray-500"
                    : getStockAvailabilityLevel(listing.stock) === "last"
                      ? "text-amber-700"
                      : getStockAvailabilityLevel(listing.stock) === "low"
                        ? "text-orange-700"
                        : "text-emerald-700"
                }`}
              >
                <span aria-hidden>📦</span>
                {inStock ? getListingStockBadgeText(listing.stock) : "Немає в наявності"}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>👁</span>
              {formatViews(listing.views)}
            </span>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>♡</span>
              {formatInFavorites(favoriteCount)}
            </span>
          </div>

          {isOwner && (
            <div className="mt-3">
              <ListingStockEditor
                listingId={listing.id}
                initialStock={listing.stock}
                listingStatus={listing.status}
              />
            </div>
          )}

          <div className="mt-4 max-w-sm space-y-2">
            {canBuy && acceptedBuyerOffer && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                <p className="font-semibold">
                  ✅ Продавець погодився на {formatPrice(acceptedBuyerOffer.amount)}
                </p>
                <p className="mt-0.5 text-xs text-emerald-800">
                  Оформіть замовлення нижче за погодженою ціною.
                </p>
              </div>
            )}

            {canBuy && (
              <OrderCheckoutForm
                listingId={listing.id}
                maxStock={listing.stock}
                unitPrice={acceptedBuyerOffer ? acceptedBuyerOffer.amount : listing.price}
                priceOfferId={acceptedBuyerOffer?.id}
                buyLabel={
                  acceptedBuyerOffer
                    ? `Купити за ${formatPrice(acceptedBuyerOffer.amount)}`
                    : undefined
                }
                compact
              />
            )}

            {canBuy && acceptedBuyerOffer && (
              <p className="text-center text-[11px] text-gray-500">
                Або за повною ціною {formatPrice(listing.price)} —{" "}
                <Link href={`/messages?listingId=${listing.id}&partnerId=${listing.sellerId}`} className="text-brand-700 underline">
                  напишіть продавцю
                </Link>
              </p>
            )}

            {session && !isOwner && listing.status === "ACTIVE" && (
              <ListingContactButton
                listingId={listing.id}
                sellerId={listing.sellerId}
                isLoggedIn
                compact
              />
            )}

            {!isOwner && listing.status === "ACTIVE" && inStock && (
                <ListingPriceOfferForm
                  listingId={listing.id}
                  sellerId={listing.sellerId}
                  listingPrice={listing.price}
                  isLoggedIn={Boolean(session)}
                  allowPriceOffers={listing.allowPriceOffers}
                  buyerOffer={buyerOfferForUi}
                  compact
                />
              )}

            {!session && listing.status === "ACTIVE" && (
              <>
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/listings/${listing.id}`)}`}
                  className="flex w-full max-w-sm items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Увійти, щоб купити
                </Link>
                <ListingContactButton
                  listingId={listing.id}
                  sellerId={listing.sellerId}
                  isLoggedIn={false}
                  compact
                />
              </>
            )}

            {session && !isOwner && listing.status === "ACTIVE" && !inStock && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm text-gray-600">
                Товар тимчасово відсутній
              </div>
            )}

            {!isOwner && listing.status === "ACTIVE" && <ListingSafeDealBanner />}

            {isOwner && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="mb-2 text-sm font-semibold text-gray-900">Управління оголошенням</p>
                {listing.allowPriceOffers && (
                  <p className="mb-2 text-xs text-amber-800">
                    ✓ Покупці можуть надсилати пропозиції —{" "}
                    <Link href="/profile/price-offers" className="font-semibold underline">
                      розділ «Пропозиції цін»
                    </Link>
                    .
                  </p>
                )}
                <div className="space-y-2">
                  <Link
                    href="/messages"
                    className="block w-full rounded-lg border border-gray-200 bg-white py-2 text-center text-sm font-medium hover:bg-gray-50"
                  >
                    Повідомлення покупців
                  </Link>
                  {listing.status === "ACTIVE" ? (
                    <div className="flex gap-2">
                      <Link
                        href={`/listings/${listing.id}/edit`}
                        className="flex-1 rounded-lg border border-brand-600 py-2 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50"
                      >
                        Редагувати
                      </Link>
                      <MarkSoldButton listingId={listing.id} />
                    </div>
                  ) : (
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="block rounded-lg border border-brand-600 py-2 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50"
                    >
                      Редагувати
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <ShareButton title={listing.title} />
              {!isOwner && (
                <ReportButton listingId={listing.id} isLoggedIn={Boolean(session)} />
              )}
            </div>
          </div>
        </div>
      </div>

      <ListingDescriptionExpandable description={listing.description} />
      <ListingCharacteristics specs={characteristics} />

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Схожі товари</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {similar.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
