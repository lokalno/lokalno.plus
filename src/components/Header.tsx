import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countOpenSupportTickets } from "@/lib/support-tickets";
import HeaderNav from "./HeaderNav";
import HeaderSearch from "./HeaderSearch";
import MobileSearchBar from "./MobileSearchBar";

export default async function Header() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  let user: { name: string; avatar: string | null } | null = null;
  let pendingListings = 0;
  let openSupport = 0;
  let favoriteCount = 0;

  if (session?.user?.id) {
    try {
      [user, pendingListings, openSupport, favoriteCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, avatar: true },
        }),
        isAdmin
          ? prisma.listing.count({ where: { status: "PENDING" } })
          : Promise.resolve(0),
        isAdmin ? countOpenSupportTickets() : Promise.resolve(0),
        prisma.favorite.count({ where: { userId: session.user.id } }),
      ]);
    } catch {
      // DB unavailable — badges load via client polling
    }
  }

  const ordersHref = "/orders";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-3 xl:px-4 py-2.5 xl:py-3 flex items-center gap-3 xl:gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="h-9 w-9 rounded-xl bg-brand-600 text-white flex items-center justify-center text-lg font-bold">
            L
          </span>
          <span className="font-bold text-lg xl:text-xl text-brand-800 lowercase tracking-tight">
            lokalno
          </span>
        </Link>

        <Suspense
          fallback={
            <div className="flex-1 max-w-2xl h-10 bg-gray-100 rounded-xl hidden xl:flex animate-pulse" />
          }
        >
          <HeaderSearch />
        </Suspense>

        <HeaderNav
          session={session}
          unreadCount={0}
          unreadPriceOffers={0}
          favoriteCount={favoriteCount}
          pendingListings={pendingListings}
          openSupport={openSupport}
          userAvatar={user?.avatar}
          userName={user?.name}
          ordersHref={ordersHref}
        />
      </div>

      <Suspense fallback={null}>
        <MobileSearchBar />
      </Suspense>
    </header>
  );
}
