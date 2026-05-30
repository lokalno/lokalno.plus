import Link from "next/link";
import { formatPrice, parsePhotos, formatTimeAgo, shortLocation } from "@/lib/utils";
import { getListingSoldCount, formatSoldCountLabel, type ListingWithSoldCount } from "@/lib/listing-sales";

type MarketplaceCardProps = {
  listing: ListingWithSoldCount & {
    id: string;
    title: string;
    price: number;
    city: string;
    photos: string;
    createdAt: Date;
    views?: number;
  };
  badge?: "top" | "new" | null;
};

export default function MarketplaceCard({ listing, badge }: MarketplaceCardProps) {
  const photos = parsePhotos(listing.photos);
  const photo = photos[0];
  const soldCount = getListingSoldCount(listing);
  const isNew =
    badge === "new" ||
    (!badge && Date.now() - new Date(listing.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000);
  const isTop = badge === "top" || (!badge && (listing.views ?? 0) > 200);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:border-brand-200"
    >
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">📦</div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {isTop && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Топ</span>
          )}
          {isNew && (
            <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Нове</span>
          )}
        </div>
        <span className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm">
          ♡
        </span>
        {soldCount > 0 && (
          <span className="absolute bottom-2 left-2 bg-green-600/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md">
            ✓ {formatSoldCountLabel(soldCount)}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm truncate">{listing.title}</h3>
        <p className="text-brand-700 font-bold mt-1">{formatPrice(listing.price)}</p>
        <p className="text-xs text-gray-500 mt-2 truncate">
          {shortLocation(listing.city)} · {formatTimeAgo(listing.createdAt)}
        </p>
      </div>
    </Link>
  );
}
