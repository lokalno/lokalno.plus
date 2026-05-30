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
    <div className="mt-3">
      <button
        type="button"
        disabled
        aria-hidden
        className={`text-sm px-4 py-2 rounded-lg border font-medium cursor-default ${
          onDark
            ? "border-white/30 bg-white/10 text-white opacity-90"
            : "border-brand-600 bg-brand-600 text-white opacity-90"
        }`}
      >
        📌 Підписатися
      </button>
      {!hideFollowerCount && (
        <p className={`text-sm mt-1.5 ${onDark ? "text-white/70" : "text-gray-500"}`}>
          {followerCount} {label}
        </p>
      )}
    </div>
  );
}
