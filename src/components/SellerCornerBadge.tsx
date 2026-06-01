import { getSellerDisplayName } from "@/lib/seller-display-name";
import Link from "next/link";
import UserAvatar from "./UserAvatar";
import { formatStars, getRatingLabel } from "@/lib/seller-stats";

type SellerCornerBadgeProps = {
  seller: {
    id: string;
    name: string;
    storeName?: string | null;
    avatar?: string | null;
  };
  avgRating: number | null;
  reviewCount: number;
};

export default function SellerCornerBadge({
  seller,
  avgRating,
  reviewCount,
}: SellerCornerBadgeProps) {
  const displayName = getSellerDisplayName(seller);

  return (
    <Link
      href={`/sellers/${seller.id}`}
      className="shrink-0 text-right max-w-[140px] sm:max-w-[160px] flex flex-col items-end gap-1.5 group"
    >
      <UserAvatar name={displayName} avatar={seller.avatar} size="sm" />
      <span className="font-semibold text-sm text-gray-900 group-hover:text-brand-700 truncate w-full text-right">
        {displayName}
      </span>

      {avgRating !== null ? (
        <div>
          <p className="text-yellow-500 text-xs leading-tight">{formatStars(avgRating)}</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {avgRating.toFixed(1)} · {getRatingLabel(reviewCount)}
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400">Немає відгуків</p>
      )}
    </Link>
  );
}
