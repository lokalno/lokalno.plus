import { getSiteSettings } from "@/lib/site-settings";
import { DEFAULT_RULES } from "@/lib/moderation";
import PlatformDisclaimerNotice from "@/components/PlatformDisclaimerNotice";

export default async function RulesPage() {
  const settings = await getSiteSettings();
  const content = settings.rulesContent || DEFAULT_RULES;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Правила користування</h1>
      <div className="mb-6">
        <PlatformDisclaimerNotice />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans text-sm">
          {content}
        </pre>
      </div>
      <p className="text-sm text-gray-500 mt-4 text-center">
        Питання?{" "}
        <a href={`mailto:${settings.supportEmail}`} className="text-brand-700 hover:underline">
          {settings.supportEmail}
        </a>
      </p>
    </div>
  );
}
