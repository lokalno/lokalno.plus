import Link from "next/link";

type CityCount = { city: string; count: number };

export default function PopularCitiesSidebar({ cities }: { cities: CityCount[] }) {
  if (cities.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mt-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Популярні міста</h2>
      <ul className="space-y-1">
        {cities.map(({ city, count }) => (
          <li key={city}>
            <Link
              href={`/?city=${encodeURIComponent(city)}`}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-700"
            >
              <span className="truncate">{city.split(",")[0]}</span>
              <span className="text-xs text-gray-400 shrink-0 ml-2">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
