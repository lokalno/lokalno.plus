import { getSiteSettings } from "@/lib/site-settings";

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Контакти та підтримка</h1>
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <p className="text-gray-700">
          Маєте питання, скаргу або пропозицію? Звертайтесь до нас:
        </p>
        <p>
          <span className="font-medium">Email:</span>{" "}
          <a href={`mailto:${settings.supportEmail}`} className="text-brand-700 hover:underline">
            {settings.supportEmail}
          </a>
        </p>
        <p className="text-sm text-gray-500">
          Час відповіді: 1–2 робочих дні. Для термінових скарг використовуйте кнопку «Поскаржитися» на сторінці товару.
        </p>
      </div>
    </div>
  );
}
