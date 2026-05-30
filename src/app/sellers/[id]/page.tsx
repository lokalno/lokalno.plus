import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SellerProfileView from "@/components/SellerProfileView";

type Params = { params: Promise<{ id: string }> };

export default async function SellerPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (session?.user?.id === id) {
    redirect("/profile");
  }

  const seller = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      city: true,
      avatar: true,
      banner: true,
      createdAt: true,
      banned: true,
      listings: {
        where: { status: "ACTIVE" },
        include: {
          seller: { select: { name: true } },
          _count: {
            select: {
              orders: { where: { paymentStatus: "PAID" } },
              favorites: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      reviewsReceived: {
        include: { reviewer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!seller || seller.banned) notFound();

  const [followerCount, followRecord] = await Promise.all([
    prisma.sellerFollow.count({ where: { sellerId: id } }),
    session?.user?.id
      ? prisma.sellerFollow.findUnique({
          where: {
            followerId_sellerId: { followerId: session.user.id, sellerId: id },
          },
        })
      : null,
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SellerProfileView
        seller={seller}
        followerCount={followerCount}
        isLoggedIn={Boolean(session)}
        isFollowing={Boolean(followRecord)}
        isOwner={false}
      />
    </div>
  );
}
