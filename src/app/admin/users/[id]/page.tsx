import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTenure } from "@/lib/utils";
import AdminUserSalesHistoryPanel from "@/components/AdminUserSalesHistoryPanel";
import AdminUserActions from "@/components/AdminUserActions";
import { getAdminUserSalesHistory } from "@/lib/admin-user-sales-history";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function AdminUserDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const data = await getAdminUserSalesHistory(id, prisma);
  if (!data) redirect("/admin/users");

  const { user, sellerDisplayName, salesOrders, totals } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/admin/users" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Користувачі
      </Link>

      <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium text-gray-700">Магазин:</span> {sellerDisplayName}
            </p>
            <p className="text-sm text-gray-500">
              {user.email} · {user.city}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>
                <span className="font-medium text-gray-700">На сайті:</span> {formatTenure(user.createdAt)}
              </span>
              <span>
                <span className="font-medium text-gray-700">Реєстрація:</span> {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
          <AdminUserActions
            userId={user.id}
            userName={user.name}
            banned={user.banned}
            isAdmin={user.role === "ADMIN"}
          />
        </div>
      </div>

      <AdminUserSalesHistoryPanel salesOrders={salesOrders} totals={totals} />
    </div>
  );
}
