import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePhotos } from "@/lib/utils";
import ListingForm from "@/components/ListingForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session) redirect("/login");

  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) notFound();
  if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Редагувати оголошення</h1>
      {parsePhotos(listing.photos).length === 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          У цьому оголошенні немає фото. Додайте хоча б одне зображення нижче і натисніть «Зберегти
          зміни» — після цього адмін зможе підтвердити публікацію.
        </div>
      )}
      <p className="mb-4 text-sm text-gray-600">
        Тут можна змінити ціну, опис, фото та <strong>кількість на складі</strong> в будь-який час.
      </p>
      <ListingForm
        variant="edit"
        initial={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          category: listing.category,
          brand: listing.brand,
          condition: listing.condition,
          city: listing.city,
          itemLocation: listing.itemLocation,
          stock: listing.stock,
          photos: parsePhotos(listing.photos),
          allowPriceOffers: listing.allowPriceOffers,
        }}
      />
    </div>
  );
}
