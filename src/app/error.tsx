"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Щось пішло не так</h1>
      <p className="text-sm text-gray-600 mb-6">
        Спробуйте оновити сторінку. Якщо помилка повторюється — зачекайте кілька хвилин і
        спробуйте знову.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700"
      >
        Спробувати знову
      </button>
      {process.env.NODE_ENV === "development" && error.message ? (
        <p className="mt-6 text-xs text-left text-red-600 break-all">{error.message}</p>
      ) : null}
    </div>
  );
}
