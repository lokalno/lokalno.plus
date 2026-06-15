import SellerListingsCatalog from "@/components/SellerListingsCatalog";
import { notFound } from "next/navigation";

const listings = [
  mk("1", "Чоловічий літній костюм", "Одяг і взуття > Чоловіче > Одяг > Костюми", 1120),
  mk("2", "Чоловічі джинси slim fit", "Одяг і взуття > Чоловіче > Низ > Джинси", 890),
  mk("3", "Чоловічі кросівки Nike", "Одяг і взуття > Чоловіче > Взуття > Кросівки", 2450),
  mk("4", "Чоловічі туфлі класичні", "Одяг і взуття > Чоловіче > Взуття > Туфлі", 1890),
  mk("5", "Жіноча сукня літня", "Одяг і взуття > Жіноче > Сукні та спідниці > Сукні", 1590),
  mk("6", "Жіноча блузка біла", "Одяг і взуття > Жіноче > Одяг > Блузки", 650),
  mk("7", "Жіночі кросівки New Balance", "Одяг і взуття > Жіноче > Взуття > Кросівки", 3200),
  mk("8", "Жіночі черевики осінні", "Одяг і взуття > Жіноче > Взуття > Черевики", 2750),
  mk("9", "Жіноча сумка Ganni", "Одяг і взуття > Жіноче > Аксесуари > Сумки", 3990),
  mk("10", "Жіночий кардіган", "Одяг і взуття > Жіноче > Одяг > Кардігани", 980),
  mk("11", "iPhone 13 Pro 128GB", "Електроніка > Телефони та аксесуари > Смартфони > Apple", 18500),
  mk("12", "Ноутбук Lenovo IdeaPad", "Електроніка > Ноутбуки > Ігрові > Lenovo", 22400),
];

/** Empty state preview: фільтр без збігів у mock-даних. */
export default function SellerFiltersEmptyPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-3 py-6 sm:px-4 sm:py-8">
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Dev preview: empty state — «Одяг і взуття → Дитяче» (0 товарів у продавця).
      </div>
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">Товари продавця</h1>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            {listings.length} товарів
          </span>
        </div>
        <SellerListingsCatalog
          listings={listings}
          initialFilter={{ main: "Одяг і взуття", sub: "Дитяче", detail: "" }}
        />
      </section>
    </div>
  );
}

function mk(id: string, title: string, category: string, price: number) {
  return {
    id,
    title,
    price,
    city: "Ужгород",
    condition: "USED",
    photos: "[]",
    views: 12,
    category,
    seller: { name: "Demo Store", storeName: "Demo Store" },
  };
}
