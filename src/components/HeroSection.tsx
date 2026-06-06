import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import ValueProps from "./ValueProps";
import MobileHeroSearch from "./MobileHeroSearch";
import type { MobileHomeStats } from "@/lib/mobile-home-stats";
import { formatStatCount } from "@/lib/mobile-home-stats";

const HERO_PEOPLE = "/images/hero-people.png";

type HeroSectionProps = {
  mobileStats?: MobileHomeStats;
};

export default function HeroSection({ mobileStats }: HeroSectionProps) {
  const listingsLabel = mobileStats ? formatStatCount(mobileStats.listingsCount) : "—";
  const sellersLabel = mobileStats ? formatStatCount(mobileStats.sellersCount) : "—";

  return (
    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4 xl:mb-6 shadow-sm">
      {/* Мобільний / планшетний hero — як на макеті */}
      <div className="xl:hidden p-4 bg-gradient-to-br from-brand-50/80 via-white to-white">
        <div className="flex gap-3 items-start">
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.35rem] font-bold text-gray-900 leading-snug">
              Купуй і продавай <span className="text-brand-600">локально</span>
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Швидко. Безпечно. Зручно.</p>

            <Suspense fallback={null}>
              <MobileHeroSearch />
            </Suspense>

            <div className="flex flex-col gap-2 mt-3">
              <Link
                href="/listings/new"
                className="w-full bg-brand-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-brand-700 text-center text-sm"
              >
                + Додати оголошення
              </Link>
              <Link
                href="/rules"
                className="w-full border border-gray-300 bg-white text-gray-800 px-4 py-3 rounded-xl font-medium hover:bg-gray-50 text-center text-sm"
              >
                Як це працює
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-1 text-center">
              <div className="rounded-xl bg-white/80 px-1 py-2 border border-gray-100">
                <p className="text-[10px] text-gray-500">🏷️</p>
                <p className="text-[10px] font-bold text-gray-900 mt-0.5 leading-tight">{listingsLabel}</p>
                <p className="text-[9px] text-gray-400">оголошень</p>
              </div>
              <div className="rounded-xl bg-white/80 px-1 py-2 border border-gray-100">
                <p className="text-[10px] text-gray-500">👥</p>
                <p className="text-[10px] font-bold text-gray-900 mt-0.5 leading-tight">{sellersLabel}</p>
                <p className="text-[9px] text-gray-400">продавців</p>
              </div>
              <div className="rounded-xl bg-white/80 px-1 py-2 border border-gray-100">
                <p className="text-[10px] text-gray-500">📍</p>
                <p className="text-[9px] font-semibold text-gray-800 mt-1 leading-tight">Вся Україна</p>
                <p className="text-[9px] text-gray-400">поруч</p>
              </div>
            </div>
          </div>

          <div className="relative w-[7.5rem] shrink-0 h-[10rem] hidden sm:block">
            <Image
              src={HERO_PEOPLE}
              alt=""
              fill
              className="object-contain object-top"
              sizes="120px"
              priority
            />
          </div>
        </div>
      </div>

      {/* Десктоп */}
      <div className="hidden xl:flex flex-col lg:flex-row items-stretch min-h-[400px]">
        <div className="lg:w-[38%] xl:w-[35%] shrink-0 p-8 xl:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-100 bg-white z-10">
          <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 leading-tight whitespace-nowrap">
            Купуй і продавай
          </h1>
          <p className="text-3xl xl:text-4xl font-bold text-brand-600 leading-tight mt-2">локально</p>
          <p className="text-gray-500 mt-4 text-base xl:text-lg whitespace-nowrap">
            Швидко. Безпечно. Зручно.
          </p>
          <div className="flex flex-row flex-wrap items-center gap-3 mt-8">
            <Link
              href="/listings/new"
              className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-700 text-center text-sm whitespace-nowrap"
            >
              + Додати оголошення
            </Link>
            <Link
              href="/rules"
              className="border border-gray-300 text-gray-800 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 text-center text-sm whitespace-nowrap"
            >
              Як це працює
            </Link>
          </div>
        </div>

        <div className="flex-1 relative min-h-[360px] lg:min-h-0 bg-white">
          <Image
            src={HERO_PEOPLE}
            alt="Покупець і продавець — успішна угода на Локально"
            fill
            className="object-contain object-center lg:object-right lg:scale-105"
            sizes="65vw"
            priority
          />
        </div>
      </div>

      <div className="hidden xl:block px-6 pb-6">
        <ValueProps />
      </div>
    </section>
  );
}
