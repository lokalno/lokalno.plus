import Link from "next/link";
import { formatPrice, parsePhotos, formatViews } from "@/lib/utils";
import { CONDITIONS, LISTING_STATUSES } from "@/lib/constants";
import { getListingSoldCount, getListingFavoriteCount, formatSoldCountLabel, type ListingWithSoldCount } from "@/lib/listing-sales";
import ListingFavoriteBadge from "@/components/ListingFavoriteBadge";
import DeleteListingButton from "@/components/DeleteListingButton";

type SellerListingCardProps = {
  listing: ListingWithSoldCount & {
    id: string;
    title: string;
    price: number;
    city: string;
    condition: string;
    status: string;
    stock: number;
    photos: string;
    views: number;
    itemLocation?: string | null;
    seller: { name: string };
  };
  compact?: boolean;
  showStoragePosition?: boolean;
  showOwnerActions?: boolean;
};

export default function SellerListingCard({
  listing,
  compact = false,
  showStoragePosition = false,
  showOwnerActions = false,
}: SellerListingCardProps) {
  const photos = parsePhotos(listing.photos);
  const photo = photos[0];
  const soldCount = getListingSoldCount(listing);
  const favoriteCount = getListingFavoriteCount(listing);

  const badgeClass = compact
    ? "absolute bg-black/60 text-white text-[10px] px-1.5 py-0 rounded-md"
    : "absolute bg-black/60 text-white text-xs px-2 py-0.5 rounded-full";

  const cardClass = `group bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
    compact ? "rounded-lg" : "rounded-xl"
  }`;

  const cardBody = (
    <>
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center text-gray-400 ${
              compact ? "text-2xl" : "text-4xl"
            }`}
          >
            📦
          </div>
        )}
        <span className={`${badgeClass} top-1.5 left-1.5`}>
          {compact ? `👁 ${formatViews(listing.views)}` : `📷 ${photos.length}`}
        </span>
        {listing.status !== "ACTIVE" && (
          <span
            className={`${
              compact
                ? "absolute top-7 left-1.5 bg-yellow-500 text-white text-[10px] px-1.5 py-0 rounded-md"
                : "absolute top-10 left-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full"
            }`}
          >
            {LISTING_STATUSES[listing.status] || listing.status}
          </span>
        )}
        <ListingFavoriteBadge
          count={favoriteCount}
          className={
            compact ? "top-1.5 right-1.5 gap-0.5 px-1.5 py-0.5 text-[10px] [&_svg]:h-3 [&_svg]:w-3" : ""
          }
        />
        <span className={`${badgeClass} bottom-1.5 left-1.5`}>
          📦 {listing.stock}
        </span>
        {soldCount > 0 && (
          <span
            className={`${
              compact
                ? "absolute bottom-1.5 right-1.5 bg-green-600/90 text-white text-[10px] px-1.5 py-0 rounded-md"
                : "absolute bottom-2 right-2 bg-green-600/90 text-white text-xs px-2 py-0.5 rounded-full"
            }`}
          >
            ✓ {formatSoldCountLabel(soldCount)}
          </span>
        )}
      </div>
      <div className={compact ? "p-2" : "p-3"}>
        <h3 className={`font-medium text-gray-900 truncate ${compact ? "text-xs" : ""}`}>
          {listing.title}
        </h3>
        {showStoragePosition && listing.itemLocation && (
          <p
            className={`truncate font-mono font-semibold text-amber-900 ${
              compact ? "mt-0.5 text-[10px]" : "mt-1 text-xs"
            }`}
            title={listing.itemLocation}
          >
            📍 {listing.itemLocation}
          </p>
        )}
        <p className={`text-brand-700 font-bold ${compact ? "mt-0.5 text-sm" : "mt-1"}`}>
          {formatPrice(listing.price)}
        </p>
        {!compact && (
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{listing.city}</span>
            <span>{CONDITIONS[listing.condition] || listing.condition}</span>
          </div>
        )}
        <p
          className={`text-brand-700 font-medium flex items-center gap-1 ${
            compact ? "mt-1 text-[10px] text-gray-500" : "mt-2 text-xs"
          }`}
        >
          👁 {formatViews(listing.views)}
        </p>
      </div>
    </>
  );

  const ownerActions = showOwnerActions ? (
    <div
      className={`flex items-center gap-3 border-t border-gray-100 ${
        compact ? "px-2 py-2" : "px-3 py-3"
      }`}
    >
      <Link
        href={`/listings/${listing.id}/edit`}
        className={`font-medium text-brand-700 hover:underline ${compact ? "text-[10px]" : "text-xs"}`}
      >
        Редагувати
      </Link>
      <DeleteListingButton listingId={listing.id} listingTitle={listing.title} compact />
    </div>
  ) : null;

  if (showOwnerActions) {
    return (
      <div className={cardClass}>
        <Link href={`/listings/${listing.id}`} className="block">
          {cardBody}
        </Link>
        {ownerActions}
      </div>
    );
  }

  return (
    <Link href={`/listings/${listing.id}`} className={cardClass}>
      {cardBody}
    </Link>
  );
}
