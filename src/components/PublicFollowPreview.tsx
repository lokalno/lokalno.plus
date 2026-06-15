type PublicFollowPreviewProps = {
  followerCount: number;
  onDark?: boolean;
  hideFollowerCount?: boolean;
};

export default function PublicFollowPreview({
  followerCount,
  onDark = false,
  hideFollowerCount = false,
}: PublicFollowPreviewProps) {
  const label =
    followerCount === 1
      ? "підписник"
      : followerCount >= 2 && followerCount <= 4
        ? "підписники"
        : "підписників";

  return (
    <div className={onDark ? "" : "mt-3"}>
      <button
        type="button"
        disabled
        aria-hidden
        className={`cursor-default font-semibold ${
          onDark
            ? "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-2.5 text-xs leading-none text-white opacity-90 shadow-md md:h-9 md:rounded-xl md:px-3.5 md:text-sm"
            : "rounded-lg border border-brand-600 bg-brand-600 px-4 py-2 text-sm font-medium text-white opacity-90"
        }`}
      >
        {onDark ? "+ Підписатися" : "📌 Підписатися"}
      </button>
      {!hideFollowerCount && (
        <p className={`text-sm mt-1.5 ${onDark ? "text-white/70" : "text-gray-500"}`}>
          {followerCount} {label}
        </p>
      )}
    </div>
  );
}
