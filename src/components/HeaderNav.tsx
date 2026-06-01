"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { Session } from "next-auth";
import UserAvatar from "./UserAvatar";
import OrdersNavLink from "./OrdersNavLink";
import { FavoriteHeartIcon } from "./FavoriteButton";
import {
  NotificationCountBadge,
  NotificationDot,
  useHeaderNotifications,
} from "./HeaderNotifications";

function NavBellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`${className} text-gray-600`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}

function NavPriceOffersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`${className} text-gray-600`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.729c.399.093.794.186 1.184.278M2.25 18.75l-.893 4.512A59.768 59.768 0 0121.75 18.75M2.25 18.75V15m18 3.75V15M2.25 15h18M10.5 2.25V4.5m3-2.25V4.5M4.5 6.75h15M4.5 6.75v10.875c0 .621.504 1.125 1.125 1.125h13.125c.621 0 1.125-.504 1.125-1.125V6.75"
      />
    </svg>
  );
}

type HeaderNavProps = {
  session: Session | null;
  unreadCount?: number;
  unreadPriceOffers?: number;
  favoriteCount?: number;
  pendingListings?: number;
  openSupport?: number;
  userAvatar?: string | null;
  userName?: string;
  ordersHref?: string;
};

export default function HeaderNav({
  session,
  unreadCount = 0,
  unreadPriceOffers = 0,
  favoriteCount = 0,
  pendingListings = 0,
  openSupport = 0,
  userAvatar = null,
  userName = "",
  ordersHref = "/orders",
}: HeaderNavProps) {
  const isAdmin = session?.user?.role === "ADMIN";
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { counts } = useHeaderNotifications(Boolean(session?.user?.id));
  const liveMessages = session?.user?.id ? counts.unreadMessages : unreadCount;
  const livePriceOffers = session?.user?.id ? counts.unreadPriceOffers : unreadPriceOffers;
  const liveTotal = liveMessages + livePriceOffers;

  const mobileLinks = session ? (
    <>
      <Link href="/listings/new" className="bg-brand-600 text-white px-3 py-2 rounded-xl hover:bg-brand-700 font-medium block text-center" onClick={() => setOpen(false)}>
        + Додати оголошення
      </Link>
      <Link href="/favorites" className="flex items-center gap-2 py-2 text-rose-700 font-medium" onClick={() => setOpen(false)}>
        <FavoriteHeartIcon filled={favoriteCount > 0} className="h-5 w-5" />
        Обране{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
      </Link>
      <Link href="/subscriptions" className="text-gray-700 py-2 block" onClick={() => setOpen(false)}>Підписки</Link>
      <OrdersNavLink href={ordersHref} className="text-gray-700 py-2 block" onNavigate={() => setOpen(false)}>
        Мої замовлення
      </OrdersNavLink>
      <Link href="/profile/wallet" className="text-gray-700 py-2 block" onClick={() => setOpen(false)}>💰 Баланс</Link>
      <Link href="/messages" className="relative flex items-center gap-2 py-2 text-gray-700" onClick={() => setOpen(false)}>
        <span className="relative inline-flex">
          💬
          <NotificationDot count={liveTotal} className="-right-0.5 -top-0.5" />
        </span>
        Повідомлення{liveMessages > 0 ? ` (${liveMessages})` : ""}
        {livePriceOffers > 0 ? ` · пропозиції (${livePriceOffers})` : ""}
      </Link>
      <Link href="/profile/price-offers" className="relative flex items-center gap-2 py-2 text-gray-700" onClick={() => setOpen(false)}>
        <span className="relative inline-flex">
          <NavPriceOffersIcon className="h-5 w-5" />
          <NotificationDot count={livePriceOffers} className="-right-0.5 -top-0.5" />
        </span>
        Пропозиції цін{livePriceOffers > 0 ? ` (${livePriceOffers})` : ""}
      </Link>
      <Link href="/contact" className="text-gray-700 py-2 block" onClick={() => setOpen(false)}>Підтримка</Link>
      <Link href="/profile" className="text-gray-700 py-2 block" onClick={() => setOpen(false)}>Мій профіль</Link>
      <Link href="/profile/settings" className="text-gray-700 py-2 block" onClick={() => setOpen(false)}>Налаштування</Link>
      {isAdmin && (
        <>
          <Link
            href="/admin/listings?status=pending"
            className="bg-amber-500 text-white px-3 py-2 rounded-xl block text-center font-medium"
            onClick={() => setOpen(false)}
          >
            ✓ Модерація{pendingListings > 0 ? ` (${pendingListings})` : ""}
          </Link>
          <Link
            href="/admin/support"
            className="bg-blue-600 text-white px-3 py-2 rounded-xl block text-center font-medium"
            onClick={() => setOpen(false)}
          >
            💬 Підтримка{openSupport > 0 ? ` (${openSupport})` : ""}
          </Link>
          <Link href="/admin" className="text-orange-600 py-2 block font-medium" onClick={() => setOpen(false)}>Адмін-панель</Link>
        </>
      )}
      <button onClick={() => signOut({ callbackUrl: "/" })} className="text-red-600 py-2 text-left w-full">
        Вийти
      </button>
    </>
  ) : (
    <>
      <Link href="/login" className="text-gray-700 py-2 block" onClick={() => setOpen(false)}>Увійти</Link>
      <Link href="/register" className="bg-brand-600 text-white px-3 py-2 rounded-xl block text-center" onClick={() => setOpen(false)}>Реєстрація</Link>
    </>
  );

  return (
    <>
      <nav className="hidden lg:flex items-center gap-1 shrink-0">
        <Link
          href="/favorites"
          className="relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-gray-700 hover:bg-rose-50 md:px-3"
          title="Обране — збережені оголошення"
        >
          <FavoriteHeartIcon filled={favoriteCount > 0} className="h-5 w-5" />
          <span className="hidden text-sm font-medium md:inline">Обране</span>
          {favoriteCount > 0 && (
            <span className="absolute -top-0.5 right-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white md:static md:ml-0.5">
              {favoriteCount > 99 ? "99+" : favoriteCount}
            </span>
          )}
        </Link>
        <Link href="/messages" className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-600" title="Повідомлення">
          <span className="text-xl">💬</span>
          <NotificationCountBadge count={liveMessages} />
        </Link>
        <Link
          href="/profile/price-offers"
          className="relative hidden p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 md:flex"
          title="Пропозиції цін"
        >
          <NavPriceOffersIcon className="h-5 w-5" />
          <NotificationCountBadge count={livePriceOffers} />
        </Link>
        <OrdersNavLink href={ordersHref} className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-600" title="Мої замовлення">
          <NavBellIcon className="h-5 w-5" />
        </OrdersNavLink>

        {isAdmin && (
          <>
            <Link
              href="/admin/listings?status=pending"
              className="ml-2 relative bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 font-medium text-sm whitespace-nowrap"
              title="Підтвердити нові оголошення"
            >
              ✓ Модерація
              {pendingListings > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {pendingListings > 99 ? "99+" : pendingListings}
                </span>
              )}
            </Link>
            <Link
              href="/admin/support"
              className="ml-2 relative bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-medium text-sm whitespace-nowrap"
              title="Повідомлення від користувачів у підтримку"
            >
              💬 Підтримка
              {openSupport > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {openSupport > 99 ? "99+" : openSupport}
                </span>
              )}
            </Link>
          </>
        )}

        <Link
          href={session ? "/listings/new" : "/login"}
          className="ml-2 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 font-medium text-sm whitespace-nowrap"
        >
          + Додати оголошення
        </Link>

        {session ? (
          <div className="relative ml-2">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-gray-100"
            >
              <UserAvatar name={userName || session.user?.name || "?"} avatar={userAvatar} size="sm" />
              <span className="text-sm font-medium text-gray-800 max-w-[80px] truncate hidden xl:inline">
                {userName || session.user?.name}
              </span>
              <span className="text-gray-400 text-xs">▾</span>
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border shadow-lg py-1 z-50 text-sm">
                  <Link href="/profile" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>Мій профіль</Link>
                  <Link href="/favorites" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                    ♡ Обране{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
                  </Link>
                  <Link href="/profile/settings" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>Налаштування</Link>
                  <Link href="/profile/wallet" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>💰 Баланс</Link>
                  <OrdersNavLink href={ordersHref} className="block px-4 py-2 hover:bg-gray-50" onNavigate={() => setProfileOpen(false)}>
                    🛒 Мої замовлення
                  </OrdersNavLink>
                  <Link href="/subscriptions" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>Підписки</Link>
                  <Link href="/contact" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>Підтримка</Link>
                  {isAdmin && (
                    <>
                      <Link
                        href="/admin/listings?status=pending"
                        className="block px-4 py-2 text-amber-700 font-medium hover:bg-amber-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        ✓ Модерація{pendingListings > 0 ? ` (${pendingListings})` : ""}
                      </Link>
                      <Link
                        href="/admin/support"
                        className="block px-4 py-2 text-blue-700 font-medium hover:bg-blue-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        💬 Звернення{openSupport > 0 ? ` (${openSupport})` : ""}
                      </Link>
                      <Link href="/admin" className="block px-4 py-2 text-orange-600 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>Адмін-панель</Link>
                    </>
                  )}
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50">
                    Вийти
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link href="/login" className="ml-2 text-sm text-brand-700 hover:underline px-2">
            Увійти
          </Link>
        )}
      </nav>

      <button
        type="button"
        className="lg:hidden p-2 rounded-xl border border-gray-200"
        onClick={() => setOpen(!open)}
        aria-label="Меню"
      >
        ☰
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-4 space-y-2 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Меню</span>
              <button onClick={() => setOpen(false)} className="text-xl">×</button>
            </div>
            {mobileLinks}
          </div>
        </div>
      )}
    </>
  );
}
