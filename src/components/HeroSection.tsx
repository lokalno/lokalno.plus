import Link from "next/link";
import Image from "next/image";
import ValueProps from "./ValueProps";

const HERO_PEOPLE = "/images/hero-people.png";

export default function HeroSection() {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row items-stretch min-h-[300px] md:min-h-[400px]">
        {/* Текст + кнопки */}
        <div className="lg:w-[38%] xl:w-[35%] shrink-0 p-6 md:p-8 xl:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-100 bg-white z-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight whitespace-nowrap">
            Купуй і продавай
          </h1>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-600 leading-tight mt-2">
            локально
          </p>
          <p className="text-gray-500 mt-4 text-sm sm:text-base md:text-lg whitespace-nowrap">
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

        {/* Фото на всю праву частину банера */}
        <div className="flex-1 relative min-h-[280px] md:min-h-[360px] lg:min-h-0 bg-white">
          <Image
            src={HERO_PEOPLE}
            alt="Покупець і продавець — успішна угода на Локально"
            fill
            className="object-contain object-center lg:object-right lg:scale-105"
            sizes="(max-width: 1024px) 100vw, 65vw"
            priority
          />
        </div>
      </div>

      <div className="px-5 pb-5 md:px-6 md:pb-6">
        <ValueProps />
      </div>
    </section>
  );
}
