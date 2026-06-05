import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { SUPPORT_STATUSES } from "@/lib/constants";

export default async function AdminSupportPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { name: true, email: true } },
      replies: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ adminUnread: "desc" }, { updatedAt: "desc" }],
  });

  const unreadCount = tickets.filter((t) => t.adminUnread).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Назад до адмінки
      </Link>
      <h1 className="text-2xl font-bold mb-2">Підтримка користувачів</h1>
      <p className="text-sm text-gray-500 mb-6">
        Переписка з користувачами ({unreadCount} з непрочитаними)
      </p>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Повідомлень поки немає
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const lastText =
              ticket.replies[0]?.content || ticket.message;
            const preview =
              lastText.length > 120 ? `${lastText.slice(0, 120)}…` : lastText;

            return (
              <Link
                key={ticket.id}
                href={`/admin/support/${ticket.id}`}
                className={`block bg-white rounded-xl border p-4 hover:border-brand-300 transition-colors ${
                  ticket.adminUnread ? "border-blue-200 bg-blue-50/40" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-blue-900 flex items-center gap-2">
                      {ticket.subject}
                      {ticket.adminUnread && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          нове
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{preview}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {ticket.user.name} · {ticket.user.email} ·{" "}
                      {SUPPORT_STATUSES[ticket.status] || ticket.status} ·{" "}
                      {formatDate(ticket.updatedAt)}
                    </p>
                  </div>
                  <span className="text-brand-700 text-sm shrink-0">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
