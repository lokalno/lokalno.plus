"use client";

import { useMemo, useState } from "react";
import {
  formatAdminMoney,
  getTopActiveDays,
  type AdminActivityChartPoint,
  type AdminActivityChartRange,
  type AdminWeekdayChartPoint,
} from "@/lib/admin-stats";

type AdminActivityChartsProps = {
  dailyActivity: AdminActivityChartPoint[];
  weekdayActivityByRange: Record<AdminActivityChartRange, AdminWeekdayChartPoint[]>;
};

function AdminBarChart({
  title,
  subtitle,
  points,
  barClassName,
  formatValue,
}: {
  title: string;
  subtitle: string;
  points: { label: string; value: number }[];
  barClassName: string;
  formatValue: (value: number) => string;
}) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      {points.every((point) => point.value === 0) ? (
        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
          Немає даних за обраний період
        </div>
      ) : (
        <div className="h-52">
          <div className="flex h-44 items-end gap-1.5 sm:gap-2">
            {points.map((point) => {
              const height = Math.max(4, Math.round((point.value / max) * 100));

              return (
                <div key={point.label} className="group flex min-w-0 flex-1 flex-col items-center">
                  <div className="relative flex h-40 w-full items-end justify-center">
                    <div
                      className={`w-full max-w-10 rounded-t-md transition-all ${barClassName}`}
                      style={{ height: `${point.value === 0 ? 0 : height}%` }}
                      title={`${point.label}: ${formatValue(point.value)}`}
                    />
                    <span className="pointer-events-none absolute -top-6 hidden rounded bg-gray-900 px-2 py-0.5 text-[10px] text-white group-hover:block">
                      {formatValue(point.value)}
                    </span>
                  </div>
                  <span className="mt-2 w-full truncate text-center text-[10px] text-gray-500 sm:text-[11px]">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminActivityCharts({
  dailyActivity,
  weekdayActivityByRange,
}: AdminActivityChartsProps) {
  const [range, setRange] = useState<AdminActivityChartRange>(30);

  const filteredDaily = useMemo(() => dailyActivity.slice(-range), [dailyActivity, range]);

  const weekdayActivity = weekdayActivityByRange[range];

  const topActiveDays = useMemo(() => getTopActiveDays(filteredDaily), [filteredDaily]);

  const dailyPoints = useMemo(
    () =>
      filteredDaily.map((point) => ({
        label: point.label,
        value: point.activeUsers,
      })),
    [filteredDaily]
  );

  const weekdayPoints = useMemo(
    () =>
      weekdayActivity.map((point) => ({
        label: point.label,
        value: point.activeUsers,
      })),
    [weekdayActivity]
  );

  const sampledDailyPoints = useMemo(() => {
    if (range <= 7) return dailyPoints;
    if (range <= 30) {
      return dailyPoints.filter((_, index) => index % 5 === 0 || index === dailyPoints.length - 1);
    }
    return dailyPoints.filter((_, index) => index % 15 === 0 || index === dailyPoints.length - 1);
  }, [dailyPoints, range]);

  const busiestWeekday = [...weekdayActivity].sort((a, b) => b.activeUsers - a.activeUsers)[0];

  return (
    <div className="mb-8 space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-orange-50/40 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
              Графіки активності
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">Коли користувачі найактивніші</h2>
            <p className="mt-1 text-sm text-gray-500">
              Унікальні реальні користувачі за день (замовлення, повідомлення, оголошення, обране)
            </p>
          </div>
          <div className="flex gap-2">
            {([7, 30, 90] as AdminActivityChartRange[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  range === value
                    ? "bg-orange-600 text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {value === 7 ? "7 днів" : value === 30 ? "30 днів" : "90 днів"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminBarChart
          title="Активність по днях"
          subtitle={`Скільки унікальних користувачів було активних кожного дня (останні ${range} днів)`}
          points={sampledDailyPoints}
          barClassName="bg-gradient-to-t from-orange-600 to-orange-400"
          formatValue={(value) => `${value} корист.`}
        />

        <AdminBarChart
          title="Активність по днях тижня"
          subtitle={`За останні ${range} днів — у які дні тижня люди найчастіше активні`}
          points={weekdayPoints}
          barClassName="bg-gradient-to-t from-brand-700 to-brand-500"
          formatValue={(value) => `${value} корист.`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-900">Топ-5 найактивніших днів</h3>
          <p className="mt-1 text-sm text-gray-500">За останні {range} днів</p>
          <div className="mt-4 space-y-2">
            {topActiveDays.map((day, index) => (
              <div
                key={day.date}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-gray-900">
                  {index + 1}. {day.label}
                </span>
                <span className="font-semibold text-orange-700">
                  {day.activeUsers} активних · {day.registrations} реєстр.
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-900">Висновок</h3>
          <p className="mt-3 text-sm text-gray-700">
            {busiestWeekday && busiestWeekday.activeUsers > 0 ? (
              <>
                Найактивніший день тижня:{" "}
                <strong className="text-brand-800">{busiestWeekday.label}</strong> (
                {busiestWeekday.activeUsers} унікальних користувачів за {range} днів).
              </>
            ) : (
              "Поки замало даних для висновку."
            )}
          </p>
          {topActiveDays[0] && (
            <p className="mt-2 text-sm text-gray-700">
              Найактивніший календарний день:{" "}
              <strong className="text-orange-800">{topActiveDays[0].label}</strong> —{" "}
              {topActiveDays[0].activeUsers} активних користувачів
              {topActiveDays[0].salesAmount > 0 && (
                <> · продажі {formatAdminMoney(topActiveDays[0].salesAmount)}</>
              )}
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
