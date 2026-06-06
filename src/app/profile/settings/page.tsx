import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatViews } from "@/lib/utils";
import ProfileForm from "@/components/ProfileForm";
import PasswordChangeForm from "@/components/PasswordChangeForm";
import SellerListingCard from "@/components/SellerListingCard";

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, reviewStats, followerCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        listings: {
          orderBy: { createdAt: "desc" },
          include: {
            seller: { select: { name: true, storeName: true } },
            _count: {
              select: {
                orders: { where: { paymentStatus: "PAID" } },
                favorites: true,
              },
            },
          },
        },
      },
    }),
    prisma.review.aggregate({
      where: { sellerId: session.user.id },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.sellerFollow.count({ where: { sellerId: session.user.id } }),
  ]);

  if (!user) redirect("/login");

  const totalViews = user.listings.reduce((sum, l) => sum + l.views, 0);
  const avgRating = reviewStats._count > 0 ? reviewStats._avg.rating : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Налаштування профілю</h1>
        <Link href="/profile" className="text-sm text-brand-700 hover:underline">
          ← Мій профіль
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <ProfileForm
            initial={{
              userId: user.id,
              name: user.name,
              storeName: user.storeName,
              city: user.city,
              phone: user.phone || "",
              email: user.email,
              avatar: user.avatar,
              banner: user.banner,
              createdAt: user.createdAt.toISOString(),
              avgRating,
              reviewCount: reviewStats._count,
              followerCount,
            }}
          />
          <PasswordChangeForm />
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 p-4 bg-brand-50 border border-brand-100 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-600">Усього переглядів ваших товарів</p>
              <p className="text-2xl font-bold text-brand-800">👁 {formatViews(totalViews)}</p>
            </div>
            <Link
              href="/listings/new"
              className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700"
            >
              + Додати
            </Link>
          </div>

          <h2 className="text-lg font-semibold mb-4">Мої оголошення ({user.listings.length})</h2>

          {user.listings.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
              <p className="mb-3">У вас ще немає оголошень</p>
              <Link href="/listings/new" className="text-brand-700 hover:underline">
                Додати перше оголошення
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {user.listings.map((listing) => (
                <SellerListingCard key={listing.id} listing={listing} showOwnerActions />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
