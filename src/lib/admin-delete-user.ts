import { prisma } from "@/lib/prisma";

export async function deleteUserAccount(userId: string): Promise<void> {
  const listingIds = (
    await prisma.listing.findMany({
      where: { sellerId: userId },
      select: { id: true },
    })
  ).map((listing) => listing.id);

  await prisma.$transaction([
    prisma.review.deleteMany({
      where: {
        OR: [{ sellerId: userId }, { reviewerId: userId }, { listingId: { in: listingIds } }],
      },
    }),
    prisma.order.deleteMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }, { listingId: { in: listingIds } }],
      },
    }),
    prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
          { listingId: { in: listingIds } },
        ],
      },
    }),
    prisma.report.deleteMany({
      where: {
        OR: [{ reporterId: userId }, { listingId: { in: listingIds } }],
      },
    }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
