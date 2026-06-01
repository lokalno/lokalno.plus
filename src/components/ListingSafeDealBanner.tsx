export default function ListingSafeDealBanner() {
  return (
    <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base"
          aria-hidden
        >
          🛡️
        </span>
        <div>
          <p className="text-xs font-semibold text-gray-900">Безпечна угода від Lokalno</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
            Оформлюйте замовлення через сайт — ви контролюєте покупку в особистому кабінеті.
          </p>
        </div>
      </div>
    </div>
  );
}
