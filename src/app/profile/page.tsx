import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SellerProfileView from "@/components/SellerProfileView";

type SearchParams = Promise<{ pending?: string }>;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [user, followerCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        city: true,
        avatar: true,
        banner: true,
        createdAt: true,
        listings: {
          where: { status: { in: ["ACTIVE", "PENDING"] } },
          include: { seller: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        reviewsReceived: {
          include: { reviewer: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.sellerFollow.count({ where: { sellerId: userId } }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Мій профіль</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/profile/settings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ⚙️ Налаштування
          </Link>
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Додати оголошення
          </Link>
        </div>
      </div>

      {params.pending && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          Оголошення надіслано на модерацію. Після схвалення адміном воно з&apos;явиться в каталозі.
        </div>
      )}

      <SellerProfileView
        seller={user}
        followerCount={followerCount}
        isLoggedIn
        isFollowing={false}
        isOwner
        showOwnerBannerEdit
        showAsPublic
        backHref="/"
        backLabel="← До каталогу"
      />
    </div>
  );
}
