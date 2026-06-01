type ListingFavoriteBadgeProps = {
  count: number;
  className?: string;
};

export default function ListingFavoriteBadge({ count, className = "" }: ListingFavoriteBadgeProps) {
  return (
    <span
      className={`absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm ${className}`}
      title={
        count > 0
          ? `${count} ${count === 1 ? "користувачу" : count < 5 ? "користувачам" : "користувачам"} сподобалось`
          : "Поки ніхто не додав у обране"
      }
    >
      <svg
        className={`h-3.5 w-3.5 shrink-0 ${count > 0 ? "text-rose-300" : "text-white/90"}`}
        viewBox="0 0 24 24"
        fill={count > 0 ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{count}</span>
    </span>
  );
}
