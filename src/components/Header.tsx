import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HeaderNav from "./HeaderNav";
import HeaderSearch from "./HeaderSearch";

export default async function Header() {
  const session = await getServerSession(authOptions);

  const isAdmin = session?.user?.role === "ADMIN";

  const [unreadCount, user, pendingListings, openSupport] = session?.user?.id
    ? await Promise.all([
        prisma.message.count({
          where: { receiverId: session.user.id, read: false },
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, avatar: true },
        }),
        isAdmin
          ? prisma.listing.count({ where: { status: "PENDING" } })
          : Promise.resolve(0),
        isAdmin
          ? prisma.supportTicket.count({ where: { status: "OPEN" } })
          : Promise.resolve(0),
      ])
    : [0, null, 0, 0];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="h-9 w-9 rounded-xl bg-brand-600 text-white flex items-center justify-center text-lg font-bold">
            L
          </span>
          <span className="font-bold text-xl text-brand-800 lowercase tracking-tight">
            lokalno
          </span>
        </Link>

        <Suspense fallback={<div className="flex-1 max-w-2xl h-10 bg-gray-100 rounded-xl hidden md:block animate-pulse" />}>
          <HeaderSearch />
        </Suspense>

        <HeaderNav
          session={session}
          unreadCount={unreadCount}
          pendingListings={pendingListings}
          openSupport={openSupport}
          userAvatar={user?.avatar}
          userName={user?.name}
        />
      </div>
    </header>
  );
}
