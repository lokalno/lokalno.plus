import { getSiteSettings } from "@/lib/site-settings";
import { DEFAULT_PRIVACY } from "@/lib/moderation";

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  const content = settings.privacyContent || DEFAULT_PRIVACY;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Політика конфіденційності</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans text-sm">
          {content}
        </pre>
      </div>
    </div>
  );
}
