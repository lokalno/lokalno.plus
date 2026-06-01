import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import OrdersNavLink from "@/components/OrdersNavLink";
import CabinetNavIcon, { type CabinetNavIconName } from "@/components/CabinetNavIcon";

type NavItem = {
  href: string;
  label: string;
  icon: CabinetNavIconName;
  badge?: number;
  active?: boolean;
};

type ProfileCabinetShellProps = {
  userName: string;
  userAvatar: string | null;
  rating: number | null;
  reviewCount: number;
  active: "profile" | "orders" | "wallet" | "settings" | "messages" | "reviews" | "achievements" | "listings" | "followers" | "analytics" | "price-offers";
  orderBadge?: number;
  messageBadge?: number;
  listingBadge?: number;
  followerBadge?: number;
  priceOfferBadge?: number;
  variant?: "full" | "compact";
  rightSidebar?: React.ReactNode;
  children: React.ReactNode;
};

export default function ProfileCabinetShell({
  userName,
  userAvatar,
  rating,
  reviewCount,
  active,
  orderBadge = 0,
  messageBadge = 0,
  listingBadge = 0,
  followerBadge = 0,
  priceOfferBadge = 0,
  variant = "full",
  rightSidebar,
  children,
}: ProfileCabinetShellProps) {
  const fullNav: NavItem[] = [
    { href: "/profile", label: "Панель продавця", icon: "dashboard", active: active === "profile" },
    {
      href: "/profile?tab=listings",
      label: "Мої оголошення",
      icon: "listings",
      badge: listingBadge,
      active: active === "listings",
    },
    {
      href: "/orders",
      label: "Мої замовлення",
      icon: "orders",
      badge: orderBadge,
      active: active === "orders",
    },
    {
      href: "/profile/price-offers",
      label: "Пропозиції цін",
      icon: "price-offers",
      badge: priceOfferBadge,
      active: active === "price-offers",
    },
    {
      href: "/messages",
      label: "Повідомлення",
      icon: "messages",
      badge: messageBadge,
      active: active === "messages",
    },
    {
      href: "/profile?tab=achievements",
      label: "Досягнення",
      icon: "achievements",
      active: active === "achievements",
    },
    {
      href: "/profile?tab=reviews",
      label: "Відгуки",
      icon: "reviews",
      badge: reviewCount,
      active: active === "reviews",
    },
    {
      href: "/profile?tab=followers",
      label: "Підписники",
      icon: "followers",
      badge: followerBadge,
      active: active === "followers",
    },
    { href: "/profile/analytics", label: "Аналітика", icon: "analytics", active: active === "analytics" },
    { href: "/profile/wallet", label: "Баланс", icon: "wallet", active: active === "wallet" },
    { href: "/profile/settings", label: "Налаштування", icon: "settings", active: active === "settings" },
  ];

  const compactNav: NavItem[] = [
    { href: "/profile", label: "Панель продавця", icon: "dashboard", active: active === "profile" },
    {
      href: "/profile?tab=listings",
      label: "Мої оголошення",
      icon: "listings",
      badge: listingBadge,
      active: active === "listings",
    },
    {
      href: "/orders",
      label: "Мої замовлення",
      icon: "orders",
      badge: orderBadge,
      active: active === "orders",
    },
    {
      href: "/profile/price-offers",
      label: "Пропозиції цін",
      icon: "price-offers",
      badge: priceOfferBadge,
      active: active === "price-offers",
    },
    {
      href: "/messages",
      label: "Повідомлення",
      icon: "messages",
      badge: messageBadge,
      active: active === "messages",
    },
    {
      href: "/profile?tab=achievements",
      label: "Досягнення",
      icon: "achievements",
      active: active === "achievements",
    },
    {
      href: "/profile?tab=reviews",
      label: "Відгуки",
      icon: "reviews",
      badge: reviewCount,
      active: active === "reviews",
    },
    {
      href: "/profile?tab=followers",
      label: "Підписники",
      icon: "followers",
      badge: followerBadge,
      active: active === "followers",
    },
    { href: "/profile/analytics", label: "Аналітика", icon: "analytics", active: active === "analytics" },
    { href: "/profile/wallet", label: "Баланс", icon: "wallet", active: active === "wallet" },
    { href: "/profile/settings", label: "Налаштування", icon: "settings", active: active === "settings" },
  ];

  const nav = variant === "compact" ? compactNav : fullNav;

  return (
    <div
      className={`mx-auto w-full px-4 py-6 lg:py-8 ${
        rightSidebar ? "max-w-[1600px]" : "max-w-7xl"
      }`}
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8 2xl:gap-12">
        <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-60 xl:w-64">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:shadow-md">
            <div className="border-b border-gray-100 bg-gradient-to-r from-brand-50/80 to-white p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-brand-600">
                Кабінет продавця
              </p>
              <div className="flex items-center gap-3">
                <UserAvatar name={userName} avatar={userAvatar} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">Продавець</p>
                  {rating != null && reviewCount > 0 && (
                    <p className="mt-0.5 text-xs text-gray-600">
                      <span className="text-gray-500">★</span> {rating.toFixed(1)} ({reviewCount}{" "}
                      {reviewCount === 1 ? "відгук" : reviewCount < 5 ? "відгуки" : "відгуків"})
                    </p>
                  )}
                </div>
              </div>
            </div>

            <nav className="p-2" aria-label="Меню кабінету продавця">
              {nav.map((item) => {
                const className = `mb-0.5 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                  item.active
                    ? "bg-brand-600 font-semibold text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"
                }`;
                const badgeClass = item.active
                  ? "rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white"
                  : "rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white";
                const inner = (
                  <>
                    <span className="flex items-center gap-2.5">
                      <CabinetNavIcon name={item.icon} />
                      {item.label}
                    </span>
                    {item.badge != null && item.badge > 0 && (
                      <span className={badgeClass.replace("bg-brand-600", "bg-emerald-500").replace("bg-white/20", "bg-white/20")}>
                        {item.badge}
                      </span>
                    )}
                  </>
                );

                if (item.label === "Мої замовлення") {
                  return (
                    <OrdersNavLink
                      key={`${item.href}-${item.label}`}
                      href={item.href}
                      className={className}
                    >
                      {inner}
                    </OrdersNavLink>
                  );
                }

                return (
                  <Link key={`${item.href}-${item.label}`} href={item.href} className={className}>
                    {inner}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-gray-100 p-4">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">Потрібна допомога?</p>
                <Link
                  href="/contact"
                  className="mt-2 inline-flex rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Написати нам
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>

        {rightSidebar ? (
          <div className="w-full shrink-0 xl:ml-auto xl:w-72 2xl:w-80">{rightSidebar}</div>
        ) : null}
      </div>
    </div>
  );
}
