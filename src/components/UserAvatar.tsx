type UserAvatarProps = {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizes = {
  sm: "w-10 h-10 text-sm",
  md: "w-16 h-16 text-xl",
  lg: "w-24 h-24 text-3xl",
  xl: "w-28 h-28 sm:w-32 sm:h-32 text-4xl",
};

export default function UserAvatar({ name, avatar, size = "md" }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover border-2 border-white shadow shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-brand-600 text-white flex items-center justify-center font-bold shrink-0 border-2 border-white shadow`}
    >
      {initial}
    </div>
  );
}
