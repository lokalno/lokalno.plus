import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ListingCard from "@/components/ListingCard";

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/favorites");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: {
          seller: { select: { name: true } },
          _count: {
            select: {
              orders: { where: { paymentStatus: "PAID" } },
              favorites: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const listings = favorites
    .map((f) => f.listing)
    .filter((l) => l.status === "ACTIVE");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Обране</h1>
        <p className="mt-2 text-sm text-gray-600">
          Тут зібрані оголошення, які ви додали сердечком на сторінці товару. Зараз збережено:{" "}
          <span className="font-semibold text-gray-900">{listings.length}</span>
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          <p className="mb-2 text-4xl">♡</p>
          <p className="mb-1 font-medium text-gray-800">Поки немає обраних товарів</p>
          <p className="mb-4 text-sm">
            Натисніть сердечко на фото оголошення — воно з&apos;явиться тут.
          </p>
          <Link href="/" className="text-brand-700 hover:underline">
            Перейти до каталогу
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
