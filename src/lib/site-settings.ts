import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DEFAULT_RULES, DEFAULT_PRIVACY } from "@/lib/moderation";

export const FALLBACK_SITE_SETTINGS = {
  id: 1,
  siteName: "Локально",
  tagline: "Купуй і продавай локально в Україні",
  logoUrl: null as string | null,
  supportEmail: "support@lokalno.ua",
  rulesContent: DEFAULT_RULES,
  privacyContent: DEFAULT_PRIVACY,
  preModeration: true,
};

async function loadSiteSettings() {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: 1,
          siteName: FALLBACK_SITE_SETTINGS.siteName,
          tagline: FALLBACK_SITE_SETTINGS.tagline,
          supportEmail: FALLBACK_SITE_SETTINGS.supportEmail,
          rulesContent: FALLBACK_SITE_SETTINGS.rulesContent,
          privacyContent: FALLBACK_SITE_SETTINGS.privacyContent,
          preModeration: FALLBACK_SITE_SETTINGS.preModeration,
        },
      });
    }

    return settings;
  } catch {
    return FALLBACK_SITE_SETTINGS;
  }
}

const getCachedSiteSettings = unstable_cache(loadSiteSettings, ["site-settings-v1"], {
  revalidate: 60,
});

export async function getSiteSettings() {
  return getCachedSiteSettings();
}
