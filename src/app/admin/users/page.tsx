import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import AdminUserActions from "@/components/AdminUserActions";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      city: true,
      role: true,
      banned: true,
      bannedReason: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Назад до адмінки
      </Link>
      <h1 className="text-2xl font-bold mb-6">Користувачі ({users.length})</h1>

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              user.banned ? "border-red-200 bg-red-50/30" : ""
            }`}
          >
            <div>
              <p className="font-medium">
                {user.name}
                {user.role === "ADMIN" && (
                  <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-1 rounded">admin</span>
                )}
                {user.banned && (
                  <span className="ml-1 text-xs bg-red-100 text-red-700 px-1 rounded">заблоковано</span>
                )}
              </p>
              <p className="text-sm text-gray-500">{user.email} · {user.city}</p>
              <p className="text-xs text-gray-400">
                {user._count.listings} оголошень · {formatDate(user.createdAt)}
              </p>
              {user.bannedReason && (
                <p className="text-xs text-red-600 mt-1">{user.bannedReason}</p>
              )}
            </div>
            <AdminUserActions
              userId={user.id}
              banned={user.banned}
              isAdmin={user.role === "ADMIN"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
