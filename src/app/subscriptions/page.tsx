import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSellerDisplayName } from "@/lib/seller-display-name";
import UserAvatar from "@/components/UserAvatar";
import { getFollowerLabel } from "@/lib/seller-stats";

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const follows = await prisma.sellerFollow.findMany({
    where: { followerId: session.user.id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          storeName: true,
          city: true,
          avatar: true,
          _count: {
            select: {
              followers: true,
              listings: { where: { status: "ACTIVE" } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Мої підписки ({follows.length})</h1>

      {follows.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          <p className="mb-3">Ви ще нікого не підписали</p>
          <Link href="/" className="text-brand-700 hover:underline">
            Перейти до каталогу
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {follows.map(({ seller }) => (
            <Link
              key={seller.id}
              href={`/sellers/${seller.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border p-4 hover:border-brand-300 transition-colors"
            >
              <UserAvatar name={getSellerDisplayName(seller)} avatar={seller.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{getSellerDisplayName(seller)}</p>
                <p className="text-sm text-gray-500">{seller.city}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {getFollowerLabel(seller._count.followers)} · {seller._count.listings} оголошень
                </p>
              </div>
              <span className="text-brand-600 text-sm">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
