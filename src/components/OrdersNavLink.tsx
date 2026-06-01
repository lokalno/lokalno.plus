"use client";

import type { AnchorHTMLAttributes, ReactNode, MouseEvent } from "react";
import { APP_VERSION } from "@/lib/app-version";
import { buildOrdersHref, fetchServerAppVersion } from "@/lib/client-version-sync";

type OrdersNavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
  onNavigate?: () => void;
};

/** Forces a full page load so the orders screen always opens reliably. */
export default function OrdersNavLink({
  href,
  className,
  children,
  onNavigate,
  onClick,
  ...rest
}: OrdersNavLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();
    onNavigate?.();

    void (async () => {
      const version = (await fetchServerAppVersion()) ?? APP_VERSION;
      window.location.assign(buildOrdersHref(href, version));
    })();
  };

  return (
    <a href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
