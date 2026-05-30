import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import AdminSettingsForm from "@/components/AdminSettingsForm";
import Link from "next/link";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const settings = await getSiteSettings();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Назад до адмінки
      </Link>
      <h1 className="text-2xl font-bold mb-6">Налаштування сайту</h1>
      <AdminSettingsForm initial={settings} />
    </div>
  );
}
