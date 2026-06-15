import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTenure } from "@/lib/utils";
import AdminUserActions from "@/components/AdminUserActions";
import AdminUsersSearch from "@/components/AdminUsersSearch";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const query = params.q?.trim() || "";

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { storeName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      email: true,
      name: true,
      storeName: true,
      city: true,
      role: true,
      banned: true,
      bannedReason: true,
      createdAt: true,
      _count: {
        select: {
          listings: true,
          ordersAsBuyer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Назад до адмінки
      </Link>
      <h1 className="text-2xl font-bold mb-2">
        Користувачі
        {query ? ` · знайдено ${users.length}` : ` (${users.length})`}
      </h1>
      <p className="mb-4 text-sm text-gray-500">
        Ім&apos;я, назва магазину, час на маркетплейсі та кількість покупок. Натисніть на ім&apos;я або
        магазин, щоб відкрити всю історію продажів.
      </p>

      <Suspense fallback={<div className="mb-6 h-11 rounded-xl bg-gray-100 animate-pulse" />}>
        <AdminUsersSearch />
      </Suspense>

      {query && users.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          <p className="text-3xl mb-2">🔍</p>
          <p>Нікого не знайдено за запитом «{query}»</p>
        </div>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className={`rounded-xl border bg-white p-4 ${
              user.banned ? "border-red-200 bg-red-50/30" : ""
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  <Link href={`/admin/users/${user.id}`} className="hover:text-brand-700 hover:underline">
                    {user.name}
                  </Link>
                  {user.role === "ADMIN" && (
                    <span className="ml-1 rounded bg-orange-100 px-1 text-xs text-orange-700">admin</span>
                  )}
                  {user.banned && (
                    <span className="ml-1 rounded bg-red-100 px-1 text-xs text-red-700">заблоковано</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Магазин:</span>{" "}
                  <Link href={`/admin/users/${user.id}`} className="hover:text-brand-700 hover:underline">
                    {user.storeName?.trim() || "—"}
                  </Link>
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
                  <span>
                    <span className="font-medium text-gray-700">Покупок:</span> {user._count.ordersAsBuyer}
                  </span>
                  <span>
                    <span className="font-medium text-gray-700">Оголошень:</span> {user._count.listings}
                  </span>
                </div>
                {user.bannedReason && (
                  <p className="mt-1 text-xs text-red-600">{user.bannedReason}</p>
                )}
              </div>
              <AdminUserActions
                userId={user.id}
                userName={user.name}
                banned={user.banned}
                isAdmin={user.role === "ADMIN"}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
