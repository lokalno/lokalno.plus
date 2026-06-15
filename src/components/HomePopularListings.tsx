import Link from "next/link";
import { formatPrice, parsePhotos } from "@/lib/utils";

export type PopularSidebarListing = {
  id: string;
  title: string;
  price: number;
  photos: string;
  views: number;
  city: string;
};

type HomePopularListingsProps = {
  listings: PopularSidebarListing[];
};

function formatViews(views: number): string {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(views >= 10000 ? 0 : 1).replace(/\.0$/, "")} тис. переглядів`;
  }
  return `${views} ${views === 1 ? "перегляд" : views >= 2 && views <= 4 ? "перегляди" : "переглядів"}`;
}

export default function HomePopularListings({ listings }: HomePopularListingsProps) {
  if (listings.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-bold text-gray-900">Популярне зараз</h2>
      <p className="mt-1 text-xs text-gray-500">Найбільше переглядів за тиждень</p>
      <ul className="mt-3 space-y-3">
        {listings.map((listing) => {
          const photo = parsePhotos(listing.photos)[0];
          return (
            <li key={listing.id}>
              <Link href={`/listings/${listing.id}`} className="group flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">📦</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-900 group-hover:text-brand-700">
                    {listing.title}
                  </p>
                  <p className="text-sm font-bold text-brand-700">{formatPrice(listing.price)}</p>
                  <p className="text-xs text-gray-400">
                    👁 {formatViews(listing.views)} · {listing.city}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/?sort=views"
        className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline"
      >
        Усі популярні →
      </Link>
    </div>
  );
}
