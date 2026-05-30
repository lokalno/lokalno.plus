import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  baseParams: Record<string, string>;
};

export default function Pagination({ page, totalPages, baseParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams(baseParams);
    if (p > 1) params.set("page", String(p));
    else params.delete("page");
    const q = params.toString();
    return q ? `/?${q}` : "/";
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
      {page > 1 && (
        <Link href={href(page - 1)} className="px-3 py-1 border rounded-lg hover:bg-gray-50">
          ← Назад
        </Link>
      )}
      <span className="text-sm text-gray-600">
        Сторінка {page} з {totalPages}
      </span>
      {page < totalPages && (
        <Link href={href(page + 1)} className="px-3 py-1 border rounded-lg hover:bg-gray-50">
          Далі →
        </Link>
      )}
    </div>
  );
}
