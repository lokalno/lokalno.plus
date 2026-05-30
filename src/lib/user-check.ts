import { prisma } from "./prisma";

export async function getActiveUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, banned: true, bannedReason: true, role: true },
  });
}

export async function assertNotBanned(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getActiveUser(userId);
  if (!user) return { ok: false, error: "Користувача не знайдено" };
  if (user.banned) {
    return {
      ok: false,
      error: user.bannedReason || "Ваш акаунт заблоковано адміністратором",
    };
  }
  return { ok: true };
}

export async function getInitialListingStatus(): Promise<"PENDING" | "ACTIVE"> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return settings?.preModeration !== false ? "PENDING" : "ACTIVE";
}
