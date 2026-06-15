import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PromImportForm from "@/components/PromImportForm";
import { PROM_IMPORT_BATCH_SIZE } from "@/lib/prom-import";

export const dynamic = "force-dynamic";

export default async function ProfileImportPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Імпорт з Prom.ua</h1>
          <p className="mt-1 text-sm text-gray-600">
            Завантажте Excel або CSV з Prom — до {PROM_IMPORT_BATCH_SIZE} товарів за один раз.
          </p>
        </div>
        <Link href="/profile" className="text-sm text-brand-700 hover:underline">
          ← Мій профіль
        </Link>
      </div>

      <PromImportForm />
    </div>
  );
}
