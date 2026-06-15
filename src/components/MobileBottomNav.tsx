"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { NotificationCountBadge } from "./HeaderNotifications";
import { useHeaderNotifications } from "./HeaderNotifications";

function NavIcon({
  href,
  label,
  active,
  children,
  onClick,
}: {
  href?: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const className = `flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors ${
    active ? "text-brand-700" : "text-gray-500"
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} aria-label={label}>
        {children}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link href={href!} className={className} aria-label={label}>
      {children}
      <span>{label}</span>
    </Link>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { counts } = useHeaderNotifications();
  const isLoggedIn = Boolean(session?.user?.id);

  const profileHref = isLoggedIn ? "/profile" : "/login";
  const addHref = isLoggedIn ? "/listings/new" : "/login?callbackUrl=/listings/new";

  const isHome = pathname === "/";
  const isFavorites = pathname.startsWith("/favorites");
  const isMessages = pathname.startsWith("/messages");
  const isProfile =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  return (
    <nav
      className="xl:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Головна навігація"
    >
      <div className="mx-auto flex max-w-lg items-end justify-between px-2 pt-1.5">
        <NavIcon href="/" label="Головна" active={isHome}>
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
          </svg>
        </NavIcon>

        <NavIcon
          href={isLoggedIn ? "/favorites" : "/login?callbackUrl=/favorites"}
          label="Обране"
          active={isFavorites}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </NavIcon>

        <Link
          href={addHref}
          className="-mt-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700"
          aria-label="Додати оголошення"
        >
          <span className="text-3xl leading-none">+</span>
        </Link>

        <NavIcon href={isLoggedIn ? "/messages" : "/login?callbackUrl=/messages"} label="Чати" active={isMessages}>
          <span className="relative inline-flex">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {isLoggedIn && <NotificationCountBadge count={counts.unreadMessages} />}
          </span>
        </NavIcon>

        <NavIcon href={profileHref} label="Профіль" active={isProfile}>
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </NavIcon>
      </div>
    </nav>
  );
}
