import { prisma } from "@/lib/prisma";
import { DEFAULT_RULES, DEFAULT_PRIVACY } from "@/lib/moderation";

export async function getSiteSettings() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        id: 1,
        siteName: "Локально",
        tagline: "Купуй і продавай локально в Україні",
        supportEmail: "support@lokalno.ua",
        rulesContent: DEFAULT_RULES,
        privacyContent: DEFAULT_PRIVACY,
        preModeration: true,
      },
    });
  }

  return settings;
}
