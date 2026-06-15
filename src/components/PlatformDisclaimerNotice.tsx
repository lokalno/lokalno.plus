import { PLATFORM_DISCLAIMER } from "@/lib/moderation";

type PlatformDisclaimerNoticeProps = {
  compact?: boolean;
};

export default function PlatformDisclaimerNotice({ compact = false }: PlatformDisclaimerNoticeProps) {
  if (compact) {
    return (
      <p className="text-center text-xs leading-relaxed text-gray-500">{PLATFORM_DISCLAIMER}</p>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-950">
      <p className="font-semibold">Важливо</p>
      <p className="mt-1">{PLATFORM_DISCLAIMER}</p>
    </div>
  );
}
