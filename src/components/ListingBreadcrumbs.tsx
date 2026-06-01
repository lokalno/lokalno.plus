import Link from "next/link";

type ListingBreadcrumbsProps = {
  category: string;
  title: string;
};

export default function ListingBreadcrumbs({ category, title }: ListingBreadcrumbsProps) {
  return (
    <nav aria-label="Навігація" className="mb-5 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link href="/" className="hover:text-brand-700">
            Головна
          </Link>
        </li>
        <li aria-hidden className="text-gray-300">
          ›
        </li>
        <li>
          <Link href={`/?category=${encodeURIComponent(category)}`} className="hover:text-brand-700">
            {category}
          </Link>
        </li>
        <li aria-hidden className="text-gray-300">
          ›
        </li>
        <li className="min-w-0 truncate text-gray-900">{title}</li>
      </ol>
    </nav>
  );
}
