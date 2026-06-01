type SpecRow = {
  label: string;
  value: string;
};

type ListingCharacteristicsProps = {
  specs: SpecRow[];
};

export default function ListingCharacteristics({ specs }: ListingCharacteristicsProps) {
  const visible = specs.filter((spec) => spec.value.trim().length > 0);
  if (visible.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-bold text-gray-900">Характеристики</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((spec) => (
          <div key={spec.label}>
            <dt className="text-sm text-gray-500">{spec.label}</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
