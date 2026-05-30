import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="text-6xl mb-4">404</p>
      <h1 className="text-2xl font-bold mb-2">Сторінку не знайдено</h1>
      <p className="text-gray-600 mb-6">Можливо, оголошення видалено або посилання застаріло.</p>
      <Link href="/" className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700">
        На головну
      </Link>
    </div>
  );
}
