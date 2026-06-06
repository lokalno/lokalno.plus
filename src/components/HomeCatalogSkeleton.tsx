export default function HomeCatalogSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 rounded-lg bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-5 w-1/3 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
