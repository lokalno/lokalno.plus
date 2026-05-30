import Link from "next/link";
import { formatPrice, parsePhotos, formatViews } from "@/lib/utils";
import { CONDITIONS, LISTING_STATUSES } from "@/lib/constants";

type SellerListingCardProps = {
  listing: {
    id: string;
    title: string;
    price: number;
    city: string;
    condition: string;
    status: string;
    stock: number;
    photos: string;
    views: number;
    seller: { name: string };
  };
};

export default function SellerListingCard({ listing }: SellerListingCardProps) {
  const photos = parsePhotos(listing.photos);
  const photo = photos[0];

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
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">📦</div>
        )}
        <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
          📷 {photos.length}
        </span>
        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
          📦 {listing.stock}
        </span>
        {listing.status !== "ACTIVE" && (
          <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
            {LISTING_STATUSES[listing.status] || listing.status}
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
        <p className="text-xs text-brand-700 font-medium mt-2 flex items-center gap-1">
          👁 {formatViews(listing.views)}
        </p>
      </div>
    </Link>
  );
}
