import Link from "next/link";
import { formatSiteOperatorLabel } from "@/lib/site-operator";
import { getSiteSettings } from "@/lib/site-settings";

export default async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="border-t border-gray-200 bg-white py-8 mt-8">
      <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <div className="text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} {settings.siteName} — маркетплейс для України
          </p>
          <p className="mt-1 text-xs text-gray-400">Оператор: {formatSiteOperatorLabel()}</p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/rules" className="hover:text-brand-700">
            Правила
          </Link>
          <Link href="/privacy" className="hover:text-brand-700">
            Конфіденційність
          </Link>
          <Link href="/contact" className="hover:text-brand-700">
            Контакти
          </Link>
        </div>
      </div>
    </footer>
  );
}
