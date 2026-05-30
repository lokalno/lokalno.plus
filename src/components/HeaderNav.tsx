"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { Session } from "next-auth";
import UserAvatar from "./UserAvatar";

type HeaderNavProps = {
  session: Session | null;
  unreadCount?: number;
  pendingListings?: number;
  openSupport?: number;
  userAvatar?: string | null;
  userName?: string;
};

export default function HeaderNav({
  session,
  unreadCount = 0,
  pendingListings = 0,
  openSupport = 0,
  userAvatar = null,
  userName = "",
}: HeaderNavProps) {
  const isAdmin = session?.user?.role === "ADMIN";
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const mobileLinks = session ? (
    <>
      <Link href="/listings/new" className="bg-brand-600 text-white px-3 py-2 rounded-xl hover:bg-brand-700 font-medium block text-center" onClick={() => setOpen(false)}>
        + Додати оголошення
      </Link>
      <Link href="/favorites" className="text-gray-700 py-2 block" onClick={() => setOpen(false)}>Обране</Link>
      <Link href="/subscriptions" className="text-gray-700 py-2 block" onClick={() => setOpen(false)}>Підписки</Link>
      <Link href="/orders" className="text-gray-700 py-2 block" onClick={() => setOpen(false)}>Замовлення</Link>
      <Link href="/messages" className="text-gray-700 py-2 block" onClick={() => setOpen(false)}>
        Повідомлення{unreadCount > 0 ? ` (${unreadCount})` : ""}
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
        <Link href="/favorites" className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-600" title="Обране">
          <span className="text-xl">♡</span>
        </Link>
        <Link href="/messages" className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-600" title="Повідомлення">
          <span className="text-xl">💬</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <Link href="/orders" className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-600" title="Замовлення">
          <span className="text-xl">🔔</span>
        </Link>

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
                  <Link href="/profile/settings" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>Налаштування</Link>
                  <Link href="/orders" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>Замовлення</Link>
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
