import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { resolvePrivacyContent } from "@/lib/privacy-policy";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  const content = resolvePrivacyContent(settings.privacyContent);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm font-medium text-brand-700 hover:underline">
        ← На головну
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">Політика конфіденційності</h1>
      <p className="mt-2 text-sm text-gray-500">
        Як lokalno.plus збирає та захищає ваші персональні дані.
      </p>

      <article className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{content}</div>
      </article>

      <p className="mt-6 text-sm text-gray-600">
        Питання?{" "}
        <Link href="/contact" className="font-medium text-brand-700 hover:underline">
          Напишіть у підтримку
        </Link>{" "}
        або на{" "}
        <a href={`mailto:${settings.supportEmail}`} className="font-medium text-brand-700 hover:underline">
          {settings.supportEmail}
        </a>
        .
      </p>
    </div>
  );
}
