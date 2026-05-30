import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteSettings } from "@/lib/site-settings";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    return {
      title: {
        default: settings.siteName,
        template: `%s | ${settings.siteName}`,
      },
      description: settings.tagline,
    };
  } catch {
    return {
      title: { default: "Локально", template: "%s | Локально" },
      description: "Купуй і продавай локально в Україні",
    };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-72px)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
