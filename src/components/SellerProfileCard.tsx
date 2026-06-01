import { getSellerDisplayName } from "@/lib/seller-display-name";
import Link from "next/link";
import UserAvatar from "./UserAvatar";
import FollowSellerButton from "./FollowSellerButton";
import { formatDate } from "@/lib/utils";
import { formatStars, getRatingLabel, getFollowerLabel } from "@/lib/seller-stats";
type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewer: { name: string };
};

type SellerProfileCardProps = {
  seller: {
    id: string;
    name: string;
    storeName?: string | null;
    city: string;
    avatar?: string | null;
    createdAt: Date;
    phone?: string | null;
  };
  avgRating: number | null;
  reviewCount: number;
  activeListings?: number;
  recentReviews?: Review[];
  showPhone?: boolean;
  compact?: boolean;
  followerCount?: number;
  isFollowing?: boolean;
  isLoggedIn?: boolean;
  currentUserId?: string | null;
};

export default function SellerProfileCard({
  seller,
  avgRating,
  reviewCount,
  activeListings,
  recentReviews = [],
  showPhone = false,
  compact = false,
  followerCount = 0,
  isFollowing = false,
  isLoggedIn = false,
  currentUserId = null,
}: SellerProfileCardProps) {
  const displayName = getSellerDisplayName(seller);
  const isOwner = currentUserId === seller.id;
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-start gap-4">
        <UserAvatar name={displayName} avatar={seller.avatar} size={compact ? "md" : "lg"} />
        <div className="flex-1 min-w-0">
          <Link href={`/sellers/${seller.id}`} className="font-semibold text-lg hover:text-brand-700">
            {displayName}
          </Link>
          <p className="text-sm text-gray-500">{seller.city}</p>

          <p className="text-xs text-gray-400 mt-1">
            Зареєстрований: {formatDate(seller.createdAt)}
          </p>

          {activeListings !== undefined && (
            <p className="text-xs text-gray-500 mt-0.5">{activeListings} активних оголошень</p>
          )}

          {isOwner ? (
            <p className="text-xs text-gray-500 mt-2">{getFollowerLabel(followerCount)}</p>
          ) : (
            <FollowSellerButton
              sellerId={seller.id}
              isLoggedIn={isLoggedIn}
              isOwner={false}
              initialFollowing={isFollowing}
              initialFollowerCount={followerCount}
              compact={compact}
            />
          )}

          {avgRating !== null ? (
            <div className="mt-2">
              <p className="text-yellow-500 text-sm">{formatStars(avgRating)}</p>
              <p className="text-sm font-medium text-brand-800">
                {avgRating.toFixed(1)} · {getRatingLabel(reviewCount)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-2">Ще немає відгуків</p>
          )}

          {showPhone && seller.phone && (
            <p className="text-sm text-brand-700 mt-2">{seller.phone}</p>
          )}

          <Link
            href={`/sellers/${seller.id}`}
            className="text-xs text-brand-600 hover:underline mt-2 inline-block"
          >
            Профіль і всі відгуки →
          </Link>
        </div>
      </div>

      {!compact && recentReviews.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <p className="text-xs font-medium text-gray-600">Останні відгуки</p>
          {recentReviews.slice(0, 2).map((r) => (
            <div key={r.id} className="bg-white rounded-lg p-3 text-sm">
              <p className="text-yellow-500 text-xs">{"⭐".repeat(r.rating)}</p>
              {r.comment && <p className="text-gray-700 mt-1 line-clamp-2">{r.comment}</p>}
              <p className="text-xs text-gray-400 mt-1">
                {r.reviewer.name} · {formatDate(r.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
