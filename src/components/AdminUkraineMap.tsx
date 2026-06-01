"use client";

import { useMemo, useState } from "react";
import ukraineMap from "@svg-maps/ukraine";
import {
  cityDotRadius,
  oblastFill,
  type AdminCityMapPoint,
  type AdminOblastMapStats,
} from "@/lib/ukraine-geo";

type AdminUkraineMapProps = {
  cities: AdminCityMapPoint[];
  oblasts: AdminOblastMapStats[];
};

type HoveredTarget =
  | { type: "city"; city: AdminCityMapPoint }
  | { type: "oblast"; oblast: AdminOblastMapStats };

export default function AdminUkraineMap({ cities, oblasts }: AdminUkraineMapProps) {
  const [query, setQuery] = useState("");
  const [showAllCities, setShowAllCities] = useState(true);
  const [hovered, setHovered] = useState<HoveredTarget | null>(null);

  const maxCityUsers = useMemo(() => Math.max(...cities.map((city) => city.users), 1), [cities]);
  const maxOblastUsers = useMemo(() => Math.max(...oblasts.map((oblast) => oblast.users), 1), [oblasts]);

  const oblastById = useMemo(() => new Map(oblasts.map((oblast) => [oblast.id, oblast])), [oblasts]);

  const mapCities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return cities.filter((city) => {
      if (!city.onMap) return false;
      if (!showAllCities && city.users <= 0) return false;
      if (!normalizedQuery) return true;
      return (
        city.name.toLowerCase().includes(normalizedQuery) ||
        city.label.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [cities, query, showAllCities]);

  const listedCities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return cities
      .filter((city) => city.users > 0)
      .filter((city) => {
        if (!normalizedQuery) return true;
        return (
          city.name.toLowerCase().includes(normalizedQuery) ||
          city.label.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 12);
  }, [cities, query]);

  const offMapCities = useMemo(
    () => cities.filter((city) => !city.onMap && city.users > 0).slice(0, 8),
    [cities]
  );

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            Карта України
          </p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Де розвивається маркетплейс</h2>
          <p className="mt-1 text-sm text-gray-500">
            Наведіть курсор на область або місто — побачите кількість зареєстрованих користувачів
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук міста…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm sm:w-56"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showAllCities}
              onChange={(event) => setShowAllCities(event.target.checked)}
              className="rounded border-gray-300 text-brand-700"
            />
            Усі міста на карті
          </label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-b from-sky-50/70 to-white">
          <svg
            viewBox={ukraineMap.viewBox}
            className="h-auto w-full"
            role="img"
            aria-label="Карта України з користувачами по містах"
          >
            {(ukraineMap.locations as Array<{ id: string; name: string; path: string }>).map(
              (location) => {
              const oblast = oblastById.get(location.id);
              const users = oblast?.users ?? 0;

              return (
                <path
                  key={location.id}
                  d={location.path}
                  fill={oblastFill(users, maxOblastUsers)}
                  stroke="#cbd5e1"
                  strokeWidth={1}
                  className="transition-colors duration-200"
                  onMouseEnter={() =>
                    oblast && setHovered({ type: "oblast", oblast })
                  }
                  onMouseLeave={() =>
                    setHovered((current) =>
                      current?.type === "oblast" && current.oblast.id === location.id
                        ? null
                        : current
                    )
                  }
                />
              );
            }
            )}

            {mapCities.map((city) => {
              const radius = cityDotRadius(city.users, maxCityUsers);
              const isActive = city.users > 0;
              const isHovered = hovered?.type === "city" && hovered.city.key === city.key;

              return (
                <g key={city.key}>
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={Math.max(radius, 8)}
                    fill="transparent"
                    onMouseEnter={() => setHovered({ type: "city", city })}
                    onMouseLeave={() =>
                      setHovered((current) =>
                        current?.type === "city" && current.city.key === city.key ? null : current
                      )
                    }
                  />
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={radius}
                    fill={isActive ? "#ea580c" : "#94a3b8"}
                    fillOpacity={isActive ? 0.92 : 0.45}
                    stroke={isHovered ? "#7c2d12" : "#ffffff"}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="pointer-events-none transition-all duration-150"
                  />
                </g>
              );
            })}
          </svg>

          {hovered && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
              {hovered.type === "city" ? (
                <>
                  <p className="text-sm font-bold text-gray-900">{hovered.city.label.split(",")[0]}</p>
                  <p className="mt-1 text-lg font-semibold text-orange-700">
                    {hovered.city.users.toLocaleString("uk-UA")} користувачів
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-gray-900">
                    {hovered.oblast.id === "kyiv-city" || hovered.oblast.id === "crimea"
                      ? hovered.oblast.name
                      : `${hovered.oblast.name} область`}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-orange-700">
                    {hovered.oblast.users.toLocaleString("uk-UA")} користувачів
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Топ міст</h3>
            <p className="mt-1 text-xs text-gray-500">Зареєстровані користувачі</p>
            <div className="mt-3 space-y-2">
              {listedCities.length === 0 ? (
                <p className="text-sm text-gray-500">Немає збігів</p>
              ) : (
                listedCities.map((city, index) => (
                  <div
                    key={city.key}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"
                    onMouseEnter={() => setHovered({ type: "city", city })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span className="font-medium text-gray-900">
                      {index + 1}. {city.label.split(",")[0]}
                    </span>
                    <span className="font-semibold text-orange-700">{city.users}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {offMapCities.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs text-amber-950">
              <p className="font-semibold">Міста поза довідником карти</p>
              <p className="mt-1">
                {offMapCities.map((city) => `${city.label.split(",")[0]} (${city.users})`).join(" · ")}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
            <p className="font-semibold text-gray-800">Як читати карту</p>
            <p className="mt-1">Помаранчевий фон області — більше користувачів у регіоні.</p>
            <p className="mt-1">Кружечки — міста; розмір і колір залежать від кількості людей.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
