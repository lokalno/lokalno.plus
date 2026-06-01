type UserAvatarProps = {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "banner";
  showOnline?: boolean;
};

const sizes = {
  sm: "w-10 h-10 text-sm",
  md: "w-16 h-16 text-xl",
  lg: "w-24 h-24 text-3xl",
  xl: "w-28 h-28 sm:w-32 sm:h-32 text-4xl",
  "2xl": "w-32 h-32 sm:w-36 sm:h-36 text-5xl",
  banner: "w-14 h-14 md:w-16 md:h-16 text-base md:text-lg",
};

export default function UserAvatar({ name, avatar, size = "md", showOnline = false }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  const avatarNode = avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatar}
      alt={name}
      className={`${sizes[size]} rounded-full object-cover border-2 border-white/90 shadow-md shrink-0`}
    />
  ) : (
    <div
      className={`${sizes[size]} rounded-full bg-brand-600 text-white flex items-center justify-center font-bold shrink-0 border-2 border-white/90 shadow-md`}
    >
      {initial}
    </div>
  );

  if (!showOnline) return avatarNode;

  return (
    <div className="relative shrink-0">
      {avatarNode}
      <span
        className={`absolute rounded-full border-2 border-white bg-emerald-500 ${
          size === "banner" ? "bottom-0 right-0 h-2.5 w-2.5" : "bottom-1 right-1 h-4 w-4"
        }`}
        title="Онлайн"
        aria-hidden
      />
    </div>
  );
}
