import Link from "next/link";
import { formatPrice, parsePhotos } from "@/lib/utils";
import { CONDITIONS } from "@/lib/constants";
import { getListingSoldCount, getListingFavoriteCount, formatSoldCountLabel, formatFavoriteCountLabel, type ListingWithSoldCount } from "@/lib/listing-sales";

type ListingCardProps = {
  listing: ListingWithSoldCount & {
    id: string;
    title: string;
    price: number;
    city: string;
    condition: string;
    photos: string;
    views?: number;
    seller: { name: string };
  };
};

export default function ListingCard({ listing }: ListingCardProps) {
  const photos = parsePhotos(listing.photos);
  const photo = photos[0];
  const soldCount = getListingSoldCount(listing);
  const favoriteCount = getListingFavoriteCount(listing);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            📦
          </div>
        )}
        {listing.views != null && (
          <span className="absolute bottom-2 right-2 bg-black/55 text-white text-[10px] px-1.5 py-0.5 rounded-md">
            👁 {listing.views}
          </span>
        )}
        {soldCount > 0 && (
          <span className="absolute bottom-2 left-2 bg-green-600/90 text-white text-[10px] px-1.5 py-0.5 rounded-md">
            ✓ {formatSoldCountLabel(soldCount)}
          </span>
        )}
        {favoriteCount > 0 && (
          <span className="absolute top-2 left-2 bg-rose-600/90 text-white text-[10px] px-1.5 py-0.5 rounded-md">
            {formatFavoriteCountLabel(favoriteCount)}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 truncate">{listing.title}</h3>
        <p className="text-brand-700 font-bold mt-1">{formatPrice(listing.price)}</p>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{listing.city}</span>
          <span>{CONDITIONS[listing.condition] || listing.condition}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{listing.seller.name}</p>
      </div>
    </Link>
  );
}
