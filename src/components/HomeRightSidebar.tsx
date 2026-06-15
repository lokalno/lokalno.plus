import Link from "next/link";
import { formatPrice, parsePhotos, formatTimeAgo } from "@/lib/utils";

type LatestListing = {
  id: string;
  title: string;
  price: number;
  photos: string;
  createdAt: Date;
};

type HomeRightSidebarProps = {
  latestListings: LatestListing[];
};

export default function HomeRightSidebar({ latestListings }: HomeRightSidebarProps) {
  if (latestListings.length === 0) return null;

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-gray-900">Останні оголошення</h2>
        <ul className="space-y-3">
          {latestListings.map((l) => {
            const photo = parsePhotos(l.photos)[0];
            return (
              <li key={l.id}>
                <Link href={`/listings/${l.id}`} className="group flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-900 group-hover:text-brand-700">{l.title}</p>
                    <p className="text-sm font-bold text-brand-700">{formatPrice(l.price)}</p>
                    <p className="text-xs text-gray-400">{formatTimeAgo(l.createdAt)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
