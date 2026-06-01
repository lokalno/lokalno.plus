import Link from "next/link";

type ListingContactButtonProps = {
  listingId: string;
  sellerId: string;
  isLoggedIn: boolean;
  compact?: boolean;
};

export default function ListingContactButton({
  listingId,
  sellerId,
  isLoggedIn,
  compact = false,
}: ListingContactButtonProps) {
  const callbackUrl = `/listings/${listingId}`;
  const href = isLoggedIn
    ? `/messages?listingId=${listingId}&partnerId=${sellerId}`
    : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <Link
      href={href}
      className={`flex w-full items-center justify-center rounded-lg border border-gray-900 bg-white font-semibold text-gray-900 transition hover:bg-gray-50 ${
        compact ? "max-w-sm px-3 py-2 text-sm" : "px-4 py-3.5 text-base"
      }`}
    >
      Написати продавцю
    </Link>
  );
}
