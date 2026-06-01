export const VERSION_STORAGE_KEY = "lokalno-app-version";

export type HealthResponse = {
  ok?: boolean;
  upload?: string;
};

export async function fetchServerAppVersion(): Promise<string | null> {
  try {
    const res = await fetch("/api/health", { cache: "no-store", credentials: "same-origin" });
    if (!res.ok) return null;
    const data = (await res.json()) as HealthResponse;
    return data.upload ?? null;
  } catch {
    return null;
  }
}

export function reloadWithVersion(version: string) {
  try {
    localStorage.setItem(VERSION_STORAGE_KEY, version);
  } catch {
    // localStorage may be unavailable in private mode
  }

  const url = new URL(window.location.href);
  url.searchParams.set("_v", version);
  url.searchParams.set("_t", String(Date.now()));
  window.location.replace(url.toString());
}

export async function syncClientWithServerVersion(fallbackVersion: string): Promise<boolean> {
  const serverVersion = (await fetchServerAppVersion()) ?? fallbackVersion;

  try {
    const stored = localStorage.getItem(VERSION_STORAGE_KEY);
    if (stored && stored !== serverVersion) {
      reloadWithVersion(serverVersion);
      return true;
    }
    if (!stored) {
      localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
    }
  } catch {
    // localStorage may be unavailable in private mode
  }

  return false;
}

export function buildOrdersHref(href: string, version: string) {
  const url = new URL(href, window.location.origin);
  url.searchParams.set("_v", version);
  url.searchParams.set("_t", String(Date.now()));
  return `${url.pathname}${url.search}${url.hash}`;
}
