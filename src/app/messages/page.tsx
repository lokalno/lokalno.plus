import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSellerDisplayName } from "@/lib/seller-display-name";
import MessagesClient from "@/components/MessagesClient";

type SearchParams = Promise<{ listingId?: string; partnerId?: string }>;

export default async function MessagesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { listingId, partnerId } = params;
  const inThread = Boolean(listingId && partnerId);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const returnParams = new URLSearchParams();
    if (listingId) returnParams.set("listingId", listingId);
    if (partnerId) returnParams.set("partnerId", partnerId);
    const returnTo = returnParams.toString() ? `/messages?${returnParams}` : "/messages";
    redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  }

  const userId = session.user.id;

  if (inThread) {
    await prisma.message.updateMany({
      where: {
        receiverId: userId,
        senderId: partnerId,
        listingId,
        read: false,
      },
      data: { read: true },
    });
  } else if (!listingId && !partnerId) {
    await prisma.message.updateMany({
      where: { receiverId: userId, read: false },
      data: { read: true },
    });
  }

  const [messages, threadMeta] = await Promise.all([
    prisma.message.findMany({
      where: {
        AND: [
          { OR: [{ senderId: userId }, { receiverId: userId }] },
          ...(listingId ? [{ listingId }] : []),
          ...(inThread
            ? [
                {
                  OR: [
                    { senderId: userId, receiverId: partnerId },
                    { senderId: partnerId, receiverId: userId },
                  ],
                },
              ]
            : []),
        ],
      },
      include: {
        sender: { select: { id: true, name: true, storeName: true } },
        receiver: { select: { id: true, name: true, storeName: true } },
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    inThread && listingId && partnerId
      ? Promise.all([
          prisma.user.findUnique({
            where: { id: partnerId },
            select: { name: true, storeName: true },
          }),
          prisma.listing.findUnique({
            where: { id: listingId },
            select: { title: true },
          }),
        ]).then(([partner, listing]) => ({
          partnerName: partner ? getSellerDisplayName(partner) : "Користувач",
          listingTitle: listing?.title ?? "Товар",
        }))
      : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Повідомлення</h1>
      <MessagesClient
        initialMessages={messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
        currentUserId={userId}
        listingId={listingId}
        partnerId={partnerId}
        threadPartnerName={threadMeta?.partnerName}
        threadListingTitle={threadMeta?.listingTitle}
      />
    </div>
  );
}
