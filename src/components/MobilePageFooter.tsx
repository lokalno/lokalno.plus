import Link from "next/link";

/** Посилання внизу сторінки на телефоні (десктопний футер прихований). */
export default function MobilePageFooter() {
  return (
    <footer className="xl:hidden mx-auto mt-8 max-w-[1400px] border-t border-gray-200 px-3 pt-6 pb-2 text-center text-sm text-gray-500">
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        <Link href="/rules" className="hover:text-brand-700">
          Правила
        </Link>
        <Link href="/privacy" className="hover:text-brand-700">
          Конфіденційність
        </Link>
        <Link href="/contact" className="hover:text-brand-700">
          Підтримка
        </Link>
      </div>
      <p className="mt-3 text-xs text-gray-400">© {new Date().getFullYear()} lokalno.plus</p>
    </footer>
  );
}
