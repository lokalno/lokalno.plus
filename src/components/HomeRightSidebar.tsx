"use client";

import { useState } from "react";
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
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <aside className="space-y-4">
      {latestListings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Останні оголошення</h2>
          <ul className="space-y-3">
            {latestListings.map((l) => {
              const photo = parsePhotos(l.photos)[0];
              return (
                <li key={l.id}>
                  <Link href={`/listings/${l.id}`} className="flex gap-3 group">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 truncate group-hover:text-brand-700">{l.title}</p>
                      <p className="text-sm font-bold text-brand-700">{formatPrice(l.price)}</p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(l.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="bg-brand-600 rounded-xl p-4 text-white">
        <h2 className="text-sm font-bold mb-1">Підписка на новини</h2>
        <p className="text-xs text-brand-100 mb-3">Отримуйте найкращі пропозиції на email</p>
        {subscribed ? (
          <p className="text-sm">Дякуємо! ✓</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setSubscribed(true);
            }}
            className="flex gap-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@..."
              className="flex-1 rounded-lg text-gray-900 text-sm py-2 px-2 border-0"
              required
            />
            <button type="submit" className="bg-white text-brand-700 px-3 py-2 rounded-lg text-sm font-medium shrink-0">
              OK
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
