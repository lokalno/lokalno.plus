import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MessagesClient from "@/components/MessagesClient";

type SearchParams = Promise<{ listingId?: string; partnerId?: string }>;

export default async function MessagesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { listingId, partnerId } = params;
  const inThread = Boolean(listingId && partnerId);

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

  const messages = await prisma.message.findMany({
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
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

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
      />
    </div>
  );
}
